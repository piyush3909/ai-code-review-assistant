package Team_B_Full_Stack_AI.ai_code_review_assistant.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.repository.UserRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.Session;
import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.UserDto;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final long SESSION_TIMEOUT_MINUTES = 30;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    private final UserRepository userRepository;
    // blacklist for revoked tokens (optional). We do NOT rely on this for active sessions.
    private final Map<String, Date> tokenBlacklist = new ConcurrentHashMap<>();
    private final Key signingKey;

    public AuthService(UserRepository userRepository, @Value("${jwt.secret}") String secret) {
        this.userRepository = userRepository;
        // String secret = System.getenv("JWT_SECRET");
        if (secret == null) {
            secret = System.getProperty("JWT_SECRET");
        }
        if (secret == null || secret.length() < 32) {
            // Fallback to an insecure default but log a warning.
            log.warn("JWT_SECRET not set or too short; using insecure default secret. Set JWT_SECRET in your .env for production.");
            secret = "please-change-this-secret-to-a-32-byte-minimum-value";
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Transactional
    public Session login(String name, String email) {
        // Input Validation
        if (name == null || name.trim().isEmpty()) {
            log.warn("Login attempt with empty name");
            throw new IllegalArgumentException("Name cannot be null or empty");
        }
        if (email == null || email.trim().isEmpty() || !EMAIL_PATTERN.matcher(email).matches()) {
            log.warn("Login attempt with invalid email: {}", email);
            throw new IllegalArgumentException("Invalid email format");
        }

        String sanitizedName = name.trim();
        String sanitizedEmail = email.trim().toLowerCase();

        log.info("Processing login for email: {}", sanitizedEmail);

        UserEntity user = userRepository.findByEmail(sanitizedEmail)
                .orElseGet(() -> {
                    log.info("Creating new user account for: {}", sanitizedEmail);
                    UserEntity newUser = new UserEntity();
                    newUser.setName(sanitizedName);
                    newUser.setEmail(sanitizedEmail);
                    return newUser;
                });

        user.setLastLogin(LocalDateTime.now());
        UserEntity savedUser = userRepository.save(user);

        String token = generateToken(savedUser.getId());

        log.info("User {} logged in successfully. JWT issued.", savedUser.getId());
        return new Session(token, mapToDto(savedUser));
    }

    public UserEntity getUserFromToken(String token) {
        if (token == null) {
            return null;
        }

        // Check blacklist first
        Date blacklistedUntil = tokenBlacklist.get(token);
        if (blacklistedUntil != null) {
            if (blacklistedUntil.after(new Date())) {
                return null;
            } else {
                tokenBlacklist.remove(token);
            }
        }

        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token).getBody();
            Date exp = claims.getExpiration();
            if (exp != null && exp.before(new Date())) {
                return null;
            }
            String userIdStr = claims.getSubject();
            UUID userId = UUID.fromString(userIdStr);
            return userRepository.findById(userId).orElse(null);
        } catch (JwtException | IllegalArgumentException e) {
            log.info("Invalid JWT token: {}", e.getMessage());
            return null;
        }
    }

    public boolean logout(String token) {
        if (token == null) {
            return false;
        }
        try {
            Claims claims = Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token).getBody();
            Date exp = claims.getExpiration();
            // Add to blacklist until token's natural expiration to prevent reuse
            tokenBlacklist.put(token, exp != null ? exp : new Date(System.currentTimeMillis() + SESSION_TIMEOUT_MINUTES * 60L * 1000L));
            log.info("JWT token explicitly blacklisted (logged out)");
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.info("Logout called with invalid token: {}", e.getMessage());
            return false;
        }
    }

    @Scheduled(fixedRate = 60000) // Sweep blacklisted tokens every minute
    public void cleanupExpiredBlacklistedTokens() {
        Date now = new Date();
        tokenBlacklist.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().before(now);
            if (expired) {
                log.info("Scheduled sweep: Blacklisted token {} removed after expiration", entry.getKey());
            }
            return expired;
        });
    }

    // Expose blacklist for verification/debugging if needed
    public Map<String, Date> getTokenBlacklist() {
        return tokenBlacklist;
    }

    private String generateToken(UUID userId) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + SESSION_TIMEOUT_MINUTES * 60L * 1000L);
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(signingKey)
                .compact();
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
