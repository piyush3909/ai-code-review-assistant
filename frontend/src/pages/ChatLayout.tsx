import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { CREATE_NEW_SESSION_MUTATION, GET_SESSIONS_QUERY } from '../graphql/operations';
import { Code2, Plus, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileModal from '../components/ProfileModal';
import GuidelinesModal from '../components/GuidelinesModal';
import './ChatLayout.css';

export default function ChatLayout() {
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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
    <div className="page-container">
      <Header 
        onOpenProfile={() => setShowProfileModal(true)} 
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      <div className="chat-layout">
      <Sidebar 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
        onOpenProfile={() => setShowProfileModal(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className="chat-main">
        {activeSessionId ? (
          <ChatArea key={activeSessionId} sessionId={activeSessionId} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
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
      <Footer onOpenGuidelines={() => setShowGuidelinesModal(true)} />
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showGuidelinesModal && <GuidelinesModal onClose={() => setShowGuidelinesModal(false)} />}
    </div>
  );
}

