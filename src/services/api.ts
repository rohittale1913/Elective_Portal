// API Base URL - Properly configured for all environments
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://elective-selection-system.onrender.com/api' 
    : 'http://localhost:5000/api');
console.log('🌐 API_BASE_URL configured as:', API_BASE_URL, 'Mode:', import.meta.env.MODE);

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  department?: string;
  semester?: number;
  section?: string;
  rollNo?: string;
  rollNumber?: string;
  mobile?: string;
  isNewUser?: boolean;
  preferences?: {
    interests: string[];
    careerGoals: string;
    difficulty: 'easy' | 'balanced' | 'challenging';
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  department?: string;
  semester?: number;
  registrationNumber?: string;
  mobile?: string;
  section?: string;
}

export interface ElectiveData {
  name: string;
  code: string;
  semester: number;
  track: string;
  description: string;
  credits: number;
  prerequisites?: string[];
  department: string;
  category: 'Departmental' | 'Humanities' | 'Open';
  electiveCategory: 'Elective';
  image?: string;
  selectionDeadline?: string;
}

export interface Elective extends ElectiveData {
  id: string;
  enrolledCount?: number;
  maxEnrollment?: number;
}

export interface StudentElectiveSelection {
  id: string;
  studentId: string;
  electiveId: string;
  semester: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// API Response types
interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
}

interface AuthResponse extends ApiResponse {
  token: string;
  user: User;
}

// Error handler
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  console.log('API Response status:', response.status, 'URL:', response.url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error response:', errorText);
    
    // If unauthorized, clear the token
    if (response.status === 401 || response.status === 403) {
      console.log('Token expired or invalid, clearing auth token');
      localStorage.removeItem('authToken');
    }
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: 'An error occurred' };
    }
    
    throw new ApiError(response.status, errorData.message || 'An error occurred');
  }
  
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken'); // Correct key used by AuthContext
  console.log('Auth token exists:', !!token, 'Token preview:', token ? token.substring(0, 20) + '...' : 'none');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Auth API
export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse<AuthResponse>(response);
    
    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('authToken', result.token); // Changed from 'token' to 'authToken'
    }
    
    return result;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse<AuthResponse>(response);
    
    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('authToken', result.token); // Changed from 'token' to 'authToken'
    }
    
    return result;
  },

  async me(): Promise<{ user: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<{ user: User }>(response);
  },

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<User>(response);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    console.log('API: Updating profile with data:', data);
    
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    console.log('API: Profile update response status:', response.status);
    
    const result = await handleResponse<{ message: string; user: User }>(response);
    console.log('API: Profile update result:', result);
    return result.user; // Extract user from the response object
  },

  logout() {
    localStorage.removeItem('authToken'); // Use consistent key
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken'); // Use consistent key
  },

  getToken(): string | null {
    return localStorage.getItem('authToken'); // Use consistent key
  }
};

