import { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Mail, Phone } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000';

export default function Auth({ onLogin }) {
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot', 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetMethod, setResetMethod] = useState('email'); // 'email' or 'phone'
  const [verificationCode, setVerificationCode] = useState('');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    gender: '',
    guardianPhone: '',
    yourPhone: '',
    rememberMe: false,
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('nisra_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          onLogin(user);
        } catch (e) {
          localStorage.removeItem('nisra_user');
        }
      }
    };
    checkAuth();
  }, []);

  // Add this AFTER the checkAuth useEffect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (view === 'login') {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: formData.email,
          password: formData.password
        });
        
        if (response.data.success) {
          const userData = response.data.user;
          if (formData.rememberMe) {
            localStorage.setItem('nisra_user', JSON.stringify(userData));
          }
          onLogin(userData);
        }
      } else if (view === 'signup') {
        const response = await axios.post(`${API_URL}/auth/signup`, {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          gender: formData.gender,
          guardianPhone: formData.guardianPhone,
          yourPhone: formData.yourPhone
        });
        
        if (response.data.success) {
          const userData = response.data.user;
          localStorage.setItem('nisra_user', JSON.stringify(userData));
          onLogin(userData);
        }
      } else if (view === 'forgot') {
        // Send reset code
        const response = await axios.post(`${API_URL}/auth/forgot-password`, {
          identifier: resetMethod === 'email' ? formData.email : formData.yourPhone,
          method: resetMethod
        });
        
        if (response.data.success) {
          setSuccess(response.data.message);
          setView('reset');
        }
      } else if (view === 'reset') {
        // Verify code and reset password
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        const response = await axios.post(`${API_URL}/auth/reset-password`, {
          identifier: resetMethod === 'email' ? formData.email : formData.yourPhone,
          code: verificationCode,
          newPassword: formData.newPassword
        });
        
        if (response.data.success) {
          setSuccess('Password reset successful! Please login.');
          setTimeout(() => {
            setView('login');
            setSuccess('');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.error || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setSuccess('');
  };

  // Send verification code
const handleSendVerification = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  try {
    if (!formData.name || !formData.gender || !formData.email || !formData.password || 
        !formData.guardianPhone || !formData.yourPhone) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Check if email exists
    const checkResponse = await axios.post(`${API_URL}/auth/check-email`, {
      email: formData.email
    });

    if (checkResponse.data.exists) {
      setError('This email is already registered. Please login instead.');
      setLoading(false);
      return;
    }

    // Send verification code
    const response = await axios.post(`${API_URL}/auth/send-verification`, {
      email: formData.email
    });

    if (response.data.success) {
      setEmailToVerify(formData.email);
      setView('verify-email');
      setSuccess('Verification code sent to your email!');
      setResendTimer(60);
      
      if (response.data.dev_code) {
        console.log('🔐 Dev Code:', response.data.dev_code);
      }
    }
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to send verification code');
  } finally {
    setLoading(false);
  }
};

// Verify code and complete signup
const handleVerifyAndSignup = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  try {
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      setLoading(false);
      return;
    }

    // Verify code then signup
    const response = await axios.post(`${API_URL}/auth/signup`, {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      gender: formData.gender,
      guardianPhone: formData.guardianPhone,
      yourPhone: formData.yourPhone,
      verificationCode: verificationCode
    });

    if (response.data.success) {
      const userData = response.data.user;
      localStorage.setItem('nisra_user', JSON.stringify(userData));
      setSuccess('Account created! Redirecting...');
      setTimeout(() => onLogin(userData), 1500);
    }
  } catch (err) {
    setError(err.response?.data?.error || 'Verification failed');
  } finally {
    setLoading(false);
  }
};

// Resend code
const handleResendCode = async () => {
  if (resendTimer > 0) return;
  setLoading(true);

  try {
    const response = await axios.post(`${API_URL}/auth/send-verification`, {
      email: emailToVerify
    });

    if (response.data.success) {
      setSuccess('New code sent!');
      setResendTimer(60);
      setVerificationCode('');
    }
  } catch (err) {
    setError('Failed to resend code');
  } finally {
    setLoading(false);
  }
};

