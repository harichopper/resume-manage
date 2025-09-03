import { useState, useEffect } from "react";
import axios from "axios";
import axiosRetry from "axios-retry";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FiDownload, FiEdit, FiTrash, FiSearch, FiPlus, FiZap } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

// Configure axios retries
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => error.response?.status === 500,
});

const SAMPLE_RESUME = [
  {
    _id: "sample-1",
    name: "Deep",
    jobRole: "PHP Developer",
    email: "deep@mail.com",
    phone: "N/A",
    education: [{ degree: "N/A", institution: "N/A", year: "N/A" }],
    experience: [{ role: "N/A", company: "N/A", duration: "N/A" }],
    skills: ["N/A"],
    createdAt: new Date().toISOString(),
  },
];

function Dashboard({ token, handleLogout }) {
  const [resumes, setResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enhancingId, setEnhancingId] = useState(null);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!process.env.REACT_APP_API_URL && process.env.NODE_ENV !== "production") {
      console.warn("REACT_APP_API_URL is not set. Using default: http://localhost:5000");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchResumes = async () => {
      if (!token) {
        setError("No authentication token provided. Please log in.");
        setResumes(SAMPLE_RESUME);
        setFilteredResumes(SAMPLE_RESUME);
        Swal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "Please log in to view your resumes.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
        });
        setTimeout(() => handleLogout(), 4000);
        return;
      }

      setLoading(true);
      setError("");
      try {
       console.log(`Fetching resumes from: ${API_URL}/api/resumes`);
        console.log("Token:", token);
        const res = await axios.get(`${API_URL}/api/resumes`, {
          headers: { Authorization: `Bearer ${token}` },
        }); // Line 80
        const fetchedResumes = res.data.length > 0 ? res.data : SAMPLE_RESUME;
        setResumes(fetchedResumes);
        setFilteredResumes(fetchedResumes);
      } catch (err) {
        const errorMessage =
          err.response?.status === 401
            ? "Unauthorized. Please log in again."
            : err.response?.status === 404
            ? "Resume service not found. Please check the server configuration."
            : `Failed to fetch resumes: ${err.response?.data?.error || err.message}`;
        setError(errorMessage);
        setResumes(SAMPLE_RESUME);
        setFilteredResumes(SAMPLE_RESUME);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
        });
        if (err.response?.status === 401) {
          setTimeout(() => handleLogout(), 4000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, [API_URL, token, handleLogout]);

  useEffect(() => {
    let updatedResumes = [...resumes];
    if (searchQuery) {
      updatedResumes = updatedResumes.filter(
        (resume) =>
          resume?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
          resume?.jobRole?.toLowerCase()?.includes(searchQuery.toLowerCase())
      );
    }
    updatedResumes.sort((a, b) =>
      sortOrder === "desc"
        ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        : new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    setFilteredResumes(updatedResumes);
  }, [searchQuery, sortOrder, resumes]);

  const downloadPDF = (resume) => {
    try {
      const doc = new jsPDF();
      let yOffset = 10;

      const addText = (text, x, y, options = {}) => {
        doc.text(text, x, y, { maxWidth: options.maxWidth || 180 });
        return doc.getTextDimensions(text, { maxWidth: options.maxWidth || 180 }).h + 5;
      };

      doc.setFontSize(16);
      yOffset += addText(`Resume: ${resume.name || "Unknown"}`, 10, yOffset);
      doc.setFontSize(12);
      yOffset += addText(`Role: ${resume.jobRole || "N/A"}`, 10, yOffset);
      yOffset += addText(`Email: ${resume.email || "N/A"}`, 10, yOffset);
      yOffset += addText(`Phone: ${resume.phone || "N/A"}`, 10, yOffset);

      if (resume.education?.length) {
        yOffset += addText("Education:", 10, yOffset);
        autoTable(doc, {
          startY: yOffset,
          head: [['Degree', 'Institution', 'Year']],
          body: resume.education.map(edu => [edu.degree || 'N/A', edu.institution || 'N/A', edu.year || 'N/A']),
          theme: 'striped',
          styles: { fontSize: 10 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;
      }

      if (resume.experience?.length) {
        yOffset += addText("Experience:", 10, yOffset);
        autoTable(doc, {
          startY: yOffset,
          head: [['Role', 'Company', 'Duration']],
          body: resume.experience.map(exp => [exp.role || 'N/A', exp.company || 'N/A', exp.duration || 'N/A']),
          theme: 'striped',
          styles: { fontSize: 10 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;
      }

      if (resume.skills?.length) {
        yOffset += addText("Skills:", 10, yOffset);
        autoTable(doc, {
          startY: yOffset,
          head: [['Skill']],
          body: resume.skills.map(skill => [skill || 'N/A']),
          theme: 'striped',
          styles: { fontSize: 10 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;
      }

      if (resume.aiEnhanced) {
        yOffset += addText("AI Enhanced Suggestions:", 10, yOffset);
        yOffset += addText(resume.aiEnhanced, 10, yOffset, { maxWidth: 180 });
      }

      doc.save(`resume-${resume.name || "unknown"}.pdf`);
      Swal.fire({
        icon: "success",
        title: "PDF Downloaded",
        text: `Resume for ${resume.name || "unknown"} downloaded successfully.`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "PDF Generation Failed",
        text: `Failed to generate PDF: ${err.message}`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
    }
  };

  const deleteResume = async (id) => {
    if (!id || id === "sample-1") {
      Swal.fire({
        icon: "error",
        title: "Cannot Delete",
        text: "Sample resumes cannot be deleted.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this resume?")) return;

    setError("");
    try {
      await axios.delete(`${API_URL}/api/resumes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResumes(resumes.filter((resume) => resume._id !== id));
      setFilteredResumes(filteredResumes.filter((resume) => resume._id !== id));
      Swal.fire({
        icon: "success",
        title: "Resume Deleted",
        text: "Resume has been successfully deleted.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      const errorMessage =
        err.response?.status === 401
          ? "Unauthorized. Please log in again."
          : `Failed to delete resume: ${err.response?.data?.error || err.message}`;
      setError(errorMessage);
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: errorMessage,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      if (err.response?.status === 401) {
        setTimeout(() => handleLogout(), 4000);
      }
    }
  };

  const enhanceResume = async (id) => {
    if (!id || id === "sample-1") {
      Swal.fire({
        icon: "error",
        title: "Cannot Enhance",
        text: "Sample resumes cannot be enhanced.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }
    setEnhancingId(id);
    setError("");
    try {
      const resume = resumes.find((r) => r._id === id);
      if (!resume) {
        throw new Error("Resume not found.");
      }
      const res = await axios.post(
        `${API_URL}/api/resumes/enhance/${id}`,
        { resume },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResumes(
        resumes.map((resume) =>
          resume._id === id ? { ...resume, aiEnhanced: res.data.aiEnhanced } : resume
        )
      );
      setFilteredResumes(
        filteredResumes.map((resume) =>
          resume._id === id ? { ...resume, aiEnhanced: res.data.aiEnhanced } : resume
        )
      );
      Swal.fire({
        icon: "success",
        title: "Resume Enhanced",
        text: "Resume has been enhanced with AI suggestions.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      const errorMessage =
        err.response?.status === 401
          ? "Unauthorized. Please log in again."
          : err.response?.status === 500
          ? "Server error while enhancing resume. Please try again later."
          : `Failed to enhance resume: ${err.response?.data?.error || err.message}`;
      setError(errorMessage);
      Swal.fire({
        icon: "error",
        title: "Enhance Failed",
        text: errorMessage,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      if (err.response?.status === 401) {
        setTimeout(() => handleLogout(), 4000);
      }
    } finally {
      setEnhancingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen p-6 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? "from-blue-400 to-purple-400" : "from-blue-600 to-purple-600"
            }`}
          >
            Dashboard
          </h2>
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-800"
              } hover:opacity-80 transition-all`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </motion.button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <FiSearch
              className={`absolute left-3 top-3 ${darkMode ? "text-blue-300" : "text-blue-500"}`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or job role..."
              className={`pl-10 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                darkMode ? "bg-gray-800 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-blue-200"
              } transition-all duration-200`}
              aria-label="Search resumes"
            />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
              darkMode ? "bg-gray-800 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-blue-200"
            } transition-all duration-200`}
            aria-label="Sort resumes"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-red-500 mb-4 text-center ${darkMode ? "text-red-400" : ""}`}
          >
            {error}
          </motion.p>
        )}

        {loading ? (
          <div className="flex justify-center mt-20">
            <ClipLoader size={40} color={darkMode ? "#fff" : "#2563eb"} />
          </div>
        ) : (
          <AnimatePresence>
            {filteredResumes.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-10 rounded-2xl text-center shadow-xl ${
                  darkMode ? "bg-gray-800" : "bg-blue-100"
                } transition-all duration-300`}
              >
                <img
                  src="https://illustrations.popsy.co/gray/empty-state.svg"
                  alt="No resumes available"
                  className="w-40 mx-auto mb-4 opacity-70"
                />
                <p className={`text-lg font-medium ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
                  No resumes found. Start by creating one!
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredResumes.map((resume) => (
                  <motion.div
                    key={resume._id || `resume-${Math.random().toString(36).substr(2, 9)}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.03 }}
                    className={`p-6 rounded-2xl shadow-xl backdrop-blur-md ${
                      darkMode ? "bg-gray-800" : "bg-blue-50"
                    } transition-all duration-300`}
                  >
                    <h3
                      className={`text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${
                        darkMode ? "from-blue-400 to-purple-400" : "from-blue-600 to-purple-600"
                      }`}
                    >
                      {resume.name || "Unknown"}
                    </h3>
                    <p className={`mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      <strong className={darkMode ? "text-blue-300" : "text-blue-600"}>Role:</strong>{" "}
                      {resume.jobRole || "N/A"}
                    </p>
                    <p className={`mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      <strong className={darkMode ? "text-blue-300" : "text-blue-600"}>Email:</strong>{" "}
                      {resume.email || "N/A"}
                    </p>
                    <p className={`mb-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Created: {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : "N/A"}
                    </p>

                    {resume.aiEnhanced && (
                      <p className={`text-xs italic ${darkMode ? "text-green-400" : "text-green-500"} mt-2`}>
                        AI Enhanced: {resume.aiEnhanced.slice(0, 80)}...
                      </p>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => downloadPDF(resume)}
                        title="Download PDF"
                        className={`p-2 rounded-full ${
                          darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-700"
                        } text-white transition-all duration-200`}
                        aria-label="Download resume as PDF"
                      >
                        <FiDownload />
                      </motion.button>
                      <Link to={`/resume-builder/${resume._id}`}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title={resume._id === "sample-1" ? "Cannot edit sample resume" : "Edit Resume"}
                          disabled={resume._id === "sample-1"}
                          className={`p-2 rounded-full ${
                            darkMode
                              ? `bg-green-600 hover:bg-green-700 text-white ${
                                  resume._id === "sample-1" ? "opacity-50 cursor-not-allowed" : ""
                                }`
                              : `bg-green-500 hover:bg-green-700 text-white ${
                                  resume._id === "sample-1" ? "opacity-50 cursor-not-allowed" : ""
                                }`
                          } transition-all duration-200`}
                          aria-label={resume._id === "sample-1" ? "Cannot edit sample resume" : "Edit resume"}
                        >
                          <FiEdit />
                        </motion.button>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteResume(resume._id)}
                        title="Delete Resume"
                        disabled={resume._id === "sample-1"}
                        className={`p-2 rounded-full ${
                          darkMode
                            ? `bg-red-600 hover:bg-red-700 text-white ${
                                resume._id === "sample-1" ? "opacity-50 cursor-not-allowed" : ""
                              }`
                            : `bg-red-500 hover:bg-red-700 text-white ${
                                resume._id === "sample-1" ? "opacity-50 cursor-not-allowed" : ""
                              }`
                        } transition-all duration-200`}
                        aria-label="Delete resume"
                      >
                        <FiTrash />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => enhanceResume(resume._id)}
                        title={resume._id === "sample-1" ? "Cannot enhance sample resume" : "Enhance with AI"}
                        disabled={enhancingId === resume._id || resume._id === "sample-1"}
                        className={`p-2 rounded-full ${
                          darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-700"
                        } text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label={resume._id === "sample-1" ? "Cannot enhance sample resume" : "Enhance resume with AI"}
                      >
                        {enhancingId === resume._id ? (
                          <ClipLoader size={16} color="#fff" />
                        ) : (
                          <FiZap />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <Link to="/resume-builder">
        <motion.a
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 ${
            darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-700"
          } text-white rounded-full shadow-lg transition-all duration-200`}
          title="Create New Resume"
          aria-label="Create new resume"
        >
          <FiPlus size={22} />
        </motion.a>
      </Link>
    </motion.div>
  );
}

export default Dashboard;