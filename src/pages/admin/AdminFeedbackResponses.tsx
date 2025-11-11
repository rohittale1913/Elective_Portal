import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { MessageSquare, User, Clock, Filter, Eye, Download, Star, Trash2, ChevronDown } from 'lucide-react';

const AdminFeedbackResponses: React.FC = () => {
  const { 
    getFeedbackResponses, 
    getActiveFeedbackTemplates,
    getAvailableDepartments,
    getAvailableSemesters,
    getAvailableSections,
    deleteFeedbackResponse
  } = useData();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string[]>([]); // Changed to array for multi-select
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false); // Dropdown state
  const sectionDropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside
  const [viewDetails, setViewDetails] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setSectionDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get all feedback responses and templates
  const allResponses = getFeedbackResponses();
  const templates = getActiveFeedbackTemplates();

  // Debug logging
  console.log('📊 AdminFeedbackResponses - All responses:', allResponses.length, allResponses);
  console.log('📝 AdminFeedbackResponses - Templates:', templates.length, templates);

  // Filter responses based on selected filters
  const filteredResponses = allResponses.filter(response => {
    if (selectedTemplate !== 'all' && response.templateId !== selectedTemplate) return false;
    if (selectedDepartment !== 'all' && response.studentDepartment !== selectedDepartment) return false;
    if (selectedSemester !== 'all' && response.studentSemester !== parseInt(selectedSemester)) return false;
    if (selectedSection.length > 0 && response.studentSection && !selectedSection.includes(response.studentSection)) return false; // Multi-select logic
    return true;
  });

  // Get available values from database (not just from responses)
  const departments = getAvailableDepartments();
  const semesters = getAvailableSemesters();
  const sections = getAvailableSections();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAnswerValue = (answer: string | number | boolean | string[], questionType: string) => {
    if (questionType === 'rating') {
      return (
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= (answer as number) ? 'text-yellow-500 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600">({answer}/5)</span>
        </div>
      );
    }
    
    if (questionType === 'yes-no') {
      return (
        <span className={`px-2 py-1 rounded text-sm ${
          answer === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {answer}
        </span>
      );
    }
    
    if (questionType === 'multiple-choice') {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {answer}
        </span>
      );
    }
    
    // Text response
    return (
      <div className="bg-gray-50 p-3 rounded border">
        <p className="text-sm text-gray-700">{answer}</p>
      </div>
    );
  };

  const exportResponses = () => {
    console.log('📥 Exporting feedback responses...');
    console.log('Total responses:', allResponses.length);
    console.log('Filtered responses:', filteredResponses.length);
    console.log('Responses data:', filteredResponses);
    
    if (filteredResponses.length === 0) {
      alert('No feedback responses to export. Please check if there are any responses submitted.');
      return;
    }
    
    const csvContent = [
      ['Student Name', 'Department', 'Semester', 'Section', 'Template', 'Question', 'Answer', 'Submitted At'].join(','),
      ...filteredResponses.flatMap(response =>
        response.responses.map(resp => [
          response.studentName,
          response.studentDepartment,
          response.studentSemester,
          response.studentSection || 'N/A',
          response.templateTitle,
          resp.question.replace(/,/g, ';'),
          String(resp.answer).replace(/,/g, ';'),
          formatDate(response.submittedAt)
        ].join(','))
      )
    ].join('\n');

    console.log('CSV content generated:', csvContent.substring(0, 200) + '...');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_responses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Export completed');
  };

  const handleDeleteResponse = async (responseId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete the feedback response from ${studentName}?`)) {
      await deleteFeedbackResponse(responseId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Responses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and analyze student feedback responses
          </p>
        </div>
        <button
          onClick={exportResponses}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{allResponses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(allResponses.map(r => r.studentId)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Filter className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{templates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredResponses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Templates</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div ref={sectionDropdownRef} className="relative">
            <label htmlFor="section-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section
            </label>
            <button
              type="button"
              onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-left flex justify-between items-center"
            >
              <span className={selectedSection.length === 0 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}>
                {selectedSection.length === 0 
                  ? 'All Sections' 
                  : `${selectedSection.length} selected: ${selectedSection.join(', ')}`}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>
            
            {sectionDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSection.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSection([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">All Sections</span>
                  </label>
                  {sections.map(sec => (
                    <label key={sec} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSection.includes(sec)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSection(prev => [...prev, sec]);
                          } else {
                            setSelectedSection(prev => prev.filter(s => s !== sec));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Section {sec}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responses List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Responses ({filteredResponses.length})
        </h2>
        
        {filteredResponses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Responses Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No feedback responses match your current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResponses.map((response) => (
              <div key={response.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {response.templateTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                      <span className="flex items-center text-gray-700 dark:text-gray-300">
                        <User className="w-4 h-4 mr-1" />
                        {response.studentName}
                      </span>
                      {response.studentDepartment && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          {response.studentDepartment}
                        </span>
                      )}
                      {response.studentSemester && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                          Semester {response.studentSemester}
                        </span>
                      )}
                      {response.studentSection && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium">
                          Section {response.studentSection}
                        </span>
                      )}
                      <span className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(response.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewDetails(viewDetails === response.id ? null : response.id)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {viewDetails === response.id ? 'Hide' : 'View'} Details
                    </button>
                    <button
                      onClick={() => handleDeleteResponse(response.id, response.studentName)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                      title="Delete response"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>

                {viewDetails === response.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Responses:</h4>
                    <div className="space-y-4">
                      {response.responses.map((resp, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-900 p-4 rounded border">
                          <p className="font-medium text-gray-900 dark:text-white mb-2">
                            {index + 1}. {resp.question}
                          </p>
                          {renderAnswerValue(resp.answer, resp.questionType)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackResponses;
