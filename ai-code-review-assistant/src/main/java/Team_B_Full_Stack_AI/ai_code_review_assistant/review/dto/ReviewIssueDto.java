package Team_B_Full_Stack_AI.ai_code_review_assistant.review.dto;

import Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity.IssueCategory;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity.Severity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewIssueDto {
    private IssueCategory category;
    private Severity severity;
    private String summary;
    private String lineNumbers;
    private String suggestedFix;
}
