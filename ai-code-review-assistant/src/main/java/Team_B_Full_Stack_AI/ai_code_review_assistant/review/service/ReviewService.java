package Team_B_Full_Stack_AI.ai_code_review_assistant.review.service;

import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.AiModel;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.dto.ReviewReportDto;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity.GapIssueEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.entity.GapReportEntity;
import Team_B_Full_Stack_AI.ai_code_review_assistant.review.repository.GapReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ChatModel huggingFaceChatModel;
    private final ChatModel ollamaChatModel;
    private final GapReportRepository gapReportRepository;

    public ReviewService(
            @Qualifier("openAiChatModel") ChatModel huggingFaceChatModel,
            @Qualifier("ollamaChatModel") ChatModel ollamaChatModel,
            GapReportRepository gapReportRepository) {
        this.huggingFaceChatModel = huggingFaceChatModel;
        this.ollamaChatModel = ollamaChatModel;
        this.gapReportRepository = gapReportRepository;
    }

    @Transactional
    public GapReportEntity reviewCode(UUID sessionId, String code, String language, AiModel modelChoice) {
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID cannot be null");
        }
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Code content cannot be null or empty");
        }
        if (language == null || language.trim().isEmpty()) {
            throw new IllegalArgumentException("Language cannot be null or empty");
        }

        log.info("Starting code review pipeline for session: {}, language: {}, model: {}", sessionId, language, modelChoice);

        // Delete existing report for the session if it exists to maintain 1-to-1 relationship
        gapReportRepository.findBySessionId(sessionId).ifPresent(existing -> {
            log.info("Deleting existing GapReport for session: {}", sessionId);
            gapReportRepository.delete(existing);
            gapReportRepository.flush();
        });

        // Set up Spring AI structured outputs converter
        BeanOutputConverter<ReviewReportDto> outputConverter = new BeanOutputConverter<>(ReviewReportDto.class);

        // Define system prompt outlining the checklist rules
        String systemPrompt = "You are an expert static analysis and AI code review orchestrator.\n" +
                "Your task is to analyze the user's submitted source code in the specified language, execute the following 4 check categories, and output your findings in a structured format:\n\n" +
                "1. **Lint Check**: Find formatting issues, syntax errors, coding standard violations, unused imports, or bad naming conventions.\n" +
                "2. **Coverage Check**: Check if the code has gaps in unit tests. Point out which lines/methods lack test coverage.\n" +
                "3. **Security Scan**: Look for SQL injections, XSS, hardcoded keys/passwords, unsafe API usages, or input validation errors.\n" +
                "4. **Dead Code Detection**: Spot unreachable branches, unused parameters, dead variables, or obsolete helper methods.\n\n" +
                "Calculate an overall 'qualityScore' from 0 (terrible, full of bugs) to 100 (flawless production code).\n" +
                "List all findings inside 'issues'. Include the category, severity (INFO, WARNING, ERROR, CRITICAL), summary of issue, line number range (e.g. '10-12' or '5'), and a concrete suggested fix.\n" +
                "Provide a list of next actions to improve code quality inside 'suggestedActions'.\n\n" +
                outputConverter.getFormat();

        String userPrompt = String.format("Language: %s\n\nCode to review:\n```\n%s\n```", language, code);

        List<Message> messages = List.of(
                new SystemMessage(systemPrompt),
                new UserMessage(userPrompt)
        );

        Prompt prompt = new Prompt(messages);
        String rawResponse;

        if (modelChoice == AiModel.HUGGING_FACE) {
            rawResponse = huggingFaceChatModel.call(prompt).getResult().getOutput().getContent();
        } else {
            rawResponse = ollamaChatModel.call(prompt).getResult().getOutput().getContent();
        }

        // Parse structured output
        ReviewReportDto parsedReport = outputConverter.convert(rawResponse);
        if (parsedReport == null) {
            throw new IllegalStateException("Failed to parse structured Gap Report from AI response");
        }

        // Map DTO to DB Entities
        GapReportEntity reportEntity = new GapReportEntity();
        reportEntity.setSessionId(sessionId);
        reportEntity.setQualityScore(parsedReport.getQualityScore());
        reportEntity.setCode(code);
        reportEntity.setSummary(parsedReport.getSummary());
        reportEntity.setSuggestedActions(parsedReport.getSuggestedActions());

        List<GapIssueEntity> issues = parsedReport.getIssues().stream().map(dto -> {
            GapIssueEntity issue = new GapIssueEntity();
            issue.setReport(reportEntity);
            issue.setCategory(dto.getCategory());
            issue.setSeverity(dto.getSeverity());
            issue.setSummary(dto.getSummary());
            issue.setLineNumbers(dto.getLineNumbers());
            issue.setSuggestedFix(dto.getSuggestedFix());
            return issue;
        }).collect(Collectors.toList());

        reportEntity.setIssues(issues);

        log.info("Persisting consolidated GapReport for session: {} with score: {}", sessionId, reportEntity.getQualityScore());
        return gapReportRepository.save(reportEntity);
    }

    public java.util.Optional<GapReportEntity> getGapReport(UUID sessionId) {
        return gapReportRepository.findBySessionId(sessionId);
    }

    @Transactional
    public String fixCode(UUID sessionId, AiModel modelChoice) {
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID cannot be null");
        }

        GapReportEntity report = gapReportRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("No Gap Report found for session: " + sessionId));

        log.info("Generating fixed code for session: {}, using model: {}", sessionId, modelChoice);

        StringBuilder issuesText = new StringBuilder();
        for (GapIssueEntity issue : report.getIssues()) {
            issuesText.append(String.format("- [%s] Severity: %s - Summary: %s (Lines: %s) Suggested Fix: %s\n",
                    issue.getCategory(),
                    issue.getSeverity(),
                    issue.getSummary(),
                    issue.getLineNumbers() != null ? issue.getLineNumbers() : "N/A",
                    issue.getSuggestedFix() != null ? issue.getSuggestedFix() : "N/A"
            ));
        }

        String systemPrompt = "You are an expert AI refactoring tool.\n" +
                "Your goal is to refactor the provided source code to fix all the review issues listed.\n" +
                "Ensure the code remains functional, efficient, and compiles cleanly.\n" +
                "Follow clean coding practices. Return ONLY the refactored source code.\n" +
                "Do NOT include markdown explanations, warnings, or formatting wrappers outside of the code block. Return ONLY code.";

        String userPrompt = String.format("Original Code:\n```\n%s\n```\n\nIssues to fix:\n%s", 
                report.getCode(), issuesText.toString());

        List<Message> messages = List.of(
                new SystemMessage(systemPrompt),
                new UserMessage(userPrompt)
        );

        Prompt prompt = new Prompt(messages);
        String response;

        if (modelChoice == AiModel.HUGGING_FACE) {
            response = huggingFaceChatModel.call(prompt).getResult().getOutput().getContent();
        } else {
            response = ollamaChatModel.call(prompt).getResult().getOutput().getContent();
        }

        // Clean up markdown code blocks if the model wrapped it anyway
        if (response.startsWith("```")) {
            int firstNewLine = response.indexOf('\n');
            int lastBackticks = response.lastIndexOf("```");
            if (firstNewLine != -1 && lastBackticks > firstNewLine) {
                response = response.substring(firstNewLine + 1, lastBackticks).trim();
            }
        }

        return response;
    }
}
