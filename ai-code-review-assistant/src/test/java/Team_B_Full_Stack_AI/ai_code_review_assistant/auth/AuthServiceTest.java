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
    }

    @Test
    void testSignupAndLoginSuccess() {
        Session signupSession = authService.signup("John Doe", "john@example.com", "password123");

        assertThat(signupSession).isNotNull();
        assertThat(signupSession.getToken()).isNotBlank();
        assertThat(signupSession.getUser()).isNotNull();
        assertThat(signupSession.getUser().getName()).isEqualTo("John Doe");
        assertThat(signupSession.getUser().getEmail()).isEqualTo("john@example.com");

        Session loginSession = authService.login("john@example.com", "password123");
        assertThat(loginSession.getToken()).isNotBlank();
        assertThat(loginSession.getUser().getId()).isEqualTo(signupSession.getUser().getId());
    }

    @Test
    void testLoginInvalidPassword() {
        authService.signup("John Doe", "john@example.com", "password123");

        assertThatThrownBy(() -> authService.login("john@example.com", "wrongpassword"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    void testSignupInputValidation() {
        assertThatThrownBy(() -> authService.signup("", "john@example.com", "password123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Name cannot be empty");

        assertThatThrownBy(() -> authService.signup("John", "notanemail", "password123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid email format");

        assertThatThrownBy(() -> authService.signup("John", "john@example.com", "123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Password must be at least 6 characters");
    }

    @Test
    void testEmailNormalization() {
        Session session = authService.signup(" John Doe ", "John@EXAMPLE.com", "password123");
        assertThat(session.getUser().getEmail()).isEqualTo("john@example.com");
        assertThat(session.getUser().getName()).isEqualTo("John Doe");
    }

    @Test
    void testGetUserFromJwtTokenActive() {
        Session session = authService.signup("John Doe", "john@example.com", "password123");
        String token = session.getToken();

        UserEntity user = authService.getUserFromToken(token);
        assertThat(user).isNotNull();
        assertThat(user.getEmail()).isEqualTo("john@example.com");
    }

    @Test
    void testGetUserFromTokenInvalid() {
        UserEntity user = authService.getUserFromToken("invalid.jwt.token");
        assertThat(user).isNull();
    }

    @Test
    void testLogout() {
        Session session = authService.signup("John Doe", "john@example.com", "password123");
        String token = session.getToken();

        boolean result = authService.logout(token);
        assertThat(result).isTrue();
    }
}
