import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, FeedbackQuestion } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { MessageSquare, Send, Star, CheckCircle } from 'lucide-react';

const StudentFeedback: React.FC = () => {
  const { user } = useAuth();
  const { getActiveFeedbackTemplates, submitFeedbackResponse, getStudentSubmittedTemplates } = useData();
  const { addNotification } = useNotifications();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [responses, setResponses] = useState<Record<string, string | number | boolean | string[]>>({});

  if (!user || user.role !== 'student') return null;

  const allTemplates = getActiveFeedbackTemplates();
  const submittedTemplates = getStudentSubmittedTemplates(user.id);

  console.log('📝 All templates:', allTemplates);
  console.log('👤 User info:', { 
    department: user.department, 
    semester: user.semester, 
    section: user.section 
  });

  // Filter templates based on student's department, semester, and section
  const feedbackTemplates = allTemplates.filter(template => {
    console.log('🔍 Filtering template:', template.title, {
      targetDepartment: template.targetDepartment,
      targetSemester: template.targetSemester,
      targetSection: template.targetSection,
      targetCategory: template.targetCategory
    });

    // If no target filters are set, show to everyone
    const hasNoFilters = !template.targetDepartment && !template.targetSemester && (!template.targetSection || (Array.isArray(template.targetSection) && template.targetSection.length === 0));
    if (hasNoFilters) {
      console.log('✅ No filters - showing to everyone');
      return true;
    }

    // Check department match
    const departmentMatch = !template.targetDepartment || template.targetDepartment === user.department;
    
    // Check semester match
    const semesterMatch = !template.targetSemester || template.targetSemester === user.semester;
    
    // Check section match (handles both string and array)
    let sectionMatch = true;
    if (template.targetSection) {
      if (Array.isArray(template.targetSection)) {
        // If it's an array, check if student's section is in the array
        sectionMatch = template.targetSection.length === 0 || template.targetSection.some(s => s.toLowerCase() === user.section?.toLowerCase());
      } else {
        // If it's a string, do direct comparison
        sectionMatch = template.targetSection.toLowerCase() === user.section?.toLowerCase();
      }
    }

    console.log('🎯 Filter results:', { departmentMatch, semesterMatch, sectionMatch });

    // Template is visible if all specified filters match
    const shouldShow = departmentMatch && semesterMatch && sectionMatch;
    console.log(shouldShow ? '✅ Template visible' : '❌ Template hidden');
    return shouldShow;
  });

  console.log('📋 Filtered templates:', feedbackTemplates.length, 'out of', allTemplates.length);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setResponses({});
  };

  const handleResponseChange = (questionId: string, value: string | number | boolean | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = feedbackTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;

    // Check if all required questions are answered
    const requiredQuestions = template.questions.filter(q => q.required);
    const missingResponses = requiredQuestions.filter(q => !responses[q.id]);
    
    if (missingResponses.length > 0) {
      addNotification({
        type: 'error',
        title: 'Incomplete Form',
        message: 'Please answer all required questions before submitting.'
      });
      return;
    }

    try {
      // Submit feedback response
      const responseData = {
        templateId: selectedTemplate,
        templateTitle: template.title,
        studentId: user.id,
        studentName: user.name,
        studentDepartment: user.department,
        studentSemester: user.semester,
        studentSection: user.section,
        responses: template.questions.map(q => ({
          questionId: q.id,
          question: q.question,
          answer: responses[q.id] || '',
          questionType: q.type
        }))
      };

      await submitFeedbackResponse(responseData);
      setSelectedTemplate('');
      setResponses({});
      
      addNotification({
        type: 'success',
        title: 'Feedback Submitted',
        message: 'Thank you for your feedback! Your responses have been recorded.'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.'
      });
    }
  };

  const renderQuestion = (question: FeedbackQuestion) => {
    const value = responses[question.id] || '';

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div>
            {question.options?.map((option: string, index: number) => (
              <label key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'rating': {
        const numericValue = typeof value === 'number' ? value : 0;
        return (
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => handleResponseChange(question.id, rating)}
                className={`p-1 ${numericValue >= rating ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {numericValue ? `${numericValue}/5` : 'Select rating'}
            </span>
          </div>
        );
      }
      
      case 'text': {
        const textValue = typeof value === 'string' ? value : '';
        return (
          <textarea
            value={textValue}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your response..."
          />
        );
      }
      
      case 'yes-no':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={value === 'yes'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={value === 'no'}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="mr-2"
              />
              No
            </label>
          </div>
        );
      
      default:
        return null;
    }
  };

  const selectedTemplateObj = feedbackTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-6">
            <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Feedback</h1>
              <p className="text-gray-600 mt-2">
                Share your thoughts and help us improve your learning experience
              </p>
            </div>
          </div>

          {feedbackTemplates.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Forms Available</h3>
              <p className="text-gray-600">Check back later for feedback opportunities.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Feedback Forms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedbackTemplates.map(template => (
                    <div 
                      key={template.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${
                        submittedTemplates.includes(template.id) 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                      onClick={() => !submittedTemplates.includes(template.id) && handleTemplateSelect(template.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{template.title}</h3>
                        {submittedTemplates.includes(template.id) && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{template.questions.length} questions</span>
                        {template.targetCategory && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {template.targetCategory}
                          </span>
                        )}
                      </div>
                      {submittedTemplates.includes(template.id) && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          ✓ Completed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Template Form */}
              {selectedTemplateObj && (
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {selectedTemplateObj.title}
                  </h2>
                  <p className="text-gray-600 mb-6">{selectedTemplateObj.description}</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {selectedTemplateObj.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          {index + 1}. {question.question}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderQuestion(question)}
                      </div>
                    ))}
                    
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate('')}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Feedback
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFeedback;
