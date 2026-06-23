import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
// @ts-ignore
import Aurora from '../components/Aurora';
import { CREATE_NEW_SESSION_MUTATION, GET_SESSIONS_QUERY } from '../graphql/operations';
import { Code2, Plus, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import './ChatLayout.css';

export default function ChatLayout() {
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const emptyStateRef = useRef<HTMLDivElement>(null);
  
  const userId = localStorage.getItem('userId');

  const [createSession, { loading: isCreating }] = useMutation(CREATE_NEW_SESSION_MUTATION, {
    refetchQueries: [{ query: GET_SESSIONS_QUERY, variables: { userId } }],
    onCompleted: (res: any) => {
      setActiveSessionId(res.createNewSession.sessionId);
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useLayoutEffect(() => {
    if (!activeSessionId && emptyStateRef.current) {
      const logo = emptyStateRef.current.querySelector('.empty-state-logo');
      const h2 = emptyStateRef.current.querySelector('h2');
      const p = emptyStateRef.current.querySelector('p');
      const btn = emptyStateRef.current.querySelector('.empty-state-btn');
      
      gsap.fromTo([logo, h2, p, btn],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' }
      );
    }
  }, [activeSessionId]);

  const handleStartNewReview = () => {
    if (!userId || isCreating) return;
    createSession({
      variables: {
        userId,
        title: `Code Review ${new Date().toLocaleDateString()}`
      }
    });
  };

  return (
    <div className="chat-layout">
      <Sidebar 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
      />
      <div className="chat-main">
        {activeSessionId ? (
          <ChatArea key={activeSessionId} sessionId={activeSessionId} />
        ) : (
          <div className="empty-state">
            <Aurora
              colorStops={['#6366f1', '#06b6d4', '#6366f1']}
              amplitude={1.0}
              blend={0.5}
            />
            <div ref={emptyStateRef} className="empty-state-content">
              <div className="empty-state-logo">
                <Code2 size={36} />
              </div>
              <h2>AI Code Review Assistant</h2>
              <p>Elevate your code quality with instant, context-aware analysis and developer guidance.</p>
              <button 
                className="empty-state-btn"
                onClick={handleStartNewReview}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="spinner" size={16} />
                ) : (
                  <Plus size={16} />
                )}
                <span>{isCreating ? 'Creating...' : 'Start New Review'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
