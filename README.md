# AI Code Review Assistant 

An advanced, enterprise-grade full-stack AI coding review tool built with **Spring Boot 3.x (GraphQL)** on the backend and **React + TypeScript + Vite** on the frontend. It features a stunning, fully responsive design (mobile, tablet, desktop) and multi-engine AI support (HuggingFace Llama 3 & Local Ollama Vision).

---

## Quick Start & Complete Setup Guide

For detailed, step-by-step instructions on how to set up dependencies, configure the MySQL database, and run both the backend and frontend on your local system, please see our complete setup guide:

 **[SETUP_AND_RUN.md](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant-develop/ai-code-review-assistant-develop/ai-code-review-assistant-main/SETUP_AND_RUN.md)**

For a full technical breakdown of the system architecture, backend modular layering, ER diagrams, and GraphQL API contracts, check out:

 **[ARCHITECTURE.md](file:///c:/Users/piyush.d.kashyap/Downloads/ai-code-review-assistant-develop/ai-code-review-assistant-develop/ai-code-review-assistant-main/ARCHITECTURE.md)**

---

## ⚡ Quick Summary of Running Locally

### 1. Start the Backend (Spring Boot + GraphQL)
Ensure MySQL is running on port `3306` (default credentials: `root` / `root123` in `application.yml`).
```bash
cd ai-code-review-assistant
# On Windows:
mvnw.cmd spring-boot:run
# On macOS / Linux:
./mvnw spring-boot:run
```
- **GraphQL API Server**: `http://localhost:8080/graphql`
- **Interactive GraphiQL Playground**: `http://localhost:8080/graphiql`

### 2. Start the Frontend (React + Vite)
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
- **Web Application**: `http://localhost:5173`

---

##  Key Features
- ** 100% Responsive Design**: Fluid layouts with an off-canvas drawer for mobile (`< 1024px`), touch-optimized chat bubbles, horizontal-scrolling code blocks, and adaptive modals.
- ** Multi-Engine AI**: Switch seamlessly between cloud HuggingFace Llama-3.2-3B and local offline Ollama Qwen2.5-VL models.
- ** Secure Password Authentication**: Password-based authentication and user registration with 30-minute session TTL and automated background token sweeping.
