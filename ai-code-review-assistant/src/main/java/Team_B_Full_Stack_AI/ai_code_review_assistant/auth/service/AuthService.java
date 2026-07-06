package Team_B_Full_Stack_AI.ai_code_review_assistant.auth.service;

import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.Session;
import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.UserDto;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final long SESSION_TIMEOUT_MINUTES = 1440; // 24 hours
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final String SECRET_STRING = "AiCodeReviewAssistantSuperSecureJwtSecretKeyWithAtLeast32BytesLength!";
    private final SecretKey secretKey = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private String generateJwtToken(UserEntity user) {
        long nowMillis = System.currentTimeMillis();
        long expMillis = nowMillis + (SESSION_TIMEOUT_MINUTES * 60 * 1000);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .issuedAt(new Date(nowMillis))
                .expiration(new Date(expMillis))
                .signWith(secretKey)
                .compact();
    }

    @Transactional
    public Session signup(String name, String email, String password) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        if (email == null || email.trim().isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        String sanitizedEmail = email.trim().toLowerCase();
        if (userRepository.findByEmail(sanitizedEmail).isPresent()) {
            throw new IllegalArgumentException("User already exists with this email");
        }

        UserEntity user = new UserEntity();
        user.setName(name.trim());
        user.setEmail(sanitizedEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setLastLogin(LocalDateTime.now());

        UserEntity savedUser = userRepository.save(user);

        String token = generateJwtToken(savedUser);

        log.info("User {} signed up successfully.", savedUser.getId());
        return new Session(token, mapToDto(savedUser));
    }

    @Transactional
    public Session login(String email, String password) {
        if (email == null || email.trim().isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }

        String sanitizedEmail = email.trim().toLowerCase();

        UserEntity user = userRepository.findByEmail(sanitizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        user.setLastLogin(LocalDateTime.now());
        UserEntity savedUser = userRepository.save(user);

        String token = generateJwtToken(savedUser);

        log.info("User {} logged in successfully.", savedUser.getId());
        return new Session(token, mapToDto(savedUser));
    }

    public UserEntity getUserFromToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userIdStr = claims.getSubject();
            if (userIdStr != null) {
                return userRepository.findById(UUID.fromString(userIdStr)).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Invalid or expired JWT token: {}", e.getMessage());
        }
        return null;
    }

    public boolean logout(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        // With stateless JWT, logout is handled client-side or via token validation check
        return getUserFromToken(token) != null;
    }

    public UserDto mapToDto(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        return UserDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .email(entity.getEmail())
                .team(entity.getTeam())
                .createdAt(entity.getCreatedAt())
                .lastLogin(entity.getLastLogin())
                .build();
    }
}
