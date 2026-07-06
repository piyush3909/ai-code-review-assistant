import { BookOpenCheck } from 'lucide-react';
import './Footer.css';

interface FooterProps {
  onOpenGuidelines?: () => void;
}

export default function Footer({ onOpenGuidelines }: FooterProps) {
  return (
    <footer className="app-footer">
      <div className="footer-section footer-left">
        <div className="footer-status-indicator">
          <span className="footer-status-dot"></span>
          <span>Security Shield Active • v2.5.0</span>
        </div>
      </div>

      <div className="footer-section footer-center">
        <div className="footer-shortcuts">
          <span><span className="shortcut-key">↵ Enter</span> to review</span>
          <span>•</span>
          <span><span className="shortcut-key">Shift + ↵</span> new line</span>
          <span>•</span>
          <span><span className="shortcut-key">Ctrl + V</span> attach image</span>
        </div>
      </div>

      <div className="footer-section footer-right">
        <button className="footer-guidelines-btn" onClick={onOpenGuidelines} title="View Review Guidelines & AI Standards">
          <BookOpenCheck size={14} />
          <span>Guidelines</span>
        </button>
        <span className="footer-copyright">© 2026 Accenture AI</span>
      </div>
    </footer>
  );
}
