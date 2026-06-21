# Module 1: Authentication & Session Management Status

This document provides a complete overview of the implemented Authentication and Session Management systems. It is designed to help other team members (and their AI coding assistants) immediately understand the completed features, class structure, and integration requirements.

---

## 1. Overview of Implementation
We have implemented a secure, passwordless authentication and session management system using **Spring GraphQL** and **Spring Boot 3.x**. 

* **User Verification**: Logs users in using their `email`. If the user exists, their session is updated. If not, a new account is automatically registered.
* **Token-based Sessions**: Generates secure `UUID` tokens on successful login.
* **Inactivity Session Expiration (TTL)**: Sessions automatically expire after **30 minutes** of inactivity.
* **Background Cleanup (Sweeping)**: A scheduled background thread sweeps the session memory cache every **1 minute** to prune expired tokens and prevent memory leaks.
* **Instant Session Revocation**: Exposes a `logout` mutation to destroy active tokens.
* **Spring GraphiQL Enabled**: The GraphiQL playground is enabled locally at `http://localhost:8080/graphiql`.

---

## 2. File and Package Structure

The following components were created, modified, or verified:

### Shared DTO Layer (in `Team_B_Full_Stack_AI.ai_code_review_assistant.dto`)
* **[UserDto.java](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant/ai-code-review-assistant/src/main/java/Team_B_Full_Stack_AI/ai_code_review_assistant/dto/UserDto.java)**: Represents the user API schema, isolating the database entities from the front-facing API.
* **[Session.java](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant/ai-code-review-assistant/src/main/java/Team_B_Full_Stack_AI/ai_code_review_assistant/dto/Session.java)**: The returned authentication payload wrapping the session token string and the `UserDto`.

### Authentication Layer (in `Team_B_Full_Stack_AI.ai_code_review_assistant.auth`)
* **[AuthController.java](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant/ai-code-review-assistant/src/main/java/Team_B_Full_Stack_AI/ai_code_review_assistant/auth/controller/AuthController.java)**: Exposes GraphQL mappings for query `me` and mutations `login` / `logout`.
* **[AuthService.java](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant/ai-code-review-assistant/src/main/java/Team_B_Full_Stack_AI/ai_code_review_assistant/auth/service/AuthService.java)**: Core authentication controller handling user persistence queries, token mapping (`ConcurrentHashMap<String, SessionDetails>`), TTL session updates, background scheduling cleanup, and input validation.
* **[SessionInterceptor.java](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant/ai-code-review-assistant/src/main/java/Team_B_Full_Stack_AI/ai_code_review_assistant/auth/interceptor/SessionInterceptor.java)**: Intercepts all GraphQL requests to extract session tokens from either the `X-Session-Token` or `Authorization` HTTP headers and populates `"currentUser"` and `"currentToken"` into the GraphQL context map.
* **[AuthExceptionHandler.java](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant/ai-code-review-assistant/src/main/java/Team_B_Full_Stack_AI/ai_code_review_assistant/auth/exception/AuthExceptionHandler.java)**: Maps `UnauthorizedException` -> `UNAUTHORIZED` and `IllegalArgumentException` (validation errors) -> `BAD_REQUEST` GraphQL classification errors.

### Database Layer (in `Team_B_Full_Stack_AI.ai_code_review_assistant.database`)
* **[UserEntity.java](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant/ai-code-review-assistant/src/main/java/Team_B_Full_Stack_AI/ai_code_review_assistant/database/entity/UserEntity.java)**: JPA database entity representing the user table.
* **[UserRepository.java](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant/ai-code-review-assistant/src/main/java/Team_B_Full_Stack_AI/ai_code_review_assistant/database/repository/UserRepository.java)**: Core database repository interface providing `findByEmail(String email)`.

---

## 3. GraphQL Schema Configuration (`schema.graphqls`)

The GraphQL API is configured as follows:

```graphql
type User {
    id: ID!
    name: String!
    email: String!
    team: String
    createdAt: String!
    lastLogin: String!
}

type Session {
    token: String!
    user: User!
}

type Query {
    me: User
}

type Mutation {
    login(name: String!, email: String!): Session!
    logout: Boolean!
}
```

---

## 4. API Usage and Testing

### 1. Register or Log In
* **Mutation**: `login(name: String!, email: String!)`
* **Validation**: Trims inputs, enforces email address regex format, and converts email to lowercase.

```graphql
mutation {
  login(name: "John Doe", email: "john@example.com") {
    token
    user {
      id
      name
      email
      lastLogin
    }
  }
}
```

### 2. Extracting Session Context
To make calls to protected queries (like `me`) or future secure mutations, pass the session token value in one of the following HTTP headers:
1. **`X-Session-Token`**: `your-uuid-token-here`
2. **`Authorization`**: `Bearer your-uuid-token-here`

### 3. Fetch Authenticated User Details
* **Query**: `me`
* **Requirement**: Requires a valid, non-expired session token header.

```graphql
query {
  me {
    id
    name
    email
    lastLogin
  }
}
```
*If missing or invalid, throws a GraphQL error classifying as `UNAUTHORIZED`.*

### 4. Log Out (Session Invalidation)
* **Mutation**: `logout`
* **Requirement**: Requires the session token header of the session you wish to terminate.

```graphql
mutation {
  logout
}
```
*Returns `true` upon successful invalidation, removing the token mapping immediately on the server.*

---

## 5. Security Implementations to Keep in Mind
* **No Raw Password Fields**: The system uses secure passwordless authentication. Other features using user identity must fetch `"currentUser"` directly from the GraphQL context.
* **Session Details TTL**:
  * If a user does not make requests for **30 minutes**, their session is pruned.
  * Inactivity checks run inline during token validation, and a cron scheduler sweeps memory maps every **60 seconds**.
* **Input Sanitization**: Email addresses are normalized to lowercase on login to prevent duplicate registration issues (e.g. `User@Example.Com` and `user@example.com` are treated as the same account).
* **Scheduling Active**: `@EnableScheduling` is placed on the main application class `AiCodeReviewAssistantApplication.java`.
