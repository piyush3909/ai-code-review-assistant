package Team_B_Full_Stack_AI.ai_code_review_assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    private String token;
    private UserDto user;
}
