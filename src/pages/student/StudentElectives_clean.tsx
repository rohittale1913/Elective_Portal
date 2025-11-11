import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BookOpen, Users, Clock } from 'lucide-react';

const StudentElectives: React.FC = () => {
  const { user, markUserAsExperienced } = useAuth();
  const { 
    electives, 
    getStudentElectives, 
    selectElective, 
    getTracksByDepartment,
    isElectiveSelectionOpen,
    getElectiveEnrollmentCount,
    isElectiveAvailable
  } = useData();
  const { addNotification } = useNotifications();
  
  const [selectedTrack, setSelectedTrack] = useState('');

  // Calculate semesters
  const currentSemester = user?.semester || 1;
  const electiveSelectionSemester = currentSemester + 1;

  // Get student's electives
  const allStudentElectives = useMemo(() => 
    user ? getStudentElectives(user.id) : [], 
    [user, getStudentElectives]
  );

  // Get electives selected for the target semester
  const selectedElectivesThisSemester = useMemo(() => 
    allStudentElectives.filter(se => se.semester === electiveSelectionSemester),
    [allStudentElectives, electiveSelectionSemester]
  );

  // Get available electives for the target semester
  const electivesForTargetSemester = useMemo(() => 
    electives.filter(e => e.semester === electiveSelectionSemester),
    [electives, electiveSelectionSemester]
  );

  // Filter out already selected electives
  const availableElectives = useMemo(() => {
    const selectedIds = selectedElectivesThisSemester.map(se => se.electiveId);
    return electivesForTargetSemester.filter(e => !selectedIds.includes(e.id));
  }, [electivesForTargetSemester, selectedElectivesThisSemester]);

  // Get categories and tracks
  const departmentTracks = getTracksByDepartment(user?.department || '');

  // Selection limits
  const MAX_SELECTIONS = 6;
  const canSelectMore = selectedElectivesThisSemester.length < MAX_SELECTIONS;

  // Filter electives by selected track
  const displayElectives = selectedTrack 
    ? availableElectives.filter(e => e.track === selectedTrack)
    : availableElectives;

  // Handle elective selection
  const handleElectiveSelect = async (electiveId: string) => {
    if (!user) return;

    // Check if can select more
    if (!canSelectMore) {
      addNotification({
        type: 'warning',
        title: 'Selection Limit Reached',
        message: `You can only select up to ${MAX_SELECTIONS} electives per semester.`
      });
      return;
    }

    // Check if already selected
    if (selectedElectivesThisSemester.some(se => se.electiveId === electiveId)) {
      addNotification({
        type: 'warning',
        title: 'Already Selected',
        message: 'You have already selected this elective for this semester.'
      });
      return;
    }

    // Check if selection is open
    if (!isElectiveSelectionOpen(electiveId)) {
      addNotification({
        type: 'error',
        title: 'Selection Closed',
        message: 'The deadline for this elective has passed.'
      });
      return;
    }

    // Check availability
    const availability = isElectiveAvailable(electiveId);
    if (!availability.available) {
      addNotification({
        type: 'error',
        title: 'Not Available',
        message: availability.reason || 'This elective is not available.'
      });
      return;
    }

    try {
      // Select the elective
      selectElective(user.id, electiveId, electiveSelectionSemester);
      
      // Mark user as experienced
      if (user.isNewUser) {
        markUserAsExperienced();
      }

      // Show success notification
      const elective = electives.find(e => e.id === electiveId);
      addNotification({
        type: 'success',
        title: 'Elective Selected!',
        message: `You have successfully selected "${elective?.name}" for Semester ${electiveSelectionSemester}.`
      });

    } catch {
      addNotification({
        type: 'error',
        title: 'Selection Failed',
        message: 'Failed to select elective. Please try again.'
      });
    }
  };

  // Early return after all hooks
  if (!user || user.role !== 'student') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">This page is only available to students.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Select Electives</h1>
        <p className="text-gray-600 mt-2">
          Choose electives for Semester {electiveSelectionSemester} (Next Semester)
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Current Semester: {currentSemester} | Selecting for: Semester {electiveSelectionSemester}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Selection Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Available:</span>
            <span className="ml-2 font-medium">{availableElectives.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Selected:</span>
            <span className="ml-2 font-medium">{selectedElectivesThisSemester.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Remaining:</span>
            <span className="ml-2 font-medium">{MAX_SELECTIONS - selectedElectivesThisSemester.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Can Select:</span>
            <span className={`ml-2 font-medium ${canSelectMore ? 'text-green-600' : 'text-red-600'}`}>
              {canSelectMore ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Electives */}
      {selectedElectivesThisSemester.length > 0 && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            Selected Electives for Semester {electiveSelectionSemester}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedElectivesThisSemester.map(selection => {
              const elective = electives.find(e => e.id === selection.electiveId);
              if (!elective) return null;
              
              return (
                <div key={selection.electiveId} className="flex items-center space-x-3 p-3 bg-white rounded border">
                  <span className="text-green-600">✓</span>
                  <div className="flex-1">
                    <div className="font-medium">{elective.name}</div>
                    <div className="text-sm text-gray-600">{elective.code} • {elective.credits} Credits</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${
                    elective.category === 'Departmental' ? 'bg-blue-500' :
                    elective.category === 'Open' ? 'bg-orange-500' : 'bg-purple-500'
                  }`}>
                    {elective.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track Filter */}
      {departmentTracks.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Track
          </label>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Tracks</option>
            {departmentTracks.map(track => (
              <option key={track.id} value={track.name}>{track.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Available Electives */}
      {displayElectives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayElectives.map(elective => {
            const enrollmentCount = getElectiveEnrollmentCount(elective.id);
            const isSelectionOpen = isElectiveSelectionOpen(elective.id);
            const availability = isElectiveAvailable(elective.id);
            
            return (
              <div key={elective.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                {/* Elective Image */}
                {elective.infoImage && (
                  <div className="h-48 w-full">
                    <img 
                      src={elective.infoImage} 
                      alt={elective.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{elective.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">{elective.code} • {elective.credits} Credits</span>
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${
                        elective.category === 'Departmental' ? 'bg-blue-500' :
                        elective.category === 'Open' ? 'bg-orange-500' : 'bg-purple-500'
                      }`}>
                        {elective.category}
                      </span>
                    </div>
                    
                    {/* Subject Type Badge */}
                    <div className="mb-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        elective.subjectType === 'Theory' ? 'bg-green-100 text-green-800' :
                        elective.subjectType === 'Practical' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {elective.subjectType === 'Theory+Practical' ? 'Theory + Practical' : elective.subjectType}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700">{elective.description}</p>
                  </div>

                  {/* Enrollment Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Enrollment:</span>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{enrollmentCount}{elective.maxEnrollment ? ` / ${elective.maxEnrollment}` : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {elective.track}
                    </span>
                  </div>

                  {/* Select Button */}
                  <div className="flex justify-end">
                    {!isSelectionOpen ? (
                      <div className="flex items-center text-red-600 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Deadline passed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleElectiveSelect(elective.id)}
                        disabled={!canSelectMore || !availability.available}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          !canSelectMore || !availability.available
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {!canSelectMore ? 'Limit Reached' : 
                         !availability.available ? 'Not Available' : 
                         'Select Elective'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Electives Available</h3>
          <p className="text-gray-600">
            {selectedTrack 
              ? `No electives found in the ${selectedTrack} track for semester ${electiveSelectionSemester}.`
              : `No electives are available for semester ${electiveSelectionSemester}.`
            }
          </p>
          {selectedTrack && (
            <button
              onClick={() => setSelectedTrack('')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Show All Tracks
            </button>
          )}
        </div>
      )}

      {/* Welcome Message for New Users */}
      {user.isNewUser && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-blue-800 font-semibold mb-2">Welcome to ElectivePro! 🎉</h3>
          <p className="text-blue-700 text-sm">
            This is your first time here. Select electives that interest you for the next semester. 
            You can select up to {MAX_SELECTIONS} electives.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentElectives;
