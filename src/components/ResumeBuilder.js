import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiUser, FiBriefcase, FiMail, FiPhone, FiBook, FiAward, FiPlus, FiMinus, FiSave, FiDownload, FiEdit, FiArrowLeft } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';

// Utility to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

function ResumeBuilder({ token }) {
  const { resumeId } = useParams();
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    jobRole: '',
    email: '',
    phone: '',
    summary: '',
    education: [{ institution: '', degree: '', year: '' }],
    experience: [{ company: '', role: '', duration: '' }],
    skills: [''],
  });
  const [userId, setUserId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    personal: true,
    summary: true,
    education: true,
    experience: true,
    skills: true,
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Decode token to extract userId
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const id = decoded.id || decoded._id || decoded.userId;
        console.log('Decoded token:', decoded); // Log full decoded token
        if (id && isValidObjectId(id)) {
          setUserId(id);
          console.log('Valid userId:', id);
        } else {
          throw new Error('Invalid or missing userId in token');
        }
      } catch (err) {
        console.error('Failed to decode token:', err.message);
        setError('Invalid authentication token. Please log in again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setError('No authentication token provided. Please log in.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [token, navigate]);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (resumeId && resumeId !== 'sample-1') {
      if (!isValidObjectId(resumeId)) {
        setError(`Invalid resume ID format: ${resumeId}. Redirecting to dashboard...`);
        console.error('Invalid resumeId:', resumeId);
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      const fetchResume = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await axios.get(`${API_URL}/api/resumes/${resumeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFormData({
            name: res.data.name || '',
            jobRole: res.data.jobRole || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            summary: res.data.summary || '',
            education: res.data.education?.length ? res.data.education : [{ institution: '', degree: '', year: '' }],
            experience: res.data.experience?.length ? res.data.experience : [{ company: '', role: '', duration: '' }],
            skills: res.data.skills?.length ? res.data.skills : [''],
          });
        } catch (err) {
          const errorMessage =
            err.response?.status === 401
              ? 'Unauthorized. Please log in again.'
              : err.response?.status === 404
              ? `Resume with ID ${resumeId} not found. Redirecting to dashboard...`
              : `Failed to fetch resume data: ${err.response?.data?.error || err.message}`;
          setError(errorMessage);
          console.error('Fetch resume error:', err.response || err);
          if (err.response?.status === 404) {
            setTimeout(() => navigate('/dashboard'), 3000);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchResume();
    } else {
      setFormData({
        name: '',
        jobRole: '',
        email: '',
        phone: '',
        summary: '',
        education: [{ institution: '', degree: '', year: '' }],
        experience: [{ company: '', role: '', duration: '' }],
        skills: [''],
      });
    }
  }, [resumeId, token, API_URL, navigate]);

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.jobRole.trim()) return 'Job role is required';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Valid email is required';
    if (formData.summary.length > 500) return 'Summary must be 500 characters or less';
    if (!userId || !isValidObjectId(userId)) return 'Valid user authentication required';
    return '';
  };

  const cleanFormData = () => {
    const cleanedEducation = formData.education.filter(
      edu => edu.institution.trim() || edu.degree.trim() || edu.year.trim()
    );
    const cleanedExperience = formData.experience.filter(
      exp => exp.company.trim() || exp.role.trim() || exp.duration.trim()
    );
    const cleanedSkills = formData.skills.filter(skill => skill.trim());

    return {
      userId,
      name: formData.name.trim(),
      jobRole: formData.jobRole.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      summary: formData.summary.trim(),
      education: cleanedEducation.length > 0 ? cleanedEducation : [],
      experience: cleanedExperience.length > 0 ? cleanedExperience : [],
      skills: cleanedSkills.length > 0 ? cleanedSkills : [],
      aiEnhanced: formData.aiEnhanced || '',
    };
  };

  const handleChange = (e, section, index) => {
    setError('');
    const { name, value } = e.target;
    if (section === 'skills') {
      const newSkills = [...formData.skills];
      newSkills[index] = value;
      setFormData({ ...formData, skills: newSkills });
    } else if (section === 'education' || section === 'experience') {
      const newSection = [...formData[section]];
      newSection[index] = { ...newSection[index], [name]: value };
      setFormData({ ...formData, [section]: newSection });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addField = (section) => {
    if (section === 'skills') {
      setFormData({ ...formData, skills: [...formData.skills, ''] });
    } else {
      setFormData({
        ...formData,
        [section]: [
          ...formData[section],
          section === 'education' ? { institution: '', degree: '', year: '' } : { company: '', role: '', duration: '' },
        ],
      });
    }
  };

  const removeField = (section, index) => {
    if (section === 'skills') {
      if (formData.skills.length === 1) return;
      setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== index) });
    } else {
      if (formData[section].length === 1) return;
      setFormData({ ...formData, [section]: formData[section].filter((_, i) => i !== index) });
    }
  };

  const staticSkillMap = {
    'software engineer': ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'GraphQL'],
    'data scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'Pandas', 'TensorFlow'],
    'designer': ['Figma', 'Adobe XD', 'UI/UX', 'Photoshop', 'Illustrator', 'Sketch'],
  };

  const suggestSkills = async () => {
    if (!formData.jobRole.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Job Role',
        text: 'Please enter a job role to get skill suggestions',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in to fetch skill suggestions',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }
    const role = formData.jobRole.toLowerCase();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${API_URL}/v1/suggestions`,
        { role: formData.jobRole, context: 'resume-skills' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const aiSuggestions = response.data.skills || [];
      setSuggestions(aiSuggestions.length > 0 ? aiSuggestions : (staticSkillMap[role] || ['Communication', 'Teamwork', 'Problem Solving']));
      
      Swal.fire({
        icon: 'success',
        title: 'Skills Suggested!',
        text: 'Click on any skill below to add it to your resume',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error('Suggest skills error:', err.response || err);
      setSuggestions(staticSkillMap[role] || ['Communication', 'Teamwork', 'Problem Solving']);
      
      Swal.fire({
        icon: 'info',
        title: 'Using Default Suggestions',
        text: 'AI service unavailable, showing default skills for your role',
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

  const addSuggestedSkill = (skill) => {
    setFormData({ ...formData, skills: [...formData.skills.filter(s => s.trim()), skill] });
    
    Swal.fire({
      icon: 'success',
      title: 'Skill Added!',
      text: `"${skill}" has been added to your skills`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const saveResume = async () => {
    const validationError = validateForm();
    if (validationError) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: validationError,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      return;
    }
    if (!token || !userId) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in to save resumes',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const cleanedData = cleanFormData();
      console.log('Sending cleaned formData:', JSON.stringify(cleanedData, null, 2));

      if (resumeId && resumeId !== 'sample-1' && isValidObjectId(resumeId)) {
        await axios.put(
          `${API_URL}/api/resumes/${resumeId}`,
          { ...cleanedData, updatedAt: new Date() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        Swal.fire({
          icon: 'success',
          title: 'Resume Updated!',
          text: 'Your resume has been successfully updated',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const response = await axios.post(
          `${API_URL}/api/resumes`,
          cleanedData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        Swal.fire({
          icon: 'success',
          title: 'Resume Saved!',
          text: 'Your resume has been successfully created',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        
        setTimeout(() => navigate(`/resume-builder/${response.data._id}`), 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.status === 401
        ? 'Unauthorized. Please log in again.'
        : `Failed to save resume: ${err.response?.data?.error || err.response?.data?.message || err.message}`;
      
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: errorMessage,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      
      console.error('Save resume error:', err.response || err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const validationError = validateForm();
    if (validationError) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: validationError,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      return;
    }
    try {
      const doc = new jsPDF();
      console.log('jsPDF instance created:', doc);
      console.log('autoTable available:', typeof autoTable === 'function');

      doc.setFontSize(16);
      doc.text(`Resume: ${formData.name}`, 10, 10);
      doc.setFontSize(12);
      doc.text(`Role: ${formData.jobRole}`, 10, 20);
      doc.text(`Email: ${formData.email}`, 10, 30);
      doc.text(`Phone: ${formData.phone || 'N/A'}`, 10, 40);
      doc.text('Summary:', 10, 50);
      doc.text(formData.summary || 'N/A', 10, 60, { maxWidth: 180 });

      let yOffset = 70 + Math.ceil((formData.summary.length / 90) * 10);

      autoTable(doc, {
        startY: yOffset + 5,
        head: [['Degree', 'Institution', 'Year']],
        body: formData.education.map(edu => [edu.degree || 'N/A', edu.institution || 'N/A', edu.year || 'N/A']),
        theme: 'striped',
        styles: { fontSize: 10 },
      });
      yOffset = doc.lastAutoTable.finalY + 10;

      autoTable(doc, {
        startY: yOffset + 5,
        head: [['Role', 'Company', 'Duration']],
        body: formData.experience.map(exp => [exp.role || 'N/A', exp.company || 'N/A', exp.duration || 'N/A']),
        theme: 'striped',
        styles: { fontSize: 10 },
      });
      yOffset = doc.lastAutoTable.finalY + 10;

      autoTable(doc, {
        startY: yOffset + 5,
        head: [['Skill']],
        body: formData.skills.map(skill => [skill || 'N/A']),
        theme: 'striped',
        styles: { fontSize: 10 },
      });

      doc.save(`resume-${formData.name || 'unnamed'}.pdf`);
      
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded!',
        text: `Resume for ${formData.name} has been downloaded successfully`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'PDF Generation Failed',
        text: `Failed to generate PDF: ${err.message}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
      console.error('PDF generation error:', err);
    }
  };

  const toggleSection = (section) => {
    setSectionsOpen({ ...sectionsOpen, [section]: !sectionsOpen[section] });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`max-w-4xl mx-auto p-8 rounded-xl shadow-2xl backdrop-blur-md ${
          darkMode ? 'bg-gray-800' : 'bg-blue-50'
        } transition-all duration-300`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
            darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'
          }`}>{resumeId ? 'Edit Resume' : 'Resume Builder'}</h2>
          <div className="flex gap-4">
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                } hover:opacity-80 transition-all`}
                aria-label="Back to dashboard"
              >
                <FiArrowLeft />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
              } hover:opacity-80 transition-all`}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </motion.button>
          </div>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-red-500 mb-4 text-center ${darkMode ? 'text-red-400' : ''}`}
          >
            {error}
          </motion.p>
        )}
        {loading && (
          <div className="flex justify-center mb-4">
            <ClipLoader size={40} color={darkMode ? '#fff' : '#2563eb'} />
          </div>
        )}

        {/* Personal Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={() => toggleSection('personal')}
            className={`text-lg font-semibold mb-2 flex items-center bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'
            }`}
          >
            {sectionsOpen.personal ? '▼' : '▶'} Personal Details
          </button>
          {sectionsOpen.personal && (
            <div className="space-y-4">
              <div className="relative">
                <FiUser className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                <input
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleChange(e)}
                  placeholder="Full Name"
                  className={`pl-10 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                  } transition-all duration-200`}
                />
              </div>
              <div className="relative">
                <FiBriefcase className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                <input
                  name="jobRole"
                  value={formData.jobRole}
                  onChange={(e) => handleChange(e)}
                  placeholder="Job Role"
                  className={`pl-10 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                  } transition-all duration-200`}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={suggestSkills}
                className={`bg-gradient-to-r ${
                  darkMode ? 'from-green-600 to-teal-600' : 'from-green-500 to-teal-500'
                } text-white p-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200`}
              >
                Suggest Skills (AI-Powered)
              </motion.button>
              {suggestions.length > 0 && (
                <div className="mt-2">
                  <p className={`${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Suggested Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((skill, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => addSuggestedSkill(skill)}
                        className={`px-3 py-1 rounded-full border ${
                          darkMode ? 'border-blue-500 text-blue-300 hover:bg-blue-900/50' : 'border-blue-300 text-blue-600 hover:bg-blue-100'
                        } transition-all duration-200`}
                      >
                        {skill}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              <div className="relative">
                <FiMail className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                <input
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleChange(e)}
                  placeholder="Email"
                  className={`pl-10 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                  } transition-all duration-200`}
                />
              </div>
              <div className="relative">
                <FiPhone className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange(e)}
                  placeholder="Phone"
                  className={`pl-10 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                  } transition-all duration-200`}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => toggleSection('summary')}
            className={`text-lg font-semibold mb-2 flex items-center bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'
            }`}
          >
            {sectionsOpen.summary ? '▼' : '▶'} Summary
          </button>
          {sectionsOpen.summary && (
            <div className="relative">
              <FiEdit className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
              <textarea
                name="summary"
                value={formData.summary}
                onChange={(e) => handleChange(e)}
                placeholder="Professional Summary (max 500 characters)"
                maxLength={500}
                className={`pl-10 p-3 border rounded-lg w-full h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                } transition-all duration-200`}
              />
              <p className={`${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                {formData.summary.length}/500 characters
              </p>
            </div>
          )}
        </motion.div>

        {/* Education */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6"
        >
          <button
            onClick={() => toggleSection('education')}
            className={`text-lg font-semibold mb-2 flex items-center bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'
            }`}
          >
            {sectionsOpen.education ? '▼' : '▶'} Education
          </button>
          {sectionsOpen.education && (
            <>
              {formData.education.map((edu, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 p-4 border rounded-lg relative border-blue-200 dark:border-blue-600"
                >
                  <div className="relative">
                    <FiBook className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                    <input
                      name="institution"
                      value={edu.institution}
                      onChange={(e) => handleChange(e, 'education', index)}
                      placeholder="Institution"
                      className={`pl-10 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                      } transition-all duration-200`}
                    />
                  </div>
                  <div className="relative mt-2">
                    <FiAward className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                    <input
                      name="degree"
                      value={edu.degree}
                      onChange={(e) => handleChange(e, 'education', index)}
                      placeholder="Degree"
                      className={`pl-10 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                      } transition-all duration-200`}
                    />
                  </div>
                  <div className="relative mt-2">
                    <input
                      name="year"
                      value={edu.year}
                      onChange={(e) => handleChange(e, 'education', index)}
                      placeholder="Year"
                      className={`p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                      } transition-all duration-200`}
                    />
                  </div>
                  {formData.education.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeField('education', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
                    >
                      <FiMinus />
                    </motion.button>
                  )}
                </motion.div>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addField('education')}
                className={`flex items-center ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-700'
                } text-white p-3 rounded-lg transition-all duration-200`}
              >
                <FiPlus className="mr-2" /> Add Education
              </motion.button>
            </>
          )}
        </motion.div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={() => toggleSection('experience')}
            className={`text-lg font-semibold mb-2 flex items-center bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'
            }`}
          >
            {sectionsOpen.experience ? '▼' : '▶'} Experience
          </button>
          {sectionsOpen.experience && (
            <>
              {formData.experience.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 p-4 border rounded-lg relative border-blue-200 dark:border-blue-600"
                >
                  <div className="relative">
                    <FiBriefcase className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                    <input
                      name="company"
                      value={exp.company}
                      onChange={(e) => handleChange(e, 'experience', index)}
                      placeholder="Company"
                      className={`pl-10 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                      } transition-all duration-200`}
                    />
                  </div>
                  <div className="relative mt-2">
                    <FiBriefcase className={`absolute left-3 top-3 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                    <input
                      name="role"
                      value={exp.role}
                      onChange={(e) => handleChange(e, 'experience', index)}
                      placeholder="Role"
                      className={`pl-10 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                      } transition-all duration-200`}
                    />
                  </div>
                  <div className="relative mt-2">
                    <input
                      name="duration"
                      value={exp.duration}
                      onChange={(e) => handleChange(e, 'experience', index)}
                      placeholder="Duration"
                      className={`p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                      } transition-all duration-200`}
                    />
                  </div>
                  {formData.experience.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeField('experience', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
                    >
                      <FiMinus />
                    </motion.button>
                  )}
                </motion.div>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addField('experience')}
                className={`flex items-center ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-700'
                } text-white p-3 rounded-lg transition-all duration-200`}
              >
                <FiPlus className="mr-2" /> Add Experience
              </motion.button>
            </>
          )}
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-6"
        >
          <button
            onClick={() => toggleSection('skills')}
            className={`text-lg font-semibold mb-2 flex items-center bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'
            }`}
          >
            {sectionsOpen.skills ? '▼' : '▶'} Skills
          </button>
          {sectionsOpen.skills && (
            <>
              {formData.skills.map((skill, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative mb-2"
                >
                  <input
                    value={skill}
                    onChange={(e) => handleChange(e, 'skills', index)}
                    placeholder="Skill"
                    className={`p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-blue-200'
                    } transition-all duration-200`}
                  />
                  {formData.skills.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeField('skills', index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
                    >
                      <FiMinus />
                    </motion.button>
                  )}
                </motion.div>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addField('skills')}
                className={`flex items-center ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-700'
                } text-white p-3 rounded-lg transition-all duration-200`}
              >
                <FiPlus className="mr-2" /> Add Skill
              </motion.button>
            </>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={saveResume}
            disabled={loading || !userId}
            className={`flex items-center justify-center ${
              darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-700'
            } text-white p-3 rounded-lg transition-all duration-200 ${loading || !userId ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={resumeId ? 'Update resume' : 'Save resume'}
          >
            {loading ? <ClipLoader size={20} color="#fff" /> : <><FiSave className="mr-2" /> {resumeId ? 'Update Resume' : 'Save Resume'}</>}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            className={`flex items-center ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-700'
            } text-white p-3 rounded-lg transition-all duration-200`}
            aria-label="Download resume as PDF"
          >
            <FiDownload className="mr-2" /> Download PDF
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ResumeBuilder;