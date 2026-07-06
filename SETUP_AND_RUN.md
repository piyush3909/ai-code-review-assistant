# AI Code Review Assistant - Complete Setup & Execution Guide

Welcome to the **AI Code Review Assistant**! This application is an advanced, enterprise-grade full-stack AI coding review tool built with **Spring Boot 3.x (GraphQL)** on the backend and **React + TypeScript + Vite** on the frontend. It features a stunning, fully responsive design (mobile, tablet, desktop) and multi-engine AI support (HuggingFace Llama 3 & Local Ollama Vision).

---

##  Table of Contents
1. [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
2. [Database Configuration](#2-database-configuration)
3. [Running the Backend (Spring Boot + GraphQL)](#3-running-the-backend-spring-boot--graphql)
4. [Running the Frontend (React + Vite)](#4-running-the-frontend-react--vite)
5. [Building for Production](#5-building-for-production)
6. [Architecture & Key Features](#6-architecture--key-features)
7. [Troubleshooting & Common Issues](#7-troubleshooting--common-issues)

---

## 1. Prerequisites & System Requirements

Before starting the project on your local machine, ensure you have the following installed:

| Tool / Service | Minimum Version | Purpose | Download Link |
| :--- | :--- | :--- | :--- |
| **Java (JDK)** | **17+** (JDK 17 or 21 recommended) | Required to run Spring Boot 3.x backend | [Adoptium JDK](https://adoptium.net/) |
| **Node.js & npm** | **v18.0.0+** | Required to build & run React frontend | [Node.js Official](https://nodejs.org/) |
| **MySQL Server** | **v8.0+** | Relational database for users & sessions | [MySQL Community](https://dev.mysql.com/downloads/mysql/) |
| **Ollama** *(Optional)* | Latest | For local AI vision/code review models (`qwen2.5vl:latest`) | [Ollama.com](https://ollama.com/) |

---

## 2. Database Configuration

The backend is configured to connect to a local MySQL instance on port `3306`. By default, Spring Boot will **automatically create the database** (`ai_code_review_db`) and generate the required tables on startup.

### Default Database Credentials
In `ai-code-review-assistant/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ai_code_review_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
    username: root
    password: root123
```

> [!IMPORTANT]
> If your local MySQL server uses a different username, password, or port, open **`ai-code-review-assistant/src/main/resources/application.yml`** and update lines 6–9 with your credentials before starting the backend.

---

## 3. Running the Backend (Spring Boot + GraphQL)

The backend uses Spring Boot 3 with GraphQL and includes a self-contained Maven wrapper (`mvnw`), so you do not need to install Maven globally!

### Step-by-Step Instructions:
1. Open your terminal or command prompt.
2. Navigate into the backend directory:
   ```bash
   cd ai-code-review-assistant
   ```
3. Start the application using the Maven wrapper:
   - **On Windows (Command Prompt / PowerShell)**:
     ```cmd
     mvnw.cmd spring-boot:run
     ```
   - **On macOS / Linux / Git Bash**:
     ```bash
     chmod +x mvnw
     ./mvnw spring-boot:run
     ```

4. **Verify Backend Startup**:
   - Once started, you will see `Started AiCodeReviewAssistantApplication in X seconds` in the console.
   - The GraphQL API server will be live at: **`http://localhost:8080/graphql`**
   - You can open the interactive **GraphiQL Playground** in your browser at: **`http://localhost:8080/graphiql`**

---

## 4. Running the Frontend (React + Vite)

The frontend is built using React 18, TypeScript, and Vite for lightning-fast development and hot-module replacement (HMR).

### Step-by-Step Instructions:
1. Open a **new, separate terminal window** (keep the backend running in the first window).
2. Navigate into the frontend directory:
   ```bash
   cd frontend
   ```
3. Install all required Node packages and dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. **Access the Web Application**:
   - Open your web browser and navigate to: **`http://localhost:5173`**
   - You will be greeted by the authentication & landing page! You can log in with your credentials or register a new account instantly.

---

## 5. Building for Production

To compile and verify the frontend codebase for production deployment:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Run the build script (which executes TypeScript type checking `tsc -b` followed by `vite build`):
   ```bash
   npm run build
   ```
3. The production-ready static assets will be generated inside the `frontend/dist/` directory.

> [!TIP]
> **Windows PowerShell Users**: If you encounter an error like *`npm.ps1 cannot be loaded because running scripts is disabled`*, run the command using Windows Command Prompt or prefix it with `cmd /c`:
> ```cmd
> cmd /c npm run build
> ```
> Or use `npm.cmd run build` directly.

---

## 6. Architecture & Key Features

### Fully Responsive Web Design
The frontend has been meticulously crafted to deliver a premium, fluid user experience across all device viewports:
- **Mobile (`< 640px`) & Tablet (`< 1024px`)**:
  - **Off-Canvas Navigation Drawer**: On screens under `1024px`, the left sidebar collapses into an off-canvas drawer triggered by a hamburger button in the top header, complete with a dark blur backdrop overlay.
  - **Touch-Optimized Chat & Code Blocks**: Message bubbles expand to 96% width on mobile, and code blocks feature smooth horizontal scrolling (`-webkit-overflow-scrolling: touch`) with comfortable tap targets.
  - **Adaptive Modals**: Profile settings and guidelines modals scale to 95vw, converting multi-column layouts into clean single-column stacked forms.
  - **Hero Section**: On compact mobile screens (`< 480px`), the login illustration is hidden so users can immediately interact with the login form without scrolling.
- **Desktop & Laptop (`> 1024px`)**:
  - Split-screen landing layout, expandable glassmorphic sidebar, and multi-column prompt starter cards.

### Multi-Engine AI Support
The application supports two powerful AI review backends:
1. **HuggingFace Llama-3.2-3B-Instruct**: Configured out-of-the-box via cloud API inference (default API key included in `application.yml`).
2. **Local Ollama Vision (`qwen2.5vl:latest`)**: Run your code reviews 100% locally and offline by starting Ollama on port `11434`.

### Password Authentication & Session Management
- Secure password-based authentication with user registration and email validation.
- Token-based sessions with **30-minute inactivity TTL expiration**.
- Automated background sweeping prunes expired session tokens every minute to prevent memory leaks.

---

## 7. Troubleshooting & Common Issues

### ❌ Error: `Port 8080 is already in use`
- Another service (or an old instance of Spring Boot) is using port 8080.
- **Fix on Windows**:
  ```cmd
  netstat -ano | findstr :8080
  taskkill /PID <PID_NUMBER> /F
  ```
- **Fix on macOS/Linux**:
  ```bash
  lsof -i :8080
  kill -9 <PID_NUMBER>
  ```

### ❌ Error: `Access denied for user 'root'@'localhost'`
- MySQL password mismatch.
- **Fix**: Open `ai-code-review-assistant/src/main/resources/application.yml` and change `password: root123` to match your local MySQL root password.

### ❌ Error: `Connection refused (Connection to localhost:3306 failed)`
- MySQL server is not running or is listening on a different port.
- **Fix**: Start your MySQL server (via Windows Services, MySQL Workbench, Homebrew, or Docker).

### ❌ Error: `npm : File ... npm.ps1 cannot be loaded`
- Windows PowerShell execution policy restricts script execution.
- **Fix**: Run `cmd /c npm run dev` or `npm.cmd run dev` instead of plain `npm run dev`.

---
*Happy Coding & Code Reviewing!*
