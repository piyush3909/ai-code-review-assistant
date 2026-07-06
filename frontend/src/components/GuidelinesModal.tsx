import { X, ShieldCheck, Zap, FileCheck, Sparkles } from 'lucide-react';
import './GuidelinesModal.css';

interface GuidelinesModalProps {
  onClose: () => void;
}

export default function GuidelinesModal({ onClose }: GuidelinesModalProps) {
  return (
    <div className="guidelines-modal-overlay" onClick={onClose}>
      <div className="guidelines-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="guidelines-header">
          <div className="guidelines-header-title">
            <div className="guidelines-icon-wrapper">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2>Code Review Guidelines</h2>
              <p>Engineering standards & AI assistance best practices</p>
            </div>
          </div>
          <button className="guidelines-close-btn" onClick={onClose} title="Close Guidelines">
            <X size={18} />
          </button>
        </div>

        <div className="guidelines-body">
          <div className="guideline-card">
            <div className="guideline-icon security">
              <ShieldCheck size={20} />
            </div>
            <div className="guideline-content">
              <h4>Security & Data Protection</h4>
              <p>Never commit hardcoded API tokens, private keys, or PII. Always validate and sanitize user inputs to mitigate SQL injection and XSS risks.</p>
            </div>
          </div>

          <div className="guideline-card">
            <div className="guideline-icon perf">
              <Zap size={20} />
            </div>
            <div className="guideline-content">
              <h4>Runtime Optimization</h4>
              <p>Avoid N+1 query patterns in database interactions. Prefer asynchronous batching, caching, and stream processing for high-throughput operations.</p>
            </div>
          </div>

          <div className="guideline-card">
            <div className="guideline-icon testing">
              <FileCheck size={20} />
            </div>
            <div className="guideline-content">
              <h4>Comprehensive Test Coverage</h4>
              <p>All production pull requests must include unit and integration tests verifying both expected positive workflows and critical edge case failures.</p>
            </div>
          </div>

          <div className="guideline-card">
            <div className="guideline-icon ai">
              <Sparkles size={20} />
            </div>
            <div className="guideline-content">
              <h4>Multimodal AI Interaction</h4>
              <p>To maximize code review accuracy, attach UI screenshots alongside relevant snippet logic or use the structured review cards to generate Gap Reports.</p>
            </div>
          </div>
        </div>

        <div className="guidelines-footer">
          <button className="guidelines-done-btn" onClick={onClose}>
            Got It, Close
          </button>
        </div>
      </div>
    </div>
  );
}
