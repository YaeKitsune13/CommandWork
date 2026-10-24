import { useState } from 'react';
import { LogIn, ArrowLeft } from 'lucide-react';
import './Login_window.css';

function Login_window({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); 
    
    if (email.length == 0 || password.length == 0) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');

    onLoginSuccess('user'); 
  };

  return (
    <div className="login-container">
      <button type="button" className="login-back-btn" onClick={onCancel}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Log in to your Dinisify account</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label htmlFor="email">Email or Username</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-submit-btn">
            <LogIn size={18} /> Log In
          </button>
        </form>

        <div className="login-footer">
          Don't have an account? <span className="login-link">Sign up</span>
        </div>
      </div>
    </div>
  );
}

export default Login_window;