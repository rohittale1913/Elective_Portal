import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import type { Elective } from '../../contexts/DataContext';

interface PreviousElectiveFeedbackProps {
  previousElective: Elective;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    rating: number;
    comment: string;
    wouldRecommend: boolean;
    improvements: string;
  }) => void;
}

const PreviousElectiveFeedback: React.FC<PreviousElectiveFeedbackProps> = ({
  previousElective,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: '',
    wouldRecommend: true,
    improvements: ''
  });

  const [hoveredStar, setHoveredStar] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.rating === 0) {
      alert('Please provide a rating');
      return;
    }
    onSubmit(feedback);
    setFeedback({
      rating: 0,
      comment: '',
      wouldRecommend: true,
      improvements: ''
    });
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoveredStar || feedback.rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {feedback.rating > 0 && (
            <>
              {feedback.rating} out of 5 stars
              {feedback.rating <= 2 && ' (Poor)'}
              {feedback.rating === 3 && ' (Average)'}
              {feedback.rating === 4 && ' (Good)'}
              {feedback.rating === 5 && ' (Excellent)'}
            </>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Share Your Experience
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Help future students by sharing feedback about {previousElective.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Previous Elective Info */}
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Previous Elective Completed
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-900 dark:text-blue-100 font-medium">
                  {previousElective.name}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  {previousElective.code} • {previousElective.track}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                previousElective.category === 'Practical' ? 'bg-orange-500' : 'bg-blue-500'
              }`}>
                {previousElective.category}
              </span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Overall Rating *
            </label>
            {renderStars()}
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Experience
            </label>
            <textarea
              id="comment"
              rows={4}
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="What did you like about this elective? What could be improved?"
            />
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Would you recommend this elective to other students?
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recommend"
                  checked={feedback.wouldRecommend === true}
                  onChange={() => setFeedback(prev => ({ ...prev, wouldRecommend: true }))}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Yes, I would recommend it</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="recommend"
                  checked={feedback.wouldRecommend === false}
                  onChange={() => setFeedback(prev => ({ ...prev, wouldRecommend: false }))}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">No, I wouldn't recommend it</span>
              </label>
            </div>
          </div>

          {/* Improvements */}
          <div>
            <label htmlFor="improvements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suggestions for Improvement
            </label>
            <textarea
              id="improvements"
              rows={3}
              value={feedback.improvements}
              onChange={(e) => setFeedback(prev => ({ ...prev, improvements: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="What changes would make this elective better?"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreviousElectiveFeedback;
