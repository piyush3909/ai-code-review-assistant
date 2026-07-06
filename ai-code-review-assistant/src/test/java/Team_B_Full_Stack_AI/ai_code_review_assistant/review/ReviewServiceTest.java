package Team_B_Full_Stack_AI.ai_code_review_assistant.review;

import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.AiModel;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity.GapReportEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.repository.GapReportRepository;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
class ReviewServiceTest {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private GapReportRepository gapReportRepository;

    @MockBean(name = "openAiChatModel")
    private ChatModel openAiChatModel;

    @MockBean(name = "ollamaChatModel")
    private ChatModel ollamaChatModel;

    @BeforeEach
    void setUp() {
        gapReportRepository.deleteAll();
    }

    @Test
    void testReviewCodeValidation() {
        assertThatThrownBy(() -> reviewService.reviewCode(null, "public class Test {}", "Java", AiModel.HUGGING_FACE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Session ID cannot be null");

        assertThatThrownBy(() -> reviewService.reviewCode(UUID.randomUUID(), "   ", "Java", AiModel.HUGGING_FACE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Code content cannot be null or empty");

        assertThatThrownBy(() -> reviewService.reviewCode(UUID.randomUUID(), "public class Test {}", "   ", AiModel.HUGGING_FACE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Language cannot be null or empty");
    }

    @Test
    void testReviewCodePersistsAndReplacesExistingReport() {
        UUID sessionId = UUID.randomUUID();

        GapReportEntity existing = new GapReportEntity();
        existing.setSessionId(sessionId);
        existing.setQualityScore(50);
        existing.setCode("old code");
        existing.setSummary("old summary");
        existing.setSuggestedActions(List.of("old action"));
        gapReportRepository.save(existing);

<<<<<<< HEAD
        String aiResponse = """
        {"qualityScore": 91, "summary": "Looks solid", "issues": [], "suggestedActions": ["Add tests"]}
        """;

        ChatResponse mockChatResponse = mock(ChatResponse.class);
        Generation mockGeneration = mock(Generation.class);
        AssistantMessage mockMessage = mock(AssistantMessage.class);

        when(mockChatResponse.getResult()).thenReturn(mockGeneration);
        when(mockGeneration.getOutput()).thenReturn(mockMessage);
        when(mockMessage.getContent()).thenReturn(aiResponse);

        when(openAiChatModel.call(any(Prompt.class))).thenReturn(mockChatResponse);
=======
        String aiResponse = "qualityScore: 91\nsummary: Looks solid\nissues: []\nsuggestedActions: [\"Add tests\"]";
        when(openAiChatModel.call(any(Prompt.class)))
                .thenReturn(new org.springframework.ai.chat.model.ChatResponse(List.of(new Generation(aiResponse))));
>>>>>>> 5c4d09682ac8ee930124f8774042543cca05e0b6

        GapReportEntity result = reviewService.reviewCode(sessionId, "public class Test {}", "Java", AiModel.HUGGING_FACE);

        assertThat(result).isNotNull();
        assertThat(result.getSessionId()).isEqualTo(sessionId);
        assertThat(result.getQualityScore()).isEqualTo(91);
        assertThat(result.getSummary()).isEqualTo("Looks solid");
        assertThat(result.getSuggestedActions()).containsExactly("Add tests");
        assertThat(gapReportRepository.findBySessionId(sessionId)).isPresent();
    }
}
