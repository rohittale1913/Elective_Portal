/**
 * DATA CONTEXT PROVIDER
 * 
 * Central data management system for the Elective Selection System.
 * Handles all CRUD operations, export functionality, and data persistence.
 * 
 * Key Features:
 * - Student and elective data management
 * - Excel and PDF export capabilities with roll numbers
 * - Local storage persistence
 * - Real-time data synchronization
 * - Comprehensive reporting system
 * 
 * Export Features:
 * - Student reports include roll numbers for identification
 * - Excel format with multiple worksheets
 * - PDF format with formatted tables
 * - Custom data filtering and sorting
 * 
 * @author Sahil Sukhdeve
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { systemConfigApi, syllabusApi, type SyllabusData } from '../services/api';

// API Base URL helper
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.MODE === 'production' 
      ? 'https://elective-selection-system.onrender.com/api' 
      : 'http://localhost:5000/api');
};

// API functions to fetch data from backend
const fetchElectives = async () => {
  try {
    console.log('Fetching electives from API...');
    const response = await fetch(`${getApiBaseUrl()}/electives`);
    console.log('Fetch response status:', response.status);
    
    if (!response.ok) {
      console.error('Fetch failed with status:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Raw electives from API:', data);
    
    // Handle both old format (array) and new format (object with electives property)
    const electives = Array.isArray(data) ? data : (data.electives || []);
    
    // Map MongoDB _id to id for frontend compatibility
    const mappedElectives = electives.map((elective: any) => ({
      ...elective,
      id: elective._id || elective.id
    }));
    
    console.log('Mapped electives:', mappedElectives);
    return mappedElectives;
  } catch (error) {
    console.error('Error fetching electives:', error);
    return [];
  }
};

const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found, skipping users fetch');
      return [];
    }
    
    const response = await fetch(`${getApiBaseUrl()}/users`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      console.warn('Fetch users failed with status:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('✅ Users fetched successfully:', data.users?.length || 0);
    
    // Log section data for first 3 users
    if (data.users && data.users.length > 0) {
      console.log('🔍 [fetchUsers] RAW API Response - First 3 users:');
      data.users.slice(0, 3).forEach((user: any) => {
        console.log(`  - ${user.name}:`);
        console.log(`    · section IN API RESPONSE: "${user.section}"`);
        console.log(`    · section type: ${typeof user.section}`);
        console.log(`    · Has section prop: ${Object.prototype.hasOwnProperty.call(user, 'section')}`);
        console.log(`    · User object keys:`, Object.keys(user));
      });
      
      // Log raw JSON of first user
      console.log('📄 [fetchUsers] RAW JSON of first user:');
      console.log(JSON.stringify(data.users[0], null, 2));
    }
    
    return data.users || [];
  } catch (error) {
    console.warn('Error fetching users (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};

const fetchTracks = async () => {
  try {
    console.log('Fetching tracks from API...');
    const response = await fetch(`${getApiBaseUrl()}/tracks`);
    console.log('Fetch tracks response status:', response.status);
    
    if (!response.ok) {
      console.error('Fetch tracks failed with status:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Raw tracks from API:', data);
    
    const tracks = Array.isArray(data) ? data : (data.tracks || []);
    
    // Map MongoDB _id to id for frontend compatibility
    const mappedTracks = tracks.map((track: any) => ({
      ...track,
      id: track._id || track.id
    }));
    
    console.log('Mapped tracks:', mappedTracks);
    return mappedTracks;
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }
};

const fetchSyllabi = async () => {
  try {
    console.log('📚 Fetching syllabi from MongoDB API...');
    const syllabi = await syllabusApi.getAllSyllabi();
    console.log('✅ Syllabi fetched successfully from MongoDB:', syllabi.length);
    console.log('📄 Syllabi details:', syllabi.map(s => ({
      id: s.id,
      electiveId: s.electiveId,
      fileName: s.pdfFileName,
      hasData: !!s.pdfData,
      dataLength: s.pdfData?.length || 0,
      isActive: s.isActive
    })));
    
    // Convert uploadedAt strings to Date objects
    const mappedSyllabi = syllabi.map((syllabus: SyllabusData) => ({
      ...syllabus,
      uploadedAt: new Date(syllabus.uploadedAt)
    }));
    
    return mappedSyllabi;
  } catch (error) {
    console.error('❌ Error fetching syllabi from MongoDB:', error);
    // Fallback to localStorage if API fails
    const storedSyllabi = localStorage.getItem('syllabi');
    if (storedSyllabi) {
      const parsedSyllabi = JSON.parse(storedSyllabi).map((syllabus: any) => ({
        ...syllabus,
        uploadedAt: new Date(syllabus.uploadedAt)
      }));
      console.log('⚠️ Using syllabi from localStorage fallback:', parsedSyllabi.length);
      return parsedSyllabi;
    }
    console.warn('⚠️ No syllabi found in localStorage either');
    return [];
  }
};

// API function to fetch feedback templates
const fetchFeedbackTemplates = async () => {
  try {
    console.log('Fetching feedback templates from API...');
    const response = await fetch(`${getApiBaseUrl()}/feedback/templates`);
    
    if (!response.ok) {
      console.error('Fetch feedback templates failed with status:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('Raw feedback templates from API:', data);
    
    if (data.success && data.templates) {
      // Map MongoDB _id to id and parse dates
      const templates = data.templates.map((template: any) => ({
        ...template,
        id: template._id || template.id,
        createdAt: new Date(template.createdAt)
      }));
      
      console.log('✅ Feedback templates fetched successfully:', templates.length);
      return templates;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching feedback templates:', error);
    return [];
  }
};

// API function to fetch ALL student elective selections (for admins)
const fetchAllStudentSelections = async () => {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('❌ No auth token found, skipping selection fetch');
      return [];
    }

    const apiUrl = `${getApiBaseUrl()}/student/all-selections`;
    console.log('🔄 [ADMIN] Fetching ALL student selections from:', apiUrl);
    console.log('📝 Using auth token:', authToken.substring(0, 20) + '...');
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch all student selections:', response.status, errorText);
      console.error('❌ API URL was:', apiUrl);
      
      // If 403/401, user might not be admin - fallback to regular fetch
      if (response.status === 403 || response.status === 401) {
        console.log('⚠️ Not authorized for all selections, falling back to user selections');
        return await fetchStudentSelections();
      }
      
      return [];
    }

    const data = await response.json();
    console.log('📊 [ADMIN] Raw API response:', data);
    console.log('   ✓ Success:', data.success);
    console.log('   ✓ Total selections across all students:', data.selections?.length || 0);
    
    if (data.success && data.selections) {
      console.log('🔄 [ADMIN] Mapping', data.selections.length, 'selections to frontend format...');
      
      // Map backend selections to frontend format
      const mappedSelections = data.selections.map((selection: any, index: number) => {
        // Handle both populated object and plain ObjectId string
        let electiveId: string;
        let track = '';
        
        if (typeof selection.electiveId === 'object' && selection.electiveId !== null) {
          // electiveId is populated object
          electiveId = selection.electiveId._id || selection.electiveId.id || selection.electiveId;
          track = selection.electiveId.track || '';
        } else {
          // electiveId is already a string
          electiveId = selection.electiveId;
          track = selection.track || '';
        }
        
        // Ensure studentId is a string
        const studentId = typeof selection.studentId === 'object' && selection.studentId !== null
          ? (selection.studentId._id || selection.studentId.id || selection.studentId.toString())
          : (selection.studentId || '').toString();
        
        if (index < 3) { // Log first 3 for debugging
          console.log(`   [${index + 1}/${data.selections.length}] Selection:`, {
            _id: selection._id,
            studentId: studentId,
            electiveId: electiveId,
            electiveName: selection.electiveId?.name || 'Unknown',
            track: track,
            semester: selection.semester
          });
        }

        return {
          id: selection._id || selection.id,
          studentId: studentId,
          electiveId: electiveId,
          semester: selection.semester,
          track: track || selection.track || '',
          category: selection.category || [],
          status: selection.status || 'selected',
          dateSelected: selection.selectedAt || selection.createdAt || new Date().toISOString()
        };
      });

      console.log('✅ [ADMIN] Successfully mapped', mappedSelections.length, 'selections');
      
      // Group by student for debugging
      const byStudent = mappedSelections.reduce((acc: any, sel: any) => {
        acc[sel.studentId] = (acc[sel.studentId] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 [ADMIN] Selections by student count:', byStudent);
      console.log('📊 [ADMIN] Total students with selections:', Object.keys(byStudent).length);
      
      return mappedSelections;
    }
    
    console.log('⚠️ No selections found in API response');
    return [];
  } catch (error) {
    console.error('❌ Error fetching all student selections:', error);
    return [];
  }
};

// API function to fetch student elective selections
const fetchStudentSelections = async () => {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('❌ No auth token found, skipping selection fetch');
      return [];
    }

    const apiUrl = `${getApiBaseUrl()}/student/selections`;
    console.log('🔄 Fetching student selections from:', apiUrl);
    console.log('📝 Using auth token:', authToken.substring(0, 20) + '...');
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch student selections:', response.status, errorText);
      console.error('❌ API URL was:', apiUrl);
      console.error('❌ Check if backend server is running and endpoint exists');
      return [];
    }

    const data = await response.json();
    console.log('📊 Raw API response:', data);
    console.log('   ✓ Success:', data.success);
    console.log('   ✓ Selections array:', data.selections);
    console.log('   ✓ Selections count:', data.selections?.length || 0);
    
    if (data.success && data.selections) {
      console.log('🔄 Mapping', data.selections.length, 'selections to frontend format...');
      
      // Map backend selections to frontend format
      const mappedSelections = data.selections.map((selection: any, index: number) => {
        // Handle both populated object and plain ObjectId string
        let electiveId: string;
        let track = '';
        
        if (typeof selection.electiveId === 'object' && selection.electiveId !== null) {
          // electiveId is populated object
          electiveId = selection.electiveId._id || selection.electiveId.id || selection.electiveId;
          track = selection.electiveId.track || '';
        } else {
          // electiveId is already a string
          electiveId = selection.electiveId;
          track = selection.track || '';
        }
        
        // Ensure studentId is a string
        const studentId = typeof selection.studentId === 'object' && selection.studentId !== null
          ? (selection.studentId._id || selection.studentId.id || selection.studentId.toString())
          : (selection.studentId || '').toString();
        
        console.log(`   [${index + 1}/${data.selections.length}] Selection:`, {
          _id: selection._id,
          studentId: studentId,
          electiveId: electiveId,
          electiveName: selection.electiveId?.name || 'Unknown',
          track: track,
          semester: selection.semester,
          status: selection.status
        });

        return {
          id: selection._id || selection.id,
          studentId: studentId,
          electiveId: electiveId,
          semester: selection.semester,
          track: track || selection.track || '',
          category: selection.category || [],
          status: selection.status || 'selected',
          dateSelected: selection.selectedAt || selection.createdAt || new Date().toISOString()
        };
      });

      console.log('✅ Successfully mapped', mappedSelections.length, 'selections');
      console.log('📋 First selection sample:', mappedSelections[0]);
      return mappedSelections;
    }
    
    console.log('⚠️ No selections found in API response (data.success:', data.success, ', data.selections:', data.selections, ')');
    return [];
  } catch (error) {
    console.error('❌ Error fetching student selections:', error);
    return [];
  }
};

// Fetch feedback responses from backend
const fetchFeedbackResponses = async () => {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('No auth token found, skipping feedback responses fetch');
      return [];
    }

    console.log('🔄 Fetching feedback responses from backend...');
    const response = await fetch(`${getApiBaseUrl()}/feedback/responses`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch feedback responses:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('📊 Raw feedback responses from API:', data);
    
    if (data.success && data.responses) {
      console.log(`✅ Loaded ${data.responses.length} feedback responses from backend`);
      return data.responses.map((response: any) => ({
        id: response._id || response.id,
        templateId: response.templateId,
        templateTitle: response.templateTitle,
        studentId: response.studentId,
        studentName: response.studentName,
        studentDepartment: response.studentDepartment,
        studentSemester: response.studentSemester,
        studentSection: response.studentSection,
        responses: response.responses || [],
        submittedAt: new Date(response.submittedAt || response.createdAt)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    return [];
  }
};

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  yearOfStudy: number;
  semester: number;
  section?: string;
  cgpa: number;
  completedCredits: number;
  profile?: {
    interests: string[];
    careerGoals: string[];
    preferredLearningStyle: string;
  };
}

export interface Elective {
  id: string;
  name: string;
  code?: string; // Make code optional
  credits: number;
  description: string;
  category: ('Departmental' | 'Open' | 'Humanities')[]; // Now an array of categories
  electiveCategory: 'Core' | 'Elective' | 'Lab';
  subjectType?: 'Theory' | 'Practical' | 'Theory+Practical'; // Type of subject
  department: string;
  // For Open Category electives
  offeredBy?: string; // Which department offers this elective
  eligibleDepartments?: string[]; // Which departments can take this elective
  semester: number;
  track: string;
  image?: string; // Optional image URL for the elective
  infoImage?: string; // Alternative field name for image (for backward compatibility)
  selectionDeadline?: string; // ISO date string for selection deadline
  deadline?: Date | string; // Also support Date type or string
  prerequisites?: string[];
  futureOpportunities?: string[];
  minEnrollment?: number;
  maxEnrollment?: number;
  maxStudents?: number; // Legacy field - keeping for backward compatibility
  enrolledStudents?: number; // Current number of enrolled students
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  type: 'elective_reminder' | 'deadline' | 'general';
  targetSemester?: number;
  targetDepartment?: string;
  targetSections?: string[]; // Added sections field
  createdAt: Date;
  createdBy: string;
}

export interface FeedbackTemplate {
  id: string;
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  targetCategory?: 'Departmental' | 'Open' | 'Humanities';
  targetDepartment?: string;
  targetSemester?: number;
  targetSection?: string | string[]; // Can be a single section or array of sections
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface FeedbackQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'rating' | 'text' | 'yes-no';
  options?: string[]; // For multiple-choice questions
  required: boolean;
}

export interface FeedbackResponse {
  id: string;
  templateId: string;
  templateTitle: string;
  studentId: string;
  studentName: string;
  studentDepartment?: string;
  studentSemester?: number;
  studentSection?: string;
  responses: {
    questionId: string;
    question: string;
    answer: any;
    questionType: 'multiple-choice' | 'rating' | 'text' | 'yes-no';
  }[];
  submittedAt: Date;
  electiveId?: string; // If feedback is specific to an elective
}

export interface Track {
  id: string;
  name: string;
  color: string;
  
  department: string;
  
  
  category: string;
}

export interface StudentElective {
  id: string;
  studentId: string;
  rollNumber?: string;
  studentName?: string;
  electiveId: string;
  elective?: Elective;
  semester: number;
  dateSelected: string;
  enrolledAt?: string;
  track: string;
  feedback?: {
    rating: number;
    comment?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    recommendation: 'Yes' | 'No' | 'Maybe';
  };
}

export interface ElectiveFeedbackForm {
  id: string;
  studentId: string;
  previousElectiveId: string;
  semester: number;
  feedback: {
    rating: number;
    comment: string;
    wouldRecommend: boolean;
    improvements: string;
  };
  submittedAt: Date;
}

export interface Syllabus {
  id: string;
  electiveId: string;
  title: string;
  description: string;
  pdfData: string; // Base64 encoded PDF data
  pdfFileName: string;
  uploadedBy: string;
  uploadedAt: Date;
  academicYear: string;
  semester: number;
  version: number;
  isActive: boolean;
  targetDepartment?: string; // Optional: Show only to specific department
  targetSemester?: number; // Optional: Show only to specific semester
}

interface DataContextType {
  electives: Elective[];
  tracks: Track[];
  studentElectives: StudentElective[];
  students: Student[];
  electiveFeedbacks: ElectiveFeedbackForm[];
  isLoadingStudentData: boolean; // NEW: Loading state for students and their electives
  getElectivesByCategoryAndDepartment: (category: string, department?: string, semester?: number) => Elective[];
  getStudentElectives: (studentId: string) => StudentElective[];
  selectElective: (studentId: string, electiveId: string, semester: number) => Promise<boolean>;
  removeElective: (studentElectiveId: string) => Promise<boolean>;
  submitFeedback: (studentElectiveId: string, feedback: object) => Promise<boolean>;
  getFutureElectives: (currentElectiveId: string) => Elective[];
  exportDataAsCSV: (dataType: 'students' | 'electives' | 'student-electives') => void;
  exportDataAsExcel: () => void;
  exportDataAsPDF: () => void;
  exportDataAsTXT: (dataType: 'students' | 'electives' | 'student-electives') => void;
  getTracksByDepartment: (department: string) => Track[];
  getElectivesByDepartment: (department: string) => Elective[];
  getTracksByCategory: (category: string) => Track[];
  getElectivesByCategory: (category: 'Humanities' | 'Departmental' | 'Open Elective') => Elective[];
  addElective: (elective: Omit<Elective, 'id'>) => Promise<boolean>;
  updateElective: (id: string, elective: Partial<Elective>) => Promise<boolean>;
  deleteElective: (id: string) => Promise<boolean>;
  clearElectiveEnrollment: (id: string) => Promise<boolean>;
  refreshElectives: () => Promise<boolean>;
  refreshUsers: () => Promise<boolean>;
  refreshStudentSelections: () => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getRecommendations: (studentId: string, semester: number) => Elective[];
  getElectiveRecommendation: (studentId: string, userPreferences: { interests: string[]; careerGoals: string; difficulty: string }) => Elective[];
  getAvailableDepartments: () => string[];
  getAvailableSections: () => string[];
  getAvailableSemesters: () => number[];
  getElectiveEnrollmentCount: (electiveId: string) => number;
  isElectiveAvailable: (electiveId: string) => { available: boolean; reason?: string };
  isElectiveSelectionOpen: (electiveId: string) => boolean;
  addDepartment: (department: string) => Promise<boolean>;
  removeDepartment: (department: string) => Promise<boolean>;
  addSection: (section: string) => Promise<boolean>;
  removeSection: (section: string) => Promise<boolean>;
  addSemester: (semester: number) => Promise<boolean>;
  removeSemester: (semester: number) => Promise<boolean>;
  // Track management functions
  addTrack: (track: Omit<Track, 'id'>) => Promise<boolean>;
  updateTrack: (id: string, updates: Partial<Track>) => Promise<boolean>;
  removeTrack: (id: string) => Promise<boolean>;
  getAvailableCategories: () => string[];
  addCategory: (category: string) => Promise<boolean>;
  removeCategory: (category: string) => Promise<boolean>;
  // Alert system functions
  createAlert: (alert: Omit<AlertNotification, 'id' | 'createdAt'>) => void;
  getActiveAlerts: (department?: string, semester?: number) => AlertNotification[];
  deleteAlert: (alertId: string) => void;
  // Feedback template functions
  createFeedbackTemplate: (template: Omit<FeedbackTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateFeedbackTemplate: (templateId: string, updates: Partial<FeedbackTemplate>) => Promise<void>;
  deleteFeedbackTemplate: (templateId: string) => Promise<void>;
  getActiveFeedbackTemplates: (category?: string) => FeedbackTemplate[];
  // Feedback response functions
  submitFeedbackResponse: (response: Omit<FeedbackResponse, 'id' | 'submittedAt'>) => Promise<void>;
  getFeedbackResponses: (templateId?: string, studentId?: string) => FeedbackResponse[];
  getStudentSubmittedTemplates: (studentId: string) => string[];
  deleteFeedbackResponse: (responseId: string) => Promise<void>;
  // Syllabus management functions
  uploadSyllabus: (electiveId: string, file: File, description: string, targetDepartment?: string, targetSemester?: number) => Promise<boolean>;
  getSyllabus: (electiveId: string) => Syllabus | null;
  getAllSyllabi: () => Syllabus[];
  updateSyllabus: (syllabusId: string, updates: Partial<Syllabus>) => Promise<boolean>;
  deleteSyllabus: (syllabusId: string) => Promise<boolean>;
  setElectiveDeadline: (electiveId: string, deadline: string) => void;
  getElectiveDeadline: (electiveId: string) => string | null;
  addElectiveFeedback: (feedback: Omit<ElectiveFeedbackForm, 'id'>) => void;
  // Elective limit functions
  getElectiveLimit: (department: string, semester: number, category: string) => Promise<number>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const initialTracks: Track[] = [
  // {
  //   id: '1',
  //   name: 'Data Science & Analytics',
  //   department: 'Computer Science',
  //   description: 'Advanced analytics, machine learning, and data visualization techniques',
  //   color: '#4F46E5',
  //   suggestedElectives: ['cs301', 'cs302'],
  //   prerequisites: ['Programming Fundamentals', 'Statistics'],
  //   careerOutcomes: ['Data Scientist', 'ML Engineer', 'Business Analyst'],
  //   difficulty: 'Advanced',
  //   estimatedHours: 120,
  //   category: 'Departmental'
  // },
  // {
  //   id: '2',
  //   name: 'Cybersecurity',
  //   department: 'Computer Science',
  //   description: 'Network security, ethical hacking, and information security management',
  //   color: '#DC2626',
  //   suggestedElectives: ['cs303', 'cs304'],
  //   prerequisites: ['Computer Networks', 'Operating Systems'],
  //   careerOutcomes: ['Security Analyst', 'Ethical Hacker', 'Security Consultant'],
  //   difficulty: 'Advanced',
  //   estimatedHours: 100,
  //   category: 'Departmental'
  // },
  // {
  //   id: '3',
  //   name: 'Web Development',
  //   department: 'Computer Science',
  //   description: 'Full-stack web development with modern frameworks',
  //   color: '#059669',
  //   suggestedElectives: ['cs305', 'cs306'],
  //   prerequisites: ['Programming Fundamentals', 'Database Systems'],
  //   careerOutcomes: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer'],
  //   difficulty: 'Intermediate',
  //   estimatedHours: 80,
  //   category: 'Open'
  // },
  // {
  //   id: '4',
  //   name: 'Power Systems',
  //   department: 'Electrical Engineering',
  //   description: 'Advanced power generation, transmission, and distribution systems',
  //   color: '#7C2D12',
  //   suggestedElectives: ['ee301', 'ee302'],
  //   prerequisites: ['Circuit Analysis', 'Electromagnetic Fields'],
  //   careerOutcomes: ['Power Engineer', 'Grid Analyst', 'Renewable Energy Specialist'],
  //   difficulty: 'Advanced',
  //   estimatedHours: 110,
  //   category: 'Departmental'
  // },
  // {
  //   id: '5',
  //   name: 'Digital Signal Processing',
  //   department: 'Electrical Engineering',
  //   description: 'Digital filter design, signal analysis, and processing techniques',
  //   color: '#1E40AF',
  //   suggestedElectives: ['ee303', 'ee304'],
  //   prerequisites: ['Signals and Systems', 'Mathematics'],
  //   careerOutcomes: ['DSP Engineer', 'Audio Engineer', 'Communications Engineer'],
  //   difficulty: 'Advanced',
  //   estimatedHours: 90,
  //   category: 'Departmental'
  // },
  // {
  //   id: '6',
  //   name: 'Communication & Leadership',
  //   department: 'Humanities',
  //   description: 'Developing effective communication and leadership skills',
  //   color: '#7C3AED',
  //   suggestedElectives: ['hum301', 'hum302'],
  //   prerequisites: ['Basic Communication'],
  //   careerOutcomes: ['Team Leader', 'Project Manager', 'Communications Specialist'],
  //   difficulty: 'Intermediate',
  //   estimatedHours: 60,
  //   category: 'Humanities'
  // },
  // {
  //   id: '7',
  //   name: 'Philosophy & Ethics',
  //   department: 'Humanities',
  //   description: 'Exploring ethical frameworks and philosophical thinking',
  //   color: '#DB2777',
  //   suggestedElectives: ['hum303', 'hum304'],
  //   prerequisites: ['Introduction to Philosophy'],
  //   careerOutcomes: ['Ethics Consultant', 'Policy Analyst', 'Academic Researcher'],
  //   difficulty: 'Intermediate',
  //   estimatedHours: 55,
  //   category: 'Humanities'
  // }
];

const initialElectives: Elective[] = [
  // AI Track - Computer Science & Engineering (Departmental Electives)
  // {
  //   id: '1',
  //   name: 'Machine Learning Fundamentals',
  //   code: 'CS501',
  //   semester: 5,
  //   track: 'Data Science & Analytics',
  //   description: 'Introduction to supervised and unsupervised learning algorithms',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop&crop=center',
  //   selectionDeadline: '2025-12-31T23:59:59.000Z'
  // },
  // {
  //   id: '2',
  //   name: 'Deep Learning',
  //   code: 'CS502',
  //   semester: 6,
  //   track: 'Data Science & Analytics',
  //   description: 'Neural networks, CNNs, RNNs and their applications',
  //   prerequisites: ['1'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '3',
  //   name: 'Natural Language Processing',
  //   code: 'CS503',
  //   semester: 7,
  //   track: 'Data Science & Analytics',
  //   description: 'Text processing, sentiment analysis, and language models',
  //   prerequisites: ['1'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1526378800651-c32d170fe6f8?w=400&h=300&fit=crop&crop=center'
  // },
  // // Cybersecurity Track - Computer Science & Engineering (Departmental Electives)
  // {
  //   id: '4',
  //   name: 'Network Security',
  //   code: 'CS504',
  //   semester: 5,
  //   track: 'Cybersecurity',
  //   description: 'Firewalls, intrusion detection, and network protocols',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '5',
  //   name: 'Ethical Hacking',
  //   code: 'CS505',
  //   semester: 6,
  //   track: 'Cybersecurity',
  //   description: 'Penetration testing, vulnerability assessment',
  //   prerequisites: ['4'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '6',
  //   name: 'Cryptography',
  //   code: 'CS506',
  //   semester: 7,
  //   track: 'Cybersecurity',
  //   description: 'Encryption algorithms, digital signatures, blockchain',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1614064643087-96ce79ad4c25?w=400&h=300&fit=crop&crop=center'
  // },
  // // Data Science Track - Computer Science & Engineering (Departmental Electives)
  // {
  //   id: '7',
  //   name: 'Big Data Analytics',
  //   code: 'CS507',
  //   semester: 5,
  //   track: 'Data Science',
  //   description: 'Hadoop, Spark, and distributed computing',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '8',
  //   name: 'Data Visualization',
  //   code: 'CS508',
  //   semester: 6,
  //   track: 'Data Science',
  //   description: 'Interactive dashboards and visual storytelling',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '9',
  //   name: 'Statistical Learning',
  //   code: 'CS509',
  //   semester: 7,
  //   track: 'Data Science',
  //   description: 'Statistical models and hypothesis testing',
  //   prerequisites: ['7'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center'
  // },
  // // Web Development Track - Computer Science & Engineering (Departmental Electives)
  // {
  //   id: '10',
  //   name: 'Full Stack Development',
  //   code: 'CS510',
  //   semester: 5,
  //   track: 'Web Development',
  //   description: 'MERN/MEAN stack development and deployment',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '11',
  //   name: 'Cloud Computing',
  //   code: 'CS511',
  //   semester: 6,
  //   track: 'Web Development',
  //   description: 'AWS, Azure, and cloud architecture patterns',
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '12',
  //   name: 'Mobile Development',
  //   code: 'CS512',
  //   semester: 7,
  //   track: 'Web Development',
  //   description: 'React Native, Flutter, and cross-platform development',
  //   prerequisites: ['10'],
  //   credits: 3,
  //   department: 'Computer Science & Engineering',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop&crop=center'
  // },
  // // Digital Signal Processing Track - Electronics & Communication (Departmental Electives)
  // {
  //   id: '13',
  //   name: 'Advanced Signal Processing',
  //   code: 'EC501',
  //   semester: 5,
  //   track: 'Digital Signal Processing',
  //   description: 'Digital filters, transforms, and signal analysis',
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '14',
  //   name: 'Communication Systems',
  //   code: 'EC502',
  //   semester: 6,
  //   track: 'Digital Signal Processing',
  //   description: 'Modulation, coding, and wireless communication',
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1476357471311-43c0db9fb2b4?w=400&h=300&fit=crop&crop=center'
  // },
  // {
  //   id: '15',
  //   name: 'Image Processing',
  //   code: 'EC503',
  //   semester: 7,
  //   track: 'Digital Signal Processing',
  //   description: 'Digital image enhancement and computer vision',
  //   prerequisites: ['13'],
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective',
  //   image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&h=300&fit=crop&crop=center'
  // },
  // // VLSI Design Track - Electronics & Communication (Departmental Electives)
  // {
  //   id: '16',
  //   name: 'VLSI Circuit Design',
  //   code: 'EC504',
  //   semester: 5,
  //   track: 'VLSI Design',
  //   description: 'CMOS circuit design and layout optimization',
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '17',
  //   name: 'System-on-Chip Design',
  //   code: 'EC505',
  //   semester: 6,
  //   track: 'VLSI Design',
  //   description: 'SoC architecture and design methodology',
  //   prerequisites: ['16'],
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '18',
  //   name: 'FPGA Programming',
  //   code: 'EC506',
  //   semester: 7,
  //   track: 'VLSI Design',
  //   description: 'HDL programming and FPGA implementation',
  //   credits: 3,
  //   department: 'Electronics & Communication',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // // Humanities Electives
  // {
  //   id: '19',
  //   name: 'Philosophy of Technology',
  //   code: 'HU501',
  //   semester: 5,
  //   track: 'Philosophy',
  //   description: 'Exploring the relationship between technology and society',
  //   credits: 2,
  //   department: 'Humanities',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '20',
  //   name: 'Technical Communication',
  //   code: 'HU502',
  //   semester: 6,
  //   track: 'Communication',
  //   description: 'Advanced writing and presentation skills for engineers',
  //   credits: 2,
  //   department: 'Humanities',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '21',
  //   name: 'Engineering Economics',
  //   code: 'HU503',
  //   semester: 7,
  //   track: 'Economics',
  //   description: 'Economic principles applied to engineering decisions',
  //   credits: 3,
  //   department: 'Humanities',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '22',
  //   name: 'Innovation Management',
  //   code: 'HU504',
  //   semester: 5,
  //   track: 'Management',
  //   description: 'Managing innovation processes in technology companies',
  //   credits: 3,
  //   department: 'Humanities',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // // Open Electives
  // {
  //   id: '23',
  //   name: 'Digital Marketing',
  //   code: 'OE501',
  //   semester: 5,
  //   track: 'Marketing',
  //   description: 'Online marketing strategies and social media management',
  //   credits: 3,
  //   department: 'Open',
  //   category: 'Departmental',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '24',
  //   name: 'Financial Literacy',
  //   code: 'OE502',
  //   semester: 6,
  //   track: 'Web Development',
  //   description: 'Personal finance, investments, and financial planning',
  //   credits: 2,
  //   department: 'Open',
  //   category: 'Open',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '25',
  //   name: 'Environmental Science',
  //   code: 'OE503',
  //   semester: 7,
  //   track: 'Web Development',
  //   description: 'Environmental issues and sustainable development',
  //   credits: 3,
  //   department: 'Open',
  //   category: 'Open',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '26',
  //   name: 'Data Analytics for Business',
  //   code: 'OE504',
  //   semester: 5,
  //   track: 'Web Development',
  //   description: 'Using data science techniques for business insights',
  //   credits: 3,
  //   department: 'Open',
  //   category: 'Open',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '27',
  //   name: 'Entrepreneurship',
  //   code: 'OE505',
  //   semester: 6,
  //   track: 'Web Development',
  //   description: 'Starting and managing technology startups',
  //   credits: 3,
  //   department: 'Open',
  //   category: 'Open',
  //   electiveCategory: 'Elective'
  // },
  // // Humanities Electives
  // {
  //   id: '28',
  //   name: 'Technical Communication',
  //   code: 'HUM501',
  //   semester: 5,
  //   track: 'Communication & Leadership',
  //   description: 'Professional writing and presentation skills',
  //   credits: 2,
  //   department: 'Humanities',
  //   category: 'Humanities',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '29',
  //   name: 'Ethics in Engineering',
  //   code: 'HUM502',
  //   semester: 6,
  //   track: 'Philosophy & Ethics',
  //   description: 'Moral and ethical issues in engineering practice',
  //   credits: 2,
  //   department: 'Humanities',
  //   category: 'Humanities',
  //   electiveCategory: 'Elective'
  // },
  // {
  //   id: '30',
  //   name: 'Psychology of Technology',
  //   code: 'HUM503',
  //   semester: 7,
  //   track: 'Communication & Leadership',
  //   description: 'Human behavior and technology interaction',
  //   credits: 3,
  //   department: 'Humanities',
  //   category: 'Humanities',
  //   electiveCategory: 'Elective'
  // }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [electives, setElectives] = useState<Elective[]>([]);
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentElectives, setStudentElectives] = useState<StudentElective[]>([]);
  const [electiveFeedbacks, setElectiveFeedbacks] = useState<ElectiveFeedbackForm[]>([]);
  const [isLoadingStudentData, setIsLoadingStudentData] = useState<boolean>(true); // NEW: Loading state
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken')); // Track auth token changes
  
  // Admin-configured data - will be loaded from database
  const [adminDepartments, setAdminDepartments] = useState<string[]>([]);
  const [adminSections, setAdminSections] = useState<string[]>([]);
  const [adminSemesters, setAdminSemesters] = useState<number[]>([]);
  
  // Alert and feedback system
  const [alertNotifications, setAlertNotifications] = useState<AlertNotification[]>([]);
  const [feedbackTemplates, setFeedbackTemplates] = useState<FeedbackTemplate[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<FeedbackResponse[]>([]);
  
  // Syllabus management
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);

  // Listen for storage events to detect auth token changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('authToken');
      setAuthToken(newToken);
    };

    // Listen for custom event when auth token changes
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authTokenChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authTokenChanged', handleStorageChange);
    };
  }, []);

  // Separate useEffect to reload student electives when auth token changes
  useEffect(() => {
    if (authToken) {
      console.log('🔄 Auth token detected, reloading student electives...');
      const reloadStudentElectives = async () => {
        setIsLoadingStudentData(true);
        
        try {
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          const isAdmin = payload.role === 'admin';
          
          const backendSelections = isAdmin 
            ? await fetchAllStudentSelections()
            : await fetchStudentSelections();
          
          if (backendSelections.length > 0) {
            console.log('✅ Reloaded student selections:', backendSelections.length);
            setStudentElectives(backendSelections);
            localStorage.setItem('studentElectives', JSON.stringify(backendSelections));
          }
        } catch (error) {
          console.error('❌ Error reloading student electives:', error);
        } finally {
          setIsLoadingStudentData(false);
        }
      };
      
      reloadStudentElectives();
    }
  }, [authToken]); // Reload when auth token changes

  useEffect(() => {
    // Load data from backend API
    const loadData = async () => {
      console.log('🔄 Loading data from backend...');
      
      // Fetch system config from database
      try {
        const systemConfig = await systemConfigApi.getConfig();
        console.log('✅ Loaded system config from database:', systemConfig);
        console.log('   📋 electiveCategories from database:', systemConfig.electiveCategories);
        
        if (systemConfig.departments && systemConfig.departments.length > 0) {
          console.log('   ✅ Setting departments:', systemConfig.departments.length);
          setAdminDepartments(systemConfig.departments);
        }
        if (systemConfig.sections && systemConfig.sections.length > 0) {
          console.log('   ✅ Setting sections:', systemConfig.sections.length);
          setAdminSections(systemConfig.sections);
        }
        if (systemConfig.semesters && systemConfig.semesters.length > 0) {
          console.log('   ✅ Setting semesters:', systemConfig.semesters.length);
          setAdminSemesters(systemConfig.semesters);
        }
        if (systemConfig.electiveCategories && systemConfig.electiveCategories.length > 0) {
          console.log('   ✅ Setting categories:', systemConfig.electiveCategories.length, systemConfig.electiveCategories);
          setAdminCategories(systemConfig.electiveCategories);
        } else {
          console.warn('   ⚠️ No electiveCategories found in database, using defaults');
        }
      } catch (error) {
        console.warn('⚠️ Could not load system config from database, using defaults:', error);
        // Keep the default values already set in state
      }
      
      // OPTIMIZATION: Fetch data in parallel for faster loading
      const [backendElectives, backendTracks, backendUsers, backendSyllabi] = await Promise.all([
        fetchElectives(),
        fetchTracks(),
        fetchUsers(),
        fetchSyllabi()
      ]);
      
      // Process electives
      if (backendElectives.length > 0) {
        console.log('✅ Loaded electives from backend:', backendElectives.length);
        setElectives(backendElectives);
        localStorage.setItem('electives', JSON.stringify(backendElectives));
      } else {
        // Fallback to stored or initial data
        const storedElectives = localStorage.getItem('electives');
        if (storedElectives) {
          setElectives(JSON.parse(storedElectives));
        } else {
          setElectives(initialElectives);
          localStorage.setItem('electives', JSON.stringify(initialElectives));
        }
      }
      
      
      // Process tracks
      if (backendTracks.length > 0) {
        console.log('✅ Loaded tracks from backend:', backendTracks.length);
        setTracks(backendTracks);
        localStorage.setItem('tracks', JSON.stringify(backendTracks));
      } else {
        // Fallback to stored data
        const storedTracks = localStorage.getItem('tracks');
        if (storedTracks) {
          setTracks(JSON.parse(storedTracks));
        } else {
          setTracks(initialTracks);
          localStorage.setItem('tracks', JSON.stringify(initialTracks));
        }
      }

      // Process users (already fetched in parallel above)
      console.log('📥 [loadData] Processing users from backend...');
      console.log('   - backendUsers length:', backendUsers.length);
      
      if (backendUsers.length > 0) {
        console.log('✅ [loadData] Loaded users from backend:', backendUsers.length);
        
        // Log first user for debugging
        if (backendUsers[0]) {
          console.log('   📋 Sample user (first):', {
            id: backendUsers[0]._id || backendUsers[0].id,
            name: backendUsers[0].name,
            role: backendUsers[0].role,
            department: backendUsers[0].department,
            section: backendUsers[0].section,
            semester: backendUsers[0].semester
          });
        }
        
        // Convert users to students format and store them
        const studentsData = backendUsers
          .filter((user: any) => user.role === 'student')
          .map((user: any) => {
            console.log(`🔄 [Initial Load] Mapping ${user.name}: section = "${user.section}" (${typeof user.section})`);
            return {
              id: user._id || user.id,
              name: user.name,
              rollNumber: user.rollNumber || user.rollNo,
              email: user.email,
              department: user.department,
              yearOfStudy: Math.ceil((user.semester || 1) / 2),
              semester: user.semester || 1,
              section: user.section, // NO FALLBACK - use actual data
              cgpa: user.cgpa || 0,
              completedCredits: user.completedCredits || 0,
              profile: user.preferences || {
                interests: [],
                careerGoals: [],
                preferredLearningStyle: ''
              }
            };
          });
        
        console.log('📊 [loadData] Converted students data:', studentsData.length);
        console.log('📊 [Initial Load] Section distribution:', 
          studentsData.reduce((acc: Record<string, number>, s) => {
            const section = s.section || 'undefined/null';
            acc[section] = (acc[section] || 0) + 1;
            return acc;
          }, {})
        );
        
        console.log('💾 [loadData] Saving students to state and localStorage...');
        setStudents(studentsData);
        localStorage.setItem('students', JSON.stringify(studentsData));
        console.log('✅ [loadData] Students saved! State should now have', studentsData.length, 'students');
      } else {
        console.warn('⚠️ [loadData] No users from backend, checking localStorage...');
        // Load from localStorage if backend fails
        const storedStudents = localStorage.getItem('students');
        if (storedStudents) {
          const parsed = JSON.parse(storedStudents);
          console.log('📦 [loadData] Loaded students from localStorage:', parsed.length);
          setStudents(parsed);
        } else {
          console.error('❌ [loadData] No students in localStorage either!');
          console.error('❌ [loadData] Students array will be EMPTY');
        }
      }

      // Process syllabi (already fetched in parallel above)
      if (backendSyllabi.length > 0) {
        console.log('✅ Loaded syllabi from MongoDB:', backendSyllabi.length);
        setSyllabi(backendSyllabi);
        localStorage.setItem('syllabi', JSON.stringify(backendSyllabi));
      } else {
        // Fallback to localStorage if API fails
        const storedSyllabi = localStorage.getItem('syllabi');
        if (storedSyllabi) {
          const parsedSyllabi = JSON.parse(storedSyllabi).map((syllabus: any) => ({
            ...syllabus,
            uploadedAt: new Date(syllabus.uploadedAt)
          }));
          setSyllabi(parsedSyllabi);
        }
      }

      // Fetch student selections from backend
      // ALWAYS fetch from backend when auth token exists (don't rely only on cache)
      const authToken = localStorage.getItem('authToken');
      console.log('🔑 [loadData] Checking auth token for student selections...');
      console.log('   - Token exists:', !!authToken);
      
      if (!authToken) {
        console.warn('⚠️ [loadData] No auth token - checking localStorage cache...');
        // Try to load from cache if no auth token
        const storedSelections = localStorage.getItem('studentElectives');
        if (storedSelections) {
          try {
            const parsedSelections = JSON.parse(storedSelections);
            console.log('📦 [loadData] Loaded from cache:', parsedSelections.length, 'selections');
            setStudentElectives(parsedSelections);
          } catch (error) {
            console.warn('⚠️ [loadData] Could not parse cached selections:', error);
          }
        } else {
          console.warn('❌ [loadData] No cached selections found');
        }
        setIsLoadingStudentData(false);
        return;
      }
      
      let isAdmin = false;
      
      try {
        // Decode JWT token (simple base64 decode of payload)
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        isAdmin = payload.role === 'admin';
        console.log('👤 [loadData] Decoded user role:', payload.role);
        console.log('   - Is Admin:', isAdmin);
        console.log('   - User ID:', payload.userId);
      } catch (error) {
        console.error('⚠️ [loadData] Could not decode auth token:', error);
        setIsLoadingStudentData(false);
        return;
      }
      
      console.log('🔄 [loadData] Fetching fresh student selections from backend...');
      console.log('   - isAdmin:', isAdmin);
      console.log('   - API endpoint:', isAdmin ? '/api/student/all-selections' : '/api/student/selections');
      
      // If admin, fetch ALL selections; if student, fetch only their selections
      const backendSelections = isAdmin 
        ? await fetchAllStudentSelections()
        : await fetchStudentSelections();
        
      console.log('📊 [loadData] Backend selections received:', backendSelections.length);
      if (backendSelections.length > 0) {
        console.log('   ✅ Sample selection:', {
          id: backendSelections[0].id,
          studentId: backendSelections[0].studentId,
          electiveId: backendSelections[0].electiveId,
          semester: backendSelections[0].semester
        });
      }
      
      if (backendSelections.length > 0) {
        console.log('✅ [loadData] Setting studentElectives in state:', backendSelections.length);
        setStudentElectives(backendSelections);
        // Save to localStorage for persistence
        localStorage.setItem('studentElectives', JSON.stringify(backendSelections));
        console.log('💾 [loadData] Saved selections to localStorage');
      } else {
        console.log('⚠️ [loadData] No selections from backend, checking localStorage...');
        // Fallback to localStorage if API fails or returns empty
        const storedSelections = localStorage.getItem('studentElectives');
        if (storedSelections) {
          const parsedSelections = JSON.parse(storedSelections);
          console.log('📦 [loadData] Loaded from localStorage:', parsedSelections.length);
          setStudentElectives(parsedSelections);
        } else {
          console.log('❌ [loadData] No selections found in localStorage either');
          console.log('❌ [loadData] studentElectives will remain empty: []');
        }
      }

      // Fetch feedback templates from backend
      const backendTemplates = await fetchFeedbackTemplates();
      if (backendTemplates.length > 0) {
        console.log('✅ Loaded feedback templates from backend:', backendTemplates.length);
        setFeedbackTemplates(backendTemplates);
        localStorage.setItem('feedbackTemplates', JSON.stringify(backendTemplates));
      } else {
        // Fallback to localStorage if API fails
        const storedTemplates = localStorage.getItem('feedbackTemplates');
        if (storedTemplates) {
          const parsedTemplates = JSON.parse(storedTemplates).map((template: FeedbackTemplate) => ({
            ...template,
            createdAt: new Date(template.createdAt)
          }));
          console.log('📦 Loaded feedback templates from localStorage:', parsedTemplates.length);
          setFeedbackTemplates(parsedTemplates);
        }
      }

      // Fetch feedback responses from backend
      const backendResponses = await fetchFeedbackResponses();
      if (backendResponses.length > 0) {
        console.log('✅ Loaded feedback responses from backend:', backendResponses.length);
        setFeedbackResponses(backendResponses);
        localStorage.setItem('feedbackResponses', JSON.stringify(backendResponses));
      } else {
        console.log('⚠️ No responses from backend, checking localStorage...');
        // Fallback to localStorage if API fails or returns empty
        const storedResponses = localStorage.getItem('feedbackResponses');
        if (storedResponses) {
          const parsedResponses = JSON.parse(storedResponses).map((response: any) => ({
            ...response,
            submittedAt: new Date(response.submittedAt)
          }));
          console.log('📦 Loaded feedback responses from localStorage:', parsedResponses.length);
          setFeedbackResponses(parsedResponses);
        } else {
          console.log('❌ No feedback responses found in localStorage either');
        }
      }
      
      // All student data loaded - set loading to false
      console.log('✅ Student data loading complete');
      setIsLoadingStudentData(false);
    };

    loadData().catch((error) => {
      console.error('❌ Error loading data:', error);
      setIsLoadingStudentData(false);
    });
    
    // Failsafe: Set loading to false after 5 seconds if data hasn't loaded
    const loadingTimeout = setTimeout(() => {
      console.log('⏱️ Loading timeout reached, forcing loading state to false');
      setIsLoadingStudentData(false);
    }, 5000);

    // Initialize other data from localStorage or use defaults
    const storedElectiveFeedbacks = localStorage.getItem('electiveFeedbacks');
    
    // Initialize admin-configured data
    const storedAdminDepartments = localStorage.getItem('adminDepartments');
    const storedAdminSections = localStorage.getItem('adminSections');
    const storedAdminSemesters = localStorage.getItem('adminSemesters');
    const storedTracks = localStorage.getItem('tracks');
    const storedAdminCategories = localStorage.getItem('adminCategories');
    
    // Initialize alert and feedback data
    const storedAlerts = localStorage.getItem('alertNotifications');
    const storedFeedbackTemplates = localStorage.getItem('feedbackTemplates');
    const storedFeedbackResponses = localStorage.getItem('feedbackResponses');
    const storedSyllabi = localStorage.getItem('syllabi');
    
    if (storedAdminDepartments) {
      const parsed = JSON.parse(storedAdminDepartments);
      if (parsed.length > 0) {
        setAdminDepartments(parsed);
      }
    }
    
    if (storedAdminSections) {
      const parsed = JSON.parse(storedAdminSections);
      if (parsed.length > 0) {
        setAdminSections(parsed);
      }
    }
    
    if (storedAdminSemesters) {
      const parsed = JSON.parse(storedAdminSemesters);
      if (parsed.length > 0) {
        setAdminSemesters(parsed);
      }
    }

    if (storedTracks) {
      setTracks(JSON.parse(storedTracks));
    } else {
      localStorage.setItem('tracks', JSON.stringify(initialTracks));
    }

    if (storedAdminCategories) {
      setAdminCategories(JSON.parse(storedAdminCategories));
    } else {
      const defaultCategories: string[] = ['Departmental', 'Open', 'Humanities'];
      setAdminCategories(defaultCategories);
      localStorage.setItem('adminCategories', JSON.stringify(defaultCategories));
    }

    if (storedElectiveFeedbacks) {
      setElectiveFeedbacks(JSON.parse(storedElectiveFeedbacks));
    }
    
    if (storedAlerts) {
      const parsedAlerts = JSON.parse(storedAlerts).map((alert: any) => ({
        ...alert,
        createdAt: new Date(alert.createdAt)
      }));
      setAlertNotifications(parsedAlerts);
    }
    
    if (storedFeedbackTemplates) {
      setFeedbackTemplates(JSON.parse(storedFeedbackTemplates));
    }
    
    if (storedFeedbackResponses) {
      const parsedResponses = JSON.parse(storedFeedbackResponses).map((response: any) => ({
        ...response,
        submittedAt: new Date(response.submittedAt)
      }));
      setFeedbackResponses(parsedResponses);
    }
    
    if (storedSyllabi) {
      const parsedSyllabi = JSON.parse(storedSyllabi).map((syllabus: any) => ({
        ...syllabus,
        uploadedAt: new Date(syllabus.uploadedAt)
      }));
      setSyllabi(parsedSyllabi);
    }
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  const addElective = async (elective: Omit<Elective, 'id'>): Promise<boolean> => {
    try {
      console.log('Adding elective:', elective);
      
      // Save to database via API
      const response = await fetch(`${getApiBaseUrl()}/electives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(elective)
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        
        const newElective = {
          ...data.elective,
          id: data.elective._id || data.elective.id
        };
        
        console.log('Mapped elective:', newElective);
        
        // Update local state immediately
        const updatedElectives = [...electives, newElective];
        setElectives(updatedElectives);
        localStorage.setItem('electives', JSON.stringify(updatedElectives));
        
        // Refresh data from backend to ensure consistency
        setTimeout(async () => {
          console.log('Refreshing electives...');
          await refreshElectives();
        }, 500);
        
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to save elective to database:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error adding elective:', error);
      // Fallback to local storage only
      const newElective = {
        ...elective,
        id: Date.now().toString()
      };
      const updatedElectives = [...electives, newElective];
      setElectives(updatedElectives);
      localStorage.setItem('electives', JSON.stringify(updatedElectives));
      return true;
    }
  };

  const updateElective = async (id: string, updates: Partial<Elective>): Promise<boolean> => {
    try {
      // Update in database via API
      const response = await fetch(`${getApiBaseUrl()}/electives/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        // Update local state
        const updatedElectives = electives.map(e => 
          e.id === id ? { ...e, ...updates } : e
        );
        setElectives(updatedElectives);
        localStorage.setItem('electives', JSON.stringify(updatedElectives));
        return true;
      } else {
        console.error('Failed to update elective in database');
        return false;
      }
    } catch (error) {
      console.error('Error updating elective:', error);
      // Fallback to local storage only
      const updatedElectives = electives.map(e => 
        e.id === id ? { ...e, ...updates } : e
      );
      setElectives(updatedElectives);
      localStorage.setItem('electives', JSON.stringify(updatedElectives));
      return true;
    }
  };

  const removeElective = async (studentElectiveId: string): Promise<boolean> => {
    try {
      // Remove from student electives
      const updatedStudentElectives = studentElectives.filter(se => se.id !== studentElectiveId);
      setStudentElectives(updatedStudentElectives);
      // Update localStorage
      localStorage.setItem('studentElectives', JSON.stringify(updatedStudentElectives));
      console.log('✅ Selection removed from state and localStorage');
      return true;
    } catch (error) {
      console.error('Error removing elective:', error);
      return false;
    }
  };

  const submitFeedback = async (studentElectiveId: string, feedback: object): Promise<boolean> => {
    try {
      // Update the student elective with feedback
      const updatedStudentElectives = studentElectives.map(se => 
        se.id === studentElectiveId 
          ? { 
              ...se, 
              feedback: {
                rating: (feedback as any).rating || se.feedback?.rating || 0,
                comment: (feedback as any).comment || se.feedback?.comment || '',
                difficulty: (feedback as any).difficulty || se.feedback?.difficulty || 'medium',
                recommendation: (feedback as any).recommendation || se.feedback?.recommendation || false
              }, 
              feedbackSubmitted: true 
            }
          : se
      );
      setStudentElectives(updatedStudentElectives);
      // Update localStorage
      localStorage.setItem('studentElectives', JSON.stringify(updatedStudentElectives));
      console.log('✅ Feedback saved to state and localStorage');
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  };

  const deleteElective = async (id: string): Promise<boolean> => {
    try {
      console.log('Deleting elective:', id);
      
      // Delete from database via API
      const response = await fetch(`${getApiBaseUrl()}/electives/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      console.log('Delete API response status:', response.status);
      
      if (response.ok) {
        // Update local state
        const updatedElectives = electives.filter(e => e.id !== id);
        setElectives(updatedElectives);
        localStorage.setItem('electives', JSON.stringify(updatedElectives));
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to delete elective:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error deleting elective:', error);
      return false;
    }
  };

  const clearElectiveEnrollment = async (id: string): Promise<boolean> => {
    try {
      console.log('Clearing enrollment for elective:', id);
      
      // Clear enrollment via API
      const response = await fetch(`${getApiBaseUrl()}/electives/${id}/clear-enrollment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      console.log('Clear enrollment API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Clear enrollment success:', data);
        
        // Update local state - set enrolledStudents to 0
        const updatedElectives = electives.map(e => 
          e.id === id ? { ...e, enrolledStudents: 0 } : e
        );
        setElectives(updatedElectives);
        localStorage.setItem('electives', JSON.stringify(updatedElectives));
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to clear enrollment:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error clearing enrollment:', error);
      return false;
    }
  };

  const selectElective = async (studentId: string, electiveId: string, semester: number): Promise<boolean> => {
    try {
      console.log('🎯 Selecting elective:', { studentId, electiveId, semester });
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No auth token found');
        return false;
      }

      console.log('📡 Sending selection request to backend...');
      const response = await fetch(`${getApiBaseUrl()}/electives/select/${electiveId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          semester
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Failed to select elective:', error);
        
        // Show user-friendly error message
        if (error.error === 'You have already selected this elective for this semester') {
          alert('You have already selected this elective for this semester.');
        } else {
          alert(error.error || 'Failed to select elective');
        }
        
        return false;
      }

      const data = await response.json();
      console.log('✅ Backend response:', data);
      
      if (data.success) {
        console.log('🔄 Selection saved to backend! Now refreshing selections from database...');
        
        // CRITICAL FIX: Refresh selections from backend to ensure state is in sync
        const updatedSelections = await fetchStudentSelections();
        console.log('� Refreshed selections from backend:', updatedSelections.length);
        
        if (updatedSelections.length > 0) {
          setStudentElectives(updatedSelections);
          localStorage.setItem('studentElectives', JSON.stringify(updatedSelections));
          console.log('✅ State updated with fresh data from MongoDB!');
        } else {
          console.warn('⚠️ No selections returned after refresh, keeping current state');
        }
        
        // Refresh electives to get updated enrollment counts
        console.log('🔄 Refreshing electives list...');
        await fetchElectives();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error selecting elective:', error);
      return false;
    }
  };

  const getStudentElectives = (studentId: string): StudentElective[] => {
    console.log('🔍 [getStudentElectives] Getting electives for student:', studentId);
    console.log('   📊 Total studentElectives in state:', studentElectives.length);
    
    if (studentElectives.length === 0) {
      console.warn('   ⚠️ studentElectives array is EMPTY!');
      console.warn('   💡 Check if data loaded from backend or localStorage');
      console.warn('   � Check browser console for auth token errors');
      return [];
    }
    
    // Get all unique student IDs
    const uniqueStudentIds = [...new Set(studentElectives.map(se => se.studentId))];
    console.log('   📋 Unique student IDs in electives (' + uniqueStudentIds.length + '):', uniqueStudentIds.slice(0, 5));
    console.log('   🎯 Looking for student ID:', studentId, '(type:', typeof studentId + ')');
    
    // Check if the requested student ID exists in the array
    const exists = uniqueStudentIds.includes(studentId);
    console.log('   🔎 Student ID exists in array:', exists);
    
    if (!exists) {
      console.warn('   ⚠️ Student ID NOT FOUND in studentElectives array');
      console.warn('   💡 This student may not have selected any electives yet');
      
      // Log type comparison
      const firstStudentId = studentElectives[0]?.studentId;
      if (firstStudentId) {
        console.log('   🔍 Type comparison:');
        console.log('      - Requested ID type:', typeof studentId);
        console.log('      - Stored ID type:', typeof firstStudentId);
        console.log('      - Requested ID:', studentId);
        console.log('      - First stored ID:', firstStudentId);
        console.log('      - Are they equal?:', studentId === firstStudentId);
      }
    }
    
    const filtered = studentElectives.filter(se => se.studentId === studentId);
    console.log('   ✅ Filtered electives for this student:', filtered.length);
    
    if (filtered.length > 0) {
      console.log('   📝 First selection:', {
        id: filtered[0].id,
        electiveId: filtered[0].electiveId,
        track: filtered[0].track,
        semester: filtered[0].semester
      });
    }
    
    return filtered;
  };

  const getRecommendations = (studentId: string, semester: number): Elective[] => {
    const userElectives = getStudentElectives(studentId);
    const completedTracks = userElectives.map(se => se.track);
    const completedElectiveIds = userElectives.map(se => se.electiveId);
    
    // Get electives for current semester that haven't been taken
    return electives.filter(e => 
      e.semester === semester && 
      !completedElectiveIds.includes(e.id) &&
      (!e.prerequisites || e.prerequisites.every(prereq => completedElectiveIds.includes(prereq)))
    ).sort((a, b) => {
      // Prioritize electives in Tracks the student has already explored
      const aInProgress = completedTracks.includes(a.track);
      const bInProgress = completedTracks.includes(b.track);
      
      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;
      return 0;
    });
  };

  const getElectivesByDepartment = (department: string): Elective[] => {
    return electives.filter(e => e.department === department);
  };

  const getTracksByDepartment = (department: string): Track[] => {
    return tracks.filter(d => d.department === department);
  };

  const getTracksByCategory = (category: string): Track[] => {
    return tracks.filter(t => t.category === category);
  };

  const getElectivesByCategory = (category: 'Humanities' | 'Departmental' | 'Open Elective'): Elective[] => {
    const mappedCategory = category === 'Open Elective' ? 'Open' : category;
    return electives.filter(e => e.category.includes(mappedCategory));
  };

  const getElectivesByCategoryAndDepartment = (category: string, department?: string, semester?: number): Elective[] => {
    const mappedCategory = category === 'Open Elective' ? 'Open' : category as 'Humanities' | 'Departmental' | 'Open';
    return electives.filter(e => {
      let categoryMatch = false;
      
      if (mappedCategory === 'Open') {
        // For Open electives, check if the user's department is in eligibleDepartments
        // or if no eligibleDepartments is specified (backward compatibility)
        const hasEligibleDepts = e.eligibleDepartments && e.eligibleDepartments.length > 0;
        const isDeptEligible = department && hasEligibleDepts ? e.eligibleDepartments!.includes(department) : true;
        categoryMatch = e.category.includes(mappedCategory) && (!hasEligibleDepts || isDeptEligible);
      } else if (mappedCategory === 'Departmental') {
        // For Departmental electives, must match user's department
        categoryMatch = e.category.includes(mappedCategory) && e.department === department;
      } else {
        // For Humanities and other categories
        categoryMatch = e.category.includes(mappedCategory);
      }
      
      const semesterMatch = semester ? e.semester === semester : true;
      return categoryMatch && semesterMatch;
    });
  };

  // New functions for additional features
  const setElectiveDeadline = (electiveId: string, deadline: string) => {
    setElectives(prev => prev.map(e => 
      e.id === electiveId ? { ...e, selectionDeadline: deadline } : e
    ));
    localStorage.setItem('electives', JSON.stringify(electives));
  };

  const getElectiveDeadline = (electiveId: string): string | null => {
    const elective = electives.find(e => e.id === electiveId);
    // Check both deadline and selectionDeadline for backward compatibility
    return elective?.deadline || elective?.selectionDeadline || null;
  };

  const isElectiveSelectionOpen = (electiveId: string): boolean => {
    const deadline = getElectiveDeadline(electiveId);
    if (!deadline) return true; // No deadline set means always open
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    // Compare dates (deadline is inclusive - can select until end of deadline day)
    return now <= deadlineDate;
  };

  // Get available departments from admin-configured data first, then fallback to electives and students data
  const getAvailableDepartments = (): string[] => {
    if (adminDepartments.length > 0) {
      return adminDepartments.sort();
    }
    
    const departmentsFromElectives = [...new Set(electives.map(e => e.department))];
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const departmentsFromStudents = [...new Set(users.filter((u: any) => u.role === 'student').map((s: any) => s.department))] as string[];
    const allDepartments = [...new Set([...departmentsFromElectives, ...departmentsFromStudents])] as string[];
    return allDepartments.filter((dept: string) => dept && dept.trim() !== '').sort();
  };

  // Get available sections from admin-configured data first, then fallback to students data
  const getAvailableSections = (): string[] => {
    console.log('🔍 [getAvailableSections] adminSections:', adminSections);
    
    if (adminSections.length > 0) {
      console.log('✅ [getAvailableSections] Using admin-configured sections:', adminSections);
      return adminSections.sort();
    }
    
    // Get sections from the students state (not localStorage users)
    console.log('📊 [getAvailableSections] Getting sections from students state...');
    console.log('📊 [getAvailableSections] Total students:', students.length);
    
    const sectionsFromStudents = [...new Set(students.map((s: any) => s.section))].filter(Boolean) as string[];
    console.log('📊 [getAvailableSections] Sections from students:', sectionsFromStudents);
    
    if (sectionsFromStudents.length > 0) {
      return sectionsFromStudents.sort();
    }
    
    // Fallback to localStorage users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const sections = [...new Set(users.filter((u: any) => u.role === 'student').map((s: any) => s.section))].filter(Boolean) as string[];
    console.log('📊 [getAvailableSections] Sections from localStorage users:', sections);
    
    return sections.filter((section: string) => section && section.trim() !== '').sort();
  };

  // Get available semesters from admin-configured data first, then fallback to electives data
  const getAvailableSemesters = (): number[] => {
    if (adminSemesters.length > 0) {
      return adminSemesters.sort((a, b) => a - b);
    }
    
    const semesters = [...new Set(electives.map(e => e.semester))];
    return semesters.filter(sem => sem > 0).sort((a, b) => a - b);
  };

  // Admin management functions for departments
  const addDepartment = async (department: string): Promise<boolean> => {
    if (!department.trim() || adminDepartments.includes(department)) {
      return false;
    }
    const updatedDepartments = [...adminDepartments, department].sort();
    setAdminDepartments(updatedDepartments);
    localStorage.setItem('adminDepartments', JSON.stringify(updatedDepartments));
    
    // Sync with database
    try {
      await systemConfigApi.updateConfig({ departments: updatedDepartments });
      console.log('✅ Department synced to database');
    } catch (error) {
      console.warn('⚠️ Could not sync department to database:', error);
    }
    
    return true;
  };

  const removeDepartment = async (department: string): Promise<boolean> => {
    const updatedDepartments = adminDepartments.filter(d => d !== department);
    setAdminDepartments(updatedDepartments);
    localStorage.setItem('adminDepartments', JSON.stringify(updatedDepartments));
    
    // Sync with database
    try {
      await systemConfigApi.updateConfig({ departments: updatedDepartments });
      console.log('✅ Department removal synced to database');
    } catch (error) {
      console.warn('⚠️ Could not sync department removal to database:', error);
    }
    
    return true;
  };

  // Admin management functions for sections
  const addSection = async (section: string): Promise<boolean> => {
    if (!section.trim() || adminSections.includes(section)) {
      return false;
    }
    const updatedSections = [...adminSections, section].sort();
    setAdminSections(updatedSections);
    localStorage.setItem('adminSections', JSON.stringify(updatedSections));
    
    // Sync with database
    try {
      await systemConfigApi.updateConfig({ sections: updatedSections });
      console.log('✅ Section synced to database');
    } catch (error) {
      console.warn('⚠️ Could not sync section to database:', error);
    }
    
    return true;
  };

  const removeSection = async (section: string): Promise<boolean> => {
    const updatedSections = adminSections.filter(s => s !== section);
    setAdminSections(updatedSections);
    localStorage.setItem('adminSections', JSON.stringify(updatedSections));
    
    // Sync with database
    try {
      await systemConfigApi.updateConfig({ sections: updatedSections });
      console.log('✅ Section removal synced to database');
    } catch (error) {
      console.warn('⚠️ Could not sync section removal to database:', error);
    }
    
    return true;
  };

  // Admin management functions for semesters
  const addSemester = async (semester: number): Promise<boolean> => {
    if (semester <= 0 || adminSemesters.includes(semester)) {
      return false;
    }
    const updatedSemesters = [...adminSemesters, semester].sort((a, b) => a - b);
    setAdminSemesters(updatedSemesters);
    localStorage.setItem('adminSemesters', JSON.stringify(updatedSemesters));
    
    // Sync with database
    try {
      await systemConfigApi.updateConfig({ semesters: updatedSemesters });
      console.log('✅ Semester synced to database');
    } catch (error) {
      console.warn('⚠️ Could not sync semester to database:', error);
    }
    
    return true;
  };

  const removeSemester = async (semester: number): Promise<boolean> => {
    const updatedSemesters = adminSemesters.filter(s => s !== semester);
    setAdminSemesters(updatedSemesters);
    localStorage.setItem('adminSemesters', JSON.stringify(updatedSemesters));
    
    // Sync with database
    try {
      await systemConfigApi.updateConfig({ semesters: updatedSemesters });
      console.log('✅ Semester removal synced to database');
    } catch (error) {
      console.warn('⚠️ Could not sync semester removal to database:', error);
    }
    
    return true;
  };

  // Admin-configured categories state
  const [adminCategories, setAdminCategories] = useState<string[]>([
    'Departmental', 'Open', 'Humanities'
  ]);

  // Track management functions
  const addTrack = async (track: Omit<Track, 'id'>): Promise<boolean> => {
    if (!track.name.trim() || tracks.some(t => t.name === track.name)) {
      return false;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          name: track.name,
          department: track.department,
          category: track.category
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add track');
      }

      const data = await response.json();
      const newTrack: Track = {
        id: data.track._id,
        name: data.track.name,
        department: data.track.department,
        category: data.track.category,
        color: track.color || '#3B82F6',
        suggestedElectives: [],
        prerequisites: [],
        careerOutcomes: [],
        estimatedHours: 0
      };
      
      const updatedTracks = [...tracks, newTrack];
      setTracks(updatedTracks);
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      return true;
    } catch (error) {
      console.error('Error adding track:', error);
      return false;
    }
  };

  const updateTrack = async (id: string, updates: Partial<Track>): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tracks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          name: updates.name,
          department: updates.department,
          category: updates.category
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update track');
      }

      const data = await response.json();
      const updatedTracks = tracks.map(track => 
        track.id === id ? { 
          ...track,
          ...updates,
          id: data.track._id,
          name: data.track.name,
          department: data.track.department,
          category: data.track.category,
          description: data.track.description
        } : track
      );
      setTracks(updatedTracks);
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      return true;
    } catch (error) {
      console.error('Error updating track:', error);
      return false;
    }
  };

  const removeTrack = async (id: string): Promise<boolean> => {
    // Check if any electives are using this track
    const trackInUse = electives.some(e => e.track === tracks.find(t => t.id === id)?.name);
    if (trackInUse) {
      return false; // Cannot remove track that's in use
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tracks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete track');
      }

      const updatedTracks = tracks.filter(t => t.id !== id);
      setTracks(updatedTracks);
      localStorage.setItem('tracks', JSON.stringify(updatedTracks));
      return true;
    } catch (error) {
      console.error('Error removing track:', error);
      return false;
    }
  };

  // Category management functions
  const getAvailableCategories = (): string[] => {
    console.log('📋 [getAvailableCategories] Called');
    console.log('   adminCategories from state:', adminCategories);
    console.log('   adminCategories count:', adminCategories.length);
    
    // Return adminCategories from system configuration (loaded from database)
    // This is the source of truth for available categories
    const categories = [...adminCategories];
    
    console.log('   ✅ Returning categories:', categories);
    return categories;
  };

  const addCategory = async (category: string): Promise<boolean> => {
    if (adminCategories.includes(category)) {
      return false;
    }
    
    const updatedCategories = [...adminCategories, category];
    
    try {
      // Save to database via API
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/system-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          electiveCategories: updatedCategories
        })
      });

      if (response.ok) {
        console.log('✅ Category saved to database:', category);
        setAdminCategories(updatedCategories);
        localStorage.setItem('adminCategories', JSON.stringify(updatedCategories));
        return true;
      } else {
        console.error('❌ Failed to save category to database');
        return false;
      }
    } catch (error) {
      console.error('Error saving category:', error);
      // Fallback to localStorage only
      setAdminCategories(updatedCategories);
      localStorage.setItem('adminCategories', JSON.stringify(updatedCategories));
      return true;
    }
  };

  const removeCategory = async (category: string): Promise<boolean> => {
    // Check if any tracks or electives are using this category
    const categoryInUse = tracks.some(t => t.category === category) || 
                          electives.some(e => e.category.includes(category as any));
    if (categoryInUse) {
      return false; // Cannot remove category that's in use
    }
    
    const updatedCategories = adminCategories.filter(c => c !== category);
    
    try {
      // Save to database via API
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/system-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          electiveCategories: updatedCategories
        })
      });

      if (response.ok) {
        console.log('✅ Category removed from database:', category);
        setAdminCategories(updatedCategories);
        localStorage.setItem('adminCategories', JSON.stringify(updatedCategories));
        return true;
      } else {
        console.error('❌ Failed to remove category from database');
        return false;
      }
    } catch (error) {
      console.error('Error removing category:', error);
      // Fallback to localStorage only
      setAdminCategories(updatedCategories);
      localStorage.setItem('adminCategories', JSON.stringify(updatedCategories));
      return true;
    }
  };

  const addElectiveFeedback = (feedback: Omit<ElectiveFeedbackForm, 'id'>) => {
    const newFeedback: ElectiveFeedbackForm = {
      ...feedback,
      id: Date.now().toString()
    };
    setElectiveFeedbacks(prev => [...prev, newFeedback]);
    localStorage.setItem('electiveFeedbacks', JSON.stringify([...electiveFeedbacks, newFeedback]));
  };

  const getFutureElectives = (currentElectiveId: string): Elective[] => {
    const currentElective = electives.find(e => e.id === currentElectiveId);
    if (!currentElective || !currentElective.futureOpportunities) return [];
    
    return electives.filter(e => currentElective.futureOpportunities?.includes(e.id));
  };

  const exportDataAsExcel = () => {
    import('xlsx').then((XLSX) => {
      // Prepare data for Excel export
      const electiveData = electives.map(e => ({
        'Elective Name': e.name,
        'Code': e.code || 'No code',
        'Semester': e.semester,
        'Track': e.track,
        'Department': e.department,
        'Category': e.category,
        'Elective Category': e.electiveCategory,
        'Credits': e.credits,
        'Description': e.description,
        'Prerequisites': e.prerequisites?.length || 0,
        'Selection Deadline': e.selectionDeadline ? new Date(e.selectionDeadline).toLocaleDateString() : 'No deadline'
      }));

      const studentElectiveData = studentElectives.map(se => {
        const elective = electives.find(e => e.id === se.electiveId);
        return {
          'Roll Number': se.rollNumber || 'Not Available',
          'Student ID': se.studentId,
          'Student Name': se.studentName || 'Unknown',
          'Elective Name': elective?.name || 'Unknown',
          'Code': elective?.code || 'Unknown',
          'Semester': se.semester,
          'Track': se.track,
          'Department': elective?.department || 'Unknown',
          'Credits': elective?.credits || 0,
          'Enrolled Date': se.enrolledAt ? new Date(se.enrolledAt).toLocaleDateString() : 'Unknown'
        };
      });

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Add electives sheet
      const electiveWs = XLSX.utils.json_to_sheet(electiveData);
      XLSX.utils.book_append_sheet(wb, electiveWs, 'Electives');
      
      // Add student selections sheet
      const studentWs = XLSX.utils.json_to_sheet(studentElectiveData);
      XLSX.utils.book_append_sheet(wb, studentWs, 'Student Selections');

      // Download file
      XLSX.writeFile(wb, `elective_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };

  const exportDataAsPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        
        // Title
        doc.setFontSize(20);
        doc.text('Elective Selection Report', 20, 20);
        
        // Date
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        
        // Student Selections Table
        doc.setFontSize(16);
        doc.text('Student Elective Selections', 20, 50);
        
        const studentTableData = studentElectives.map(se => {
          const elective = electives.find(e => e.id === se.electiveId);
          return [
            se.rollNumber || 'N/A',
            se.studentId,
            se.studentName || 'Unknown',
            elective?.name || 'Unknown',
            elective?.code || 'Unknown',
            se.semester.toString(),
            se.track,
            elective?.department || 'Unknown',
            (elective?.credits || 0).toString(),
            se.enrolledAt ? new Date(se.enrolledAt).toLocaleDateString() : se.dateSelected
          ];
        });

        doc.autoTable({
          head: [['Roll No.', 'Student ID', 'Student Name', 'Elective Name', 'Code', 'Semester', 'Track', 'Department', 'Credits', 'Date']],
          body: studentTableData,
          startY: 60,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 98, 255] }
        });

        // Electives Summary
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(16);
        doc.text('Electives Summary', 20, finalY);
        
        const electiveTableData = electives.map(e => [
          e.name,
          e.code,
          e.semester.toString(),
          e.track,
          e.department,
          e.electiveCategory,
          e.credits.toString()
        ]);

        doc.autoTable({
          head: [['Name', 'Code', 'Semester', 'Track', 'Department', 'Category', 'Credits']],
          body: electiveTableData,
          startY: finalY + 10,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [34, 197, 94] }
        });

        // Save the PDF
        doc.save(`elective_report_${new Date().toISOString().split('T')[0]}.pdf`);
      });
    });
  };

  const exportDataAsCSV = (dataType: 'students' | 'electives' | 'student-electives'): void => {
    let csvContent = '';
    let filename = '';

    switch (dataType) {
      case 'students':
        csvContent = 'ID,Name,Roll Number,Email,Department,Semester,Year of Study\n';
        csvContent += students.map(s => 
          `${s.id},"${s.name}","${s.rollNumber}","${s.email}","${s.department}",${s.semester},${s.yearOfStudy}`
        ).join('\n');
        filename = `students_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'electives':
        csvContent = 'ID,Name,Code,Credits,Department,Semester,Category,Track,Description\n';
        csvContent += electives.map(e => 
          `${e.id},"${e.name}","${e.code || 'No code'}",${e.credits},"${e.department}",${e.semester},"${e.category}","${e.track}","${e.description}"`
        ).join('\n');
        filename = `electives_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'student-electives':
        csvContent = 'Student ID,Student Name,Roll Number,Elective ID,Elective Name,Semester,Credits\n';
        csvContent += studentElectives.map(se => {
          const student = students.find(s => s.id === se.studentId);
          const elective = electives.find(e => e.id === se.electiveId);
          return `${se.studentId},"${student?.name || 'Unknown'}","${student?.rollNumber || 'Unknown'}",${se.electiveId},"${elective?.name || 'Unknown'}",${se.semester},${elective?.credits || 0}`;
        }).join('\n');
        filename = `student_electives_${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportDataAsTXT = (dataType: 'students' | 'electives' | 'student-electives'): void => {
    let txtContent = '';
    let filename = '';

    switch (dataType) {
      case 'students':
        txtContent = 'STUDENTS REPORT\n';
        txtContent += '===============\n\n';
        students.forEach(s => {
          txtContent += `Name: ${s.name}\n`;
          txtContent += `Roll Number: ${s.rollNumber}\n`;
          txtContent += `Email: ${s.email}\n`;
          txtContent += `Department: ${s.department}\n`;
          txtContent += `Semester: ${s.semester}\n`;
          txtContent += `Year of Study: ${s.yearOfStudy}\n`;
          txtContent += '---\n';
        });
        filename = `students_${new Date().toISOString().split('T')[0]}.txt`;
        break;
        
      case 'electives':
        txtContent = 'ELECTIVES REPORT\n';
        txtContent += '================\n\n';
        electives.forEach(e => {
          txtContent += `Name: ${e.name}\n`;
          txtContent += `Code: ${e.code || 'No code'}\n`;
          txtContent += `Credits: ${e.credits}\n`;
          txtContent += `Department: ${e.department}\n`;
          txtContent += `Semester: ${e.semester}\n`;
          txtContent += `Category: ${e.category}\n`;
          txtContent += `Track: ${e.track}\n`;
          txtContent += `Description: ${e.description}\n`;
          txtContent += '---\n';
        });
        filename = `electives_${new Date().toISOString().split('T')[0]}.txt`;
        break;
        
      case 'student-electives':
        txtContent = 'STUDENT ELECTIVES REPORT\n';
        txtContent += '========================\n\n';
        studentElectives.forEach(se => {
          const student = students.find(s => s.id === se.studentId);
          const elective = electives.find(e => e.id === se.electiveId);
          txtContent += `Student: ${student?.name || 'Unknown'} (${student?.rollNumber || 'Unknown'})\n`;
          txtContent += `Elective: ${elective?.name || 'Unknown'} (${elective?.code || 'Unknown'})\n`;
          txtContent += `Semester: ${se.semester}\n`;
          txtContent += `Credits: ${elective?.credits || 0}\n`;
          txtContent += '---\n';
        });
        filename = `student_electives_${new Date().toISOString().split('T')[0]}.txt`;
        break;
    }

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getElectiveRecommendation = (
    studentId: string, 
    userPreferences: { interests: string[]; careerGoals: string; difficulty: string }
  ): Elective[] => {
    const studentElectiveHistory = getStudentElectives(studentId);
    const completedElectiveIds = studentElectiveHistory.map(se => se.electiveId);
    
    return electives
      .filter(e => !completedElectiveIds.includes(e.id))
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        // Score based on interests (Track matching)
        if (userPreferences.interests.includes(a.track)) scoreA += 3;
        if (userPreferences.interests.includes(b.track)) scoreB += 3;
        
        // Score based on career goals (simple keyword matching)
        if (a.description.toLowerCase().includes(userPreferences.careerGoals.toLowerCase())) scoreA += 2;
        if (b.description.toLowerCase().includes(userPreferences.careerGoals.toLowerCase())) scoreB += 2;
        
        // Score based on difficulty preference
        if (userPreferences.difficulty === 'easy' && a.category.includes('Humanities')) scoreA += 1;
        if (userPreferences.difficulty === 'easy' && b.category.includes('Humanities')) scoreB += 1;
        if (userPreferences.difficulty === 'challenging' && a.category.includes('Departmental')) scoreA += 1;
        if (userPreferences.difficulty === 'challenging' && b.category.includes('Departmental')) scoreB += 1;
        
        return scoreB - scoreA; // Higher score first
      })
      .slice(0, 5); // Return top 5 recommendations
  };

  // Alert notification functions
  const createAlert = (alert: Omit<AlertNotification, 'id' | 'createdAt'>): void => {
    const newAlert: AlertNotification = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    const updatedAlerts = [...alertNotifications, newAlert];
    setAlertNotifications(updatedAlerts);
    localStorage.setItem('alertNotifications', JSON.stringify(updatedAlerts));
  };

  const getActiveAlerts = (department?: string, semester?: number): AlertNotification[] => {
    return alertNotifications.filter(alert => {
      if (department && alert.targetDepartment && alert.targetDepartment !== department) {
        return false;
      }
      if (semester && alert.targetSemester && alert.targetSemester !== semester) {
        return false;
      }
      return true;
    });
  };

  const deleteAlert = (alertId: string): void => {
    const updatedAlerts = alertNotifications.filter(alert => alert.id !== alertId);
    setAlertNotifications(updatedAlerts);
    localStorage.setItem('alertNotifications', JSON.stringify(updatedAlerts));
  };

  // Feedback template functions
  const createFeedbackTemplate = async (template: Omit<FeedbackTemplate, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Creating feedback template in database...', template);
      
      const response = await fetch(`${getApiBaseUrl()}/feedback/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(template)
      });
      
      const data = await response.json();
      console.log('Response from server:', data);
      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);
      
      if (!response.ok) {
        const errorMsg = `${data.error || 'Server error'}\nDetails: ${data.details || 'No details'}\nStatus: ${response.status}`;
        console.error('❌ Server error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (data.success && data.template) {
        const newTemplate: FeedbackTemplate = {
          ...data.template,
          id: data.template._id || data.template.id,
          createdAt: new Date(data.template.createdAt)
        };
        
        const updatedTemplates = [...feedbackTemplates, newTemplate];
        setFeedbackTemplates(updatedTemplates);
        localStorage.setItem('feedbackTemplates', JSON.stringify(updatedTemplates));
        console.log('✅ Feedback template created successfully:', newTemplate.id);
      } else {
        throw new Error(data.message || data.error || 'Failed to create feedback template');
      }
    } catch (error) {
      console.error('Failed to create feedback template:', error);
      throw error; // Re-throw to let caller handle it
    }
  };

  const updateFeedbackTemplate = async (templateId: string, updates: Partial<FeedbackTemplate>): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Updating feedback template in database:', templateId);
      
      const response = await fetch(`${getApiBaseUrl()}/feedback/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success && data.template) {
        const updatedTemplate: FeedbackTemplate = {
          ...data.template,
          id: data.template._id || data.template.id,
          createdAt: new Date(data.template.createdAt)
        };
        
        const updatedTemplates = feedbackTemplates.map(template =>
          template.id === templateId ? updatedTemplate : template
        );
        setFeedbackTemplates(updatedTemplates);
        localStorage.setItem('feedbackTemplates', JSON.stringify(updatedTemplates));
        console.log('✅ Feedback template updated successfully:', templateId);
      } else {
        console.error('Failed to update feedback template:', data.message);
      }
    } catch (error) {
      console.error('Error updating feedback template:', error);
      // Fallback to localStorage only
      const updatedTemplates = feedbackTemplates.map(template =>
        template.id === templateId ? { ...template, ...updates } : template
      );
      setFeedbackTemplates(updatedTemplates);
      localStorage.setItem('feedbackTemplates', JSON.stringify(updatedTemplates));
    }
  };

  const deleteFeedbackTemplate = async (templateId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Deleting feedback template from database:', templateId);
      
      const response = await fetch(`${getApiBaseUrl()}/feedback/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedTemplates = feedbackTemplates.filter(template => template.id !== templateId);
        setFeedbackTemplates(updatedTemplates);
        localStorage.setItem('feedbackTemplates', JSON.stringify(updatedTemplates));
        console.log('✅ Feedback template deleted successfully:', templateId);
      } else {
        console.error('Failed to delete feedback template:', data.message);
      }
    } catch (error) {
      console.error('Error deleting feedback template:', error);
      // Fallback to localStorage only
      const updatedTemplates = feedbackTemplates.filter(template => template.id !== templateId);
      setFeedbackTemplates(updatedTemplates);
      localStorage.setItem('feedbackTemplates', JSON.stringify(updatedTemplates));
    }
  };

  const getActiveFeedbackTemplates = (category?: string): FeedbackTemplate[] => {
    return feedbackTemplates.filter(template => {
      if (!template.isActive) return false;
      if (category && template.targetCategory && template.targetCategory !== category) {
        return false;
      }
      return true;
    });
  };

  // Feedback response functions
  const submitFeedbackResponse = async (response: Omit<FeedbackResponse, 'id' | 'submittedAt'>): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Submitting feedback response to database...');
      
      const submitResponse = await fetch(`${getApiBaseUrl()}/feedback/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(response)
      });
      
      const data = await submitResponse.json();
      
      if (data.success && data.response) {
        const newResponse: FeedbackResponse = {
          ...data.response,
          id: data.response._id || data.response.id,
          submittedAt: new Date(data.response.submittedAt)
        };
        
        const updatedResponses = [...feedbackResponses, newResponse];
        setFeedbackResponses(updatedResponses);
        localStorage.setItem('feedbackResponses', JSON.stringify(updatedResponses));
        console.log('✅ Feedback response submitted successfully:', newResponse.id);
      } else {
        console.error('Failed to submit feedback response:', data.message);
        // Still save locally even if API fails
        const newResponse: FeedbackResponse = {
          ...response,
          id: Date.now().toString(),
          submittedAt: new Date()
        };
        const updatedResponses = [...feedbackResponses, newResponse];
        setFeedbackResponses(updatedResponses);
        localStorage.setItem('feedbackResponses', JSON.stringify(updatedResponses));
      }
    } catch (error) {
      console.error('Error submitting feedback response:', error);
      // Fallback to localStorage only
      const newResponse: FeedbackResponse = {
        ...response,
        id: Date.now().toString(),
        submittedAt: new Date()
      };
      const updatedResponses = [...feedbackResponses, newResponse];
      setFeedbackResponses(updatedResponses);
      localStorage.setItem('feedbackResponses', JSON.stringify(updatedResponses));
    }
  };

  const getFeedbackResponses = (templateId?: string, studentId?: string): FeedbackResponse[] => {
    return feedbackResponses.filter(response => {
      if (templateId && response.templateId !== templateId) return false;
      if (studentId && response.studentId !== studentId) return false;
      return true;
    });
  };

  const getStudentSubmittedTemplates = (studentId: string): string[] => {
    return feedbackResponses
      .filter(response => response.studentId === studentId)
      .map(response => response.templateId);
  };

  const deleteFeedbackResponse = async (responseId: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting feedback response:', responseId);
      
      // Delete from database via API
      const response = await fetch(`${getApiBaseUrl()}/feedback/responses/${responseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      console.log('Delete feedback response API status:', response.status);
      
      if (response.ok) {
        // Update local state
        const updatedResponses = feedbackResponses.filter(r => r.id !== responseId);
        setFeedbackResponses(updatedResponses);
        localStorage.setItem('feedbackResponses', JSON.stringify(updatedResponses));
        console.log('✅ Feedback response deleted successfully');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Failed to delete feedback response:', errorData);
      }
    } catch (error) {
      console.error('❌ Error deleting feedback response:', error);
    }
  };

  // Get current enrollment count for an elective
  const getElectiveEnrollmentCount = (electiveId: string): number => {
    return studentElectives.filter(se => se.electiveId === electiveId).length;
  };

  // Check if an elective is available for enrollment
  const isElectiveAvailable = (electiveId: string): { available: boolean; reason?: string } => {
    const elective = electives.find(e => e.id === electiveId);
    if (!elective) return { available: false, reason: 'Elective not found' };

    const currentEnrollment = getElectiveEnrollmentCount(electiveId);
    
    if (elective.maxEnrollment && currentEnrollment >= elective.maxEnrollment) {
      return { available: false, reason: 'Maximum enrollment reached' };
    }

    return { available: true };
  };

  // Syllabus management functions
  const uploadSyllabus = async (
    electiveId: string, 
    file: File, 
    description: string,
    targetDepartment?: string,
    targetSemester?: number
  ): Promise<boolean> => {
    try {
      // Convert PDF to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const syllabusData: Omit<SyllabusData, 'id' | 'uploadedAt'> = {
        electiveId,
        title: `${file.name} - Syllabus`,
        description,
        pdfData: base64Data,
        pdfFileName: file.name,
        uploadedBy: 'admin', // In real app, get from auth context
        academicYear: '2024-25',
        semester: targetSemester || (new Date().getMonth() >= 6 ? 1 : 2),
        version: 1,
        isActive: true,
        targetDepartment, // Add department targeting
        targetSemester // Add semester targeting
      };

      // Upload to MongoDB via API
      const uploadedSyllabus = await syllabusApi.uploadSyllabus(syllabusData);
      
      // Convert uploadedAt to Date object
      const newSyllabus: Syllabus = {
        ...uploadedSyllabus,
        uploadedAt: new Date(uploadedSyllabus.uploadedAt)
      };

      // Don't deactivate previous versions, allow multiple files
      const finalSyllabi = [...syllabi, newSyllabus];
      setSyllabi(finalSyllabi);
      localStorage.setItem('syllabi', JSON.stringify(finalSyllabi));
      
      console.log('Syllabus uploaded to MongoDB successfully:', uploadedSyllabus);
      return true;
    } catch (error) {
      console.error('Error uploading syllabus to MongoDB:', error);
      return false;
    }
  };

  const getSyllabus = (electiveId: string): Syllabus | null => {
    console.log('🔍 Getting syllabus for elective:', electiveId);
    console.log('   Available syllabi count:', syllabi.length);
    console.log('   All elective IDs:', syllabi.map(s => s.electiveId));
    
    const found = syllabi.find(s => s.electiveId === electiveId && s.isActive);
    console.log('   Found syllabus:', !!found, found ? `(${found.pdfFileName})` : 'Not found');
    
    return found || null;
  };

  const getAllSyllabi = (): Syllabus[] => {
    const activeSyllabi = syllabi.filter(s => s.isActive);
    console.log('📚 Getting all syllabi:', activeSyllabi.length, 'active out of', syllabi.length, 'total');
    return activeSyllabi;
  };

  const updateSyllabus = async (syllabusId: string, updates: Partial<Syllabus>): Promise<boolean> => {
    try {
      const updatedSyllabi = syllabi.map(s => 
        s.id === syllabusId ? { ...s, ...updates } : s
      );
      setSyllabi(updatedSyllabi);
      localStorage.setItem('syllabi', JSON.stringify(updatedSyllabi));
      return true;
    } catch (error) {
      console.error('Error updating syllabus:', error);
      return false;
    }
  };

  const deleteSyllabus = async (syllabusId: string): Promise<boolean> => {
    try {
      // Delete from MongoDB via API
      const success = await syllabusApi.deleteSyllabus(syllabusId);
      
      if (success) {
        // Update local state
        const updatedSyllabi = syllabi.filter(s => s.id !== syllabusId);
        setSyllabi(updatedSyllabi);
        localStorage.setItem('syllabi', JSON.stringify(updatedSyllabi));
        console.log('Syllabus deleted from MongoDB successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting syllabus from MongoDB:', error);
      return false;
    }
  };

  const refreshElectives = async (): Promise<boolean> => {
    try {
      const refreshedElectives = await fetchElectives();
      if (refreshedElectives.length >= 0) {
        setElectives(refreshedElectives);
        localStorage.setItem('electives', JSON.stringify(refreshedElectives));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing electives:', error);
      return false;
    }
  };

  const refreshUsers = async (): Promise<boolean> => {
    try {
      console.log('🔄 Refreshing users from backend...');
      const refreshedUsers = await fetchUsers();
      console.log('📦 Received users:', refreshedUsers.length);
      
      if (refreshedUsers.length >= 0) {
        // Update localStorage since users don't have React state
        localStorage.setItem('users', JSON.stringify(refreshedUsers));
        
        // Update students state if we have it
        const studentsData = refreshedUsers
          .filter((user: any) => user.role === 'student')
          .map((user: any) => {
            console.log(`  📝 Mapping student: ${user.name} - Section: ${user.section || '❌ MISSING'}`);
            return {
              id: user._id || user.id,
              name: user.name,
              rollNumber: user.rollNumber || user.rollNo,
              email: user.email,
              department: user.department,
              semester: user.semester,
              section: user.section
            };
          });
        
        console.log('✅ Mapped students:', studentsData.length);
        console.log('📊 Section distribution:', 
          studentsData.reduce((acc: any, s: any) => {
            const section = s.section || 'Not Assigned';
            acc[section] = (acc[section] || 0) + 1;
            return acc;
          }, {})
        );
        
        setStudents(studentsData);
        localStorage.setItem('students', JSON.stringify(studentsData));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing users:', error);
      return false;
    }
  };

  const refreshStudentSelections = async (): Promise<boolean> => {
    try {
      console.log('🔄 Refreshing student selections from MongoDB...');
      const refreshedSelections = await fetchStudentSelections();
      
      if (refreshedSelections) {
        console.log('✅ Refreshed selections from backend:', refreshedSelections.length);
        setStudentElectives(refreshedSelections);
        localStorage.setItem('studentElectives', JSON.stringify(refreshedSelections));
        console.log('💾 Updated state and localStorage with fresh data');
        return true;
      }
      
      console.warn('⚠️ No selections returned from refresh');
      return false;
    } catch (error) {
      console.error('❌ Error refreshing student selections:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // Delete user via API
      const response = await fetch(`${getApiBaseUrl()}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        // Refresh users data to update the local state
        await refreshUsers();
        return true;
      } else {
        console.error('Failed to delete user:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  // ============================================
  // ELECTIVE LIMITS MANAGEMENT
  // ============================================

  /**
   * Get elective limit for specific department, semester, and category
   */
  const getElectiveLimit = async (department: string, semester: number, category: string): Promise<number> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return 1; // Default to 1 if not authenticated

      const response = await fetch(
        `${getApiBaseUrl()}/elective-limits/${department}/${semester}/${category}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return 1; // Default to 1 if fetch fails

      const data = await response.json();
      return data.success ? data.limit : 1;
    } catch (error) {
      console.error('Error fetching elective limit:', error);
      return 1; // Default to 1 on error
    }
  };

  return (
    <DataContext.Provider value={{
      electives,
      tracks,
      students,
      studentElectives,
      electiveFeedbacks,
      isLoadingStudentData,
      addElective,
      updateElective,
      deleteElective,
      clearElectiveEnrollment,
      removeElective,
      submitFeedback,
      refreshElectives,
      refreshUsers,
      refreshStudentSelections,
      deleteUser,
      selectElective,
      getStudentElectives,
      getRecommendations,
      getElectivesByDepartment,
      getTracksByDepartment,
      getTracksByCategory,
      getElectivesByCategory,
      getElectivesByCategoryAndDepartment,
      setElectiveDeadline,
      getElectiveDeadline,
      isElectiveSelectionOpen,
      addElectiveFeedback,
      getFutureElectives,
      exportDataAsExcel,
      exportDataAsPDF,
      exportDataAsCSV,
      exportDataAsTXT,
      getElectiveRecommendation,
      getAvailableDepartments,
      getAvailableSections,
      getAvailableSemesters,
      getElectiveEnrollmentCount,
      isElectiveAvailable,
      addDepartment,
      removeDepartment,
      addSection,
      removeSection,
      addSemester,
      removeSemester,
      // Track management functions
      addTrack,
      updateTrack,
      removeTrack,
      getAvailableCategories,
      addCategory,
      removeCategory,
      // Alert system functions
      createAlert,
      getActiveAlerts,
      deleteAlert,
      // Feedback template functions
      createFeedbackTemplate,
      updateFeedbackTemplate,
      deleteFeedbackTemplate,
      getActiveFeedbackTemplates,
      // Feedback response functions
      submitFeedbackResponse,
      getFeedbackResponses,
      getStudentSubmittedTemplates,
      deleteFeedbackResponse,
      // Syllabus management functions
      uploadSyllabus,
      getSyllabus,
      getAllSyllabi,
      updateSyllabus,
      deleteSyllabus,
      // Elective limit functions
      getElectiveLimit,
    }}>
      {children}
    </DataContext.Provider>
  );
};
