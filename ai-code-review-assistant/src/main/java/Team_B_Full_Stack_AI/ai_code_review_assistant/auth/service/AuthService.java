package Team_B_Full_Stack_AI.ai_code_review_assistant.auth.service;

import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.Session;
import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.UserDto;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final long SESSION_TIMEOUT_MINUTES = 30;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    private final UserRepository userRepository;
    private final Map<String, SessionDetails> sessionStore = new ConcurrentHashMap<>();

    public static class SessionDetails {
        private final UUID userId;
        private final LocalDateTime createdAt;
        private LocalDateTime lastAccessedAt;

        public SessionDetails(UUID userId) {
            this.userId = userId;
            this.createdAt = LocalDateTime.now();
            this.lastAccessedAt = LocalDateTime.now();
        }

        public UUID getUserId() {
            return userId;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public LocalDateTime getLastAccessedAt() {
            return lastAccessedAt;
        }

        public void updateLastAccessed() {
            this.lastAccessedAt = LocalDateTime.now();
        }
    }

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
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

        String token = UUID.randomUUID().toString();
        sessionStore.put(token, new SessionDetails(savedUser.getId()));

        log.info("User {} logged in successfully. Session token generated.", savedUser.getId());
        return new Session(token, mapToDto(savedUser));
    }

    public UserEntity getUserFromToken(String token) {
        if (token == null) {
            return null;
        }
        SessionDetails details = sessionStore.get(token);
        if (details == null) {
            return null;
        }

        // Session Expiration check
        if (details.getLastAccessedAt().plusMinutes(SESSION_TIMEOUT_MINUTES).isBefore(LocalDateTime.now())) {
            sessionStore.remove(token);
            log.info("Session token {} expired due to inactivity", token);
            return null;
        }

        details.updateLastAccessed();
        return userRepository.findById(details.getUserId()).orElse(null);
    }

    public boolean logout(String token) {
        if (token == null) {
            return false;
        }
        SessionDetails removed = sessionStore.remove(token);
        if (removed != null) {
            log.info("Session token {} explicitly invalidated (logged out)", token);
            return true;
        }
        return false;
    }

    @Scheduled(fixedRate = 60000) // Sweeps every 1 minute
    public void cleanupExpiredSessions() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(SESSION_TIMEOUT_MINUTES);
        sessionStore.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().getLastAccessedAt().isBefore(threshold);
            if (expired) {
                log.info("Scheduled sweep: Session token {} removed due to expiration", entry.getKey());
            }
            return expired;
        });
    }

    // Retained for any direct verification needs
    public Map<String, SessionDetails> getSessionStore() {
        return sessionStore;
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
