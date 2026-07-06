package Team_B_Full_Stack_AI.ai_code_review_assistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableCaching
public class AiCodeReviewAssistantApplication {

	public static void main(String[] args) {
		SpringApplication.run(AiCodeReviewAssistantApplication.class, args);
	}

}
