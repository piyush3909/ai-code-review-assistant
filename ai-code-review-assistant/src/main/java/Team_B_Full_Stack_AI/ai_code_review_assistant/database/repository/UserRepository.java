package Team_B_Full_Stack_AI.ai_code_review_assistant.database.repository;

import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmail(String email);
}
