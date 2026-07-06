package Team_B_Full_Stack_AI.ai_code_review_assistant.graphql;

import Team_B_Full_Stack_AI.ai_code_review_assistant.auth.service.AuthService;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.repository.UserRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.repository.ChatSessionRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.repository.ChatMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.graphql.test.tester.ExecutionGraphQlServiceTester;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureGraphQlTester
class GraphQlApiTest {

    @Autowired
    private GraphQlTester graphQlTester;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private AuthService authService;

    @BeforeEach
    void setUp() {
        chatMessageRepository.deleteAll();
        chatSessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    private ExecutionGraphQlServiceTester getServiceTester() {
        return (ExecutionGraphQlServiceTester) graphQlTester;
    }

    @Test
    void testSignupAndLoginMutations() {
        String signupDoc = """
                mutation Signup($name: String!, $email: String!, $password: String!) {
                    signup(name: $name, email: $email, password: $password) {
                        token
                        user {
                            name
                            email
                        }
                    }
                }
                """;

        graphQlTester.document(signupDoc)
                .variable("name", "John Doe")
                .variable("email", "john@example.com")
                .variable("password", "password123")
                .execute()
                .path("signup.token").entity(String.class).satisfies(token -> assertThat(token).isNotBlank())
                .path("signup.user.name").entity(String.class).isEqualTo("John Doe")
                .path("signup.user.email").entity(String.class).isEqualTo("john@example.com");

        String loginDoc = """
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                        user {
                            name
                            email
                        }
                    }
                }
                """;

        graphQlTester.document(loginDoc)
                .variable("email", "john@example.com")
                .variable("password", "password123")
                .execute()
                .path("login.token").entity(String.class).satisfies(token -> assertThat(token).isNotBlank())
                .path("login.user.name").entity(String.class).isEqualTo("John Doe");
    }

    @Test
    void testMeQueryUnauthorizedWhenMissingToken() {
        String document = """
                query {
                    me {
                        id
                        name
                    }
                }
                """;

        graphQlTester.document(document)
                .execute()
                .errors()
                .satisfy(errors -> {
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).getErrorType()).isEqualTo(ErrorType.UNAUTHORIZED);
                    assertThat(errors.get(0).getMessage()).contains("Session is required");
                });
    }

    @Test
    void testMeQuerySuccessWithToken() {
        UserEntity user = new UserEntity();
        user.setName("John Doe");
        user.setEmail("john@example.com");
        user.setPassword("password123");
        user = userRepository.save(user);
        final UserEntity finalUser = user;

        String document = """
                query {
                    me {
                        id
                        name
                    }
                }
                """;

        GraphQlTester authenticatedTester = getServiceTester().mutate()
                .configureExecutionInput((executionInput, builder) ->
                        builder.graphQLContext(Map.of("currentUser", finalUser, "currentToken", "dummy-token")).build())
                .build();

        authenticatedTester.document(document)
                .execute()
                .path("me.id").entity(String.class).isEqualTo(finalUser.getId().toString())
                .path("me.name").entity(String.class).isEqualTo("John Doe");
    }

    @Test
    void testChatSessionCreationAndSecurityBoundary() {
        UserEntity user1 = new UserEntity();
        user1.setName("User One");
        user1.setEmail("user1@example.com");
        user1.setPassword("password123");
        user1 = userRepository.save(user1);
        UUID userId1 = user1.getId();

        UserEntity user2 = new UserEntity();
        user2.setName("User Two");
        user2.setEmail("user2@example.com");
        user2.setPassword("password123");
        user2 = userRepository.save(user2);
        UUID userId2 = user2.getId();

        String createSessionDoc = """
                mutation CreateSession($userId: ID!, $title: String!) {
                    createNewSession(userId: $userId, title: $title) {
                        sessionId
                        userId
                        title
                    }
                }
                """;

        // 1. User 1 successfully creates session for User 1
        final UserEntity finalUser1 = user1;
        GraphQlTester user1Tester = getServiceTester().mutate()
                .configureExecutionInput((executionInput, builder) ->
                        builder.graphQLContext(Map.of("currentUser", finalUser1)).build())
                .build();

        GraphQlTester.Response createResponse = user1Tester.document(createSessionDoc)
                .variable("userId", userId1.toString())
                .variable("title", "User 1 Chat")
                .execute();

        createResponse.path("createNewSession.title").entity(String.class).isEqualTo("User 1 Chat");
        String sessionIdStr = createResponse.path("createNewSession.sessionId").entity(String.class).get();

        // 2. User 2 attempts to create session for User 1 (should fail)
        final UserEntity finalUser2 = user2;
        GraphQlTester user2Tester = getServiceTester().mutate()
                .configureExecutionInput((executionInput, builder) ->
                        builder.graphQLContext(Map.of("currentUser", finalUser2)).build())
                .build();

        user2Tester.document(createSessionDoc)
                .variable("userId", userId1.toString())
                .variable("title", "Hacked Session")
                .execute()
                .errors()
                .satisfy(errors -> {
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).getErrorType()).isEqualTo(ErrorType.UNAUTHORIZED);
                });

        // 3. User 2 attempts to read User 1's sessions (should fail)
        String getSessionsDoc = """
                query GetSessions($userId: ID!) {
                    getSessions(userId: $userId) {
                        sessionId
                        title
                    }
                }
                """;

        user2Tester.document(getSessionsDoc)
                .variable("userId", userId1.toString())
                .execute()
                .errors()
                .satisfy(errors -> {
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).getErrorType()).isEqualTo(ErrorType.UNAUTHORIZED);
                });

        // 4. User 1 successfully reads their own sessions
        user1Tester.document(getSessionsDoc)
                .variable("userId", userId1.toString())
                .execute()
                .path("getSessions").entityList(Object.class).hasSize(1);
    }

    @Test
    void testChatMessageSecurityBoundary() {
        UserEntity user1 = new UserEntity();
        user1.setName("User One");
        user1.setEmail("user1@example.com");
        user1.setPassword("password123");
        user1 = userRepository.save(user1);
        UUID userId1 = user1.getId();

        UserEntity user2 = new UserEntity();
        user2.setName("User Two");
        user2.setEmail("user2@example.com");
        user2.setPassword("password123");
        user2 = userRepository.save(user2);

        String createSessionDoc = """
                mutation CreateSession($userId: ID!, $title: String!) {
                    createNewSession(userId: $userId, title: $title) {
                        sessionId
                    }
                }
                """;

        final UserEntity finalUser1 = user1;
        GraphQlTester user1Tester = getServiceTester().mutate()
                .configureExecutionInput((executionInput, builder) ->
                        builder.graphQLContext(Map.of("currentUser", finalUser1)).build())
                .build();

        String sessionId = user1Tester.document(createSessionDoc)
                .variable("userId", userId1.toString())
                .variable("title", "User 1 Chat")
                .execute()
                .path("createNewSession.sessionId").entity(String.class).get();

        String saveMessageDoc = """
                mutation SaveMessage($sessionId: ID!, $role: Role!, $message: String!) {
                    saveMessage(sessionId: $sessionId, role: $role, message: $message) {
                        messageId
                        message
                        role
                    }
                }
                """;

        String getMessagesDoc = """
                query GetMessages($sessionId: ID!) {
                    getMessages(sessionId: $sessionId) {
                        messageId
                        message
                        role
                    }
                }
                """;

        // 1. User 2 tries to send message to User 1's session (should fail)
        final UserEntity finalUser2 = user2;
        GraphQlTester user2Tester = getServiceTester().mutate()
                .configureExecutionInput((executionInput, builder) ->
                        builder.graphQLContext(Map.of("currentUser", finalUser2)).build())
                .build();

        user2Tester.document(saveMessageDoc)
                .variable("sessionId", sessionId)
                .variable("role", "USER")
                .variable("message", "Spam message")
                .execute()
                .errors()
                .satisfy(errors -> {
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).getErrorType()).isEqualTo(ErrorType.UNAUTHORIZED);
                });

        // 2. User 1 successfully sends message to User 1's session
        user1Tester.document(saveMessageDoc)
                .variable("sessionId", sessionId)
                .variable("role", "USER")
                .variable("message", "Legitimate message")
                .execute()
                .path("saveMessage.message").entity(String.class).isEqualTo("Legitimate message");

        // 3. User 2 tries to read User 1's session messages (should fail)
        user2Tester.document(getMessagesDoc)
                .variable("sessionId", sessionId)
                .execute()
                .errors()
                .satisfy(errors -> {
                    assertThat(errors).hasSize(1);
                    assertThat(errors.get(0).getErrorType()).isEqualTo(ErrorType.UNAUTHORIZED);
                });

        // 4. User 1 reads their own session messages (should succeed)
        user1Tester.document(getMessagesDoc)
                .variable("sessionId", sessionId)
                .execute()
                .path("getMessages").entityList(Object.class).hasSize(1);
    }
}
