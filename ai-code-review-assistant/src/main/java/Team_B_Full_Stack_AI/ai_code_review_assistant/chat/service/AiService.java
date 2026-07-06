package Team_B_Full_Stack_AI.ai_code_review_assistant.chat.service;

import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.AiModel;
import Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.ChatMessageEntity;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Media;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class AiService {

    private final ChatModel huggingFaceChatModel;
    private final ChatModel ollamaChatModel;

    public AiService(
            @Qualifier("openAiChatModel") ChatModel huggingFaceChatModel, 
            @Qualifier("ollamaChatModel") ChatModel ollamaChatModel) {
        this.huggingFaceChatModel = huggingFaceChatModel;
        this.ollamaChatModel = ollamaChatModel;
    }

    @Cacheable(value = "aiReviews", key = "#history != null ? #history.hashCode() + '-' + #modelChoice : 'null'")
    public String generateReview(List<ChatMessageEntity> history, AiModel modelChoice) {
        List<Message> messages = new ArrayList<>();
        
        // System Prompt
        String systemPrompt = "You are an expert AI Code Review Assistant. Your goal is to review code, point out bugs, suggest optimizations, and explain your reasoning clearly. Be concise and professional.";
        messages.add(new SystemMessage(systemPrompt));

        // Implement Sliding Window Optimization: Send only the last 10 messages to save tokens and reduce latency
        List<ChatMessageEntity> windowedHistory = history;
        if (history != null && history.size() > 10) {
            windowedHistory = history.subList(history.size() - 10, history.size());
        }

        if (windowedHistory != null) {
            for (ChatMessageEntity msg : windowedHistory) {
                if (ObjectUtils.nullSafeEquals(msg.getRole(), Team_B_Full_Stack_AI.ai_code_review_assistant.chat.entity.Role.USER)) {
                    String base64Data = msg.getImageBase64();
                    if (StringUtils.hasText(base64Data)) {
                        try {
                            String mimeTypeStr = "image/png";
                            String cleanBase64 = base64Data.trim();
                            if (cleanBase64.startsWith("data:")) {
                                int commaIdx = cleanBase64.indexOf(',');
                                if (commaIdx != -1) {
                                    String prefix = cleanBase64.substring(5, commaIdx);
                                    if (prefix.contains(";")) {
                                        mimeTypeStr = prefix.split(";")[0];
                                    } else {
                                        mimeTypeStr = prefix;
                                    }
                                    cleanBase64 = cleanBase64.substring(commaIdx + 1);
                                }
                            }
                            byte[] imageBytes = Base64.getDecoder().decode(cleanBase64);
                            Media media = new Media(org.springframework.util.MimeType.valueOf(mimeTypeStr), new ByteArrayResource(imageBytes));
                            messages.add(new UserMessage(msg.getMessage(), List.of(media)));
                        } catch (Exception e) {
                            // Fallback to text message if image decoding fails
                            messages.add(new UserMessage(msg.getMessage()));
                        }
                    } else {
                        messages.add(new UserMessage(msg.getMessage()));
                    }
                } else {
                    messages.add(new AssistantMessage(msg.getMessage()));
                }
            }
        }

        Prompt prompt = new Prompt(messages);
        
        if (ObjectUtils.nullSafeEquals(modelChoice, AiModel.HUGGING_FACE)) {
            return huggingFaceChatModel.call(prompt).getResult().getOutput().getContent();
        } else {
            return ollamaChatModel.call(prompt).getResult().getOutput().getContent();
        }
    }
}
