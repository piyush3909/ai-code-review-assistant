import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MESSAGES_QUERY, SAVE_MESSAGE_MUTATION, REVIEW_CODE_MUTATION, GET_GAP_REPORT_QUERY } from '../graphql/operations';
import { Send, Loader2, User, Cpu, ShieldAlert, Zap, FileCode, HelpCircle, Paperclip, FileText, X, Cloud } from 'lucide-react';
import './ChatArea.css';
import MarkdownRenderer from './MarkdownRenderer';
import { extractTextFromPdf } from '../utils/pdfParser';
import GapReportView from './GapReportView';
import type { GapReport } from './GapReportView';

interface Message {
  messageId: string;
  role: 'USER' | 'AI';
  message: string;
  timestamp: string;
  imageBase64?: string;
}

interface ChatAreaProps {
  sessionId: string;
}

const promptStarters = [
  {
    title: 'Find Security Bugs',
    description: 'Scan code for vulnerabilities like SQL injection or leaks.',
    icon: <ShieldAlert className="starter-icon security" size={20} />,
    prompt: 'Review the following code specifically for security vulnerabilities and security best practices:\n\n```\n// paste your code here\n```'
  },
  {
    title: 'Optimize Performance',
    description: 'Identify bottlenecks and suggest runtime optimizations.',
    icon: <Zap className="starter-icon speed" size={20} />,
    prompt: 'Review this code for performance issues and suggest how to optimize it:\n\n```\n// paste your code here\n```'
  },
  {
    title: 'Generate Unit Tests',
    description: 'Generate JUnit or Jest tests covering all edge cases.',
    icon: <FileCode className="starter-icon test" size={20} />,
    prompt: 'Generate comprehensive unit tests for the following code, including normal flows and edge cases:\n\n```\n// paste your code here\n```'
  },
  {
    title: 'Explain Architecture',
    description: 'Understand the design patterns and document them.',
    icon: <HelpCircle className="starter-icon docs" size={20} />,
    prompt: 'Explain the design pattern, data flow, and structure of this code, then add clear comments:\n\n```\n// paste your code here\n```'
  }
];

