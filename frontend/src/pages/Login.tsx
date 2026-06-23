import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { LOGIN_MUTATION } from '../graphql/operations';
import { Code2, ArrowRight, Loader2, X } from 'lucide-react';
import gsap from 'gsap';
import LetterGlitch from '../components/LetterGlitch';
import GlitchText from '../components/GlitchText';
import './Login.css';

export default function Login() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Initial hero load animations
    if (heroRef.current) {
      const heroEls = heroRef.current.querySelectorAll('.hero-logo, .hero-title, .hero-subtitle, .cta-button');
      gsap.fromTo(heroEls,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
      );
    }
    
    // Top right actions fade in
    if (actionsRef.current) {
      gsap.fromTo(actionsRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.5 }
      );
    }
  }, []);

  // Modal entrance animation
  useEffect(() => {
    if (isModalOpen && cardRef.current) {
      const formEls = cardRef.current.querySelectorAll('.login-header, .input-group, .login-button, .toggle-mode');
      
      // Animate the card itself
      gsap.fromTo(cardRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.2)' }
      );
      
      // Stagger animate the form fields inside
      gsap.fromTo(formEls,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, [isModalOpen, isSignUp]); // Re-animate form fields slightly when switching modes
  
  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data: any) => {
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('userId', data.login.user.id);
      localStorage.setItem('userName', data.login.user.name);
      navigate('/chat');
    },
    onError: (err: any) => {
      setError(err.message || 'An error occurred during authentication');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !name) {
      setError('Please provide your name');
      return;
    }
    if (!email) {
      setError('Please provide your email');
      return;
    }
    setError('');
    login({ variables: { name: name || 'User', email } });
  };

  const openModal = (mode: 'login' | 'signup') => {
    setIsSignUp(mode === 'signup');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (loading) return; // Prevent closing while authenticating
    
    // Animate out
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        opacity: 0, 
        scale: 0.95, 
        y: 10, 
        duration: 0.3, 
        ease: 'power2.in',
        onComplete: () => setIsModalOpen(false)
      });
    } else {
      setIsModalOpen(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  return (
    <div className="landing-layout">
      {/* Background Section */}
      <div className="hero-background">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
      </div>

      {/* Top Right Actions */}
      <div ref={actionsRef} className="top-right-actions">
        <button onClick={() => openModal('login')} className="nav-btn ghost">Log In</button>
        <button onClick={() => openModal('signup')} className="nav-btn primary">Sign Up</button>
      </div>

      {/* Centered Hero Content */}
      <div className="centered-hero" ref={heroRef}>
        <div className="hero-logo">
          <Code2 size={56} />
        </div>
        <div className="hero-title">
          <GlitchText speed={1.2} enableOnHover={false}>Elevate Your Code</GlitchText>
        </div>
        <p className="hero-subtitle">
          Experience the future of code reviews powered by intelligent, context-aware AI.
        </p>
        <button onClick={() => openModal('signup')} className="cta-button">
          Get Started <ArrowRight size={18} />
        </button>
      </div>

      {/* Modal Overlay for Form */}
      {isModalOpen && (
        <div className="modal-overlay" onMouseDown={closeModal}>
          <div 
            ref={cardRef} 
            className="login-card modal-card" 
            onMouseDown={e => e.stopPropagation()}
            style={{ opacity: 0 }}
          >
            <button className="close-modal-btn" onClick={closeModal} disabled={loading}>
              <X size={20} />
            </button>
            
            <div className="login-header">
              <h1>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h1>
              <p className="subtitle">
                {isSignUp ? 'Start reviewing code instantly' : 'Sign in to your intelligent assistant'}
              </p>
            </div>

            {error && <div className="error-message animate-fade-in">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              {isSignUp && (
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    id="name"
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
              )}
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>
              
              <button type="submit" disabled={loading} className="login-button">
                {loading ? <Loader2 className="spinner" size={20} /> : (isSignUp ? 'Sign Up' : 'Continue')}
                {!loading && <ArrowRight size={20} />}
              </button>

              <div className="toggle-mode">
                <p>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button type="button" onClick={toggleMode} className="toggle-btn" disabled={loading}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
