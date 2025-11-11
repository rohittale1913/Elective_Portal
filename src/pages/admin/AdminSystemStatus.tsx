import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { RefreshCw, Bug, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const AdminSystemStatus: React.FC = () => {
  const { user } = useAuth();
  const { electives, refreshElectives } = useData();
  const { addNotification } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  if (!user || user.role !== 'admin') return null;

  const testApiConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/electives');
      if (response.ok) {
        setApiStatus('connected');
        addNotification({
          type: 'success',
          title: 'API Connected',
          message: 'Backend API is responding correctly'
        });
      } else {
        setApiStatus('error');
        addNotification({
          type: 'error',
          title: 'API Error',
          message: `API returned status: ${response.status}`
        });
      }
    } catch (error) {
      console.error('API test error:', error);
      setApiStatus('error');
      addNotification({
        type: 'error',
        title: 'API Connection Failed',
        message: 'Unable to connect to backend API'
      });
    }
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshElectives();
      if (success) {
        addNotification({
          type: 'success',
          title: 'Data Refreshed',
          message: 'All data has been refreshed from the server'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Refresh Failed',
          message: 'Failed to refresh data from server'
        });
      }
    } catch (error) {
      console.error('Refresh error:', error);
      addNotification({
        type: 'error',
        title: 'Refresh Error',
        message: 'An error occurred while refreshing data'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearLocalData = () => {
    if (confirm('This will clear all cached data and force a complete reload. Continue?')) {
      localStorage.removeItem('electives');
      localStorage.removeItem('tracks');
      localStorage.removeItem('students');
      localStorage.removeItem('studentElectives');
      localStorage.removeItem('feedbackTemplates');
      window.location.reload();
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bug className="w-8 h-8 text-blue-600" />
          System Status & Diagnostics
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor system health and troubleshoot issues
        </p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">API Connection</h3>
            {statusIcon(apiStatus)}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Backend API connectivity status
          </p>
          <button
            onClick={testApiConnection}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Test Connection
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Data Status</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Electives loaded: {electives.length}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRefreshing ? 'Refreshing...' : 'Force Refresh'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Cache Management</h3>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Clear local cache if experiencing issues
          </p>
          <button
            onClick={clearLocalData}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Environment</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Frontend:</span>
                <span className="font-mono">localhost:5173</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Backend:</span>
                <span className="font-mono">localhost:5000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User Role:</span>
                <span className="capitalize">{user.role}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Counts</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Electives:</span>
                <span>{electives.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Departmental:</span>
                <span>{electives.filter(e => e.category === 'Departmental').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Open:</span>
                <span>{electives.filter(e => e.category === 'Open').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Humanities:</span>
                <span>{electives.filter(e => e.category === 'Humanities').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">Common Issues & Solutions</h3>
        
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-yellow-800">Profile updates not saving:</h4>
            <p className="text-yellow-700">
              • Check API connection status above<br/>
              • Ensure you're logged in with valid token<br/>
              • Try refreshing the page and logging in again
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-yellow-800">New electives not appearing:</h4>
            <p className="text-yellow-700">
              • Use the "Force Refresh" button above<br/>
              • Check that elective was saved successfully<br/>
              • Clear cache if data seems corrupted
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-yellow-800">Data inconsistencies:</h4>
            <p className="text-yellow-700">
              • Clear local cache and reload<br/>
              • Check network connectivity<br/>
              • Verify backend server is running
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemStatus;
