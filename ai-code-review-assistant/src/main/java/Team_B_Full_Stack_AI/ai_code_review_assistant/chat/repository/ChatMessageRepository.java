package Team_B_Full_Stack_AI.ai_code_review_assistant.chat.repository;

import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, UUID> {
    List<ChatMessageEntity> findBySessionIdOrderByTimestampAsc(UUID sessionId);
    void deleteBySessionId(UUID sessionId);
}
