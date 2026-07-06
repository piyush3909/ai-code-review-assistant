package Team_B_Full_Stack_AI.ai_code_review_assistant.chat;

import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.ChatMessageEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.ChatSessionEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.Role;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.repository.ChatMessageRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.repository.ChatSessionRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.service.ChatService;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity.GapReportEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.repository.GapReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ChatServiceTest {

    @Autowired
    private ChatService chatService;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private GapReportRepository gapReportRepository;

    private UUID testUserId;

    @BeforeEach
    void setUp() {
        chatMessageRepository.deleteAll();
        chatSessionRepository.deleteAll();
        testUserId = UUID.randomUUID();
    }

    @Test
    void testCreateNewSessionSuccess() {
        ChatSessionEntity session = chatService.createNewSession(testUserId, "Support Chat");

        assertThat(session).isNotNull();
        assertThat(session.getSessionId()).isNotNull();
        assertThat(session.getUserId()).isEqualTo(testUserId);
        assertThat(session.getTitle()).isEqualTo("Support Chat");
        assertThat(session.getCreatedDate()).isNotNull();
        assertThat(session.getUpdatedDate()).isNotNull();
    }

    @Test
    void testCreateNewSessionValidation() {
        assertThatThrownBy(() -> chatService.createNewSession(null, "Support Chat"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User ID cannot be null");

        assertThatThrownBy(() -> chatService.createNewSession(testUserId, "   "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Title cannot be null or empty");
    }

    @Test
    void testGetUserSessions() {
        chatService.createNewSession(testUserId, "Session 1");
        chatService.createNewSession(testUserId, "Session 2");

        List<ChatSessionEntity> sessions = chatService.getUserSessions(testUserId);
        assertThat(sessions).hasSize(2);
        assertThat(sessions.stream().map(ChatSessionEntity::getTitle))
                .containsExactlyInAnyOrder("Session 1", "Session 2");
    }

    @Test
    void testSaveMessageUpdatesSessionUpdatedDate() throws InterruptedException {
        ChatSessionEntity session = chatService.createNewSession(testUserId, "Support Chat");
        LocalDateTime initialUpdatedDate = session.getUpdatedDate();

        // Introduce a tiny delay so timestamps are distinct
        Thread.sleep(15);

        ChatMessageEntity message = chatService.saveMessage(session.getSessionId(), Role.USER, "Hello World");

        assertThat(message).isNotNull();
        assertThat(message.getMessageId()).isNotNull();
        assertThat(message.getMessage()).isEqualTo("Hello World");
        assertThat(message.getRole()).isEqualTo(Role.USER);

        // Fetch session again to check updatedDate was bumped
        ChatSessionEntity updatedSession = chatService.getSessionById(session.getSessionId()).orElseThrow();
        assertThat(updatedSession.getUpdatedDate()).isAfter(initialUpdatedDate);
    }

    @Test
    void testGetMessagesOrderedChronologically() throws InterruptedException {
        ChatSessionEntity session = chatService.createNewSession(testUserId, "Support Chat");
        UUID sessionId = session.getSessionId();

        // Save three messages with small delays to guarantee timestamp ordering
        chatService.saveMessage(sessionId, Role.USER, "First message");
        Thread.sleep(15);
        chatService.saveMessage(sessionId, Role.AI, "Second message (AI response)");
        Thread.sleep(15);
        chatService.saveMessage(sessionId, Role.USER, "Third message");

        List<ChatMessageEntity> messages = chatService.getMessages(sessionId);
        assertThat(messages).hasSize(3);
        assertThat(messages.get(0).getMessage()).isEqualTo("First message");
        assertThat(messages.get(1).getMessage()).isEqualTo("Second message (AI response)");
        assertThat(messages.get(2).getMessage()).isEqualTo("Third message");

        // Verify timestamps are strictly increasing
        assertThat(messages.get(0).getTimestamp()).isBefore(messages.get(1).getTimestamp());
        assertThat(messages.get(1).getTimestamp()).isBefore(messages.get(2).getTimestamp());
    }

    @Test
    void testSaveMessageValidation() {
        ChatSessionEntity session = chatService.createNewSession(testUserId, "Support Chat");
        UUID sessionId = session.getSessionId();

        assertThatThrownBy(() -> chatService.saveMessage(null, Role.USER, "Hello"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Session ID cannot be null");

        assertThatThrownBy(() -> chatService.saveMessage(sessionId, null, "Hello"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Role cannot be null");

        assertThatThrownBy(() -> chatService.saveMessage(sessionId, Role.USER, ""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Message content or attached image cannot be null or empty");
    }

    @Test
    void testDeleteSessionRemovesMessagesAndReports() {
        ChatSessionEntity session = chatService.createNewSession(testUserId, "Session to delete");
        chatService.saveMessage(session.getSessionId(), Role.USER, "Hello from the session");

        GapReportEntity report = new GapReportEntity();
        report.setSessionId(session.getSessionId());
        report.setQualityScore(82);
        report.setCode("public class Example {}\n");
        report.setSummary("A sample review report");
        report.setSuggestedActions(List.of("Add tests"));
        gapReportRepository.save(report);

        chatService.deleteSession(session.getSessionId());

        assertThat(chatSessionRepository.findById(session.getSessionId())).isEmpty();
        assertThat(chatMessageRepository.findBySessionIdOrderByTimestampAsc(session.getSessionId())).isEmpty();
        assertThat(gapReportRepository.findBySessionId(session.getSessionId())).isEmpty();
    }
}
