import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, Plus, Send, Calendar, Users, AlertTriangle, Info, Megaphone, X } from 'lucide-react';

const AdminAlerts: React.FC = () => {
  const { createAlert, getActiveAlerts, getAvailableDepartments, getAvailableSemesters } = useData();
  const { addNotification } = useNotifications();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'general' as 'general' | 'elective_reminder' | 'deadline',
    targetDepartment: '',
    targetSemester: ''
  });

  const [loading, setLoading] = useState(false);

  const alertTypes = [
    { value: 'general', label: 'General', icon: Info, color: 'text-blue-600' },
    { value: 'elective_reminder', label: 'Elective Reminder', icon: AlertTriangle, color: 'text-yellow-600' },
    { value: 'deadline', label: 'Deadline', icon: Megaphone, color: 'text-red-600' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    setLoading(true);
    try {
      const alertData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        targetDepartment: formData.targetDepartment || undefined,
        targetSemester: formData.targetSemester ? parseInt(formData.targetSemester) : undefined,
        createdBy: 'admin' // This should come from auth context in real implementation
      };

      createAlert(alertData);
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Alert created successfully!'
      });

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'general',
        targetDepartment: '',
        targetSemester: ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating alert:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create alert. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get all active alerts for display
  const departments = getAvailableDepartments();
  const semesters = getAvailableSemesters();
  
  const allAlerts = (departments || []).flatMap(dept => 
    (semesters || []).map(sem => getActiveAlerts(dept, sem))
  ).flat();

  // Remove duplicates based on id
  const uniqueAlerts = allAlerts.filter((alert, index, self) => 
    index === self.findIndex(a => a.id === alert.id)
  );

  const getAlertIcon = (type: string) => {
    const alertType = alertTypes.find(t => t.value === type);
    return alertType ? alertType.icon : Info;
  };

  const getAlertColor = (type: string) => {
    const alertType = alertTypes.find(t => t.value === type);
    return alertType ? alertType.color : 'text-blue-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alert Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and manage student notifications</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Alert</span>
        </button>
      </div>

      {/* Create Alert Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Alert</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alert Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter alert title"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter alert message"
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Alert Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alert Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {alertTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Department (Optional)
                </label>
                <select
                  name="targetDepartment"
                  value={formData.targetDepartment}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Target Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Semester (Optional)
                </label>
                <select
                  name="targetSemester"
                  value={formData.targetSemester}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Semesters</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Creating...' : 'Create Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Alerts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Alerts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {uniqueAlerts.length} active alert{uniqueAlerts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {uniqueAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No active alerts</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Create your first alert to notify students
              </p>
            </div>
          ) : (
            uniqueAlerts.map((alert) => {
              const IconComponent = getAlertIcon(alert.type);
              const colorClass = getAlertColor(alert.type);
              
              return (
                <div key={alert.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${colorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {alert.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alert.type === 'deadline' ? 'bg-red-100 text-red-800' :
                          alert.type === 'elective_reminder' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {alert.targetDepartment || 'All Departments'}
                            {alert.targetSemester ? ` - Sem ${alert.targetSemester}` : ' - All Semesters'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAlerts;
