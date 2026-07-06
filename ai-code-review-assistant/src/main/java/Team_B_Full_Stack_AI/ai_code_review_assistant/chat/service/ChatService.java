package Team_B_Full_Stack_AI.ai_code_review_assistant.chat.service;

import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.ChatMessageEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.ChatSessionEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.Role;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.repository.ChatMessageRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.repository.ChatSessionRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.repository.GapReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final GapReportRepository gapReportRepository;

    public ChatService(ChatSessionRepository chatSessionRepository, ChatMessageRepository chatMessageRepository, GapReportRepository gapReportRepository) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.gapReportRepository = gapReportRepository;
    }

    @Transactional
    public ChatSessionEntity createNewSession(UUID userId, String title) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be null or empty");
        }

        ChatSessionEntity session = new ChatSessionEntity();
        session.setUserId(userId);
        session.setTitle(title.trim());
        return chatSessionRepository.save(session);
    }

    public List<ChatSessionEntity> getUserSessions(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return chatSessionRepository.findByUserId(userId);
    }

    public List<ChatMessageEntity> getMessages(UUID sessionId) {
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID cannot be null");
        }
        return chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    @Transactional
    public ChatMessageEntity saveMessage(UUID sessionId, Role role, String messageContent, String imageBase64) {
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID cannot be null");
        }
        if (role == null) {
            throw new IllegalArgumentException("Role cannot be null");
        }
        if ((messageContent == null || messageContent.trim().isEmpty()) && (imageBase64 == null || imageBase64.trim().isEmpty())) {
            throw new IllegalArgumentException("Message content or attached image cannot be null or empty");
        }
        if (messageContent == null || messageContent.trim().isEmpty()) {
            messageContent = "Please review the attached screenshot.";
        }

        ChatSessionEntity session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found with ID: " + sessionId));

        // Update session's updatedDate
        session.setUpdatedDate(LocalDateTime.now());
        chatSessionRepository.save(session);

        ChatMessageEntity chatMessage = new ChatMessageEntity();
        chatMessage.setSessionId(sessionId);
        chatMessage.setRole(role);
        chatMessage.setMessage(messageContent.trim());
        chatMessage.setImageBase64(imageBase64);
        chatMessage.setTimestamp(LocalDateTime.now());
        return chatMessageRepository.save(chatMessage);
    }

    @Transactional
    public ChatMessageEntity saveMessage(UUID sessionId, Role role, String messageContent) {
        return saveMessage(sessionId, role, messageContent, null);
    }

    @Transactional
    public ChatMessageEntity saveMessage(ChatMessageEntity message) {
        if (message == null) {
            throw new IllegalArgumentException("Message cannot be null");
        }
        return saveMessage(message.getSessionId(), message.getRole(), message.getMessage(), message.getImageBase64());
    }

    public Optional<ChatSessionEntity> getSessionById(UUID sessionId) {
        if (sessionId == null) {
            return Optional.empty();
        }
        return chatSessionRepository.findById(sessionId);
    }

    @Transactional
    public void deleteSession(UUID sessionId) {
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID cannot be null");
        }
        gapReportRepository.deleteBySessionId(sessionId);
        chatMessageRepository.deleteBySessionId(sessionId);
        chatSessionRepository.deleteById(sessionId);
    }
}
