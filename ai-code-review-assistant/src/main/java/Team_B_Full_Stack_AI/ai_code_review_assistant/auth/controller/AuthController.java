package Team_B_Full_Stack_AI.ai_code_review_assistant.auth.controller;

import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.Session;
import Team_B_Full_Stack_AI.ai_code_review_assistant.dto.UserDto;
import Team_B_Full_Stack_AI.ai_code_review_assistant.auth.exception.UnauthorizedException;
import Team_B_Full_Stack_AI.ai_code_review_assistant.auth.service.AuthService;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.ContextValue;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @MutationMapping
    public Session signup(@Argument String name, @Argument String email, @Argument String password) {
        return authService.signup(name, email, password);
    }

    @MutationMapping
    public Session login(@Argument String email, @Argument String password) {
        return authService.login(email, password);
    }

    @QueryMapping
    public UserDto me(@ContextValue(name = "currentUser", required = false) UserEntity currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Session is required");
        }
        return authService.mapToDto(currentUser);
    }

    @MutationMapping
    public boolean logout(@ContextValue(name = "currentToken", required = false) String token) {
        return authService.logout(token);
    }
}
