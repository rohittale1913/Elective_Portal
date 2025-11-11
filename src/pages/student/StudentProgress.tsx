import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { BookOpen, TrendingUp, Calendar } from 'lucide-react';

const StudentProgress: React.FC = () => {
  const { user } = useAuth();
  const { electives, getStudentElectives, tracks } = useData();

  // Memoize student electives
  const studentElectives = React.useMemo(() => 
    user ? getStudentElectives(user.id) : [], 
    [user, getStudentElectives]
  );

  // DEBUG: Log to understand what data we have
  React.useEffect(() => {
    console.log('📊 StudentProgress Debug:');
    console.log('  - User ID:', user?.id);
    console.log('  - User Role:', user?.role);
    console.log('  - Student Electives:', studentElectives);
    console.log('  - Total Electives Available:', electives.length);
    console.log('  - Total Tracks:', tracks.length);
    console.log('  - Raw localStorage studentElectives:', localStorage.getItem('studentElectives'));
  }, [user, studentElectives, electives, tracks]);
  
  // Group electives by semester
  const electivesBySemester = React.useMemo(() => {
    const semesters: { [key: number]: typeof studentElectives } = {};
    
    studentElectives.forEach(se => {
      if (!semesters[se.semester]) {
        semesters[se.semester] = [];
      }
      semesters[se.semester].push(se);
    });
    
    console.log('📊 Electives by semester:', semesters);
    return semesters;
  }, [studentElectives]);

  if (!user || user.role !== 'student') return null;

  // Get current track from student's elective selections
  const currentTrackName = studentElectives.length > 0 
    ? studentElectives[0].track 
    : null;
    
  const currentTrack = currentTrackName 
    ? tracks.find(t => t.name === currentTrackName)
    : null;

  console.log('🎯 Track Debug:', { currentTrackName, currentTrack });

  // Get current semester
  const currentSemester = user.semester || 1;
  
  // Only show semesters that have selections (from database)
  const semestersWithSelections = Object.keys(electivesBySemester)
    .map(Number)
    .sort((a, b) => a - b);
  
  console.log('📅 Semesters with selections:', semestersWithSelections);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          My Progress
        </h1>
        <p className="text-gray-600 mt-2">
          Track your elective journey and academic progress
        </p>
      </div>

      {/* Current Track */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Current Elective Track
        </h2>
        
        {currentTrack ? (
          <div 
            className="p-6 rounded-lg border-2"
            style={{ 
              borderColor: currentTrack.color || '#4F46E5',
              backgroundColor: `${currentTrack.color || '#4F46E5'}10`
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentTrack.name}
                </h3>
                <p className="text-gray-600 mb-3">
                  {currentTrack.department}
                </p>
                <span 
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: currentTrack.color || '#4F46E5' }}
                >
                  {currentTrack.category}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No track selected yet</p>
            <p className="text-sm text-gray-500 mt-1">Visit the Roadmap page to select your track</p>
          </div>
        )}
      </div>

      {/* Previous Elective Selections */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Previous Elective Selections
        </h2>
        
        {semestersWithSelections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No electives taken yet</p>
            <p className="text-gray-400 text-sm mt-2">Start selecting electives to see your progress here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {semestersWithSelections.map((semester: number) => {
              const semesterElectives = electivesBySemester[semester] || [];
              const isPast = semester < currentSemester;
              const isCurrent = semester === currentSemester;
              
              return (
                <div 
                  key={semester}
                  className={`p-4 rounded-lg border-2 ${
                    isPast ? 'bg-green-50 border-green-200' :
                    isCurrent ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold ${
                      isPast ? 'text-green-800' :
                      isCurrent ? 'text-blue-800' :
                      'text-gray-600'
                    }`}>
                      Semester {semester}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isPast ? 'bg-green-100 text-green-800' :
                      isCurrent ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {isPast ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {semesterElectives.map(se => {
                      const elective = electives.find(e => e.id === se.electiveId);
                      if (!elective) return null;
                      
                      return (
                        <div 
                          key={se.electiveId}
                          className="p-2 bg-white rounded border text-sm"
                        >
                          <div className="font-medium text-gray-900 mb-1">
                            {elective.name}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>{elective.code} • {elective.credits} Credits</div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                elective.category.includes('Departmental') ? 'bg-blue-100 text-blue-700' :
                                elective.category.includes('Humanities') ? 'bg-purple-100 text-purple-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {elective.category.join(', ')}
                              </span>
                              {elective.subjectType && (
                                <span className={`px-1 py-0.5 rounded text-xs ${
                                  elective.subjectType === 'Theory' ? 'bg-green-100 text-green-700' :
                                  elective.subjectType === 'Practical' ? 'bg-orange-100 text-orange-700' :
                                  'bg-purple-100 text-purple-700'
                                }`}>
                                  {elective.subjectType === 'Theory+Practical' ? 'Theory+Practical' : elective.subjectType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgress;
