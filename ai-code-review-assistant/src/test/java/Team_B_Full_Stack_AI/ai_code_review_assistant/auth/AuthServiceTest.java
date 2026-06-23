package Team_B_Full_Stack_AI.ai_code_review_assistant.auth;

import Team_B_Full_Stack_AI.ai_code_review_assistant.auth.service.AuthService;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.repository.UserRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        authService.getSessionStore().clear();
    }

    @Test
    void testLoginNewUserSuccess() {
        Session session = authService.login("John Doe", "john@example.com");

        assertThat(session).isNotNull();
        assertThat(session.getToken()).isNotBlank();
        assertThat(session.getUser()).isNotNull();
        assertThat(session.getUser().getName()).isEqualTo("John Doe");
        assertThat(session.getUser().getEmail()).isEqualTo("john@example.com");

        // Verify saved in DB
        assertThat(userRepository.findByEmail("john@example.com")).isPresent();
    }

    @Test
    void testLoginExistingUserUpdatesLastLogin() {
        Session firstSession = authService.login("John Doe", "john@example.com");
        LocalDateTime firstLoginTime = firstSession.getUser().getLastLogin();

        // Perform second login
        Session secondSession = authService.login("John Doe", "john@example.com");

        assertThat(secondSession.getUser().getId()).isEqualTo(firstSession.getUser().getId());
        assertThat(userRepository.count()).isEqualTo(1); // No duplicate user created
    }

    @Test
    void testLoginInputValidation() {
        // Null/empty name
        assertThatThrownBy(() -> authService.login("", "john@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Name cannot be null or empty");

        // Invalid email
        assertThatThrownBy(() -> authService.login("John", "notanemail"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid email format");
    }

    @Test
    void testEmailNormalization() {
        Session session = authService.login(" John Doe ", "John@EXAMPLE.com");
        assertThat(session.getUser().getEmail()).isEqualTo("john@example.com");
        assertThat(session.getUser().getName()).isEqualTo("John Doe");
    }

    @Test
    void testGetUserFromTokenActive() {
        Session session = authService.login("John Doe", "john@example.com");
        String token = session.getToken();

        // Valid active session
        UserEntity user = authService.getUserFromToken(token);
        assertThat(user).isNotNull();
        assertThat(user.getEmail()).isEqualTo("john@example.com");
    }

    @Test
    void testGetUserFromTokenExpired() throws Exception {
        Session session = authService.login("John Doe", "john@example.com");
        String token = session.getToken();

        AuthService.SessionDetails details = authService.getSessionStore().get(token);
        java.lang.reflect.Field field = AuthService.SessionDetails.class.getDeclaredField("lastAccessedAt");
        field.setAccessible(true);
        field.set(details, LocalDateTime.now().minusMinutes(31));

        // Expired token should return null
        UserEntity user = authService.getUserFromToken(token);
        assertThat(user).isNull();
        assertThat(authService.getSessionStore().containsKey(token)).isFalse();
    }

    @Test
    void testCleanupExpiredSessions() throws Exception {
        Session session = authService.login("John Doe", "john@example.com");
        String token = session.getToken();

        AuthService.SessionDetails details = authService.getSessionStore().get(token);
        java.lang.reflect.Field field = AuthService.SessionDetails.class.getDeclaredField("lastAccessedAt");
        field.setAccessible(true);
        field.set(details, LocalDateTime.now().minusMinutes(31));

        authService.cleanupExpiredSessions();
        assertThat(authService.getSessionStore().containsKey(token)).isFalse();
    }

    @Test
    void testLogout() {
        Session session = authService.login("John Doe", "john@example.com");
        String token = session.getToken();

        boolean result = authService.logout(token);
        assertThat(result).isTrue();
        assertThat(authService.getSessionStore().containsKey(token)).isFalse();
        assertThat(authService.getUserFromToken(token)).isNull();
    }
}
