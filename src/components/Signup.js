import { useState } from 'react';
import axios from 'axios';
import { FiMail, FiLock } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

function Signup({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const navigate = useNavigate();

  // Validate inputs
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;
  const validateConfirmPassword = (password, confirmPassword) => password === confirmPassword;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email address',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      Swal.fire({
        icon: 'error',
        title: 'Invalid Password',
        text: 'Password must be at least 6 characters',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }
    if (!validateConfirmPassword(password, confirmPassword)) {
      setError('Passwords do not match');
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Passwords do not match',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log(`Signing up with: ${API_URL}/api/auth/signup`);
      const res = await axios.post(`${API_URL}/api/auth/signup`, { email, password });

      const { token, user } = res.data;
      if (!token || !user?.id) {
        throw new Error('Invalid response from server');
      }

      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id); // Store userId for debugging

      // Success toast
      Swal.fire({
        icon: 'success',
        title: 'Signup Successful',
        text: 'Welcome aboard!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // Redirect to dashboard
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Signup failed. Try again.';
      setError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Signup Failed',
        text: errorMessage,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Update theme in localStorage
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-100 to-purple-100'} transition-colors duration-500`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`relative p-8 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-800'} transition-all duration-500`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-3xl font-extrabold bg-clip-text text-transparent ${darkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
            Sign Up
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'} hover:opacity-80 transition-all`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 mb-6 text-center font-medium"
          >
            {error}
          </motion.p>
        )}

        {/* Form */}
        <form onSubmit={handleSignup}>
          {/* Email */}
          <div className="relative mb-6">
            <FiMail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-blue-300' : 'text-blue-500'} text-xl`} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={`pl-10 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'} transition-all duration-200`}
              aria-label="Email"
            />
          </div>

          {/* Password */}
          <div className="relative mb-6">
            <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-blue-300' : 'text-blue-500'} text-xl`} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`pl-10 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'} transition-all duration-200`}
              aria-label="Password"
            />
          </div>

          {/* Confirm Password */}
          <div className="relative mb-8">
            <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-blue-300' : 'text-blue-500'} text-xl`} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className={`pl-10 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'} transition-all duration-200`}
              aria-label="Confirm Password"
            />
          </div>

          {/* Signup Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className={`flex justify-center items-center w-full p-3 rounded-xl font-semibold text-white bg-gradient-to-r ${darkMode ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Sign Up"
          >
            {loading ? <ClipLoader size={20} color="#fff" /> : 'Sign Up'}
          </motion.button>
        </form>

        {/* Login Link */}
        <p className={`mt-6 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Already have an account?{' '}
          <a href="/login" className="text-blue-500 hover:underline font-medium">
            Login
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default Signup;