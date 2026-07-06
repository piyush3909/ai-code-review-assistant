import { Sparkles, Cpu, Menu } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  onOpenProfile?: () => void;
  onToggleMobileSidebar?: () => void;
}

export default function Header({ onOpenProfile, onToggleMobileSidebar }: HeaderProps) {
  const userName = localStorage.getItem('userName') || 'Developer';
  const currentModel = localStorage.getItem('default-ai-model') === 'HUGGING_FACE' ? 'HuggingFace Llama' : 'Ollama Vision';

  return (
    <header className="app-header">
      <div className="header-left-container">
        <button 
          className="header-mobile-menu-btn" 
          onClick={onToggleMobileSidebar}
          title="Open navigation menu"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-brand-badge" onClick={onOpenProfile} title="AI Assistant Core">
          <Sparkles size={18} className="header-brand-icon" />
          <span className="header-brand-text">AI Core</span>
        </div>
        
        <div className="header-title-group">
          <span className="header-app-title">AI Code Review <span>Assistant</span></span>
          <span className="header-pro-tag">PRO v2.5</span>
        </div>
      </div>

      <div className="header-actions">
        <div className="header-engine-badge" title="Active AI Inference Engine">
          <span className="header-live-dot"></span>
          <Cpu size={14} color="#818cf8" />
          <span className="header-engine-text">Engine: <strong>{currentModel}</strong></span>
        </div>
        
        <button className="header-profile-btn" onClick={onOpenProfile} title="Click to view Profile & Workflow Preferences">
          <div className="header-avatar-circle">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span>{userName}</span>
        </button>
      </div>
    </header>
  );
}
