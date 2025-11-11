import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import type { Elective } from '../../contexts/DataContext';
import { Map, Book, Users, Globe, CheckCircle, Clock, Target, Info } from 'lucide-react';

const StudentRoadmap: React.FC = () => {
  const { user } = useAuth();
  const { 
    electives, 
    getStudentElectives 
  } = useData();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Departmental');

  if (!user || user.role !== 'student') return null;

  const studentElectives = getStudentElectives(user.id);
  const currentSemester = user.semester || 5;

  // Category configuration
  const categoryConfig = {
    'Departmental': {
      title: 'Departmental Electives',
      icon: Book,
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      description: 'Core technical courses in your specialization',
      requirement: 4
    },
    'Humanities': {
      title: 'Humanities Electives',
      icon: Users,
      color: 'bg-purple-500',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50',
      description: 'Soft skills and liberal arts courses',
      requirement: 2
    },
    'Open': {
      title: 'Open Electives',
      icon: Globe,
      color: 'bg-green-500',
      borderColor: 'border-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
      description: 'Interdisciplinary courses from any department',
      requirement: 2
    }
  };

  const categories = Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>;

  // Get electives for selected category
  const getElectivesForCategory = (category: string) => {
    return electives.filter(e => e.category === category && e.department === user.department);
  };

  // Get completed electives for category
  const getCompletedElectives = (category: string) => {
    return studentElectives.filter(se => {
      const elective = electives.find(e => e.id === se.electiveId);
      return elective?.category === category;
    });
  };

  // Group electives by semester
  const groupElectivesBySemester = (categoryElectives: Elective[]) => {
    const grouped = categoryElectives.reduce((acc, elective) => {
      const semester = elective.semester;
      if (!acc[semester]) acc[semester] = [];
      acc[semester].push(elective);
      return acc;
    }, {} as Record<number, Elective[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([semester, electiveList]) => ({
        semester: parseInt(semester),
        electives: electiveList
      }));
  };

  const selectedCategoryData = categoryConfig[selectedCategory as keyof typeof categoryConfig];
  const categoryElectives = getElectivesForCategory(selectedCategory);
  const completedElectives = getCompletedElectives(selectedCategory);
  const semesterGroups = groupElectivesBySemester(categoryElectives);

  const isElectiveCompleted = (electiveId: string) => {
    return studentElectives.some(se => se.electiveId === electiveId);
  };

  const canTakeElective = (elective: Elective) => {
    return elective.semester <= currentSemester && !isElectiveCompleted(elective.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Map className="w-8 h-8 text-blue-600" />
          Elective Roadmap
        </h1>
        <p className="text-gray-600 mt-2">
          Plan your elective journey with a clear semester-wise view
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
          {categories.map((category) => {
            const config = categoryConfig[category];
            const IconComponent = config.icon;
            const completed = getCompletedElectives(category).length;
            const required = config.requirement;
            
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
                  selectedCategory === category
                    ? `${config.color} text-white shadow-md`
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{config.title}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedCategory === category 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {completed}/{required}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Info */}
      <div className={`p-4 rounded-lg ${selectedCategoryData.bgLight} border ${selectedCategoryData.borderColor} mb-8`}>
        <div className="flex items-start gap-3">
          <Info className={`w-6 h-6 ${selectedCategoryData.textColor} mt-0.5`} />
          <div>
            <h3 className={`font-semibold ${selectedCategoryData.textColor}`}>
              {selectedCategoryData.title}
            </h3>
            <p className="text-gray-700 mt-1">{selectedCategoryData.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Required: {selectedCategoryData.requirement} electives</span>
              <span>Completed: {completedElectives.length}</span>
              <span>Remaining: {Math.max(0, selectedCategoryData.requirement - completedElectives.length)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Electives by Semester */}
      <div className="space-y-8">
        {semesterGroups.map(({ semester, electives: semesterElectives }) => {
          const isPastSemester = semester < currentSemester;
          const isCurrentSemester = semester === currentSemester;

          return (
            <div key={semester} className="relative">
              {/* Semester Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  isPastSemester ? 'bg-gray-500' :
                  isCurrentSemester ? selectedCategoryData.color :
                  'bg-gray-300'
                } text-white font-bold`}>
                  {semester}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Semester {semester}
                    {isCurrentSemester && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${selectedCategoryData.color} text-white`}>
                        Current
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600">
                    {semesterElectives.length} elective{semesterElectives.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>

              {/* Electives Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-16">
                {semesterElectives.map((elective) => {
                  const isCompleted = isElectiveCompleted(elective.id);
                  const canTake = canTakeElective(elective);

                  return (
                    <div
                      key={elective.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200' 
                          : canTake 
                            ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md' 
                            : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-2">
                          {elective.name}
                        </h4>
                        {isCompleted && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{elective.code}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{elective.credits} credits</span>
                        <span>{elective.track}</span>
                      </div>

                      {elective.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {elective.description}
                        </p>
                      )}

                      {!isCompleted && !canTake && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Available in future semester</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {semesterGroups.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No electives found for {selectedCategoryData.title}
          </h3>
          <p className="text-gray-600">
            Electives for this category will be added by administrators.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentRoadmap;
