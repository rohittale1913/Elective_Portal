import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useData, Student } from '../../contexts/DataContext';
import { BarChart3, Users, BookOpen, Award, Target, Download, ChevronDown } from 'lucide-react';

const AdminAnalytics: React.FC = () => {
  const { electives, studentElectives, students, getAvailableDepartments, getAvailableSemesters, getAvailableSections, tracks } = useData();
  
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState<string[]>([]); // Changed to array for multi-select
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false); // Dropdown state
  const sectionDropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside
  const [selectedTrack, setSelectedTrack] = useState('');

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

  // Get filter options
  const departments = getAvailableDepartments();
  const semesters = getAvailableSemesters();
  const sections = getAvailableSections();

  // Apply filters
  const filteredStudents = useMemo(() => {
    return students.filter((student: Student) => {
      if (selectedDepartment && student.department !== selectedDepartment) return false;
      if (selectedSemester && student.semester !== parseInt(selectedSemester)) return false;
      if (selectedSection.length > 0 && student.section && !selectedSection.includes(student.section)) return false; // Multi-select logic
      return true;
    });
  }, [students, selectedDepartment, selectedSemester, selectedSection]);

  const filteredElectives = useMemo(() => {
    return electives.filter(elective => {
      if (selectedDepartment && elective.department !== selectedDepartment) return false;
      if (selectedSemester && elective.semester !== parseInt(selectedSemester)) return false;
      if (selectedTrack && elective.track !== selectedTrack) return false;
      return true;
    });
  }, [electives, selectedDepartment, selectedSemester, selectedTrack]);

  const filteredStudentElectives = useMemo(() => {
    const studentIds = new Set(filteredStudents.map(s => s.id));
    const electiveIds = new Set(filteredElectives.map(e => e.id));
    
    return studentElectives.filter(se => {
      if (!studentIds.has(se.studentId)) return false;
      if (!electiveIds.has(se.electiveId)) return false;
      if (selectedSemester && se.semester !== parseInt(selectedSemester)) return false;
      if (selectedTrack && se.track !== selectedTrack) return false;
      return true;
    });
  }, [studentElectives, filteredStudents, filteredElectives, selectedSemester, selectedTrack]);

  const analytics = useMemo(() => {
    // Use filtered data instead of all data
    const dataStudents = filteredStudents;
    const dataElectives = filteredElectives;
    const dataStudentElectives = filteredStudentElectives;
    
    // Semester analytics
    const semesterStats = [5, 6, 7, 8].map(semester => {
      const semesterSelections = dataStudentElectives.filter(se => se.semester === semester);
      const semesterElectives = dataElectives.filter(e => e.semester === semester);
      const utilizationRate = semesterElectives.length > 0 
        ? (semesterSelections.length / semesterElectives.length) * 100 
        : 0;
      
      return {
        semester,
        selections: semesterSelections.length,
        available: semesterElectives.length,
        utilizationRate
      };
    });

    // Popular electives
    const electivePopularity = dataElectives.map(elective => {
      const selections = dataStudentElectives.filter(se => se.electiveId === elective.id).length;
      return { ...elective, selections };
    }).sort((a, b) => b.selections - a.selections);

    // Student engagement
    const studentEngagement = dataStudents.map((student: Student) => {
      const studentElectivesData = dataStudentElectives.filter(se => se.studentId === student.id);
      return {
        ...student,
        totalElectives: studentElectivesData.length
      };
    });

    const avgElectivesPerStudent = studentEngagement.length > 0
      ? studentEngagement.reduce((sum, s) => sum + s.totalElectives, 0) / studentEngagement.length
      : 0;

    return {
      semesterStats,
      electivePopularity,
      studentEngagement,
      avgElectivesPerStudent: avgElectivesPerStudent || 0,
      totalSelections: dataStudentElectives.length,
      activeStudents: new Set(dataStudentElectives.map(se => se.studentId)).size
    };
  }, [filteredElectives, filteredStudentElectives, filteredStudents]);

  const handleExportAnalytics = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      filters: {
        department: selectedDepartment || 'All',
        semester: selectedSemester || 'All',
        section: selectedSection.length > 0 ? selectedSection.join(', ') : 'All', // Multi-select support
        track: selectedTrack || 'All'
      },
      overview: {
        totalStudents: filteredStudents.length,
        totalElectives: filteredElectives.length,
        totalSelections: analytics.totalSelections,
        activeStudents: analytics.activeStudents
      },
      semesterStats: analytics.semesterStats,
      popularElectives: analytics.electivePopularity.slice(0, 10)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setSelectedDepartment('');
    setSelectedSemester('');
    setSelectedSection([]); // Clear array
    setSelectedTrack('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters Section */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Filter Analytics
          </h2>
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear All Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div ref={sectionDropdownRef} className="relative">
            <label htmlFor="section-analytics" className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <button
              type="button"
              onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center"
            >
              <span className={selectedSection.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                {selectedSection.length === 0 
                  ? 'All Sections' 
                  : `${selectedSection.length} selected: ${selectedSection.join(', ')}`}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>
            
            {sectionDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                    <span className="text-sm font-medium text-gray-900">All Sections</span>
                  </label>
                  {sections.map(sec => (
                    <label key={sec} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                      <span className="text-sm text-gray-700">Section {sec}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Track Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Track
            </label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tracks</option>
              {tracks.map(track => (
                <option key={track.id} value={track.name}>{track.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedDepartment || selectedSemester || selectedSection.length > 0 || selectedTrack) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedDepartment && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Dept: {selectedDepartment}
                <button onClick={() => setSelectedDepartment('')} className="ml-2 hover:text-blue-900">×</button>
              </span>
            )}
            {selectedSemester && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Sem: {selectedSemester}
                <button onClick={() => setSelectedSemester('')} className="ml-2 hover:text-green-900">×</button>
              </span>
            )}
            {selectedSection.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                Sections: {selectedSection.join(', ')}
                <button onClick={() => setSelectedSection([])} className="ml-2 hover:text-purple-900">×</button>
              </span>
            )}
            {selectedTrack && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                Track: {selectedTrack}
                <button onClick={() => setSelectedTrack('')} className="ml-2 hover:text-orange-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into elective selections and student trends
          </p>
        </div>
        <button
          onClick={handleExportAnalytics}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Analytics
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
              <p className="text-gray-600">Total Students</p>
              <p className="text-xs text-gray-500">{analytics.activeStudents} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{filteredElectives.length}</p>
              <p className="text-gray-600">Available Electives</p>
              <p className="text-xs text-gray-500">across all semesters</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{analytics.totalSelections}</p>
              <p className="text-gray-600">Total Selections</p>
              <p className="text-xs text-gray-500">across all semesters</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{analytics.avgElectivesPerStudent.toFixed(1)}</p>
              <p className="text-gray-600">Avg Electives/Student</p>
              <p className="text-xs text-gray-500">completion rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Semester Utilization */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Semester Utilization</h2>
          <div className="space-y-4">
            {analytics.semesterStats.map(stat => (
              <div key={stat.semester} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">Semester {stat.semester}</h3>
                  <span className="text-sm font-medium text-blue-600">
                    {stat.utilizationRate.toFixed(1)}% utilized
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{stat.selections} selections</span>
                  <span>{stat.available} available</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.max(5, stat.utilizationRate)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Electives */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Most Popular Electives</h2>
          <div className="space-y-3">
            {analytics.electivePopularity.slice(0, 8).map((elective, index) => (
              <div key={elective.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    index < 3 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{elective.name}</h3>
                  <p className="text-sm text-gray-600">{elective.code} • {elective.track}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{elective.selections}</p>
                  <p className="text-xs text-gray-600">selections</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Engagement */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Engagement</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">Average Electives per Student</h3>
                  <p className="text-sm text-blue-700">Overall completion rate</p>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {analytics.avgElectivesPerStudent.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Engagement Distribution</h4>
              {[
                { label: 'High Engagement (3+ electives)', count: analytics.studentEngagement.filter(s => s.totalElectives >= 3).length },
                { label: 'Medium Engagement (1-2 electives)', count: analytics.studentEngagement.filter(s => s.totalElectives >= 1 && s.totalElectives < 3).length },
                { label: 'Low Engagement (0 electives)', count: analytics.studentEngagement.filter(s => s.totalElectives === 0).length }
              ].map((item, index) => {
                const colors = ['bg-green-500', 'bg-yellow-500', 'bg-red-500'];
                const percentage = students.length > 0 ? (item.count / students.length) * 100 : 0;
                
                return (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                      <span className="text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-medium">{item.count}</span>
                      <span className="text-gray-500">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <Award className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-medium text-green-900 mb-2">Best Performing Elective</h3>
            <p className="text-sm text-green-800">
              "{analytics.electivePopularity[0]?.name}" has {analytics.electivePopularity[0]?.selections} selections,
              making it the most chosen elective.
            </p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <BookOpen className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-medium text-purple-900 mb-2">Semester Utilization</h3>
            <p className="text-sm text-purple-800">
              Semester {analytics.semesterStats.sort((a, b) => b.utilizationRate - a.utilizationRate)[0]?.semester} 
              has the highest utilization at {analytics.semesterStats.sort((a, b) => b.utilizationRate - a.utilizationRate)[0]?.utilizationRate.toFixed(1)}%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
