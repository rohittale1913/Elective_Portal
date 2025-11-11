import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import { GraduationCap, User, Mail, Lock, Phone, Building, Hash } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    semester: 5,
    section: '',
    mobile: '',
    registrationNumber: '',
    role: 'student' as 'student' | 'admin'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { getAvailableDepartments, getAvailableSections, getAvailableSemesters } = useData();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  // Get dynamic data from admin-configured options
  const departments = getAvailableDepartments();
  const sections = getAvailableSections();
  const semesters = getAvailableSemesters();

  // Fallback departments if none are configured
  const fallbackDepartments = [
    'Computer Science & Engineering',
    'Artificial Intelligence', 
    'Data Science',
    'Information Technology',
    'Cyber Security',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' ? parseInt(value) : value
    }));
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, registrationNumber } = formData;
    
    if (name.length < 3 || name.length > 60) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Name must be between 3 and 60 characters.'
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid email address.'
      });
      return false;
    }

    if (!registrationNumber || registrationNumber.length < 1) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid class roll number (minimum 1 character).'
      });
      return false;
    }

    if (password.length < 8 || password.length > 16) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be between 8 and 16 characters.'
      });
      return false;
    }

    if (!/(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(password)) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must contain at least one uppercase letter and one special character.'
      });
      return false;
    }

    if (password !== confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Passwords do not match.'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const success = await register(formData);
      if (success) {
        addNotification({
          type: 'success',
          title: 'Registration successful!',
          message: 'Your account has been created successfully.'
        });
        navigate('/');
      } else {
        addNotification({
          type: 'error',
          title: 'Registration failed',
          message: 'Email or class roll number already exists.'
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 flex justify-center px-4 sm:px-6 lg:px-8 transition-colors duration-200 overflow-y-auto fixed inset-0">
      <div className="max-w-md w-full flex flex-col justify-start min-h-screen">
        
        <div className="text-center mt-4 mb-4">
          <div className="flex justify-center">
            <GraduationCap className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="mt-3 text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            SIGN UP HERE
          </h1>
          <h2 className="mt-2 text-2xl font-bold text-gray-800 dark:text-gray-200">
            Create your account
          </h2>
          <p className="mt-1 text-base text-gray-600 dark:text-gray-300 font-medium">
            Join Elective Selection Portal to start your academic journey
          </p>
        </div>

        <form className="mt-3 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Full Name *
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Email Address *
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Department *
                </label>
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Department</option>
                  {(departments.length > 0 ? departments : fallbackDepartments).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Section *
                </label>
                <div className="mt-1 relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    id="section"
                    name="section"
                    required
                    value={formData.section}
                    onChange={handleChange}
                    className="pl-10 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Section</option>
                    {sections.length > 0 ? (
                      sections.map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))
                    ) : (
                      // Fallback to default sections if no data from admin
                      ['A', 'B', 'C', 'D', 'E'].map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))
                    )}
                    {/* <option value="F">Section F</option>
                    <option value="G">Section G</option>
                    <option value="H">Section H</option>
                    <option value="I">Section I</option>
                    <option value="J">Section J</option> */}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Semester *
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    required
                    value={formData.semester}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {semesters.length > 0 ? (
                      semesters.map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))
                    ) : (
                      [5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))
                    )
                    }
                  </select>
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Mobile *
                  </label>
                  <div className="mt-1 relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Mobile number"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Class Roll No *
                </label>
                <div className="mt-1 relative">
                  <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="registrationNumber"
                    name="registrationNumber"
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 120"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Password *
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="8-16 chars with uppercase & special char"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Confirm Password *
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
              <br/><br/><br/>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;