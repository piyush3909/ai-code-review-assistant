import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { LOGIN_MUTATION, SIGNUP_MUTATION } from '../graphql/operations';
import { Code2, ArrowRight, Loader2, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Login.css';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();

  const handleAuthSuccess = (data: any, isSignupMode: boolean) => {
    const authData = isSignupMode ? data.signup : data.login;
    localStorage.setItem('token', authData.token);
    localStorage.setItem('userId', authData.user.id);
    localStorage.setItem('userName', authData.user.name);
    navigate('/chat');
  };

  const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => handleAuthSuccess(data, false),
    onError: (err) => setError(err.message || 'An error occurred during authentication'),
  });

  const [signup, { loading: signupLoading }] = useMutation(SIGNUP_MUTATION, {
    onCompleted: (data) => handleAuthSuccess(data, true),
    onError: (err) => setError(err.message || 'An error occurred during registration'),
  });

  const loading = loginLoading || signupLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (isSignUp) {
      const result = signupSchema.safeParse({ name, email, password, confirmPassword });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message;
          }
        });
        setFieldErrors(errors);
        return;
      }
      signup({ variables: { name: name.trim(), email: email.trim(), password } });
    } else {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message;
          }
        });
        setFieldErrors(errors);
        return;
      }
      login({ variables: { email: email.trim(), password } });
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFieldErrors({});
  };

  return (
    <div className="page-container">
      <Header />
      <div className="login-split-layout">
        {/* 70% Left Section: Hero & Illustration */}
        <div className="login-hero-section">
          <div className="hero-top-bar">
            <div className="brand-logo">
              <div className="brand-icon-wrapper">
                <Code2 size={24} />
              </div>
              <span className="brand-name">AI Code Review Assistant</span>
            </div>
            <div className="badge-pill">
              <Sparkles size={14} className="badge-icon" />
              <span>Next-Gen AI Pair Programming</span>
            </div>
          </div>

          <div className="hero-content-center">
            <h1 className="hero-main-title">Elevate Your Code Quality</h1>
            <p className="hero-main-subtitle">
              Experience intelligent, context-aware code analysis, instant vulnerability scanning, and automated refactoring guidance.
            </p>
            
            <div className="hero-illustration-container">
              <img 
                src="/login-illustration.svg" 
                alt="AI Code Review Assistant Workflow" 
                className="hero-svg-img" 
              />
            </div>

            <div className="hero-feature-tags">
              <div className="feature-tag">
                <CheckCircle2 size={16} className="tag-icon" />
                <span>Instant Vulnerability Detection</span>
              </div>
              <div className="feature-tag">
                <CheckCircle2 size={16} className="tag-icon" />
                <span>Deep Contextual Analysis</span>
              </div>
              <div className="feature-tag">
                <CheckCircle2 size={16} className="tag-icon" />
                <span>Automated Unit Test Generation</span>
              </div>
            </div>
          </div>
        </div>

        {/* 30% Right Section: Login/Signup Form */}
        <div className="login-form-section">
          <div className="form-container glass-panel">
            <div className="form-header">
              <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
              <p className="form-subtitle">
                {isSignUp ? 'Sign up to start reviewing code instantly' : 'Sign in to access your AI assistant'}
              </p>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {isSignUp && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    id="name"
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    disabled={loading}
                  />
                  {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={loading}
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </div>

              {isSignUp && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
                </div>
              )}
              
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? <Loader2 className="spinner" size={20} /> : (isSignUp ? 'Sign Up' : 'Continue')}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="form-footer">
              <p>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button type="button" onClick={toggleMode} className="mode-toggle-btn" disabled={loading}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


