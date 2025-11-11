/**
 * AUTHENTICATION CONTEXT PROVIDER
 * 
 * Manages user authentication state throughout the application.
 * Provides login, logout, registration, and user profile management.
 * 
 * Key Features:
 * - JWT token-based authentication
 * - Persistent user sessions via localStorage
 * - Role-based access control (student/admin)
 * - Profile management capabilities
 * - Roll number tracking for students
 * 
 * @author Sahil Sukhdeve
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, type User } from '../services/api';

/**
 * Authentication Context Type Definition
 * 
 * Defines the shape of the authentication context that will be available
 * to all components that consume this context.
 */
interface AuthContextType {
  user: User | null;                    // Current authenticated user
  loading: boolean;                     // Loading state during auth operations
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterUserData) => Promise<boolean>;
  logout: () => void;                   // Sign out current user
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  markUserAsExperienced: () => void;    // Mark user as experienced (onboarding)
}

/**
 * User Registration Data Interface
 * 
 * Defines the structure of data required for user registration.
 * Includes role-specific fields for students and admins.
 */
interface RegisterUserData {
  name: string;                         // Full name of the user
  email: string;                        // Email address for login
  password: string;                     // User password
  role: 'student' | 'admin';           // User role for access control
  department?: string;                  // Academic department (for students)
  semester?: number;                    // Current semester (for students)
  registrationNumber?: string;          // Class Roll Number (for students)
  mobile?: string;                      // Mobile phone number
  section?: string;                     // Section (for students)
}

// Create React Context for authentication
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom Hook to Access Authentication Context
 * 
 * Provides a convenient way to access authentication state and methods
 * from any component in the application.
 * 
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * 
 * Wraps the application and provides authentication context to all child components.
 * Manages user state, handles authentication operations, and persists sessions.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State to store current authenticated user
  const [user, setUser] = useState<User | null>(null);
  
  // State to track loading during authentication operations
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Initialize Authentication State
   * 
   * Checks for existing authentication token on component mount
   * and automatically logs in the user if valid token exists.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
          // Verify token with backend and get user data
          const userData = await authApi.me();
          setUser(userData.user);
        }
      } catch (error) {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        console.error('Token verification failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * User Login Function
   * 
   * Authenticates user with email and password.
   * Stores JWT token and user data on successful login.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise<boolean> - Success status of login attempt
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Call authentication API
      const response = await authApi.login({ email, password });
      
      if (response.token && response.user) {
        // Store token in localStorage for persistence
        localStorage.setItem('authToken', response.token);
        
        // Dispatch custom event to notify DataContext of auth token change
        window.dispatchEvent(new Event('authTokenChanged'));
        
        // Update user state
        setUser(response.user);
        
        console.log('Login successful for user:', response.user.email);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * User Registration Function
   * 
   * Creates new user account with provided information.
   * Automatically logs in user after successful registration.
   * 
   * @param userData - Registration form data
   * @returns Promise<boolean> - Success status of registration attempt
   */
  const register = async (userData: RegisterUserData): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Call registration API
      const response = await authApi.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        department: userData.department,
        semester: userData.semester,
        registrationNumber: userData.registrationNumber,
        mobile: userData.mobile,
        section: userData.section
      });
      
      if (response.token && response.user) {
        // Store token and log in user immediately
        localStorage.setItem('authToken', response.token);
        
        // Dispatch custom event to notify DataContext of auth token change
        window.dispatchEvent(new Event('authTokenChanged'));
        
        setUser(response.user);
        
        console.log('Registration successful for user:', response.user.email);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * User Logout Function
   * 
   * Clears user session and removes authentication token.
   * Redirects user to login page.
   */
  const logout = () => {
    // Clear user state
    setUser(null);
    
    // Remove stored authentication data
    localStorage.removeItem('authToken');
    
    // Dispatch custom event to notify DataContext of auth token removal
    window.dispatchEvent(new Event('authTokenChanged'));
    
    console.log('User logged out successfully');
  };

  /**
   * Update User Profile Function
   * 
   * Updates user profile information in the database.
   * Refreshes local user state with updated data.
   * 
   * @param data - Partial user data to update
   * @returns Promise<boolean> - Success status of update operation
   */
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!user) {
        console.error('No user found for profile update');
        return false;
      }
      
      console.log('Updating profile with data:', data);
      
      // Call profile update API
      const updatedUser = await authApi.updateProfile(data);
      
      if (updatedUser) {
        // Update local user state
        setUser(updatedUser);
        console.log('Profile updated successfully:', updatedUser);
        return true;
      }
      
      console.error('No updated user returned from API');
      return false;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  /**
   * Mark User as Experienced Function
   * 
   * Updates user profile to indicate they have completed onboarding.
   * Used to skip introduction screens on subsequent visits.
   */
  const markUserAsExperienced = () => {
    if (user) {
      const updatedUser = { ...user, isExperienced: true };
      setUser(updatedUser);
      
      // Persist the change locally (could also sync with backend)
      localStorage.setItem('userExperience', 'true');
    }
  };

  // Context value object with all authentication methods and state
  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    markUserAsExperienced
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};