export default function ChatArea({ sessionId }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<'HUGGING_FACE' | 'OLLAMA'>(() => {
    return (localStorage.getItem('default-ai-model') as 'HUGGING_FACE' | 'OLLAMA') || 'OLLAMA';
  });
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; size: string } | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; previewUrl: string; name?: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('default-code-language') || 'Java';
  });
  const [gapReport, setGapReport] = useState<GapReport | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const startersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, loading, networkStatus } = useQuery(GET_MESSAGES_QUERY, {
    variables: { sessionId },
    skip: !sessionId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });

  const { data: reportData } = useQuery(GET_GAP_REPORT_QUERY, {
    variables: { sessionId },
    skip: !sessionId,
    onCompleted: (res) => {
      if (res?.getGapReport) {
        setGapReport(res.getGapReport);
      }
    }
  });

  const isInitialLoading = loading && networkStatus !== 4;

  const [saveMessage, { loading: saving }] = useMutation(SAVE_MESSAGE_MUTATION, {
    refetchQueries: [{ query: GET_MESSAGES_QUERY, variables: { sessionId } }],
    onCompleted: async () => {
      setPendingUserMessage(null);
    },
    onError: async (err) => {
      console.error("Failed to send message:", err);
      alert("Failed to send message: " + err.message);
      setPendingUserMessage(null);
    }
  });

  const [reviewCode, { loading: isReviewing }] = useMutation(REVIEW_CODE_MUTATION, {
    refetchQueries: [
      { query: GET_GAP_REPORT_QUERY, variables: { sessionId } },
      { query: GET_MESSAGES_QUERY, variables: { sessionId } }
    ],
    onCompleted: (res) => {
      if (res?.reviewCode) {
        const report = res.reviewCode;
        setGapReport(report);
        
        // Save AI report summary message in chat history (model: null prevents conversational AI response)
        const issueSummary = report.issues.map((i: any) => `- [${i.severity}] ${i.category.replace('_', ' ')}: ${i.summary}`).join('\n');
        const aiMessage = `**Structured Code Review Report Generated**\n\n` +
                          `* **Quality Score:** ${report.qualityScore}/100\n` +
                          `* **Issues Identified:**\n${issueSummary || 'No issues found! Code quality is excellent.'}\n\n` +
                          `Click **View Report** in the banner at the top of the chat area to view details.`;
        
        saveMessage({
          variables: {
            sessionId,
            role: 'AI',
            message: aiMessage,
            model: null
          }
        });
      }
    },
    onError: (err) => {
      alert("Failed to review code: " + err.message);
    }
  });

  const handleReviewCode = (codeToReview?: string) => {
    const code = codeToReview || input;
    if (!code || !code.trim()) return;

    const codeSnippet = code;
    
    // Clear input if starting a new review from the chat input box
    if (!codeToReview) {
      setInput('');
    }

    // Save the submitted code snippet to the chat history as a USER message
    saveMessage({
      variables: {
        sessionId,
        role: 'USER',
        message: `### Submitted Code for Review (${language})\n\`\`\`${language.toLowerCase()}\n${codeSnippet}\n\`\`\``,
        model: null
      }
    });

    reviewCode({
      variables: {
        sessionId,
        code: codeSnippet,
        language: language,
        model: model
      }
    });
  };

  // Auto-grow textarea logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.getMessages, pendingUserMessage]);

  const handleSend = () => {
    if (!input.trim() && !attachedFile && !attachedImage) return;
    
    let finalMessage = input;
    let displayMessage = input;

    if (attachedFile) {
      finalMessage = `[Attached Document: ${attachedFile.name} (${attachedFile.size})]\n` +
                     `---------------------\n` +
                     `${attachedFile.content}\n` +
                     `---------------------\n\n` +
                     `${input}`;
      
      displayMessage = input 
        ? `[Attached Document: ${attachedFile.name}]\n\n${input}` 
        : `Analyzed document: ${attachedFile.name}`;
    } else if (attachedImage && !input.trim()) {
      finalMessage = "Please review the attached screenshot.";
      displayMessage = "Please review the attached screenshot.";
    }
    
    setInput('');
    setAttachedFile(null);
    const sentImageBase64 = attachedImage ? attachedImage.base64 : null;
    setAttachedImage(null);
    setPendingUserMessage(displayMessage);

    saveMessage({
      variables: {
        sessionId,
        role: 'USER',
        message: finalMessage,
        model: model,
        imageBase64: sentImageBase64
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAttachedImage({
          base64: result,
          previewUrl: result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Only PDF or Image files are supported.');
      return;
    }

    setIsExtracting(true);
    try {
      const text = await extractTextFromPdf(file);
      const sizeKb = (file.size / 1024).toFixed(1);
      
      setAttachedFile({
        name: file.name,
        content: text,
        size: `${sizeKb} KB`
      });
    } catch (err) {
      console.error('Failed to parse PDF', err);
      alert('Error reading PDF file. Make sure it is not password-protected.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setAttachedImage({
              base64: result,
              previewUrl: result,
              name: 'Screenshot-' + new Date().toLocaleTimeString().replace(/:/g, '') + '.png'
            });
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleStarterClick = (promptTemplate: string) => {
    setInput(promptTemplate);
    setTimeout(() => {
      textareaRef.current?.focus();
      // Position cursor inside the code block markers
      const index = promptTemplate.indexOf('// paste your code here');
      if (index !== -1 && textareaRef.current) {
        textareaRef.current.setSelectionRange(index, index + 23);
      }
    }, 50);
  };

  const hasMessages = data?.getMessages && data.getMessages.length > 0;

  if (gapReport) {
    return (
      <GapReportView 
        report={gapReport} 
        onBack={() => setGapReport(null)} 
        onReRun={handleReviewCode}
        isReRunning={isReviewing}
        model={model}
      />
    );
  }

  return (
    <div className="chat-area">
      <div className="messages-container">
        {reportData?.getGapReport && (
          <div className="report-banner glass-panel">
            <div className="banner-content">
              <ShieldAlert size={16} className="banner-icon" />
              <span>A structured code review report is available (Quality Score: {reportData.getGapReport.qualityScore}/100)</span>
            </div>
            <button className="banner-view-btn" onClick={() => setGapReport(reportData.getGapReport)}>
              View Report
            </button>
          </div>
        )}
        {isInitialLoading ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={24} />
          </div>
        ) : !hasMessages && !pendingUserMessage ? (
          <div ref={startersRef} className="prompt-starters-container">
            <div className="prompt-starters-header">
              <h3>Start a code review session</h3>
              <p>Select a quick template card or paste your code snippet directly in the input box.</p>
            </div>
            <div className="prompt-starters-grid">
              {promptStarters.map((starter, index) => (
                <button
                  key={index}
                  className="prompt-starter-card glass-panel"
                  onClick={() => handleStarterClick(starter.prompt)}
                >
                  <div className="starter-icon-wrapper">
                    {starter.icon}
                  </div>
                  <div className="starter-content">
                    <h4>{starter.title}</h4>
                    <p>{starter.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={listRef} className="messages-list">
            {data?.getMessages?.map((msg: Message) => (
              <div 
                key={msg.messageId} 
                className={`message-wrapper ${msg.role === 'USER' ? 'user' : 'ai'}`}
              >
                <div className={`message-bubble`}>
                  <div className="message-avatar">
                    {msg.role === 'USER' ? <User size={15} /> : <Cpu size={15} />}
                  </div>
                  <div className="message-content">
                    {msg.imageBase64 && (
                      <div className="message-image-container">
                        <img src={msg.imageBase64} alt="User attached screenshot" className="message-image" />
                      </div>
                    )}
                    {msg.role === 'USER' ? (
                      <pre className="user-pre">{msg.message}</pre>
                    ) : (
                      <MarkdownRenderer content={msg.message} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {pendingUserMessage && (
              <>
                <div className="message-wrapper user">
                  <div className="message-bubble">
                    <div className="message-avatar">
                      <User size={15} />
                    </div>
                    <div className="message-content">
                      <pre className="user-pre">{pendingUserMessage}</pre>
                    </div>
                  </div>
                </div>
                
                <div className="message-wrapper ai">
                  <div className="message-bubble thinking-bubble">
                    <div className="message-avatar">
                      <Cpu size={15} />
                    </div>
                    <div className="message-content">
                      <div className="thinking-indicator">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {isReviewing && !pendingUserMessage && (
              <div className="message-wrapper ai">
                <div className="message-bubble thinking-bubble" style={{ borderLeft: '3px solid #6366f1' }}>
                  <div className="message-avatar">
                    <Zap size={15} color="#818cf8" />
                  </div>
                  <div className="message-content" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>AI is generating structured code review report</span>
                    <div className="thinking-indicator" style={{ display: 'inline-flex', padding: 0 }}>
                      <span className="dot" style={{ backgroundColor: '#818cf8' }}></span>
                      <span className="dot" style={{ backgroundColor: '#818cf8' }}></span>
                      <span className="dot" style={{ backgroundColor: '#818cf8' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div ref={inputWrapperRef} className="chat-input-wrapper">
        <div className="model-selector-container">
          <div className="model-selector">
            <div 
              className="model-slider-indicator" 
              style={{
                transform: model === 'OLLAMA' ? 'translateX(100%)' : 'translateX(0%)'
              }}
            />
            <button 
              className={`model-btn ${model === 'HUGGING_FACE' ? 'active' : ''}`}
              onClick={() => setModel('HUGGING_FACE')}
            >
              <Cloud size={14} />
              Cloud (Hugging Face)
            </button>
            <button 
              className={`model-btn ${model === 'OLLAMA' ? 'active' : ''}`}
              onClick={() => setModel('OLLAMA')}
            >
              Local (Ollama)
            </button>
          </div>

          <div className="language-selector-wrapper">
            <span className="lang-label">Lang:</span>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select glass-panel"
              disabled={isReviewing}
            >
              <option value="Java">Java</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Python">Python</option>
            </select>
          </div>
        </div>

        {attachedFile && (
          <div className="attachment-badge-container">
            <div className="attachment-badge">
              <FileText size={14} className="attachment-file-icon" />
              <span className="attachment-file-name">{attachedFile.name}</span>
              <span className="attachment-file-size">({attachedFile.size})</span>
              <button 
                type="button" 
                className="attachment-remove-btn" 
                onClick={() => setAttachedFile(null)}
                title="Remove PDF specification"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {attachedImage && (
          <div className="attachment-badge-container">
            <div className="image-preview-badge">
              <img src={attachedImage.previewUrl} alt="Screenshot preview" className="preview-thumb" />
              <span className="attachment-file-name">{attachedImage.name || 'Screenshot'}</span>
              <button 
                type="button" 
                className="attachment-remove-btn" 
                onClick={() => setAttachedImage(null)}
                title="Remove screenshot"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="chat-input-container glass-panel">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,image/*"
            style={{ display: 'none' }}
          />
          <button 
            type="button"
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving || isExtracting}
            title="Attach PDF specification or Image screenshot"
          >
            {isExtracting ? (
              <Loader2 className="spinner" size={18} />
            ) : (
              <Paperclip size={18} />
            )}
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isExtracting ? "Extracting PDF text..." : "Paste screenshot (Ctrl+V), code, or type a message..."}
            disabled={saving || isExtracting || isReviewing}
            rows={1}
          />
          {input.trim() && (
            <button 
              className="review-code-btn"
              onClick={() => handleReviewCode()}
              disabled={isReviewing || saving}
              title="Run structured code review"
            >
              {isReviewing ? <Loader2 className="spinner" size={18} /> : <Zap size={18} />}
            </button>
          )}
          <button 
            className="send-button" 
            onClick={handleSend}
            disabled={(!input.trim() && !attachedFile && !attachedImage) || saving || isExtracting || isReviewing}
            title="Send chat message"
          >
            {saving ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
          </button>
        </div>
        <div className="input-footer">
          <p>AI Code Review Assistant - Shift + Enter for new lines</p>
        </div>
      </div>
    </div>
  );
}
