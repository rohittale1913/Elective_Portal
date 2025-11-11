import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, Elective } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Book, Users, Globe, ArrowRight, Info, Check, BookOpen, Clock } from 'lucide-react';

const StudentElectiveSelection: React.FC = () => {
  const { user } = useAuth();
  const { 
    electives,
    getElectivesByCategoryAndDepartment, 
    getTracksByDepartment, 
    selectElective, 
    getStudentElectives,
    getAvailableCategories,
    isElectiveSelectionOpen,
    isElectiveAvailable,
    getElectiveLimit
  } = useData();
  const { addNotification } = useNotifications();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedElectiveInfo, setSelectedElectiveInfo] = useState<Elective | null>(null);
  const [electiveLimits, setElectiveLimits] = useState<Record<string, number>>({});
  const [totalElectiveLimit, setTotalElectiveLimit] = useState<number>(3); // Default to 3

  // Calculate the semester for elective selection (next semester)
  const currentSemester = user?.semester || 1;
  const electiveSelectionSemester = currentSemester;
  
  // Get student's electives and filter for the target semester
  const selectedElectivesThisSemester = useMemo(() => {
    if (!user) return [];
    const allStudentElectives = getStudentElectives(user.id);
    return allStudentElectives.filter(se => se.semester === electiveSelectionSemester);
  }, [user, getStudentElectives, electiveSelectionSemester]);

  // Get student's PRIMARY track (the track with most elective selections)
  const studentPrimaryTrack = useMemo(() => {
    if (!user) return null;
    const allStudentElectives = getStudentElectives(user.id);
    
    if (allStudentElectives.length === 0) return null;
    
    // Count electives per track
    const trackCounts: Record<string, number> = {};
    allStudentElectives.forEach(se => {
      if (se.track) {
        trackCounts[se.track] = (trackCounts[se.track] || 0) + 1;
      }
    });
    
    // Find track with most electives (primary track)
    let primaryTrack = null;
    let maxCount = 0;
    Object.entries(trackCounts).forEach(([track, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primaryTrack = track;
      }
    });
    
    console.log('🎯 Student Primary Track Calculation:');
    console.log('   - Total selections:', allStudentElectives.length);
    console.log('   - Track counts:', trackCounts);
    console.log('   - Primary track:', primaryTrack);
    
    return primaryTrack;
  }, [user, getStudentElectives]);

  // Get admin-configured categories
  const availableCategories = getAvailableCategories();

  // Check which categories have been selected for this semester
  const selectedCategories = useMemo(() => {
    const categories = new Set<string>();
    selectedElectivesThisSemester.forEach(selection => {
      const elective = electives.find(e => e.id === selection.electiveId);
      if (elective && elective.category) {
        // Handle category as array
        elective.category.forEach(cat => categories.add(cat));
      }
    });
    return categories;
  }, [selectedElectivesThisSemester, electives]);

  // Fetch elective limits from backend
  React.useEffect(() => {
    const fetchLimits = async () => {
      if (!user || !user.department) return;
      
      const limits: Record<string, number> = {};
      let total = 0;
      
      // Fetch limit for each category
      for (const category of availableCategories) {
        const limit = await getElectiveLimit(user.department, electiveSelectionSemester, category);
        limits[category] = limit;
        total += limit;
      }
      
      setElectiveLimits(limits);
      setTotalElectiveLimit(total || 3); // Fallback to 3 if no limits configured
    };
    
    fetchLimits();
  }, [user, availableCategories, electiveSelectionSemester, getElectiveLimit]);

  if (!user) return null;

  // Check if user can select from a specific category
  const canSelectFromCategory = (category: string) => {
    return !selectedCategories.has(category);
  };

  // Get available electives for the selected category
  // Get electives for the selected category and current semester
  const getElectives = () => {
    if (!selectedCategory || !user) return [];
    return getElectivesByCategoryAndDepartment(
      selectedCategory as 'Departmental' | 'Open' | 'Humanities', 
      user.department, 
      electiveSelectionSemester // Filter by current semester
    );
  };

  // Get available tracks for the selected category
  const getAvailableTracks = () => {
    if (!selectedCategory) return [];
    if (selectedCategory === 'Departmental') {
      return getTracksByDepartment(user.department || '');
    }
    // For other categories, get unique tracks from electives
    const categoryElectives = getElectives();
    const uniqueTracks = [...new Set(categoryElectives.map(e => e.track))];
    return uniqueTracks.map(track => ({ 
      id: track, 
      name: track, 
      description: '', 
      color: 'bg-gray-500', 
      suggestedElectives: [], 
      department: '' 
    }));
  };

  // Get filtered electives based on selected track
  const getFilteredElectives = () => {
    const categoryElectives = getElectives();
    if (!selectedTrack) return categoryElectives;
    return categoryElectives.filter(e => e.track === selectedTrack);
  };

  // Generate category data from admin configuration
  const categoryData = availableCategories.map(category => {
    const icons = {
      'Departmental': Book,
      'Open': Globe,
      'Humanities': Users
    };
    
    const colors = {
      'Departmental': 'bg-blue-500',
      'Open': 'bg-green-500', 
      'Humanities': 'bg-purple-500'
    };

    const hoverColors = {
      'Departmental': 'hover:bg-blue-600',
      'Open': 'hover:bg-green-600',
      'Humanities': 'hover:bg-purple-600'  
    };

    const descriptions = {
      'Departmental': 'Advanced courses in your department specialization',
      'Open': 'Courses from various departments available to multiple departments - check eligibility',
      'Humanities': 'Philosophy, communication, economics, and management courses'
    };

    return {
      id: category,
      title: category === 'Open' ? 'Open Elective' : category,
      description: descriptions[category as keyof typeof descriptions] || `${category} electives`,
      icon: icons[category as keyof typeof icons] || BookOpen,
      color: colors[category as keyof typeof colors] || 'bg-gray-500',
      hoverColor: hoverColors[category as keyof typeof hoverColors] || 'hover:bg-gray-600'
    };
  });

  const handleCategorySelect = (category: string) => {
    // Check if total elective limit reached
    if (selectedCategories.size >= totalElectiveLimit) {
      addNotification({
        type: 'error',
        title: 'Selection Limit Reached',
        message: `You have reached the maximum limit of ${totalElectiveLimit} electives for this semester.`
      });
      return;
    }
    
    if (!canSelectFromCategory(category)) {
      addNotification({
        type: 'warning',
        title: 'Category Already Selected',
        message: `You have already selected an elective from the ${category} category for this semester.`
      });
      return;
    }
    setSelectedCategory(category);
    setSelectedTrack(''); // Reset track selection
  };

  const handleElectiveSelect = async (electiveId: string) => {
    const elective = electives.find(e => e.id === electiveId);
    if (!elective) return;

    // Check if total elective limit reached
    if (selectedCategories.size >= totalElectiveLimit) {
      addNotification({
        type: 'error',
        title: 'Selection Limit Reached',
        message: `You have reached the maximum limit of ${totalElectiveLimit} electives for this semester.`
      });
      return;
    }

    // Check if already selected any category from this elective's categories
    const hasConflict = elective.category.some(cat => !canSelectFromCategory(cat));
    if (hasConflict) {
      const conflictingCategory = elective.category.find(cat => !canSelectFromCategory(cat));
      addNotification({
        type: 'warning',
        title: 'Category Already Selected',
        message: `You have already selected an elective from the ${conflictingCategory} category for this semester.`
      });
      return;
    }

    // Check if already selected this specific elective
    if (selectedElectivesThisSemester.some(se => se.electiveId === electiveId)) {
      addNotification({
        type: 'warning',
        title: 'Already Selected',
        message: 'You have already selected this elective for this semester.'
      });
      return;
    }

    // Check if selection is open (default to true if function not available)
    const selectionOpen = isElectiveSelectionOpen ? isElectiveSelectionOpen(electiveId) : true;
    if (!selectionOpen) {
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
      console.log('🎯 Student selecting elective:', { electiveId, electiveName: elective.name, semester: electiveSelectionSemester });
      
      // CRITICAL FIX: Await the selectElective to ensure database save completes
      const success = await selectElective(user.id, electiveId, electiveSelectionSemester);
      
      if (success) {
        console.log('✅ Elective selection saved to database successfully!');
        addNotification({
          type: 'success',
          title: 'Elective Selected',
          message: `You have successfully selected "${elective.name}" for Semester ${electiveSelectionSemester}!`
        });
        
        // Reset selections to go back to category view
        setSelectedCategory(null);
        setSelectedTrack('');
      } else {
        console.error('❌ Failed to save elective selection to database');
        addNotification({
          type: 'error',
          title: 'Selection Failed',
          message: 'Failed to save elective selection to database. Please try again.'
        });
      }
    } catch (error) {
      console.error('❌ Error selecting elective:', error);
      addNotification({
        type: 'error',
        title: 'Selection Failed',
        message: 'Failed to select elective. Please try again.'
      });
    }
  };

  const handleShowInfo = (elective: Elective) => {
    setSelectedElectiveInfo(elective);
    setShowInfoModal(true);
  };

  const getTrackColor = (track: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500'
    ];
    return colors[track.length % colors.length];
  };

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Select Your Elective Category for Semester {electiveSelectionSemester}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose from available elective categories to enhance your learning experience
            </p>
            
            {/* Primary Track Info Banner */}
            {studentPrimaryTrack && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">🎯</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">Your Primary Track</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">{studentPrimaryTrack}</p>
                  </div>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  ⭐ Electives from this track will be marked as "Recommended" to help you continue your specialization
                </p>
              </div>
            )}
            
            <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200">
                You can select one elective from each category (up to {totalElectiveLimit} total). Currently selected: {selectedCategories.size}/{totalElectiveLimit}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {categoryData.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.has(category.id);
              const canSelect = canSelectFromCategory(category.id);
              
              // Get the selected elective for this category
              const selectedElective = selectedElectivesThisSemester.find(se => {
                const elec = electives.find(e => e.id === se.electiveId);
                return elec?.category.includes(category.id);
              });
              
              const selectedElectiveData = selectedElective 
                ? electives.find(e => e.id === selectedElective.electiveId)
                : null;
              
              return (
                <div
                  key={category.id}
                  onClick={() => canSelect && handleCategorySelect(category.id)}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center transform transition-all duration-200 ${
                    canSelect ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'cursor-not-allowed'
                  } ${isSelected ? 'ring-4 ring-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}
                >
                  <div className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {category.description}
                  </p>
                  
                  {isSelected && selectedElectiveData ? (
                    <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-500">
                      <div className="flex items-center justify-center text-green-700 dark:text-green-300 font-bold mb-2">
                        <Check className="w-5 h-5 mr-2" />
                        Already Selected
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-semibold">{selectedElectiveData.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {selectedElectiveData.code} • {selectedElectiveData.credits} Credits
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Track: {selectedElectiveData.track}
                        </p>
                      </div>
                    </div>
                  ) : canSelect ? (
                    <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                      Select Category
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                      Already Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show selected electives for this semester */}
          {selectedElectivesThisSemester.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Selected Electives for Semester {electiveSelectionSemester}
              </h3>
              <div className="grid gap-4">
                {selectedElectivesThisSemester.map((se) => {
                  const elective = electives.find(e => e.id === se.electiveId);
                  if (!elective) return null;
                  
                  return (
                    <div key={se.electiveId} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{elective.name}</h4>
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {elective.code} • {elective.credits} Credits • {elective.track}
                        </p>
                        {elective.category && elective.category.map((cat, idx) => (
                          <span key={idx} className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                            cat === 'Departmental' ? 'bg-blue-500' :
                            cat === 'Humanities' ? 'bg-purple-500' : 'bg-green-500'
                          }`}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Get tracks and available electives for the selected category
  const tracks = getAvailableTracks();
  const availableElectives = getFilteredElectives();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mr-4"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Categories
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {categoryData.find(c => c.id === selectedCategory)?.title} Electives
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {categoryData.find(c => c.id === selectedCategory)?.description}
            </p>
          </div>
        </div>

        {/* Primary Track Info Banner */}
        {studentPrimaryTrack && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 dark:border-green-400 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="text-2xl mt-1">🎯</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">Your Primary Track:</p>
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-600 text-white">
                    {studentPrimaryTrack}
                  </span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Electives matching your primary track are marked with ⭐ <span className="font-semibold">Recommended for Your Track</span> to help you specialize further.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Track Selection */}
        {tracks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select a Track
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setSelectedTrack('')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedTrack === '' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <span className="font-medium text-gray-900 dark:text-white">All Tracks</span>
              </button>
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTrack === track.name 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-white">{track.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Electives Grid */}
        <div className="grid gap-6">
          {availableElectives.map((elective) => {
            const alreadySelected = selectedElectivesThisSemester.some(se => se.electiveId === elective.id);
            const categorySelected = elective.category.some(cat => !canSelectFromCategory(cat));
            const availability = isElectiveAvailable(elective.id);
            const selectionOpen = isElectiveSelectionOpen ? isElectiveSelectionOpen(elective.id) : true;
            
            return (
              <div key={elective.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Elective Image */}
                {elective.image && (
                  <div className="h-48 w-full">
                    <img 
                      src={elective.image} 
                      alt={elective.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300/6366f1/ffffff?text=' + encodeURIComponent(elective.name.substring(0, 2));
                      }}
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{elective.name}</h3>
                        {studentPrimaryTrack && elective.track === studentPrimaryTrack && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md animate-pulse">
                            ⭐ Recommended for Your Track
                          </span>
                        )}
                        <button
                          onClick={() => handleShowInfo(elective)}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          title="View elective details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{elective.code} • {elective.credits} Credits</p>
                        <div className="flex gap-1">
                          {elective.subjectType && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-purple-500">
                              {elective.subjectType}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                            elective.electiveCategory === 'Lab' ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {elective.electiveCategory}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTrackColor(elective.track)}`}>
                      {elective.track}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{elective.description}</p>
                  
                  {/* Deadline Display - Always visible */}
                  {(elective.deadline || elective.selectionDeadline) && (
                    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Deadline: </span>
                        <span className={`text-sm font-semibold ${
                          selectionOpen 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {new Date(elective.deadline || elective.selectionDeadline!).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {elective.prerequisites && elective.prerequisites.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prerequisites: </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {elective.prerequisites.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Multi-department info for Open electives */}
                  {elective.category && elective.category.includes('Open') && (elective.offeredBy || (elective.eligibleDepartments && elective.eligibleDepartments.length > 0)) && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      {elective.offeredBy && (
                        <div className="mb-1">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Offered by: </span>
                          <span className="text-sm text-green-600 dark:text-green-400">{elective.offeredBy}</span>
                        </div>
                      )}
                      {elective.eligibleDepartments && elective.eligibleDepartments.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Available to: </span>
                          <span className="text-sm text-green-600 dark:text-green-400">
                            {elective.eligibleDepartments.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deadline Display */}
                  {elective.selectionDeadline && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selection Deadline: </span>
                        <span className={`text-sm font-medium ${
                          selectionOpen 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {new Date(elective.selectionDeadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Enrollment Status */}
                  {elective.maxEnrollment && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enrollment:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            (elective.enrolledStudents || 0) >= elective.maxEnrollment 
                              ? 'text-red-600 dark:text-red-400' 
                              : (elective.enrolledStudents || 0) / elective.maxEnrollment >= 0.8
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {elective.enrolledStudents || 0} / {elective.maxEnrollment}
                          </span>
                          {(elective.enrolledStudents || 0) >= elective.maxEnrollment && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-medium">
                              Full
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            (elective.enrolledStudents || 0) >= elective.maxEnrollment 
                              ? 'bg-red-500' 
                              : (elective.enrolledStudents || 0) / elective.maxEnrollment >= 0.8
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min(((elective.enrolledStudents || 0) / elective.maxEnrollment) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Semester {elective.semester}
                    </div>
                    {!selectionOpen && (
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">Deadline Passed</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleElectiveSelect(elective.id)}
                      disabled={
                        alreadySelected || 
                        categorySelected || 
                        !availability.available || 
                        !selectionOpen ||
                        !!(elective.maxEnrollment && (elective.enrolledStudents || 0) >= elective.maxEnrollment)
                      }
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        alreadySelected || categorySelected || !availability.available || !selectionOpen || 
                        (elective.maxEnrollment && (elective.enrolledStudents || 0) >= elective.maxEnrollment)
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {alreadySelected ? 'Already Selected' : 
                       categorySelected ? 'Category Selected' :
                       !availability.available ? 'Not Available' :
                       !selectionOpen ? 'Registration Closed' :
                       (elective.maxEnrollment && (elective.enrolledStudents || 0) >= elective.maxEnrollment) ? 'Enrollment Full' :
                       'Select Elective'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {availableElectives.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No electives available in this category {selectedTrack && `for ${selectedTrack} track`}.
            </p>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && selectedElectiveInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedElectiveInfo.name} - Details
                </h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
              
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p><strong>Code:</strong> {selectedElectiveInfo.code}</p>
                <p><strong>Credits:</strong> {selectedElectiveInfo.credits}</p>
                <p><strong>Track:</strong> {selectedElectiveInfo.track}</p>
                <p><strong>Category:</strong> {selectedElectiveInfo.category}</p>
                <p><strong>Type:</strong> {selectedElectiveInfo.electiveCategory}</p>
                <p><strong>Description:</strong> {selectedElectiveInfo.description}</p>
                {selectedElectiveInfo.prerequisites && selectedElectiveInfo.prerequisites.length > 0 && (
                  <p><strong>Prerequisites:</strong> {selectedElectiveInfo.prerequisites.join(', ')}</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentElectiveSelection;
