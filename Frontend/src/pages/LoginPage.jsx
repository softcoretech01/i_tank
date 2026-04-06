import React, { useState } from 'react';
import { loginUser } from '../services/authService';
import { Button } from '../components/ui/Button';

export default function LoginPage({ onLoginSuccess }) {
  // Changed state from email to loginName
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    // 1. STOP the page reload immediately
    e.preventDefault();

    // 2. Clear previous errors and start loading
    setError('');
    setLoading(true);

    try {
      // Pass loginName instead of email
      const result = await loginUser(loginName, password);

      if (result && result.success) {
        sessionStorage.setItem('token', result.data.token);
        // We save the email from the response data if needed, or save the login_name
        sessionStorage.setItem('userEmail', result.data.email);
        sessionStorage.setItem('loginName', result.data.login_name);
        sessionStorage.setItem('role_id', result.data.role_id);
        sessionStorage.setItem('web_access', JSON.stringify(result.data.web_access));
        onLoginSuccess();
      } else {
        const msg = result?.message || 'Login failed';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } catch (err) {
      console.error("Login Error Details:", err);

      let errorMessage = "Login failed.";

      // 3. ROBUST ERROR EXTRACTION (Prevents Crashes)
      // 3. ROBUST ERROR EXTRACTION (Prevents Crashes)
      // Check if err is the data object directly (from authService)
      const serverData = err.response ? err.response.data : err;

      if (serverData) {
        // Check for 'detail' (FastAPI) or 'message'
        const rawMessage = serverData.detail || serverData.message;
        if (rawMessage) {
          errorMessage = typeof rawMessage === 'object'
            ? JSON.stringify(rawMessage)
            : rawMessage;
        } else if (err.message) {
          // Fallback to standard Error message
          errorMessage = err.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      // 4. Force error to be a string
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#546E7A]">iTank</h1>
          <p className="text-gray-500 mt-2">Welcome</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            {/* CHANGED LABEL */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              /* CHANGED TYPE TO TEXT */
              type="text"
              required
              /* BINDING TO LOGINNAME STATE */
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#546E7A] focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#546E7A] hover:bg-[#455A64] text-white py-2.5 rounded font-medium transition-colors shadow-md"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}