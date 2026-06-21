package Team_B_Full_Stack_AI.ai_code_review_assistant.auth.interceptor;

import Team_B_Full_Stack_AI.ai_code_review_assistant.auth.service.AuthService;
import Team_B_Full_Stack_AI.ai_code_review_assistant.database.entity.UserEntity;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class SessionInterceptor implements WebGraphQlInterceptor {

    private final AuthService authService;

    public SessionInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    @NonNull
    public Mono<WebGraphQlResponse> intercept(@NonNull WebGraphQlRequest request, @NonNull Chain chain) {
        String token = null;

        // Try X-Session-Token header
        List<String> tokens = request.getHeaders().get("X-Session-Token");
        if (tokens != null && !tokens.isEmpty()) {
            token = tokens.get(0);
        }

        // Try Authorization header
        if (token == null) {
            List<String> authHeaders = request.getHeaders().get("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String headerVal = authHeaders.get(0);
                if (headerVal.startsWith("Bearer ")) {
                    token = headerVal.substring(7);
                } else {
                    token = headerVal;
                }
            }
        }

        if (token != null) {
            UserEntity user = authService.getUserFromToken(token);
            if (user != null) {
                final String finalToken = token;
                request.configureExecutionInput((executionInput, builder) ->
                        builder.graphQLContext(Map.of("currentUser", user, "currentToken", finalToken)).build());
            }
        }

        return chain.next(request);
    }
}
