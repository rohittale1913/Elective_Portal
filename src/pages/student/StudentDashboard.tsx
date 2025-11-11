import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { BookOpen, TrendingUp, Clock, Target, ArrowRight, Bell, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProgressBar from '../../components/common/ProgressBar';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { electives, tracks, getStudentElectives, getRecommendations, getActiveAlerts, isLoadingStudentData } = useData();

  if (!user || user.role !== 'student') return null;

  const studentElectives = getStudentElectives(user.id);
  const currentSemester = user.semester || 5;
  const recommendations = getRecommendations(user.id);
  
  // Get alerts relevant to the student
  const relevantAlerts = getActiveAlerts(user.department, user.semester);

  // Show basic content if data is still loading
  if (isLoadingStudentData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {user.department} • Semester {user.semester}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Loading Your Data...</h3>
              <p className="text-blue-700 mt-1">
                Please wait while we load your electives and course information.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/student/electives" className="block text-blue-600 hover:text-blue-800">
                Browse Electives →
              </Link>
              <Link to="/student/profile" className="block text-blue-600 hover:text-blue-800">
                Update Profile →
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Semester</h3>
            <p className="text-2xl font-bold text-green-600">{currentSemester}</p>
            <p className="text-gray-600">Semester {currentSemester}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Department</h3>
            <p className="text-lg font-medium text-blue-600">{user.department || 'Not Set'}</p>
          </div>
        </div>
      </div>
    );
  }

  const trackProgress = tracks.map(track => {
    const trackElectives = studentElectives.filter(se => se.track === track.name);
    const totalIntrack = electives.filter(e => e.track === track.name).length;
    return {
      ...track,
      completed: trackElectives.length,
      total: totalIntrack
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user.department} • Semester {user.semester}
        </p>
      </div>

      {/* Alert Notifications */}
      {relevantAlerts.length > 0 && (
        <div className="mb-8 space-y-4">
          {relevantAlerts.map(alert => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'deadline' ? 'bg-red-50 border-red-500' :
                alert.type === 'elective_reminder' ? 'bg-blue-50 border-blue-500' :
                'bg-yellow-50 border-yellow-500'
              }`}
            >
              <div className="flex items-start">
                <Bell className={`w-5 h-5 mt-0.5 mr-3 ${
                  alert.type === 'deadline' ? 'text-red-600' :
                  alert.type === 'elective_reminder' ? 'text-blue-600' :
                  'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                  <p className="text-gray-700 mt-1">{alert.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{studentElectives.length}</p>
              <p className="text-gray-600">Electives Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
              <p className="text-gray-600">Available Options</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {trackProgress.filter(d => d.completed > 0).length}
              </p>
              <p className="text-gray-600">tracks Explored</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{8 - currentSemester}</p>
              <p className="text-gray-600">Semesters Left</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* track Progress */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">track Progress</h2>
          <div className="space-y-6">
            {trackProgress.map(track => (
              <div key={track.id}>
                <ProgressBar
                  progress={track.completed}
                  total={track.total}
                  label={track.name}
                  color={track.color}
                />
                <p className="text-sm text-gray-600 mt-1">{track.description}</p>
              </div>
            ))}
          </div>
          <Link
            to="/progress"
            className="mt-6 inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
          >
            View detailed progress
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Recommended Electives */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Recommended for Semester {currentSemester}
          </h2>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.slice(0, 3).map(elective => (
                <div key={elective.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold text-gray-900">{elective.name}</h3>
                  <p className="text-sm text-gray-600">{elective.code} • {elective.track}</p>
                  <p className="text-sm text-gray-700 mt-2">{elective.description}</p>
                </div>
              ))}
              <Link
                to="/electives"
                className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
              >
                View all electives
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No electives available for this semester</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/electives"
            className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
          >
            <BookOpen className="w-8 h-8 text-blue-600 group-hover:text-blue-700 mb-2" />
            <h3 className="font-medium text-gray-900">Select Electives</h3>
            <p className="text-sm text-gray-600">Choose your electives for this semester</p>
          </Link>

          <Link
            to="/roadmap"
            className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group"
          >
            <Target className="w-8 h-8 text-purple-600 group-hover:text-purple-700 mb-2" />
            <h3 className="font-medium text-gray-900">View Roadmap</h3>
            <p className="text-sm text-gray-600">See your future elective pathway</p>
          </Link>

          <Link
            to="/profile"
            className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors group"
          >
            <Target className="w-8 h-8 text-green-600 group-hover:text-green-700 mb-2" />
            <h3 className="font-medium text-gray-900">Update Profile</h3>
            <p className="text-sm text-gray-600">Manage your account settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
