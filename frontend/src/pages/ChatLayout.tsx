import { useQuery } from '@apollo/client';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatArea from '../components/ChatArea';
import Sidebar from '../components/Sidebar';
import { ME_QUERY } from '../graphql/operations';
import './ChatLayout.css';

export default function ChatLayout() {
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const emptyStateRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');

  const { data, loading: loadingMe, error: meError } = useQuery(ME_QUERY, {
    skip: !token,
    fetchPolicy: 'network-only',
    onError: () => {
      localStorage.clear();
      navigate('/login');
    }
  });
  
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!loadingMe && !meError && data && !data.me) {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate, token, loadingMe, data, meError]);

  useLayoutEffect(() => {
    if (!activeSessionId && emptyStateRef.current) {
      const h2 = emptyStateRef.current.querySelector('h2');
      const p = emptyStateRef.current.querySelector('p');
      gsap.fromTo([h2, p],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, [activeSessionId]);

  return (
    <div className="chat-layout">
      <Sidebar 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
      />
      <div className="chat-main">
        {activeSessionId ? (
          <ChatArea sessionId={activeSessionId} />
        ) : (
          <div className="empty-state">
            <div ref={emptyStateRef} className="empty-state-content">
              <h2>Welcome to AI Code Review</h2>
              <p>Select a chat from the sidebar or start a new one to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
