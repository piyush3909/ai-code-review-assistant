import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MESSAGES_QUERY, SAVE_MESSAGE_MUTATION } from '../graphql/operations';
import { Send, Loader2, User, Cpu, ShieldAlert, Zap, FileCode, HelpCircle, Paperclip, FileText, X } from 'lucide-react';
import gsap from 'gsap';
import './ChatArea.css';
import MarkdownRenderer from './MarkdownRenderer';
import { extractTextFromPdf } from '../utils/pdfParser';
// @ts-ignore
import Aurora from './Aurora';

interface Message {
  messageId: string;
  role: 'USER' | 'AI';
  message: string;
  timestamp: string;
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
  const [model, setModel] = useState<'GROK' | 'OLLAMA'>('OLLAMA');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; size: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const startersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, loading, refetch, networkStatus } = useQuery(GET_MESSAGES_QUERY, {
    variables: { sessionId },
    skip: !sessionId,
    notifyOnNetworkStatusChange: true,
  });

  const isInitialLoading = loading && networkStatus !== 4;

  const [saveMessage, { loading: saving }] = useMutation(SAVE_MESSAGE_MUTATION, {
    onCompleted: async () => {
      await refetch();
      setPendingUserMessage(null);
    },
    onError: async () => {
      await refetch();
      setPendingUserMessage(null);
    }
  });

  // Auto-grow textarea logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  useLayoutEffect(() => {
    if (inputWrapperRef.current) {
      gsap.fromTo(inputWrapperRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, [sessionId]);

  // Animate messages list
  useLayoutEffect(() => {
    if (data?.getMessages && listRef.current) {
      const msgs = listRef.current.querySelectorAll('.message-bubble');
      gsap.fromTo(msgs,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      );
    }
  }, [data?.getMessages]);

  // Animate prompt starter cards when empty state resolves
  useLayoutEffect(() => {
    const hasMessages = data?.getMessages && data.getMessages.length > 0;
    if (startersRef.current && !isInitialLoading && !hasMessages && !pendingUserMessage) {
      const header = startersRef.current.querySelector('.prompt-starters-header');
      const cards = startersRef.current.querySelectorAll('.prompt-starter-card');
      gsap.fromTo([header, cards],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [sessionId, isInitialLoading, data?.getMessages, pendingUserMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.getMessages, pendingUserMessage]);

  const handleSend = () => {
    if (!input.trim() && !attachedFile) return;
    
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
    }
    
    setInput('');
    setAttachedFile(null);
    setPendingUserMessage(displayMessage);

    saveMessage({
      variables: {
        sessionId,
        role: 'USER',
        message: finalMessage,
        model: model
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

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported.');
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

  return (
    <div className="chat-area">
      <Aurora
        colorStops={['#6366f1', '#06b6d4', '#6366f1']}
        amplitude={1.0}
        blend={0.5}
      />
      <div className="messages-container">
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
                  <div className="message-bubble animate-slide-up">
                    <div className="message-avatar">
                      <User size={15} />
                    </div>
                    <div className="message-content">
                      <pre className="user-pre">{pendingUserMessage}</pre>
                    </div>
                  </div>
                </div>
                
                <div className="message-wrapper ai">
                  <div className="message-bubble animate-slide-up thinking-bubble">
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
              className={`model-btn ${model === 'GROK' ? 'active' : ''}`}
              onClick={() => setModel('GROK')}
            >
              Cloud (Grok)
            </button>
            <button 
              className={`model-btn ${model === 'OLLAMA' ? 'active' : ''}`}
              onClick={() => setModel('OLLAMA')}
            >
              Local (Ollama)
            </button>
          </div>
        </div>

        {attachedFile && (
          <div className="attachment-badge-container animate-fade-in">
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

        <div className="chat-input-container glass-panel">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            style={{ display: 'none' }}
          />
          <button 
            type="button"
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving || isExtracting}
            title="Attach PDF specifications"
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
            placeholder={isExtracting ? "Extracting PDF text..." : "Paste your code or type a message..."}
            disabled={saving || isExtracting}
            rows={1}
          />
          <button 
            className="send-button" 
            onClick={handleSend}
            disabled={(!input.trim() && !attachedFile) || saving || isExtracting}
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
