import React from 'react';
import { X, Clock, BookOpen } from 'lucide-react';
import type { Elective } from '../../contexts/DataContext';

interface ElectiveInfoModalProps {
  elective: Elective;
  isOpen: boolean;
  onClose: () => void;
  isDeadlinePassed?: boolean;
  futureElectives?: Elective[];
}

const ElectiveInfoModal: React.FC<ElectiveInfoModalProps> = ({
  elective,
  isOpen,
  onClose,
  isDeadlinePassed = false,
  futureElectives = []
}) => {
  if (!isOpen) return null;

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    return new Date(deadline).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {elective.name}
              </h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-gray-600 dark:text-gray-300">{elective.code}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                  elective.category === 'Practical' ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {elective.category}
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  {elective.credits} Credits
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Elective Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{elective.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Semester</h4>
                  <p className="text-gray-600 dark:text-gray-300">{elective.semester}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">track</h4>
                  <p className="text-gray-600 dark:text-gray-300">{elective.track}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Department</h4>
                  <p className="text-gray-600 dark:text-gray-300">{elective.department}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Category</h4>
                  <p className="text-gray-600 dark:text-gray-300">{elective.electiveCategory}</p>
                </div>
              </div>

              {elective.selectionDeadline && (
                <div className={`p-4 rounded-lg border ${
                  isDeadlinePassed 
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900' 
                    : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900'
                }`}>
                  <div className="flex items-center">
                    <Clock className={`w-5 h-5 mr-2 ${
                      isDeadlinePassed ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        isDeadlinePassed ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {isDeadlinePassed ? 'Selection Deadline Passed' : 'Selection Deadline'}
                      </p>
                      <p className={`text-sm ${
                        isDeadlinePassed ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'
                      }`}>
                        {formatDeadline(elective.selectionDeadline)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {elective.prerequisites && elective.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Prerequisites
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {elective.prerequisites.map(prereqId => (
                      <span
                        key={prereqId}
                        className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                      >
                        {prereqId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Curriculum Image */}
            <div className="space-y-4">
              {elective.infoImage ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Course Curriculum
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={elective.infoImage} 
                      alt={`${elective.name} curriculum`}
                      className="w-full h-auto max-h-96 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No curriculum image available
                  </p>
                </div>
              )}

              {futureElectives.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Future Opportunities
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    If you choose this elective, these options become available:
                  </p>
                  <div className="space-y-2">
                    {futureElectives.map(future => (
                      <div
                        key={future.id}
                        className="p-3 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-200">
                              {future.name}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                              {future.code} • Semester {future.semester}
                            </p>
                          </div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {future.track}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElectiveInfoModal;