const renderEmailVerification = () => (
  <div className="w-full max-w-md">
    <button onClick={() => setView('signup')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>

    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
      <p className="text-gray-600">Code sent to <strong>{emailToVerify}</strong></p>
    </div>

    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}
    {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-600">{success}</p></div>}

    <form onSubmit={handleVerifyAndSignup} className="space-y-5">
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="w-full px-4 py-4 border-2 border-gray-300 focus:border-purple-600 outline-none rounded-lg text-center text-3xl tracking-[0.5em] font-bold"
        placeholder="000000"
        maxLength="6"
        required
        autoFocus
      />

      <button
        type="submit"
        disabled={loading || verificationCode.length !== 6}
        className="w-full bg-purple-600 text-white py-3.5 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify & Create Account'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendTimer > 0}
          className="text-sm text-purple-600 font-semibold disabled:text-gray-400"
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
        </button>
      </div>
    </form>
  </div>
);

  const renderForgotPassword = () => (
    <div className="w-full max-w-md">
      <button
        onClick={() => setView('login')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
        <p className="text-gray-600">Choose how to reset your password</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setResetMethod('email')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
            resetMethod === 'email'
              ? 'border-purple-600 bg-purple-50 text-purple-600'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          <Mail className="w-5 h-5" />
          <span className="font-medium">Email</span>
        </button>
        <button
          onClick={() => setResetMethod('phone')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
            resetMethod === 'phone'
              ? 'border-purple-600 bg-purple-50 text-purple-600'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="font-medium">Phone</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {resetMethod === 'email' ? 'Email Address' : 'Phone Number'}
          </label>
          <input
            type={resetMethod === 'email' ? 'email' : 'tel'}
            name={resetMethod === 'email' ? 'email' : 'yourPhone'}
            value={resetMethod === 'email' ? formData.email : formData.yourPhone}
            onChange={handleChange}
            className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400"
            placeholder={resetMethod === 'email' ? 'Enter your email' : 'Enter your phone number'}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3.5 rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>
    </div>
  );

  const renderResetPassword = () => (
    <div className="w-full max-w-md">
      <button
        onClick={() => setView('forgot')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-gray-600">Enter the code sent to your {resetMethod}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400 text-center text-2xl tracking-widest"
            placeholder="000000"
            maxLength="6"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400"
            placeholder="Enter new password"
            required
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 pr-12 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400"
            placeholder="Confirm new password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-11 text-gray-500 hover:text-gray-700 transition"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3.5 rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );

  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex bg-white overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-12 relative">
          {/* Same SVG decorations as before */}
          <svg width="100%" height="100%" viewBox="0 0 800 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
            <ellipse cx="700" cy="80" rx="180" ry="180" fill="#FF9B85" opacity="0.9" />
            <path d="M 150 180 Q 200 80, 300 120 Q 350 150, 320 220 Q 280 280, 180 260 Q 100 240, 150 180 Z" fill="#A89BFF" opacity="0.8" />
          </svg>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          {renderForgotPassword()}
        </div>
      </div>
    );
  }

if (view === 'verify-email') {
  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-12 relative">
        <svg width="100%" height="100%" viewBox="0 0 800 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
          <ellipse cx="700" cy="80" rx="180" ry="180" fill="#FF9B85" opacity="0.9" />
          <path d="M 150 180 Q 200 80, 300 120 Q 350 150, 320 220 Q 280 280, 180 260 Q 100 240, 150 180 Z" fill="#A89BFF" opacity="0.8" />
        </svg>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        {renderEmailVerification()}
      </div>
    </div>
  );
}

  if (view === 'reset') {
    return (
      <div className="min-h-screen flex bg-white overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-12 relative">
          <svg width="100%" height="100%" viewBox="0 0 800 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
            <ellipse cx="700" cy="80" rx="180" ry="180" fill="#FF9B85" opacity="0.9" />
            <path d="M 150 180 Q 200 80, 300 120 Q 350 150, 320 220 Q 280 280, 180 260 Q 100 240, 150 180 Z" fill="#A89BFF" opacity="0.8" />
          </svg>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          {renderResetPassword()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-12 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 z-10">
          <h2 className="text-4xl font text-gray-800 mb-3">"Help & Support"</h2>
          <p className="text-lg text-gray-700 max-w-md leading-relaxed">
            Your safe space for mental health support
          </p>
        </div>
        <svg width="100%" height="100%" viewBox="0 0 800 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
          <ellipse cx="700" cy="80" rx="180" ry="180" fill="#FF9B85" opacity="0.9" />
          <path d="M 150 180 Q 200 80, 300 120 Q 350 150, 320 220 Q 280 280, 180 260 Q 100 240, 150 180 Z" fill="#A89BFF" opacity="0.8" />
          <path d="M 120 650 Q 180 580, 280 620 Q 340 660, 310 740 Q 260 810, 150 770 Q 80 730, 120 650 Z" fill="#FF8B9E" opacity="0.85" />
          <ellipse cx="600" cy="720" rx="140" ry="160" fill="#8DD8E8" opacity="0.75" />
        </svg>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div>
              <span className="text-4xl font-bold text-black tracking-tight">NISRA</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {view === 'login' ? 'Welcome back!' : 'Create Account'}
            </h1>
            <p className="text-gray-600">
              {view === 'login' ? 'Please enter your details' : 'Please fill in your information'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={view === 'signup' ? handleSendVerification : handleSubmit} className="space-y-5">
            {view === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900"
                    required
                  >
                    <option value="">Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="w-full px-4 py-3 pr-12 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-11 text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {view === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Phone</label>
                  <input
                    type="tel"
                    name="guardianPhone"
                    value={formData.guardianPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Phone</label>
                  <input
                    type="tel"
                    name="yourPhone"
                    value={formData.yourPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-purple-600 outline-none transition-all bg-transparent text-gray-900 placeholder-gray-400"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </>
            )}

            {view === 'login' && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3.5 rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (view === 'login' ? 'Logging in...' : 'Signing up...') : (view === 'login' ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setView(view === 'login' ? 'signup' : 'login');
                setError('');
                setSuccess('');
              }}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              {view === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}