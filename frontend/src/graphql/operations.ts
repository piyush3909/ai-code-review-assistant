import { gql } from '@apollo/client';

export const SIGNUP_MUTATION = gql`
  mutation Signup($name: String!, $email: String!, $password: String!) {
    signup(name: $name, email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const GET_SESSIONS_QUERY = gql`
  query GetSessions($userId: ID!) {
    getSessions(userId: $userId) {
      sessionId
      userId
      title
      createdDate
      updatedDate
    }
  }
`;

export const GET_MESSAGES_QUERY = gql`
  query GetMessages($sessionId: ID!) {
    getMessages(sessionId: $sessionId) {
      messageId
      sessionId
      role
      message
      timestamp
      imageBase64
    }
  }
`;

export const CREATE_NEW_SESSION_MUTATION = gql`
  mutation CreateNewSession($userId: ID!, $title: String!) {
    createNewSession(userId: $userId, title: $title) {
      sessionId
      userId
      title
      createdDate
      updatedDate
    }
  }
`;

export const SAVE_MESSAGE_MUTATION = gql`
  mutation SaveMessage($sessionId: ID!, $role: Role!, $message: String!, $model: AiModel, $imageBase64: String) {
    saveMessage(sessionId: $sessionId, role: $role, message: $message, model: $model, imageBase64: $imageBase64) {
      messageId
      sessionId
      role
      message
      timestamp
      imageBase64
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      team
      createdAt
      lastLogin
    }
  }
`;

export const DELETE_SESSION_MUTATION = gql`
  mutation DeleteSession($sessionId: ID!) {
    deleteSession(sessionId: $sessionId)
  }
`;

export const REVIEW_CODE_MUTATION = gql`
  mutation ReviewCode($sessionId: ID!, $code: String!, $language: String!, $model: AiModel!) {
    reviewCode(sessionId: $sessionId, code: $code, language: $language, model: $model) {
      reportId
      sessionId
      qualityScore
      code
      summary
      suggestedActions
      issues {
        category
        severity
        summary
        lineNumbers
        suggestedFix
      }
    }
  }
`;

export const GET_GAP_REPORT_QUERY = gql`
  query GetGapReport($sessionId: ID!) {
    getGapReport(sessionId: $sessionId) {
      reportId
      sessionId
      qualityScore
      code
      summary
      suggestedActions
      issues {
        category
        severity
        summary
        lineNumbers
        suggestedFix
      }
    }
  }
`;

export const FIX_CODE_MUTATION = gql`
  mutation FixCode($sessionId: ID!, $model: AiModel!) {
    fixCode(sessionId: $sessionId, model: $model)
  }
`;
