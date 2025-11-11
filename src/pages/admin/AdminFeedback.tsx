import React, { useState, useRef, useEffect } from 'react';
import { Plus, FileText, Eye, Trash2, CheckCircle, ChevronDown } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const AdminFeedback: React.FC = () => {
  const { user } = useAuth();
  const { 
    getActiveFeedbackTemplates,
    deleteFeedbackTemplate, 
    createFeedbackTemplate,
    getFeedbackResponses,
    getAvailableDepartments,
    getAvailableSemesters,
    getAvailableSections,
    getAvailableCategories,
    electives
  } = useData();
  
  // Get all categories directly from database (no filtering)
  const categoryOptions = getAvailableCategories();
  
  console.log('🔍 Categories from MongoDB:', categoryOptions);
  
  // Get all templates and responses
  const feedbackTemplates = getActiveFeedbackTemplates();
  const feedbackResponses = getFeedbackResponses();
  
  // Get dynamic values from database
  const availableDepartments = getAvailableDepartments();
  const availableSemesters = getAvailableSemesters();
  const availableSections = getAvailableSections();
  
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
    targetCategory: 'Departmental' as 'Departmental' | 'Open' | 'Humanities',
    targetElectiveName: '', // NEW: For selecting specific elective
    targetDepartment: '',
    targetSemester: undefined as number | undefined,
    targetSection: [] as string[],
    isActive: true,
    createdBy: 'admin',
    questions: [{ 
      id: '',
      question: '', 
      type: 'text' as 'text' | 'rating' | 'multiple-choice' | 'yes-no', 
      options: [] as string[],
      required: true
    }]
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false); // Dropdown state
  const sectionDropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside

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

  // Get elective names based on selected category
  const getElectivesByCategory = () => {
    if (!newTemplate.targetCategory) return [];
    return electives.filter(e => e.category.includes(newTemplate.targetCategory));
  };

  const addQuestion = () => {
    setNewTemplate(prev => ({
      ...prev,
      questions: [...prev.questions, { 
        id: `q_${Date.now()}`, 
        question: '', 
        type: 'text', 
        options: [], 
        required: true 
      }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: string | boolean | string[]) => {
    setNewTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const addMCQOption = (questionIndex: number) => {
    setNewTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { ...q, options: [...q.options, ''] } : q
      )
    }));
  };

  const updateMCQOption = (questionIndex: number, optionIndex: number, value: string) => {
    setNewTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, j) => j === optionIndex ? value : opt) 
            } 
          : q
      )
    }));
  };

  const removeMCQOption = (questionIndex: number, optionIndex: number) => {
    setNewTemplate(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: q.options.filter((_, j) => j !== optionIndex) } 
          : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTemplate.title.trim() && newTemplate.questions.every(q => q.question.trim())) {
      try {
        // Add IDs to questions if they don't have them
        const questionsWithIds = newTemplate.questions.map(q => ({
          ...q,
          id: q.id || `q_${Date.now()}_${Math.random()}`
        }));

        // Only send fields that match the backend schema
        const templateData: any = {
          title: newTemplate.title,
          description: newTemplate.description,
          questions: questionsWithIds,
          isActive: newTemplate.isActive,
          createdBy: user?.email || user?.name || 'admin'
        };

        // Only add optional fields if they have values
        if (newTemplate.targetCategory && newTemplate.targetCategory.trim()) {
          templateData.targetCategory = newTemplate.targetCategory;
        }
        if (newTemplate.targetDepartment && newTemplate.targetDepartment.trim()) {
          templateData.targetDepartment = newTemplate.targetDepartment;
        }
        if (newTemplate.targetSemester) {
          templateData.targetSemester = newTemplate.targetSemester;
        }
        if (newTemplate.targetSection && newTemplate.targetSection.length > 0) {
          templateData.targetSection = newTemplate.targetSection;
        }

        console.log('📝 Sending template data:', templateData);
        console.log('📝 Full newTemplate state:', newTemplate);

        await createFeedbackTemplate(templateData);
        
        setNewTemplate({
          title: '',
          description: '',
          targetCategory: 'Departmental',
          targetElectiveName: '', // Reset elective name
          targetDepartment: '',
          targetSemester: undefined,
          targetSection: [],
          isActive: true,
          createdBy: 'admin',
          questions: [{ id: '', question: '', type: 'text', options: [], required: true }]
        });
        setShowAddForm(false);
        alert('Feedback template created successfully!');
      } catch (error) {
        console.error('Error in handleSubmit:', error);
        alert(`Failed to create feedback template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback template?')) {
      deleteFeedbackTemplate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage feedback templates</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Template</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{feedbackTemplates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{feedbackResponses.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Plus className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{feedbackTemplates.filter(t => t.isActive).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Template Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Feedback Template</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Title
              </label>
              <input
                type="text"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter template title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter template description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={newTemplate.targetCategory}
                onChange={(e) => setNewTemplate(prev => ({ 
                  ...prev, 
                  targetCategory: e.target.value as 'Departmental' | 'Open' | 'Humanities',
                  targetElectiveName: '' // Reset elective when category changes
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categoryOptions.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Categories from database (only valid feedback categories shown)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Elective Name (Optional)
              </label>
              <select
                value={newTemplate.targetElectiveName}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, targetElectiveName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!newTemplate.targetCategory}
              >
                <option value="">All Electives in Category</option>
                {newTemplate.targetCategory && getElectivesByCategory().map(elective => (
                  <option key={elective.id} value={elective.name}>
                    {elective.name} ({elective.code || 'N/A'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {!newTemplate.targetCategory 
                  ? 'Select a category first to see available electives'
                  : 'Leave blank to show feedback for all electives in the category'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Department (Optional)
                </label>
                <select
                  value={newTemplate.targetDepartment}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, targetDepartment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave blank to show to all departments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Semester (Optional)
                </label>
                <select
                  value={newTemplate.targetSemester || ''}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, targetSemester: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Semesters</option>
                  {availableSemesters.map(sem => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave blank to show to all semesters
                </p>
              </div>

              <div ref={sectionDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Section (Optional)
                </label>
                {availableSections.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center"
                    >
                      <span className={newTemplate.targetSection.length === 0 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}>
                        {newTemplate.targetSection.length === 0 
                          ? 'All Sections' 
                          : `${newTemplate.targetSection.length} selected: ${newTemplate.targetSection.join(', ')}`}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${sectionDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </button>
                    
                    {sectionDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newTemplate.targetSection.length === 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTemplate(prev => ({ ...prev, targetSection: [] }));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">All Sections</span>
                          </label>
                          {availableSections.map(section => (
                            <label key={section} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newTemplate.targetSection.includes(section)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewTemplate(prev => ({
                                      ...prev,
                                      targetSection: [...prev.targetSection, section]
                                    }));
                                  } else {
                                    setNewTemplate(prev => ({
                                      ...prev,
                                      targetSection: prev.targetSection.filter(s => s !== section)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                Section {section}
                                {newTemplate.targetSection.includes(section) && (
                                  <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No sections found in database. Add students with sections first.
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Select specific sections or leave all unchecked to show to all sections
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Questions
              </label>
              <div className="space-y-3">
                {newTemplate.questions.map((question, index) => (
                  <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter question text"
                        required
                      />
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="text">Text</option>
                        <option value="rating">Rating</option>
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="yes-no">Yes/No</option>
                      </select>
                    </div>
                    
                    {/* MCQ Options - Show when type is multiple-choice */}
                    {question.type === 'multiple-choice' && (
                      <div className="mt-3 ml-4 space-y-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Multiple Choice Options:
                        </label>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateMCQOption(index, optIndex, e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded 
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeMCQOption(index, optIndex)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400"
                              disabled={question.options.length <= 2}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addMCQOption(index)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 
                                   text-xs flex items-center space-x-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Option</span>
                        </button>
                        {question.options.length < 2 && (
                          <p className="text-xs text-red-500 dark:text-red-400">
                            ⚠ At least 2 options required for multiple choice
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Required</span>
                      </label>
                      {newTemplate.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="mt-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Template
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Existing Templates</h2>
        {feedbackTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates yet</h3>
            <p className="text-gray-600 dark:text-gray-400">Create your first feedback template to get started.</p>
          </div>
        ) : (
          feedbackTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{template.title}</h3>
                  {template.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                  )}
                  <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{template.questions.length} questions</span>
                    <span className="mx-2">•</span>
                    <span>{template.targetCategory}</span>
                    <span className="mx-2">•</span>
                    <span className={template.isActive ? 'text-green-600' : 'text-red-600'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {(template.targetDepartment || template.targetSemester || (template.targetSection && (Array.isArray(template.targetSection) ? template.targetSection.length > 0 : true))) && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Target:</span>
                      {template.targetDepartment && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                          {template.targetDepartment}
                        </span>
                      )}
                      {template.targetSemester && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                          Semester {template.targetSemester}
                        </span>
                      )}
                      {template.targetSection && (
                        <>
                          {Array.isArray(template.targetSection) ? (
                            template.targetSection.map(section => (
                              <span key={section} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                                Section {section}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                              Section {template.targetSection}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Questions:</h4>
                <ul className="space-y-1">
                  {template.questions.map((question, index) => (
                    <li key={question.id} className="text-sm text-gray-600 dark:text-gray-400">
                      {index + 1}. {question.question} ({question.type})
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
