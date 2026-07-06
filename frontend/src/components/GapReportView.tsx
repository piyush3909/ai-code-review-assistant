import { useState, useRef } from 'react';
import { ShieldAlert, Zap, FileCode, HelpCircle, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Info, ArrowLeft, RefreshCw, Sparkles, Copy, X } from 'lucide-react';
import './GapReportView.css';
import { useMutation } from '@apollo/client';
import { FIX_CODE_MUTATION } from '../graphql/operations';

export interface GapIssue {
  category: 'LINT' | 'SECURITY' | 'COVERAGE' | 'DEAD_CODE';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  summary: string;
  lineNumbers?: string;
  suggestedFix?: string;
}

export interface GapReport {
  reportId: string;
  sessionId: string;
  qualityScore: number;
  code: string;
  summary: string;
  issues: GapIssue[];
  suggestedActions: string[];
}

interface GapReportViewProps {
  report: GapReport;
  onBack: () => void;
  onReRun?: (code: string) => void;
  isReRunning?: boolean;
  model: 'HUGGING_FACE' | 'OLLAMA';
}

export default function GapReportView({ report, onBack, onReRun, isReRunning, model }: GapReportViewProps) {
  const [expandedIssueIndex, setExpandedIssueIndex] = useState<number | null>(null);
  const [fixedCode, setFixedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [fixCode, { loading: isFixing }] = useMutation(FIX_CODE_MUTATION, {
    variables: {
      sessionId: report.sessionId,
      model: model
    },
    onCompleted: (data) => {
      if (data?.fixCode) {
        setFixedCode(data.fixCode);
      }
    },
    onError: (err) => {
      alert("Failed to fix code: " + err.message);
    }
  });

  const handleFixCode = () => {
    fixCode();
  };

  const handleCopy = () => {
    if (fixedCode) {
      navigator.clipboard.writeText(fixedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };



  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'score-green';
    if (score >= 50) return 'score-yellow';
    return 'score-red';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <ShieldAlert className="severity-icon critical" size={18} />;
      case 'ERROR':
        return <AlertTriangle className="severity-icon error" size={18} />;
      case 'WARNING':
        return <AlertTriangle className="severity-icon warning" size={18} />;
      case 'INFO':
      default:
        return <Info className="severity-icon info" size={18} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return <ShieldAlert size={14} />;
      case 'COVERAGE':
        return <Zap size={14} />;
      case 'LINT':
        return <FileCode size={14} />;
      case 'DEAD_CODE':
      default:
        return <HelpCircle size={14} />;
    }
  };

  const toggleIssue = (index: number) => {
    setExpandedIssueIndex(expandedIssueIndex === index ? null : index);
  };

  return (
    <div ref={containerRef} className="gap-report-view">
      <div className="report-navbar">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Chat</span>
        </button>
        <div className="navbar-actions">
          {onReRun && (
            <button className="rerun-btn" onClick={() => onReRun(report.code)} disabled={isReRunning || isFixing}>
              <RefreshCw className={isReRunning ? 'spinner' : ''} size={16} />
              <span>{isReRunning ? 'Re-analyzing...' : 'Re-run Analysis'}</span>
            </button>
          )}
          <button 
            className="fix-code-btn-premium" 
            onClick={handleFixCode} 
            disabled={isFixing || isReRunning}
          >
            <Sparkles className={isFixing ? 'spinner' : ''} size={16} />
            <span>{isFixing ? 'Fixing Code...' : 'Fix Code'}</span>
          </button>
        </div>
      </div>

      <div className="report-dashboard">
        {/* Quality Score Header */}
        <div className="report-header-card glass-panel">
          <div className="score-section">
            <div className={`score-ring-wrapper ${getScoreColorClass(report.qualityScore)}`}>
              <svg className="score-ring" viewBox="0 0 100 100">
                <circle className="score-ring-bg" cx="50" cy="50" r="42" />
                <circle 
                  className="score-ring-fill" 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - report.qualityScore / 100)}`}
                />
              </svg>
              <div className="score-value">
                <span className="number">{report.qualityScore}</span>
                <span className="label">SCORE</span>
              </div>
            </div>
          </div>
          <div className="summary-section">
            <h2>PR Code Quality Report</h2>
            <p className="summary-text">{report.summary}</p>
            <div className="stats-badges">
              <span className="stat-badge crit">
                {report.issues.filter(i => i.severity === 'CRITICAL').length} Critical
              </span>
              <span className="stat-badge err">
                {report.issues.filter(i => i.severity === 'ERROR').length} Errors
              </span>
              <span className="stat-badge warn">
                {report.issues.filter(i => i.severity === 'WARNING').length} Warnings
              </span>
              <span className="stat-badge info">
                {report.issues.filter(i => i.severity === 'INFO').length} Info
              </span>
            </div>
          </div>
        </div>

        {/* Refactored Code Section */}
        {fixedCode && (
          <div className="fixed-code-card glass-panel animate-fade-in">
            <div className="fixed-code-header">
              <div className="header-title">
                <Sparkles className="fix-icon" size={18} />
                <h3>Refactored Error-Free Code</h3>
              </div>
              <div className="header-actions">
                <button className="copy-code-btn" onClick={handleCopy}>
                  {copied ? <CheckCircle size={16} className="text-green" /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button className="close-fixed-btn" onClick={() => setFixedCode(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="fixed-code-body">
              <pre className="fixed-code-pre">
                <code>{fixedCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Detailed Findings */}
        <div className="report-findings-section">
          <h3>Code Findings ({report.issues.length})</h3>
          <div className="issues-list">
            {report.issues.length === 0 ? (
              <div className="no-issues-card glass-panel">
                <CheckCircle className="check-success" size={24} />
                <p>No issues found! Your code is fully compliant with standards.</p>
              </div>
            ) : (
              report.issues.map((issue, idx) => {
                const isExpanded = expandedIssueIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className={`issue-item-card glass-panel ${issue.severity.toLowerCase()} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div className="issue-header" onClick={() => toggleIssue(idx)}>
                      <div className="issue-title-block">
                        {getSeverityIcon(issue.severity)}
                        <div className="issue-meta">
                          <span className={`severity-tag ${issue.severity.toLowerCase()}`}>
                            {issue.severity}
                          </span>
                          <span className="category-tag">
                            {getCategoryIcon(issue.category)}
                            <span>{issue.category.replace('_', ' ')}</span>
                          </span>
                          {issue.lineNumbers && (
                            <span className="line-badge">
                              Lines {issue.lineNumbers}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="issue-summary-trigger">
                        <span className="issue-summary-text">{issue.summary}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="issue-details animate-expand">
                        <div className="detail-row">
                          <h5>Issue Summary</h5>
                          <p>{issue.summary}</p>
                        </div>
                        {issue.suggestedFix && (
                          <div className="detail-row fix-suggestion">
                            <h5>Suggested Fix</h5>
                            <pre className="fix-code-block">
                              <code>{issue.suggestedFix}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Suggested Next Actions Checklist */}
        <div className="suggested-actions-card glass-panel">
          <h3>Suggested Next Actions</h3>
          <ul className="actions-checklist">
            {report.suggestedActions.map((action, idx) => (
              <li key={idx} className="action-item">
                <input type="checkbox" id={`action-${idx}`} className="action-checkbox" />
                <label htmlFor={`action-${idx}`}>{action}</label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
