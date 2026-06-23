package Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "gap_issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GapIssueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "issue_id")
    private UUID issueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    @ToString.Exclude
    @JsonBackReference
    private GapReportEntity report;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private IssueCategory category;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "line_numbers")
    private String lineNumbers;

    @Column(name = "suggested_fix", columnDefinition = "TEXT")
    private String suggestedFix;
}
