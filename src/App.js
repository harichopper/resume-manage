import { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ResumeBuilder from "./components/ResumeBuilder";
import Dashboard from "./components/Dashboard";

// Create a ThemeContext for dark mode
const ThemeContext = createContext();

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  // Sync token with localStorage changes (e.g., from external updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token") || "";
      setToken(newToken);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Persist dark mode in localStorage
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    window.location.href = "/login"; // Kept as is for compatibility
  };

  // Error Boundary Component
  const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
      if (hasError) {
        const timer = setTimeout(() => {
          setHasError(false);
          navigate("/dashboard");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [hasError, navigate]);

    if (hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className={`text-red-500 ${darkMode ? "text-red-400" : ""}`}>
            Something went wrong. Redirecting to dashboard...
          </p>
        </div>
      );
    }

    return children;
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <Router>
        <div>
          {token && (
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`p-4 bg-gray-100 dark:bg-gray-900 shadow-lg`}
            >
              <div className="max-w-6xl mx-auto flex justify-between items-center">
                <a
                  href="/"
                  className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
                    darkMode ? "from-blue-400 to-purple-400" : "from-blue-600 to-purple-600"
                  }`}
                  aria-label="Resume Platform Home"
                >
                  Resume Platform
                </a>
                <div className="flex items-center space-x-6">
                  <motion.a
                    href="/resume-builder"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-200 hover:text-blue-300" : "text-gray-800 hover:text-blue-600"
                    } transition-all duration-200`}
                    aria-label="Go to Resume Builder"
                  >
                    Resume Builder
                  </motion.a>
                  <motion.a
                    href="/dashboard"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-200 hover:text-blue-300" : "text-gray-800 hover:text-blue-600"
                    } transition-all duration-200`}
                    aria-label="Go to Dashboard"
                  >
                    Dashboard
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLogout}
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      darkMode
                        ? "bg-red-600 text-gray-200 hover:bg-red-700"
                        : "bg-red-500 text-gray-200 hover:bg-red-700"
                    } transition-all duration-200`}
                    aria-label="Log out"
                  >
                    Logout
                  </motion.button>
                </div>
              </div>
            </motion.nav>
          )}
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
              <Route path="/login" element={<Login setToken={setToken} />} />
              <Route path="/signup" element={<Signup setToken={setToken} />} />
              <Route
                path="/resume-builder"
                element={token ? <ResumeBuilder token={token} /> : <Navigate to="/login" />}
              />
              <Route
                path="/resume-builder/:resumeId"
                element={token ? <ResumeBuilder token={token} /> : <Navigate to="/login" />}
              />
              <Route
                path="/dashboard"
                element={token ? <Dashboard token={token} handleLogout={handleLogout} /> : <Navigate to="/login" />}
              />
            </Routes>
          </ErrorBoundary>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

// Export ThemeContext for use in child components
export { ThemeContext };
export default App;