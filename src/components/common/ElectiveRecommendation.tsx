import React, { useState } from 'react';
import { Lightbulb, Target, BookOpen, TrendingUp, Star } from 'lucide-react';
import type { Elective } from '../../contexts/DataContext';

interface ElectiveRecommendationProps {
  studentId: string;
  currentSemester: number;
  completedElectives: string[];
  availableElectives: Elective[];
  onGetRecommendations: (preferences: {
    interests: string[];
    careerGoals: string;
    difficulty: string;
  }) => Elective[];
}

const ElectiveRecommendation: React.FC<ElectiveRecommendationProps> = ({
  studentId,
  currentSemester,
  completedElectives,
  availableElectives,
  onGetRecommendations
}) => {
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [preferences, setPreferences] = useState({
    interests: [] as string[],
    careerGoals: '',
    difficulty: 'balanced'
  });
  const [recommendations, setRecommendations] = useState<Elective[]>([]);

  const interestOptions = [
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Cybersecurity',
    'Web Development',
    'Mobile Development',
    'Cloud Computing',
    'IoT',
    'Blockchain',
    'Software Engineering',
    'Database Systems',
    'Computer Networks',
    'Human-Computer Interaction',
    'Graphics and Visualization',
    'Algorithms and Theory'
  ];

  const careerGoals = [
    'Software Developer',
    'Data Scientist',
    'AI Engineer',
    'Cybersecurity Specialist',
    'Full Stack Developer',
    'DevOps Engineer',
    'Product Manager',
    'Research Scientist',
    'System Administrator',
    'Mobile App Developer',
    'Game Developer',
    'UI/UX Designer',
    'Cloud Architect',
    'Startup Founder',
    'Technical Consultant'
  ];

  const handleInterestChange = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleGetRecommendations = () => {
    const recs = onGetRecommendations(preferences);
    setRecommendations(recs);
  };

  const getMatchScore = (elective: Elective) => {
    let score = 0;
    
    // track matching
    if (preferences.interests.includes(elective.track)) score += 3;
    
    // Career goal keyword matching
    if (elective.description.toLowerCase().includes(preferences.careerGoals.toLowerCase())) score += 2;
    
    // Difficulty preference
    if (preferences.difficulty === 'easy' && elective.category === 'Theory') score += 1;
    if (preferences.difficulty === 'challenging' && elective.category === 'Practical') score += 1;
    
    return score;
  };

  const getRecommendationReason = (elective: Elective) => {
    const reasons = [];
    
    if (preferences.interests.includes(elective.track)) {
      reasons.push(`Matches your interest in ${elective.track}`);
    }
    
    if (elective.description.toLowerCase().includes(preferences.careerGoals.toLowerCase())) {
      reasons.push(`Relevant to your career goal: ${preferences.careerGoals}`);
    }
    
    if (preferences.difficulty === 'easy' && elective.category === 'Theory') {
      reasons.push('Theory-based course suitable for easier learning curve');
    }
    
    if (preferences.difficulty === 'challenging' && elective.category === 'Practical') {
      reasons.push('Hands-on practical course for challenging experience');
    }
    
    if (reasons.length === 0) {
      reasons.push('Good foundation course for your semester');
    }
    
    return reasons;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Smart Elective Recommendations
          </h2>
        </div>
        <button
          onClick={() => setShowRecommendationForm(!showRecommendationForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showRecommendationForm ? 'Hide' : 'Get Recommendations'}
        </button>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Get personalized elective recommendations based on your interests and career goals.
      </p>

      {showRecommendationForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Select Your Interests
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {interestOptions.map(interest => (
                <label key={interest} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.interests.includes(interest)}
                    onChange={() => handleInterestChange(interest)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {interest}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Career Goal
            </h3>
            <select
              value={preferences.careerGoals}
              onChange={(e) => setPreferences(prev => ({ ...prev, careerGoals: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select your career goal</option>
              {careerGoals.map(goal => (
                <option key={goal} value={goal}>{goal}</option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Difficulty Preference
            </h3>
            <div className="flex space-x-4">
              {[
                { value: 'easy', label: 'Easy (Theory-focused)' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'challenging', label: 'Challenging (Practical-focused)' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="difficulty"
                    value={option.value}
                    checked={preferences.difficulty === option.value}
                    onChange={(e) => setPreferences(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleGetRecommendations}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Star className="w-4 h-4 mr-2" />
            Get My Recommendations
          </button>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Recommended for You
          </h3>
          <div className="space-y-4">
            {recommendations.map((elective, index) => {
              const matchScore = getMatchScore(elective);
              const reasons = getRecommendationReason(elective);
              
              return (
                <div
                  key={elective.id}
                  className="border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">
                        #{index + 1} {elective.name}
                      </h4>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        {elective.code} • {elective.track} • {elective.credits} Credits
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < matchScore ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {matchScore}/5 match
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-green-700 dark:text-green-300 text-sm mb-3">
                    {elective.description}
                  </p>
                  
                  <div>
                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                      Why this is recommended:
                    </p>
                    <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                      {reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectiveRecommendation;
