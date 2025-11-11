import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, AlertNotification } from '../../contexts/DataContext';
import { emailApi, type EmailNotificationData } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { Users, BookOpen, BarChart3, Building2, Trash2, Bell, FileText, ChevronDown } from 'lucide-react';
import AdminSyllabus from './AdminSyllabus';

// Alert Management Component
interface AlertManagementProps {
  createAlert: (alert: Omit<AlertNotification, 'id' | 'createdAt'>) => void;
  getActiveAlerts: (department?: string, semester?: number) => AlertNotification[];
  deleteAlert: (alertId: string) => void;
  departments: string[];
  sections: string[];
}

const AlertManagement: React.FC<AlertManagementProps> = ({ 
  createAlert, 
  getActiveAlerts, 
  deleteAlert,
  departments,
  sections
}) => {
  const { addNotification } = useNotifications();
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    type: 'general' as 'elective_reminder' | 'deadline' | 'general',
    targetDepartment: '',
    targetSemester: '',
    targetSections: [] as string[],
    createdBy: 'Admin',
    sendEmail: false
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false); // Dropdown state
  const sectionDropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setSectionDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendEmailNotification = async (alertData: typeof newAlert, targetUsers: Array<{email: string, name: string}>) => {
    try {
      setIsSendingEmail(true);
      
      const emailData: EmailNotificationData = {
        subject: alertData.title,
        message: alertData.message,
        recipients: targetUsers,
        alertType: alertData.type,
        filters: {
          department: alertData.targetDepartment || undefined,
          semester: alertData.targetSemester ? parseInt(alertData.targetSemester) : undefined,
          sections: alertData.targetSections.length > 0 ? alertData.targetSections : undefined
        }
      };

      console.log('Sending email notification via API:', emailData);
      
      const result = await emailApi.sendAlertEmail(emailData);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Emails Sent Successfully',
          message: `Email notification sent to ${result.sentCount} student(s). ${result.failedCount > 0 ? `Failed to send to ${result.failedCount} recipient(s).` : ''}`
        });
        console.log('✅ Email sent successfully:', result);
      } else {
        throw new Error(result.message || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
      addNotification({
        type: 'error',
        title: 'Email Send Failed',
        message: error instanceof Error ? error.message : 'Failed to send email notifications. Please check your email configuration.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the alert
    createAlert({
      title: newAlert.title,
      message: newAlert.message,
      type: newAlert.type,
      targetDepartment: newAlert.targetDepartment || undefined,
      targetSemester: newAlert.targetSemester ? parseInt(newAlert.targetSemester) : undefined,
      targetSections: newAlert.targetSections.length > 0 ? newAlert.targetSections : undefined,
      createdBy: newAlert.createdBy
    });

    // Send email if requested
    if (newAlert.sendEmail) {
      // Get target users based on department and semester filters
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      let targetUsers = allUsers.filter((user: {role: string, department?: string, semester?: number, section?: string, email: string, name: string}) => user.role === 'student');
      
      if (newAlert.targetDepartment) {
        targetUsers = targetUsers.filter((user: typeof targetUsers[0]) => user.department === newAlert.targetDepartment);
      }
      
      if (newAlert.targetSemester) {
        targetUsers = targetUsers.filter((user: typeof targetUsers[0]) => user.semester === parseInt(newAlert.targetSemester));
      }

      if (newAlert.targetSections.length > 0) {
        targetUsers = targetUsers.filter((user: typeof targetUsers[0]) => newAlert.targetSections.includes(user.section || ''));
      }
      
      sendEmailNotification(newAlert, targetUsers);
    }
    
    setNewAlert({
      title: '',
      message: '',
      type: 'general',
      targetDepartment: '',
      targetSemester: '',
      targetSections: [],
      createdBy: 'Admin',
      sendEmail: false
    });
  };

  const alerts = getActiveAlerts();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Alert</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Title
              </label>
              <input
                type="text"
                value={newAlert.title}
                onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter alert title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type
              </label>
              <select
                value={newAlert.type}
                onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as 'elective_reminder' | 'deadline' | 'general' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="elective_reminder">Elective Reminder</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={newAlert.message}
              onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter alert message"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={newAlert.targetDepartment}
                onChange={(e) => setNewAlert({ ...newAlert, targetDepartment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                value={newAlert.targetSemester}
                onChange={(e) => setNewAlert({ ...newAlert, targetSemester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div ref={sectionDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            {sections.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center"
                >
                  <span className={newAlert.targetSections.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                    {newAlert.targetSections.length === 0 
                      ? 'All Sections' 
                      : `${newAlert.targetSections.length} selected: ${newAlert.targetSections.join(', ')}`}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${sectionDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {sectionDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAlert.targetSections.length === 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAlert({ ...newAlert, targetSections: [] });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">All Sections</span>
                      </label>
                      {sections.map(section => (
                        <label key={section} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newAlert.targetSections.includes(section)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAlert({ ...newAlert, targetSections: [...newAlert.targetSections, section] });
                              } else {
                                setNewAlert({ ...newAlert, targetSections: newAlert.targetSections.filter(s => s !== section) });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Section {section}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">No sections available</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={newAlert.sendEmail}
              onChange={(e) => setNewAlert({ ...newAlert, sendEmail: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSendingEmail}
            />
            <label htmlFor="sendEmail" className="text-sm text-gray-700">
              Send email notification to targeted students
            </label>
          </div>

          <button
            type="submit"
            disabled={isSendingEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSendingEmail ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Create Alert'
            )}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <p className="text-gray-500">No active alerts</p>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      alert.type === 'deadline' ? 'bg-red-100 text-red-800' :
                      alert.type === 'elective_reminder' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  <div className="text-sm text-gray-500">
                    {alert.targetDepartment && <span>Department: {alert.targetDepartment} • </span>}
                    {alert.targetSemester && <span>Semester: {alert.targetSemester} • </span>}
                    {alert.targetSections && alert.targetSections.length > 0 && <span>Sections: {alert.targetSections.join(', ')} • </span>}
                    Created: {alert.createdAt.toLocaleDateString()} • By: {alert.createdBy}
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-red-600 hover:text-red-800 ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    electives, 
    students,
    getAvailableDepartments,
    getAvailableSections,
    createAlert,
    getActiveAlerts,
    deleteAlert
  } = useData();
  const [selectedView, setSelectedView] = useState<'overview' | 'departments' | 'alerts' | 'syllabus'>('overview');

  if (!user || user.role !== 'admin') return null;

  // Get admin-configured departments and sections
  const departments = getAvailableDepartments();
  const sections = getAvailableSections();

  // Calculate analytics - use students from DataContext instead of localStorage
  const totalStudents = students.length;
  
  const totalElectives = electives.length;

  // Department-wise statistics
  const departmentStats = departments.map(dept => {
    const deptElectives = electives.filter(e => e.department === dept);

    return {
      department: dept,
      totalElectives: deptElectives.length
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of electives, students, and system analytics
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'departments', label: 'Departments', icon: Building2 },
              { id: 'alerts', label: 'Alert System', icon: Bell },
              { id: 'syllabus', label: 'Syllabus Management', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as 'overview' | 'departments' | 'alerts' | 'syllabus')}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-gray-600">Total Students</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totalElectives}</p>
                  <p className="text-gray-600">Total Electives</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                  <p className="text-gray-600">Departments</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Departments Tab */}
      {selectedView === 'departments' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentStats.map((dept) => (
              <div key={dept.department} className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{dept.department}</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Electives Offered</span>
                    <span className="font-bold text-gray-900">{dept.totalElectives}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert System Tab */}
      {selectedView === 'alerts' && (
        <div className="space-y-6">
          <AlertManagement 
            createAlert={createAlert}
            getActiveAlerts={getActiveAlerts}
            deleteAlert={deleteAlert}
            departments={departments}
            sections={sections}
          />
        </div>
      )}

      {/* Syllabus Management Tab */}
      {selectedView === 'syllabus' && (
        <div className="space-y-6">
          <AdminSyllabus />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
