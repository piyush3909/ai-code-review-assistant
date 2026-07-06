import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SESSIONS_QUERY, CREATE_NEW_SESSION_MUTATION, DELETE_SESSION_MUTATION } from '../graphql/operations';
import { Plus, MessageSquare, LogOut, Code2, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

interface Session {
  sessionId: string;
  title: string;
}

interface SidebarProps {
  activeSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  onOpenProfile?: () => void;
}

export default function Sidebar({ activeSessionId, onSelectSession, onOpenProfile }: SidebarProps) {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionsRef = useRef<HTMLDivElement>(null);

  const { data, loading, refetch } = useQuery(GET_SESSIONS_QUERY, {
    variables: { userId },
    skip: !userId,
  });

  const [createSession] = useMutation(CREATE_NEW_SESSION_MUTATION, {
    onCompleted: (res: any) => {
      refetch();
      onSelectSession(res.createNewSession.sessionId);
      setIsCreating(false);
    }
  });

  const [deleteSession] = useMutation(DELETE_SESSION_MUTATION, {
    onCompleted: () => {
      refetch();
    }
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const handleNewChat = () => {
    if (!userId) return;
    setIsCreating(true);
    createSession({
      variables: {
        userId,
        title: `Code Review ${new Date().toLocaleDateString()}`
      }
    });
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionIdToDelete: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this code review chat?')) {
      deleteSession({
        variables: { sessionId: sessionIdToDelete }
      });
      if (activeSessionId === sessionIdToDelete) {
        onSelectSession(null);
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div ref={containerRef} className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-row">
          {!isCollapsed && (
            <div className="sidebar-brand">
              <Code2 className="brand-icon" size={24} />
              <span>AI Assistant</span>
            </div>
          )}
          <button 
            className="sidebar-top-toggle-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <button 
          className="new-chat-btn" 
          onClick={handleNewChat}
          disabled={isCreating}
          title={isCollapsed ? "New Review" : undefined}
        >
          <Plus size={18} />
          {!isCollapsed && <span>New Review</span>}
        </button>
      </div>


      <div ref={sessionsRef} className="sidebar-sessions">
        {loading ? (
          <div className="loading-sessions">{isCollapsed ? "..." : "Loading..."}</div>
        ) : (
          data?.getSessions?.map((session: Session) => (
            <div key={session.sessionId} className="session-item-wrapper">
              <button
                className={`session-item ${activeSessionId === session.sessionId ? 'active' : ''}`}
                onClick={() => onSelectSession(session.sessionId)}
                title={isCollapsed ? session.title : undefined}
              >
                <MessageSquare size={16} />
                {!isCollapsed && <span className="session-title">{session.title}</span>}
              </button>
              {!isCollapsed && (
                <button
                  className="session-delete-btn"
                  onClick={(e) => handleDeleteSession(e, session.sessionId)}
                  title="Delete review"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-info" onClick={onOpenProfile} title="View & Edit Profile Preferences">
          <div className="user-avatar">
            {userName?.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && <span className="user-name">{userName}</span>}
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}

