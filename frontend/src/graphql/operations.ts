import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($name: String!, $email: String!) {
    login(name: $name, email: $email) {
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
  mutation SaveMessage($sessionId: ID!, $role: Role!, $message: String!, $model: AiModel!) {
    saveMessage(sessionId: $sessionId, role: $role, message: $message, model: $model) {
      messageId
      sessionId
      role
      message
      timestamp
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;