// Electives API
export const electivesApi = {
  async getElectives(): Promise<Elective[]> {
    const response = await fetch(`${API_BASE_URL}/electives`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Elective[]>(response);
  },

  async getElectiveById(id: string): Promise<Elective> {
    const response = await fetch(`${API_BASE_URL}/electives/${id}`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<Elective>(response);
  },

  async createElective(data: ElectiveData): Promise<Elective> {
    const response = await fetch(`${API_BASE_URL}/electives`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse<Elective>(response);
  },

  async updateElective(id: string, data: Partial<ElectiveData>): Promise<Elective> {
    const response = await fetch(`${API_BASE_URL}/electives/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse<Elective>(response);
  },

  async deleteElective(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/electives/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    await handleResponse(response);
  },

  async getStudentSelections(): Promise<StudentElectiveSelection[]> {
    const response = await fetch(`${API_BASE_URL}/electives/my-selections`, {
      headers: getAuthHeaders(),
    });
    
    return handleResponse<StudentElectiveSelection[]>(response);
  },

  async selectElective(electiveId: string): Promise<StudentElectiveSelection> {
    const response = await fetch(`${API_BASE_URL}/electives/select`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ electiveId }),
    });
    
    return handleResponse<StudentElectiveSelection>(response);
  },

  async unselectElective(selectionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/electives/unselect/${selectionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    await handleResponse(response);
  }
};

// System Config API
export interface SystemConfig {
  departments: string[];
  semesters: number[];
  sections: string[];
  electiveCategories: string[];
}

export const systemConfigApi = {
  async getConfig(): Promise<SystemConfig> {
    const response = await fetch(`${API_BASE_URL}/system-config`, {
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse<{ success: boolean; config: SystemConfig }>(response);
    return result.config;
  },

  async updateConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const response = await fetch(`${API_BASE_URL}/system-config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    
    const result = await handleResponse<{ success: boolean; config: SystemConfig }>(response);
    return result.config;
  }
};

// Syllabus API
export interface SyllabusData {
  id: string;
  electiveId: string;
  title: string;
  description: string;
  pdfData: string; // Base64 encoded PDF
  pdfFileName: string;
  uploadedBy: string;
  uploadedAt: string | Date;
  academicYear: string;
  semester: number;
  version: number;
  isActive: boolean;
  targetDepartment?: string; // Optional: Show only to specific department
  targetSemester?: number; // Optional: Show only to specific semester
}

export const syllabusApi = {
  // Upload a new syllabus
  async uploadSyllabus(syllabusData: Omit<SyllabusData, 'id' | 'uploadedAt'>): Promise<SyllabusData> {
    const response = await fetch(`${API_BASE_URL}/syllabi`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(syllabusData),
    });
    
    const result = await handleResponse<{ success: boolean; syllabus: SyllabusData }>(response);
    return result.syllabus;
  },

  // Get all active syllabi (Public - No auth required)
  async getAllSyllabi(): Promise<SyllabusData[]> {
    const response = await fetch(`${API_BASE_URL}/syllabi`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await handleResponse<{ syllabi: SyllabusData[] }>(response);
    return result.syllabi;
  },

  // Get syllabus for a specific elective (Public - No auth required)
  async getSyllabusByElective(electiveId: string): Promise<SyllabusData | null> {
    const response = await fetch(`${API_BASE_URL}/syllabi/elective/${electiveId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 404) {
      return null;
    }
    
    const result = await handleResponse<{ syllabus: SyllabusData }>(response);
    return result.syllabus;
  },

  // Update a syllabus
  async updateSyllabus(syllabusId: string, updates: Partial<SyllabusData>): Promise<SyllabusData> {
    const response = await fetch(`${API_BASE_URL}/syllabi/${syllabusId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    const result = await handleResponse<{ success: boolean; syllabus: SyllabusData }>(response);
    return result.syllabus;
  },

  // Delete a syllabus
  async deleteSyllabus(syllabusId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/syllabi/${syllabusId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    const result = await handleResponse<{ success: boolean }>(response);
    return result.success;
  }
};

// Email API
export interface EmailNotificationData {
  subject: string;
  message: string;
  recipients: Array<{
    email: string;
    name: string;
  }>;
  alertType?: 'general' | 'elective_reminder' | 'deadline';
  filters?: {
    department?: string;
    semester?: number;
    sections?: string[];
  };
}

export interface EmailResponse {
  success: boolean;
  sentCount: number;
  failedCount: number;
  message: string;
}

export const emailApi = {
  // Send email notification to targeted students
  async sendAlertEmail(emailData: EmailNotificationData): Promise<EmailResponse> {
    const response = await fetch(`${API_BASE_URL}/notifications/send-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(emailData),
    });
    
    const result = await handleResponse<EmailResponse>(response);
    return result;
  },

  // Send email to specific users by IDs
  async sendEmailToUsers(userIds: string[], subject: string, message: string): Promise<EmailResponse> {
    const response = await fetch(`${API_BASE_URL}/notifications/send-to-users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds, subject, message }),
    });
    
    const result = await handleResponse<EmailResponse>(response);
    return result;
  },

  // Test email configuration (send test email to admin)
  async sendTestEmail(recipientEmail: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/notifications/test-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipientEmail }),
    });
    
    const result = await handleResponse<{ success: boolean; message: string }>(response);
    return result;
  }
};

// Export the ApiError for error handling
export { ApiError };

