package Team_B_Full_Stack_AI.ai_code_review_assistant.review.repository;

import Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity.GapReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GapReportRepository extends JpaRepository<GapReportEntity, UUID> {
    Optional<GapReportEntity> findBySessionId(UUID sessionId);
    void deleteBySessionId(UUID sessionId);
}


