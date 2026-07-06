import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ME_QUERY } from '../graphql/operations';
import { X, User, Settings2, LogOut, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ProfileModal.css';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const navigate = useNavigate();
  const { data, loading } = useQuery(ME_QUERY, {
    fetchPolicy: 'cache-and-network'
  });

  const [defaultModel, setDefaultModel] = useState<'OLLAMA' | 'HUGGING_FACE'>(() => {
    return (localStorage.getItem('default-ai-model') as 'OLLAMA' | 'HUGGING_FACE') || 'OLLAMA';
  });

  const [defaultLanguage, setDefaultLanguage] = useState(() => {
    return localStorage.getItem('default-code-language') || 'Java';
  });

  const [showSavedToast, setShowSavedToast] = useState(false);

  const triggerToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleModelChange = (newModel: 'OLLAMA' | 'HUGGING_FACE') => {
    setDefaultModel(newModel);
    localStorage.setItem('default-ai-model', newModel);
    triggerToast();
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setDefaultLanguage(lang);
    localStorage.setItem('default-code-language', lang);
    triggerToast();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const user = data?.me;
  const userName = user?.name || localStorage.getItem('userName') || 'Developer';
  const userEmail = user?.email || localStorage.getItem('userEmail') || 'developer@company.com';
  const userTeam = user?.team || 'Engineering & AI';
  const createdAt = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Active Member';
  const lastLogin = user?.lastLogin ? new Date(user.lastLogin).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Just now';

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <button className="profile-modal-close-btn" onClick={onClose} title="Close Profile">
            <X size={18} />
          </button>
          
          <div className="profile-modal-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          
          <div className="profile-modal-title">
            <h2>{userName}</h2>
            <p>{userEmail}</p>
            <span className="profile-team-badge">{userTeam}</span>
          </div>
        </div>

        <div className="profile-modal-body">
          <div className="profile-section">
            <h3 className="profile-section-title">
              <User size={14} /> Account Information
            </h3>
            {loading ? (
              <div style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Loading account data...</div>
            ) : (
              <div className="profile-grid">
                <div className="profile-info-item">
                  <span className="profile-info-label">Display Name</span>
                  <span className="profile-info-value">{userName}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Email Address</span>
                  <span className="profile-info-value" title={userEmail}>{userEmail}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Member Since</span>
                  <span className="profile-info-value">{createdAt}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Last Active</span>
                  <span className="profile-info-value">{lastLogin}</span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="profile-section-title">
                <Settings2 size={14} /> Workflow Preferences
              </h3>
              {showSavedToast && (
                <div className="save-toast">
                  <CheckCircle2 size={13} /> Saved
                </div>
              )}
            </div>

            <div className="preferences-list">
              <div className="preference-item">
                <div className="preference-label">
                  <span>Default AI Review Model</span>
                  <small>Preselected engine when starting a new code review</small>
                </div>
                <div className="model-toggle-pills">
                  <button
                    type="button"
                    className={`model-pill-btn ${defaultModel === 'OLLAMA' ? 'active' : ''}`}
                    onClick={() => handleModelChange('OLLAMA')}
                  >
                    Ollama (Qwen)
                  </button>
                  <button
                    type="button"
                    className={`model-pill-btn ${defaultModel === 'HUGGING_FACE' ? 'active' : ''}`}
                    onClick={() => handleModelChange('HUGGING_FACE')}
                  >
                    HuggingFace
                  </button>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-label">
                  <span>Default Programming Language</span>
                  <small>Language applied to quick code snippet reviews</small>
                </div>
                <div className="preference-control">
                  <select value={defaultLanguage} onChange={handleLanguageChange}>
                    <option value="Java">Java</option>
                    <option value="Python">Python</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="C++">C++</option>
                    <option value="Go">Go</option>
                    <option value="Rust">Rust</option>
                    <option value="C#">C#</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button className="profile-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
          <button className="profile-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
