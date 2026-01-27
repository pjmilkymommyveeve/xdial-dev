import { useState } from 'react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://api.xlitecore.xdialnetworks.com/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Unable to process server response. Please try again later.');
      }

      // Handle different error scenarios
      if (!response.ok) {
        // Authentication errors (401 or 403)
        if (response.status === 401 || response.status === 403) {
          const errorMessage = data.detail || 'Invalid username or password. Please check your credentials and try again.';
          setError(errorMessage);

          // Clear any existing tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('username');
          localStorage.removeItem('role');

          // Reset form after a delay
          setTimeout(() => {
            setFormData({
              username: '',
              password: ''
            });
          }, 2000);

          setLoading(false);
          return;
        }

        // Rate limiting (429)
        if (response.status === 429) {
          setError('Too many login attempts. Please wait a few minutes before trying again.');
          setLoading(false);
          return;
        }

        // Server errors (5xx)
        if (response.status >= 500) {
          setError('Server error occurred. Please try again later or contact support if the problem persists.');
          setLoading(false);
          return;
        }

        // Other errors
        throw new Error(data.detail || data.message || 'Login failed. Please try again.');
      }

      // Validate response data
      if (!data.access_token || !data.user_id || !data.role) {
        throw new Error('Invalid server response. Please try again or contact support.');
      }

      // Store in localStorage only
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);

      setSuccess('Login successful! Redirecting...');

      setTimeout(() => {
        // Redirect based on user role
        if (data.role === 'admin' || data.role === 'onboarding' || data.role === 'qa') {
          window.location.href = '/admin-dashboard';
        } else {
          window.location.href = '/client-landing';
        }
      }, 1500);

    } catch (err) {
      // Network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
          color: #111827;
          line-height: 1.3;
          font-size: 14px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 16px;
          border: 1px solid #F3F4F6;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          padding: 2.5rem;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.75rem;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .logo-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.5px;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #6B7280;
          font-weight: 400;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .form-label i {
          font-size: 0.875rem;
          color: #9CA3AF;
        }

        .form-input {
          padding: 0.75rem 1rem;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: #FFFFFF;
          color: #111827;
          transition: all 0.2s ease;
        }

        .form-input::placeholder {
          color: #D1D5DB;
        }

        .form-input:focus {
          outline: none;
          border-color: #4F46E5;
          background-color: #FAFBFF;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-input:hover:not(:focus):not(:disabled) {
          border-color: #D1D5DB;
          background-color: #F9FAFB;
        }

        .form-input:disabled {
          background-color: #F3F4F6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .login-btn {
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 0.938rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #3730A3 0%, #6D28D9 100%);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
          transform: translateY(-2px);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
        }

        .login-btn:disabled {
          background: linear-gradient(135deg, #D1D5DB 0%, #E5E7EB 100%);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .login-btn i {
          font-size: 1rem;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-message {
          display: none;
          padding: 0.75rem 1rem;
          background-color: #FEE2E2;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          color: #DC2626;
          font-size: 0.813rem;
          font-weight: 500;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .error-message.show {
          display: flex;
        }

        .error-message i {
          font-size: 0.938rem;
          flex-shrink: 0;
        }

        .success-message {
          display: none;
          padding: 0.75rem 1rem;
          background-color: #D1FAE5;
          border: 1px solid #A7F3D0;
          border-radius: 8px;
          color: #059669;
          font-size: 0.813rem;
          font-weight: 500;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .success-message.show {
          display: flex;
        }

        .success-message i {
          font-size: 0.938rem;
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 2rem 1.5rem;
          }
          .login-title {
            font-size: 1.25rem;
          }
          .logo-wrapper {
            margin-bottom: 1rem;
          }
        }
      `}</style>

      <div className="login-container">
        <div className="login-header">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <i className="bi bi-telephone-fill"></i>
            </div>
            <div className="logo-text">
              <div className="logo-name">Xdial Networks</div>
            </div>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="error-message show">
            <i className="bi bi-exclamation-circle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message show">
            <i className="bi bi-check-circle-fill"></i>
            <span>{success}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <i className="bi bi-person"></i>
              Username
            </label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <i className="bi bi-lock"></i>
              Password
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i>
                Signing In...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default LoginPage;