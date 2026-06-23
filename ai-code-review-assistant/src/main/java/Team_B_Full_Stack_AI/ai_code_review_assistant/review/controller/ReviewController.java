package Team_B_Full_Stack_AI.ai_code_review_assistant.review.controller;

import Team_B_Full_Stack_AI.ai_code_review_assistant.auth.exception.UnauthorizedException;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.AiModel;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.ChatSessionEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.service.ChatService;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity.GapReportEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.service.ReviewService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.ContextValue;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
public class ReviewController {

    private final ReviewService reviewService;
    private final ChatService chatService;

    public ReviewController(ReviewService reviewService, ChatService chatService) {
        this.reviewService = reviewService;
        this.chatService = chatService;
    }

    @MutationMapping
    public GapReportEntity reviewCode(
            @Argument UUID sessionId,
            @Argument String code,
            @Argument String language,
            @Argument AiModel model,
            @ContextValue(name = "currentUser", required = false) UserEntity currentUser) {

        if (currentUser == null) {
            throw new UnauthorizedException("Session is required to execute code review");
        }

        ChatSessionEntity chatSession = chatService.getSessionById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found with ID: " + sessionId));

        if (!chatSession.getUserId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Unauthorized access to review code in this session");
        }

        return reviewService.reviewCode(sessionId, code, language, model);
    }

    @QueryMapping
    public GapReportEntity getGapReport(
            @Argument UUID sessionId,
            @ContextValue(name = "currentUser", required = false) UserEntity currentUser) {

        if (currentUser == null) {
            throw new UnauthorizedException("Session is required to retrieve code review");
        }

        ChatSessionEntity chatSession = chatService.getSessionById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found with ID: " + sessionId));

        if (!chatSession.getUserId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Unauthorized access to code review in this session");
        }

        return reviewService.getGapReport(sessionId).orElse(null);
    }

    @MutationMapping
    public String fixCode(
            @Argument UUID sessionId,
            @Argument AiModel model,
            @ContextValue(name = "currentUser", required = false) UserEntity currentUser) {

        if (currentUser == null) {
            throw new UnauthorizedException("Session is required to fix code");
        }

        ChatSessionEntity chatSession = chatService.getSessionById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found with ID: " + sessionId));

        if (!chatSession.getUserId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Unauthorized access to fix code in this session");
        }

        return reviewService.fixCode(sessionId, model);
    }
}
