package Team_B_Full_Stack_AI.ai_code_review_assistant.review.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewReportDto {
    private int qualityScore;
    private String summary;
    private List<ReviewIssueDto> issues;
    private List<String> suggestedActions;
}
