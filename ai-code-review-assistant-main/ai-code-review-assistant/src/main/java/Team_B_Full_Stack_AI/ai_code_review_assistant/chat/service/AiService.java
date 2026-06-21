package Team_B_Full_Stack_AI.ai_code_review_assistant.chat.service;

import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.AiModel;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.ChatMessageEntity;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiService {

    private final ChatModel grokChatModel;
    private final ChatModel ollamaChatModel;

    public AiService(
            @Qualifier("openAiChatModel") ChatModel grokChatModel, 
            @Qualifier("ollamaChatModel") ChatModel ollamaChatModel) {
        this.grokChatModel = grokChatModel;
        this.ollamaChatModel = ollamaChatModel;
    }

    public String generateReview(List<ChatMessageEntity> history, AiModel modelChoice) {
        List<Message> messages = new ArrayList<>();
        
        // System Prompt
        String systemPrompt = "You are an expert AI Code Review Assistant. Your goal is to review code, point out bugs, suggest optimizations, and explain your reasoning clearly. Be concise and professional.";
        messages.add(new SystemMessage(systemPrompt));

        // Add history
        for (ChatMessageEntity msg : history) {
            if (msg.getRole() == Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.Role.USER) {
                messages.add(new UserMessage(msg.getMessage()));
            } else {
                messages.add(new AssistantMessage(msg.getMessage()));
            }
        }

        Prompt prompt = new Prompt(messages);
        
        if (modelChoice == AiModel.GROK) {
            return grokChatModel.call(prompt).getResult().getOutput().getContent();
        } else {
            return ollamaChatModel.call(prompt).getResult().getOutput().getContent();
        }
    }
}
