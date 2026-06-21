import { useState, useRef, useLayoutEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SESSIONS_QUERY, CREATE_NEW_SESSION_MUTATION, DELETE_SESSION_MUTATION } from '../graphql/operations';
import { Plus, MessageSquare, LogOut, Code2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './Sidebar.css';

interface Session {
  sessionId: string;
  title: string;
}

interface SidebarProps {
  activeSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}

export default function Sidebar({ activeSessionId, onSelectSession }: SidebarProps) {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
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

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const header = containerRef.current.querySelector('.sidebar-header');
    const footer = containerRef.current.querySelector('.sidebar-footer');
    
    gsap.fromTo([header, footer],
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, stagger: 0.2, ease: 'power3.out' }
    );
  }, []);

  useLayoutEffect(() => {
    if (!sessionsRef.current || !data?.getSessions) return;
    const items = sessionsRef.current.querySelectorAll('.session-item-wrapper');
    if (items.length > 0) {
      gsap.fromTo(items,
        { opacity: 0, x: -15 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, [data?.getSessions]);

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
    <div ref={containerRef} className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <Code2 className="brand-icon" size={24} />
          <span>AI Assistant</span>
        </div>
        <button 
          className="new-chat-btn" 
          onClick={handleNewChat}
          disabled={isCreating}
        >
          <Plus size={18} />
          <span>New Review</span>
        </button>
      </div>

      <div ref={sessionsRef} className="sidebar-sessions">
        {loading ? (
          <div className="loading-sessions">Loading...</div>
        ) : (
          data?.getSessions?.map((session: Session) => (
            <div key={session.sessionId} className="session-item-wrapper">
              <button
                className={`session-item ${activeSessionId === session.sessionId ? 'active' : ''}`}
                onClick={() => onSelectSession(session.sessionId)}
              >
                <MessageSquare size={16} />
                <span className="session-title">{session.title}</span>
              </button>
              <button
                className="session-delete-btn"
                onClick={(e) => handleDeleteSession(e, session.sessionId)}
                title="Delete review"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{userName?.charAt(0).toUpperCase()}</div>
          <span className="user-name">{userName}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
