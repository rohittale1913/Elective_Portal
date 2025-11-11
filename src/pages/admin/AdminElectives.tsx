import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import type { Elective } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Plus, Edit, Trash2, X, XCircle } from 'lucide-react';

const AdminElectives: React.FC = () => {
  const { 
    electives, 
    tracks, 
    addElective, 
    updateElective, 
    deleteElective,
    clearElectiveEnrollment,
    refreshElectives,
    getAvailableDepartments,
    getAvailableSemesters,
    getAvailableCategories
  } = useData();
  const { addNotification } = useNotifications();
  
  const [showModal, setShowModal] = useState(false);
  const [editingElective, setEditingElective] = useState<Elective | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 5,
    track: 'General',
    description: '',
    credits: 3,
    prerequisites: [] as string[],
    department: '',
    category: 'Theory' as 'Theory' | 'Practical',
    electiveCategory: 'Departmental' as 'Humanities' | 'Departmental' | 'Open',
    subjectType: 'Theory' as 'Theory' | 'Practical' | 'Theory+Practical',
    // New fields for Open electives
    offeredBy: '',
    eligibleDepartments: [] as string[],
    infoImage: '',
    selectionDeadline: '',
    futureOptions: [] as string[],
    minEnrollment: 5,
    maxEnrollment: 40
  });

  // Get departments
  const departments = getAvailableDepartments();
  
  // Filter electives by department instead of category
  const departmentFilter = ['all', ...departments];
  const filteredElectives = selectedDepartment === 'all' 
    ? electives 
    : electives.filter(e => e.department === selectedDepartment);

  // Group electives by department
  const electivesByDepartment = departments.map(department => ({
    department,
    electives: electives.filter(e => e.department === department),
    count: electives.filter(e => e.department === department).length
  })).filter(group => group.count > 0);

  const handleOpenModal = (elective?: Elective) => {
    if (elective) {
      setEditingElective(elective);
      
      // Log enrollment values for debugging
      console.log('📝 Opening edit modal for:', elective.name);
      console.log('   minEnrollment from DB:', elective.minEnrollment);
      console.log('   maxEnrollment from DB:', elective.maxEnrollment);
      
      // Format deadline for date input field
      let formattedDeadline = '';
      if (elective.deadline) {
        const deadlineDate = typeof elective.deadline === 'string' ? new Date(elective.deadline) : elective.deadline;
        if (!isNaN(deadlineDate.getTime())) {
          formattedDeadline = deadlineDate.toISOString().split('T')[0];
        }
      } else if (elective.selectionDeadline) {
        const deadlineDate = new Date(elective.selectionDeadline);
        if (!isNaN(deadlineDate.getTime())) {
          formattedDeadline = deadlineDate.toISOString().split('T')[0];
        }
      }
      
      setFormData({
        name: elective.name,
        code: elective.code || '', // Handle optional code
        semester: elective.semester,
        track: elective.track,
        description: elective.description,
        credits: elective.credits,
        prerequisites: elective.prerequisites || [],
        department: elective.department || '',
        category: 'Theory',
        electiveCategory: (elective.category && elective.category.length > 0 ? elective.category[0] : 'Departmental') as 'Humanities' | 'Departmental' | 'Open',
        subjectType: elective.subjectType || 'Theory',
        offeredBy: elective.offeredBy || '',
        eligibleDepartments: elective.eligibleDepartments || [],
        infoImage: elective.image || '',
        selectionDeadline: formattedDeadline,
        futureOptions: [],
        minEnrollment: elective.minEnrollment || 5,
        maxEnrollment: elective.maxEnrollment || 40
      });
      
      console.log('   Setting form minEnrollment to:', elective.minEnrollment || 5);
      console.log('   Setting form maxEnrollment to:', elective.maxEnrollment || 40);
    } else {
      setEditingElective(null);
      setFormData({
        name: '',
        code: '',
        semester: 5,
        track: 'General',
        description: '',
        credits: 3,
        prerequisites: [],
        department: '',
        category: 'Theory',
        electiveCategory: 'Departmental',
        subjectType: 'Theory',
        offeredBy: '',
        eligibleDepartments: [],
        infoImage: '',
        selectionDeadline: '',
        futureOptions: [],
        minEnrollment: 5,
        maxEnrollment: 40
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingElective(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Automatically determine elective category based on department
    let electiveCategory: 'Humanities' | 'Departmental' | 'Open' = 'Departmental';
    if (formData.department === 'Humanities' || formData.department === 'Liberal Arts') {
      electiveCategory = 'Humanities';
    } else if (formData.department !== formData.department) {
      // This logic can be enhanced based on your requirements
      electiveCategory = 'Open';
    }
    
    // Basic validation
    if (!formData.name || !formData.track || !formData.department) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields (Name, Track, Department).'
      });
      return;
    }
    
    // Validate Open elective fields
    if (formData.electiveCategory === 'Open') {
      if (!formData.offeredBy) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select which department is offering this open elective.'
        });
        return;
      }
      
      if (formData.eligibleDepartments.length === 0) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select at least one department that can take this open elective.'
        });
        return;
      }
    }
    
    // Create elective data matching the interface
    const electiveData = {
      name: formData.name,
      code: formData.code,
      semester: formData.semester,
      track: formData.track,
      description: formData.description,
      credits: formData.credits,
      prerequisites: formData.prerequisites,
      department: formData.department,
      category: [formData.electiveCategory], // Send as array with selected category
      electiveCategory: 'Elective' as const, // Always 'Elective' for this type
      subjectType: formData.subjectType,
      image: formData.infoImage || undefined, // Include the image
      deadline: formData.selectionDeadline === '' ? '' : (formData.selectionDeadline || undefined), // Send empty string to clear, or the date, or undefined
      minEnrollment: formData.minEnrollment !== undefined && formData.minEnrollment !== null ? formData.minEnrollment : undefined,
      maxEnrollment: formData.maxEnrollment !== undefined && formData.maxEnrollment !== null ? formData.maxEnrollment : undefined
    };
    
    console.log('📤 Sending elective data:', electiveData);
    console.log('   minEnrollment being sent:', electiveData.minEnrollment);
    console.log('   maxEnrollment being sent:', electiveData.maxEnrollment);
    console.log('   deadline being sent:', electiveData.deadline);
    console.log('📋 Category from form:', formData.electiveCategory);
    
    let success = false;
    if (editingElective) {
      success = await updateElective(editingElective.id, electiveData);
      if (success) {
        addNotification({
          type: 'success',
          title: 'Elective Updated',
          message: `${formData.name} has been updated successfully.`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: `Failed to update ${formData.name}. Please try again.`
        });
        return;
      }
    } else {
      success = await addElective(electiveData);
      if (success) {
        addNotification({
          type: 'success',
          title: 'Elective Added',
          message: `${formData.name} has been added successfully.`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Add Failed',
          message: `Failed to add ${formData.name}. Please try again.`
        });
        return;
      }
    }
    
    // Refresh the electives list after successful add/update
    if (success) {
      console.log('Refreshing electives after successful operation...');
      const refreshSuccess = await refreshElectives();
      console.log('Refresh result:', refreshSuccess);
      if (!refreshSuccess) {
        console.warn('Failed to refresh electives list');
      }
    }
    
    handleCloseModal();
  };

  const handleDelete = (elective: Elective) => {
    if (confirm(`Are you sure you want to delete "${elective.name}"?`)) {
      deleteElective(elective.id);
      addNotification({
        type: 'success',
        title: 'Elective Deleted',
        message: `${elective.name} has been deleted successfully.`
      });
    }
  };

  const handleClearEnrollment = async (elective: Elective) => {
    if (confirm(`Are you sure you want to clear all enrollment data for "${elective.name}"? This will reset the enrolled student count to 0.`)) {
      const success = await clearElectiveEnrollment(elective.id);
      if (success) {
        addNotification({
          type: 'success',
          title: 'Enrollment Cleared',
          message: `Enrollment for ${elective.name} has been reset to 0.`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to clear enrollment. Please try again.'
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Convert number fields to integers
      const numberFields = ['semester', 'credits', 'minEnrollment', 'maxEnrollment'];
      const newData = {
        ...prev,
        [name]: numberFields.includes(name) ? parseInt(value) || 0 : value
      };
      
      // Clear track when department or elective category changes
      if ((name === 'department' && prev.department !== value) || 
          (name === 'electiveCategory' && prev.electiveCategory !== value)) {
        newData.track = '';
      }
      
      // Reset open elective specific fields when changing away from Open category
      if (name === 'electiveCategory' && value !== 'Open') {
        newData.offeredBy = '';
        newData.eligibleDepartments = [];
      }
      
      return newData;
    });
  };

  const handleEligibleDepartmentToggle = (department: string) => {
    setFormData(prev => {
      const currentDepts = prev.eligibleDepartments;
      const isSelected = currentDepts.includes(department);
      
      return {
        ...prev,
        eligibleDepartments: isSelected 
          ? currentDepts.filter(d => d !== department)
          : [...currentDepts, department]
      };
    });
  };

  const handleClearDeadline = () => {
    setFormData(prev => ({
      ...prev,
      selectionDeadline: ''
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        addNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select an image file (JPG, PNG, GIF, etc.)'
        });
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: 'Please select an image smaller than 5MB'
        });
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          infoImage: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const gettrackColor = (trackName: string) => {
    const track = tracks.find(d => d.name === trackName);
    return track?.color || 'bg-gray-500';
  };

  const ElectiveCard = ({ elective }: { elective: Elective }) => (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{elective.name}</h3>
          <p className="text-sm text-gray-600">
            {elective.code ? `${elective.code} • ` : ''}Semester {elective.semester}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${gettrackColor(elective.track)}`}>
          {elective.track}
        </span>
      </div>

      <p className="text-gray-700 mb-3 text-sm">{elective.description}</p>

      {/* Multi-department info for Open electives */}
      {elective.category && elective.category.includes('Open') && (elective.offeredBy || elective.eligibleDepartments) && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
          {elective.offeredBy && (
            <p className="text-xs text-green-700 mb-1">
              <span className="font-medium">Offered by:</span> {elective.offeredBy}
            </p>
          )}
          {elective.eligibleDepartments && elective.eligibleDepartments.length > 0 && (
            <p className="text-xs text-green-700">
              <span className="font-medium">Available to:</span> {elective.eligibleDepartments.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <span>{elective.credits} Credits</span>
          {elective.subjectType && (
            <>
              <span className="text-gray-400">•</span>
              <span className="font-medium text-purple-700">{elective.subjectType}</span>
            </>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Display all categories as badges */}
          {elective.category && elective.category.map((cat, idx) => (
            <span key={idx} className={`text-xs px-2 py-1 rounded ${
              cat === 'Departmental' ? 'bg-blue-100 text-blue-800' :
              cat === 'Open' ? 'bg-green-100 text-green-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {cat}
            </span>
          ))}
          {(!elective.category || elective.category.length === 0) && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Departmental</span>
          )}
        </div>
      </div>

      {/* Enrollment Information */}
      <div className="mb-3 p-2 bg-gray-100 rounded-md">
        <div className="flex justify-between text-xs text-gray-700">
          <div>
            <span className="font-medium">Min:</span> {elective.minEnrollment ?? 5}
          </div>
          <div>
            <span className="font-medium">Enrolled:</span> {elective.enrolledStudents ?? 0}
          </div>
          <div>
            <span className="font-medium">Max:</span> {elective.maxEnrollment ?? elective.maxStudents ?? 40}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              (elective.enrolledStudents ?? 0) >= (elective.maxEnrollment ?? elective.maxStudents ?? 40) 
                ? 'bg-red-500' 
                : (elective.enrolledStudents ?? 0) >= (elective.minEnrollment ?? 5)
                ? 'bg-green-500'
                : 'bg-yellow-500'
            }`}
            style={{ 
              width: `${Math.min(100, ((elective.enrolledStudents ?? 0) / (elective.maxEnrollment ?? elective.maxStudents ?? 40)) * 100)}%` 
            }}
          />
        </div>
        {/* Clear Enrollment Button */}
        {(elective.enrolledStudents ?? 0) > 0 && (
          <div className="mt-2">
            <button
              onClick={() => handleClearEnrollment(elective)}
              className="w-full bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 transition-colors flex items-center justify-center"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Clear Enrollment
            </button>
          </div>
        )}
      </div>

      {/* Deadline Information */}
      {(elective.deadline || elective.selectionDeadline) && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-700">
            <span className="font-medium">Deadline:</span>{' '}
            {new Date(elective.deadline || elective.selectionDeadline!).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => handleOpenModal(elective)}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          onClick={() => handleDelete(elective)}
          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Electives</h1>
          <p className="text-gray-600 mt-2">
            Add, edit, and organize electives by category
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={async () => {
              await refreshElectives();
              addNotification({
                type: 'success',
                title: 'Refreshed',
                message: 'Electives list has been refreshed'
              });
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Elective
          </button>
        </div>
      </div>

      {/* Department Filter */}
      <div className="mb-6">
        <div className="flex space-x-2 flex-wrap">
          {departmentFilter.map(department => (
            <button
              key={department}
              onClick={() => setSelectedDepartment(department)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedDepartment === department
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {department === 'all' ? 'All Departments' : department}
              {department !== 'all' && (
                <span className="ml-2 text-xs">
                  ({electives.filter(e => e.department === department).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Department-wise Electives Display */}
      {selectedDepartment === 'all' ? (
        <div className="space-y-8">
          {electivesByDepartment.map(({ department, electives: deptElectives, count }) => (
            <div key={department} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {department} Electives
                  <span className="ml-2 text-sm text-gray-500">({count} total)</span>
                </h2>
              </div>
              
              {deptElectives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptElectives.map(elective => (
                    <ElectiveCard key={elective.id} elective={elective} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No electives in this department
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {selectedDepartment} Electives
            <span className="ml-2 text-sm text-gray-500">({filteredElectives.length} total)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredElectives.map(elective => (
              <ElectiveCard key={elective.id} elective={elective} />
            ))}
            {filteredElectives.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No electives in this department
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for adding/editing electives */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingElective ? 'Edit Elective' : 'Add New Elective'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Elective Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Machine Learning Fundamentals"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CS501 (Optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getAvailableSemesters().map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Type *
                  </label>
                  <select
                    name="subjectType"
                    value={formData.subjectType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Theory+Practical">Theory+Practical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {getAvailableDepartments().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Elective Category *
                  </label>
                  <select
                    name="electiveCategory"
                    value={formData.electiveCategory}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    {getAvailableCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.electiveCategory === 'Departmental' && 'Core technical courses for your department'}
                    {formData.electiveCategory === 'Open' && 'Interdisciplinary courses from any department'}
                    {formData.electiveCategory === 'Humanities' && 'Soft skills and liberal arts courses'}
                  </p>
                </div>

                {/* Open Elective specific fields */}
                {formData.electiveCategory === 'Open' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offered By Department *
                      </label>
                      <select
                        name="offeredBy"
                        value={formData.offeredBy}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Department</option>
                        {getAvailableDepartments().map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        Which department is offering this open elective
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Eligible Departments *
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                        {getAvailableDepartments().map(dept => (
                          <label key={dept} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.eligibleDepartments.includes(dept)}
                              onChange={() => handleEligibleDepartmentToggle(dept)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{dept}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Select which departments can take this open elective
                      </p>
                      {formData.eligibleDepartments.length === 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Please select at least one eligible department
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Track *
                  </label>
                  <select
                    name="track"
                    value={formData.track}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select track</option>
                    {tracks
                      .filter(track => 
                        track.department === formData.department && 
                        track.category === formData.electiveCategory
                      )
                      .map(track => (
                        <option key={track.id} value={track.name}>
                          {track.name}
                        </option>
                      ))}
                  </select>
                  {formData.department && formData.electiveCategory && 
                   tracks.filter(track => 
                     track.department === formData.department && 
                     track.category === formData.electiveCategory
                   ).length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No tracks available for {formData.electiveCategory} category in {formData.department} department. Please create tracks first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits *
                  </label>
                  <select
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(credit => (
                      <option key={credit} value={credit}>{credit} Credits</option>
                    ))}
                  </select>
                </div>

                
                 
                {/* {
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div> 
                } */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the elective (optional)..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selection Deadline
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="selectionDeadline"
                    value={formData.selectionDeadline}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData.selectionDeadline && (
                    <button
                      type="button"
                      onClick={handleClearDeadline}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors flex items-center gap-1"
                      title="Clear deadline"
                    >
                      <XCircle className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Enrollment
                  </label>
                  <input
                    type="number"
                    name="minEnrollment"
                    value={formData.minEnrollment}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Enrollment *
                  </label>
                  <input
                    type="number"
                    name="maxEnrollment"
                    value={formData.maxEnrollment}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Curriculum Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.infoImage && (
                  <div className="mt-2">
                    <img 
                      src={formData.infoImage} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingElective ? 'Update Elective' : 'Add Elective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminElectives;
