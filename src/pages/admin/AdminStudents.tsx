import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData, Student } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Search, Download, Users, FileText, CheckCircle, Filter, X, RefreshCw, ChevronDown } from 'lucide-react';

interface ReportFilters {
  department: string;
  semester: string;
  section: string | string[]; // Support both string and array for backward compatibility
  category: 'Departmental' | 'Open' | 'Humanities' | '';
  track: string;
  elective: string;
}

const AdminStudents: React.FC = () => {
  const { 
    electives, 
    tracks, 
    students,
    studentElectives,
    isLoadingStudentData, // NEW: Loading state
    getAvailableDepartments,
    getAvailableSections,
    getAvailableSemesters,
    getTracksByCategory,
    getAvailableCategories,
    refreshUsers
  } = useData();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string[]>([]); // Array for multi-select
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false); // Dropdown state
  const sectionDropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside
  const [reportSectionDropdownOpen, setReportSectionDropdownOpen] = useState(false); // Report section dropdown
  const reportSectionDropdownRef = useRef<HTMLDivElement>(null); // Ref for report section dropdown
  const [trackFilter, settrackFilter] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAdvancedReport, setShowAdvancedReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    department: '',
    semester: '',
    section: '',
    category: '',
    track: '',
    elective: ''
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setSectionDropdownOpen(false);
      }
      if (reportSectionDropdownRef.current && !reportSectionDropdownRef.current.contains(event.target as Node)) {
        setReportSectionDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug: Log students data on mount and when it changes
  useEffect(() => {
    console.log('👥 [AdminStudents] Students loaded:', students.length);
    console.log('📊 [AdminStudents] Section distribution:', 
      students.reduce((acc: Record<string, number>, s) => {
        const section = s.section || 'Not Assigned';
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      }, {})
    );
    
    // Log first 3 students with their section data
    console.log('📋 [AdminStudents] Sample students with sections:');
    students.slice(0, 3).forEach(s => {
      console.log(`  - ${s.name}: section = "${s.section}" (${typeof s.section})`);
    });
  }, [students]);

  // Get students from DataContext
  const allStudents: Student[] = students;
  
  // Debug logging for students
  console.log('👥 [AdminStudents] Total students from context:', students.length);
  if (students.length > 0) {
    console.log('   📋 First student:', {
      id: students[0].id,
      name: students[0].name,
      department: students[0].department,
      semester: students[0].semester,
      section: students[0].section
    });
  } else {
    console.error('   ❌ Students array is EMPTY!');
    console.error('   ❌ Check DataContext - students should be loaded from backend or localStorage');
  }
  console.log('📊 [AdminStudents] studentElectives length:', studentElectives.length);
  console.log('⏳ [AdminStudents] isLoadingStudentData:', isLoadingStudentData);

  // Use admin-configured departments, sections, and semesters
  const departments = getAvailableDepartments();
  const sections = getAvailableSections();
  const semesters = getAvailableSemesters();
  const categories = getAvailableCategories();

  const filteredStudents = useMemo(() => {
    console.log('🔍 [Filter] Filtering students...');
    console.log('🔍 [Filter] sectionFilter:', sectionFilter);
    console.log('🔍 [Filter] Total students:', allStudents.length);
    
    // Log section distribution
    const sectionDist = allStudents.reduce((acc: Record<string, number>, s) => {
      const section = s.section || 'undefined/null';
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 [Filter] Section distribution in allStudents:', sectionDist);
    
    const filtered = allStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || student.department === departmentFilter;
      const matchesSemester = !semesterFilter || student.semester.toString() === semesterFilter;
      const matchesSection = sectionFilter.length === 0 || (student.section && sectionFilter.includes(student.section)); // Multi-select logic
      
      // Debug logging for section filter
      if (sectionFilter.length > 0) {
        console.log(`🔍 [Filter] Student: ${student.name}, section: "${student.section}", matchesSection: ${matchesSection}`);
      }
      
      let matchestrack = true;
      if (trackFilter) {
        const studenttracks = studentElectives
          .filter(se => se.studentId === student.id)
          .map(se => se.track);
        matchestrack = studenttracks.includes(trackFilter);
      }

      return matchesSearch && matchesDepartment && matchesSemester && matchesSection && matchestrack;
    });
    
    console.log('✅ [Filter] Filtered students:', filtered.length);
    if (sectionFilter.length > 0) {
      const filteredSectionDist = filtered.reduce((acc: Record<string, number>, s) => {
        const section = s.section || 'undefined/null';
        acc[section] = (acc[section] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 [Filter] Section distribution in filtered results:', filteredSectionDist);
    }
    return filtered;
  }, [allStudents, searchTerm, departmentFilter, semesterFilter, sectionFilter, trackFilter, studentElectives]);

  const getStudentElectives = (studentId: string) => {
    console.log('🔍 [AdminStudents] Getting electives for student:', studentId);
    console.log('📊 [AdminStudents] Total studentElectives in context:', studentElectives.length);
    
    if (studentElectives.length > 0) {
      console.log('📋 [AdminStudents] Sample studentElective (first one):', {
        id: studentElectives[0].id,
        studentId: studentElectives[0].studentId,
        electiveId: studentElectives[0].electiveId,
        track: studentElectives[0].track,
        semester: studentElectives[0].semester
      });
      console.log('🎯 [AdminStudents] Looking for studentId:', studentId);
      console.log('🎯 [AdminStudents] Type of target studentId:', typeof studentId);
      console.log('🎯 [AdminStudents] Type of first se.studentId:', typeof studentElectives[0].studentId);
    }
    
    const filtered = studentElectives
      .filter(se => {
        // Ensure both IDs are strings for comparison
        const seStudentId = String(se.studentId || '');
        const targetStudentId = String(studentId || '');
        const match = seStudentId === targetStudentId;
        
        if (!match && studentElectives.length > 0) {
          console.log('❌ [AdminStudents] No match - Comparing:', { 
            seStudentId, 
            targetStudentId,
            match 
          });
        }
        return match;
      })
      .map(se => {
        const elective = electives.find(e => {
          // Ensure both IDs are strings for comparison
          const eId = String(e.id || '');
          const seElectiveId = String(se.electiveId || '');
          return eId === seElectiveId;
        });
        if (!elective) {
          console.warn('⚠️ [AdminStudents] Elective not found for electiveId:', se.electiveId);
          console.warn('   Available elective IDs:', electives.slice(0, 5).map(e => e.id));
        }
        return { ...se, elective };
      })
      .sort((a, b) => a.semester - b.semester);
    
    console.log('✅ [AdminStudents] Filtered electives for student:', filtered.length);
    if (filtered.length > 0) {
      console.log('📝 [AdminStudents] First elective:', {
        electiveId: filtered[0].electiveId,
        electiveName: filtered[0].elective?.name,
        semester: filtered[0].semester,
        track: filtered[0].track
      });
    }
    
    return filtered;
  };

  const getStudenttracks = (studentId: string, semester?: number) => {
    const allElectives = getStudentElectives(studentId);
    // Filter by semester if provided
    const studentElectivesData = semester 
      ? allElectives.filter(se => se.semester === semester)
      : allElectives;
      
    const trackCounts = studentElectivesData.reduce((acc: Record<string, number>, se) => {
      acc[se.track] = (acc[se.track] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(trackCounts).map(([track, count]) => ({
      track,
      count: count as number
    }));
  };

  // Get primary track for a student (the track with most electives)
  const getPrimaryTrack = (studentId: string, semester?: number): string => {
    const tracks = getStudenttracks(studentId, semester);
    if (tracks.length === 0) return 'No track selected';
    
    // Sort by count descending and get the first one
    const primaryTrack = tracks.sort((a, b) => b.count - a.count)[0];
    return primaryTrack.track;
  };

  // Get filtered students for advanced report
  const getFilteredStudentsForReport = () => {
    let reportStudents = allStudents;
    
    console.log('📊 [Report Filter] Starting with', reportStudents.length, 'students');
    console.log('📊 [Report Filter] Report filters:', reportFilters);
    
    // Filter by department
    if (reportFilters.department) {
      reportStudents = reportStudents.filter(s => s.department === reportFilters.department);
      console.log('📊 [Report Filter] After department filter:', reportStudents.length);
    }
    
    // Filter by semester
    if (reportFilters.semester) {
      reportStudents = reportStudents.filter(s => s.semester.toString() === reportFilters.semester);
      console.log('📊 [Report Filter] After semester filter:', reportStudents.length);
    }
    
    // Filter by section
    if (reportFilters.section) {
      console.log('📊 [Report Filter] Section filter value:', reportFilters.section);
      if (Array.isArray(reportFilters.section)) {
        // Multi-select: filter by any of the selected sections
        const beforeCount = reportStudents.length;
        reportStudents = reportStudents.filter(s => {
          const hasSection = s.section && reportFilters.section.includes(s.section);
          if (!hasSection) {
            console.log(`❌ [Report Filter] Student ${s.name} (section: ${s.section}) excluded by section filter`);
          }
          return hasSection;
        });
        console.log(`📊 [Report Filter] After section filter: ${reportStudents.length} (filtered out ${beforeCount - reportStudents.length})`);
      } else {
        // Single select (backward compatibility)
        reportStudents = reportStudents.filter(s => s.section === reportFilters.section);
        console.log('📊 [Report Filter] After section filter (single):', reportStudents.length);
      }
    }
    
    // Filter by category/track/elective
    if (reportFilters.category || reportFilters.track || reportFilters.elective) {
      reportStudents = reportStudents.filter(student => {
        const studentElectivesData = getStudentElectives(student.id);
        
        if (reportFilters.elective) {
          // Filter by specific elective
          return studentElectivesData.some(se => se.electiveId === reportFilters.elective);
        } else if (reportFilters.track) {
          // Filter by specific track
          return studentElectivesData.some(se => se.track === reportFilters.track);
        } else if (reportFilters.category) {
          // Filter by category (get tracks in that category)
          const categoryTracks = getTracksByCategory(reportFilters.category);
          const categoryTrackNames = categoryTracks.map(t => t.name);
          return studentElectivesData.some(se => categoryTrackNames.includes(se.track));
        }
        
        return true;
      });
      console.log('📊 [Report Filter] After category/track/elective filter:', reportStudents.length);
    }
    
    console.log('📊 [Report Filter] Final filtered students:', reportStudents.length);
    return reportStudents;
  };

  // Generate detailed report data
  const generateReportData = () => {
    const reportStudents = getFilteredStudentsForReport();
    
    console.log('📊 [Report] Generating report for', reportStudents.length, 'students');
    console.log('📊 [Report] Total studentElectives available:', studentElectives.length);
    
    return reportStudents.map(student => {
      console.log('👤 [Report] Processing student:', student.name, 'ID:', student.id);
      
      // Get student's electives - FILTERED BY STUDENT'S CURRENT SEMESTER
      const allStudentElectives = getStudentElectives(student.id);
      
      // Filter electives to show only those for the student's current semester
      const studentElectivesData = allStudentElectives.filter(se => se.semester === student.semester);
      
      console.log('📝 [Report] Student electives found (current semester):', studentElectivesData.length);
      console.log('📝 [Report] All semesters electives:', allStudentElectives.length);
      
      const electivesList = studentElectivesData.map(se => {
        const elective = electives.find(e => e.id === se.electiveId);
        const electiveName = elective ? `${elective.name} (${elective.code})` : 'Unknown';
        console.log('  - Elective:', electiveName, 'ID:', se.electiveId, 'Semester:', se.semester);
        return electiveName;
      }).join('; ');
      
      console.log('📋 [Report] Electives list for', student.name, ':', electivesList || 'No electives selected');
      
      // Get primary track (track with most electives) - only from current semester
      const primaryTrack = getPrimaryTrack(student.id, student.semester);
      
      // Get all student's tracks - only from current semester
      const studentTracks = [...new Set(studentElectivesData.map(se => se.track))].join('; ');
      
      return {
        'Roll No': student.rollNumber,
        'Name': student.name,
        'Email': student.email,
        'Department': student.department,
        'Semester': student.semester,
        'Section': student.section || 'Not Assigned',
        'Primary Track': primaryTrack,
        'All Track(s)': studentTracks || 'No track selected',
        'Electives Selected': electivesList || 'No electives selected',
        'Total Electives': studentElectivesData.length
      };
    });
  };

  // Enhanced export function for advanced reports
  const handleAdvancedExport = (format: 'excel' | 'pdf') => {
    const data = generateReportData();
    const sectionStr = Array.isArray(reportFilters.section) 
      ? (reportFilters.section.length > 0 ? reportFilters.section.join('-') : 'all-sections')
      : (reportFilters.section || 'all-sections');
    const fileName = `students_report_${reportFilters.department || 'all-depts'}_${reportFilters.semester || 'all-sems'}_${sectionStr}_${reportFilters.category || 'all-categories'}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'excel') {
      const csvHeaders = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(row => Object.values(row).map(val => {
        // Escape commas and quotes in CSV
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes(';') || stringVal.includes('"')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const reportTitle = 'STUDENT ROSTER REPORT';
      const sectionDisplay = Array.isArray(reportFilters.section)
        ? (reportFilters.section.length > 0 ? `Sections: ${reportFilters.section.join(', ')}` : '')
        : (reportFilters.section ? `Section: ${reportFilters.section}` : '');
      const filterInfo = [
        reportFilters.department && `Department: ${reportFilters.department}`,
        reportFilters.semester && `Semester: ${reportFilters.semester}`,
        sectionDisplay
      ].filter(Boolean);
      
      const pdfContent = [
        reportTitle,
        `Generated on: ${new Date().toLocaleDateString()}`,
        `Total Students: ${data.length}`,
        '',
        'FILTERS APPLIED:',
        ...filterInfo,
        '',
        'STUDENT DATA:',
        '',
        ...data.map((student, index) => [
          `${index + 1}. ${student.Name} (${student['Roll No']})`,
          `   Department: ${student.Department} | Semester: ${student.Semester} | Section: ${student.Section}`,
          `   Email: ${student.Email}`,
          `   Primary Track: ${student['Primary Track']}`,
          `   All Tracks: ${student['All Track(s)']}`,
          `   Electives: ${student['Electives Selected']}`,
          `   Total Electives: ${student['Total Electives']}`,
          '─'.repeat(80),
          ''
        ]).flat()
      ].join('\n');
      
      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setShowAdvancedReport(false);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const data = filteredStudents.map(student => {
      // Get student's electives
      const studentElectivesData = getStudentElectives(student.id);
      const electivesList = studentElectivesData.map(se => {
        const elective = electives.find(e => e.id === se.electiveId);
        return elective ? `${elective.name} (${elective.code})` : 'Unknown';
      }).join('; ');
      
      // Get primary track (track with most electives)
      const primaryTrack = getPrimaryTrack(student.id);
      
      // Get all student's tracks
      const studentTracks = [...new Set(studentElectivesData.map(se => se.track))].join('; ');
      
      return {
        'Roll No': student.rollNumber,
        'Name': student.name,
        'Email': student.email,
        'Department': student.department,
        'Semester': student.semester,
        'Section': student.section || 'Not Assigned',
        'Primary Track': primaryTrack,
        'All Track(s)': studentTracks || 'No track selected',
        'Electives Selected': electivesList || 'No electives selected',
        'Total Electives': studentElectivesData.length
      };
    });
    
    if (format === 'excel') {
      // Create CSV content for Excel
      const csvHeaders = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(row => Object.values(row).map(val => {
        // Escape commas and quotes in CSV
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes(';') || stringVal.includes('"')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Create simple PDF-like content
      const pdfContent = [
        'STUDENT REPORT',
        `Generated on: ${new Date().toLocaleDateString()}`,
        `Total Students: ${data.length}`,
        '',
        'STUDENT DETAILS:',
        '',
        ...data.map((student, index) => [
          `${index + 1}. ${student.Name} (${student['Roll No']})`,
          `   Department: ${student.Department} | Semester: ${student.Semester} | Section: ${student.Section}`,
          `   Email: ${student.Email}`,
          `   Primary Track: ${student['Primary Track']}`,
          `   All Tracks: ${student['All Track(s)']}`,
          `   Electives: ${student['Electives Selected']}`,
          `   Total Electives: ${student['Total Electives']}`,
          '─'.repeat(80),
          ''
        ]).flat()
      ].join('\n');
      
      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setShowExportDialog(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('');
    setSemesterFilter('');
    setSectionFilter([]); // Clear array
    settrackFilter('');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshUsers();
      if (success) {
        addNotification({
          type: 'success',
          title: 'Students Refreshed',
          message: `Successfully loaded ${students.length} student(s) from database`
        });
        console.log('✅ Students refreshed successfully');
      } else {
        addNotification({
          type: 'warning',
          title: 'Refresh Failed',
          message: 'Could not fetch latest student data from server'
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing students:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while refreshing student data'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Loading State - Show spinner until student data and electives are loaded */}
      {isLoadingStudentData ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Student Data...</h2>
          <p className="text-gray-600">Please wait while we fetch student information and electives</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <p className="text-gray-600 mt-2">
                View and manage student profiles and elective selections
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh student data"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowExportDialog(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Basic Report
              </button>
              <button
                onClick={() => setShowAdvancedReport(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced Report
              </button>
            </div>
          </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                id="search"
                type="text"
                placeholder="Name, Roll No, or Email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              id="department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              id="semester"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div ref={sectionDropdownRef} className="relative">
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <button
              type="button"
              onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-left flex justify-between items-center"
            >
              <span className={sectionFilter.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                {sectionFilter.length === 0 
                  ? 'All Sections' 
                  : `${sectionFilter.length} selected: ${sectionFilter.join(', ')}`}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>
            
            {sectionDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sectionFilter.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSectionFilter([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900">All Sections</span>
                  </label>
                  {sections.map(section => (
                    <label key={section} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionFilter.includes(section)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSectionFilter(prev => [...prev, section]);
                          } else {
                            setSectionFilter(prev => prev.filter(s => s !== section));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Section {section}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* <div>
            <label htmlFor="track" className="block text-sm font-medium text-gray-700 mb-1">
              Track Focus
            </label>
            <select
              id="track"
              value={trackFilter}
              onChange={(e) => settrackFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Tracks</option>
              {tracks.map(track => (
                <option key={track.id} value={track.name}>{track.name}</option>
              ))}
            </select>
          </div> */}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {allStudents.length} students
          </div>
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => {
          const studentElectivesData = getStudentElectives(student.id);
          const studenttracks = getStudenttracks(student.id);
          
          return (
            <div key={student.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.rollNumber}</p>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Sem {student.semester}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {student.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Department:</span> {student.department}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Section:</span> {student.section || 'Not Assigned'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Electives Completed:</span> {studentElectivesData.length}
                </p>
              </div>

              {/* track Progress */}
              {studenttracks.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">track Focus:</p>
                  <div className="flex flex-wrap gap-1">
                    {studenttracks.slice(0, 2).map(({ track, count }) => {
                      const trackData = tracks.find(d => d.name === track);
                      return (
                        <span
                          key={track}
                          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${trackData?.color || 'bg-gray-500'}`}
                        >
                          {track} ({count})
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Electives */}
              {studentElectivesData.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Electives:</p>
                  <div className="space-y-1">
                    {studentElectivesData.slice(-2).map(se => (
                      <div key={se.electiveId} className="flex items-center text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        <span className="text-gray-700">{se.elective?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600">
            {searchTerm || departmentFilter || semesterFilter || trackFilter
              ? 'Try adjusting your filters to see more results.'
              : 'No students are registered in the system yet.'
            }
          </p>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Student Report</h3>
              <p className="text-gray-600 mb-4">
                Choose the format for exporting student data. This will include all filtered results.
              </p>
              
              {/* Export Criteria */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Export Criteria:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Students:</span>
                    <span className="font-medium text-gray-900">{filteredStudents.length}</span>
                  </div>
                  {departmentFilter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-gray-900">{departmentFilter}</span>
                    </div>
                  )}
                  {semesterFilter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Semester:</span>
                      <span className="font-medium text-gray-900">{semesterFilter}</span>
                    </div>
                  )}
                  {sectionFilter.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sections:</span>
                      <span className="font-medium text-gray-900">{sectionFilter.join(', ')}</span>
                    </div>
                  )}
                  {trackFilter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Primary track:</span>
                      <span className="font-medium text-gray-900">{trackFilter}</span>
                    </div>
                  )}
                  {searchTerm && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Search Term:</span>
                      <span className="font-medium text-gray-900">"{searchTerm}"</span>
                    </div>
                  )}
                  {!departmentFilter && !semesterFilter && sectionFilter.length === 0 && !trackFilter && !searchTerm && (
                    <div className="text-gray-600 text-center">All students (no filters applied)</div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-gray-900">Export as CSV (.csv)</span>
                </button>
                
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-red-600 mr-3" />
                  <span className="text-gray-900">Export as Text Report (.txt)</span>
                </button>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Report Dialog */}
      {showAdvancedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Generate Advanced Student Report</h3>
                <button
                  onClick={() => setShowAdvancedReport(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Create detailed reports with advanced filtering options by department, category, track, and specific electives.
              </p>
              
              {/* Report Filters */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Filter
                    </label>
                    <select
                      value={reportFilters.department}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        department: e.target.value,
                        category: '', // Reset dependent filters
                        track: '',
                        elective: ''
                      }))}
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
                      Semester Filter
                    </label>
                    <select
                      value={reportFilters.semester}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        semester: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Semesters</option>
                      {semesters.map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section Filter */}
                  <div ref={reportSectionDropdownRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Filter
                    </label>
                    <button
                      type="button"
                      onClick={() => setReportSectionDropdownOpen(!reportSectionDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center"
                    >
                      <span className={!reportFilters.section || (Array.isArray(reportFilters.section) && reportFilters.section.length === 0) ? 'text-gray-500' : 'text-gray-900'}>
                        {!reportFilters.section || (Array.isArray(reportFilters.section) && reportFilters.section.length === 0)
                          ? 'All Sections' 
                          : Array.isArray(reportFilters.section)
                            ? `${reportFilters.section.length} selected: ${reportFilters.section.join(', ')}`
                            : `Section ${reportFilters.section}`}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${reportSectionDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </button>
                    
                    {reportSectionDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!reportFilters.section || (Array.isArray(reportFilters.section) && reportFilters.section.length === 0) || reportFilters.section === ''}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setReportFilters(prev => ({ ...prev, section: '' }));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">All Sections</span>
                          </label>
                          {sections.map(section => {
                            const sectionsArray = Array.isArray(reportFilters.section) ? reportFilters.section : [];
                            const isChecked = sectionsArray.includes(section);
                            
                            return (
                              <label key={section} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentSections = Array.isArray(reportFilters.section) ? reportFilters.section : [];
                                    if (e.target.checked) {
                                      setReportFilters(prev => ({ ...prev, section: [...currentSections, section] }));
                                    } else {
                                      setReportFilters(prev => ({ ...prev, section: currentSections.filter(s => s !== section) }));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Section {section}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Elective Category
                    </label>
                    <select
                      value={reportFilters.category}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        category: e.target.value as 'Departmental' | 'Open' | 'Humanities' | '',
                        track: '', // Reset dependent filters
                        elective: ''
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Track Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Track
                    </label>
                    <select
                      value={reportFilters.track}
                      onChange={(e) => setReportFilters(prev => ({ 
                        ...prev, 
                        track: e.target.value,
                        elective: '' // Reset dependent filter
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!reportFilters.category}
                    >
                      <option value="">All Tracks</option>
                      {reportFilters.category && getTracksByCategory(reportFilters.category).map(track => (
                        <option key={track.id} value={track.name}>{track.name}</option>
                      ))}
                    </select>
                    {!reportFilters.category && (
                      <p className="text-xs text-gray-500 mt-1">Select a category first to filter by track</p>
                    )}
                  </div>

                  {/* Elective Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Elective
                    </label>
                    <select
                      value={reportFilters.elective}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, elective: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!reportFilters.track}
                    >
                      <option value="">All Electives</option>
                      {reportFilters.track && electives
                        .filter(e => e.track === reportFilters.track)
                        .map(elective => (
                          <option key={elective.id} value={elective.id}>{elective.name}</option>
                        ))}
                    </select>
                    {!reportFilters.track && (
                      <p className="text-xs text-gray-500 mt-1">Select a track first to filter by specific elective</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Report Preview */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Report Preview:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students matching criteria:</span>
                    <span className="font-medium text-gray-900">{getFilteredStudentsForReport().length}</span>
                  </div>
                  {reportFilters.department && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-gray-900">{reportFilters.department}</span>
                    </div>
                  )}
                  {reportFilters.semester && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Semester:</span>
                      <span className="font-medium text-gray-900">Semester {reportFilters.semester}</span>
                    </div>
                  )}
                  {reportFilters.section && (Array.isArray(reportFilters.section) ? reportFilters.section.length > 0 : reportFilters.section) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Section{Array.isArray(reportFilters.section) && reportFilters.section.length > 1 ? 's' : ''}:</span>
                      <span className="font-medium text-gray-900">
                        {Array.isArray(reportFilters.section) ? reportFilters.section.join(', ') : `Section ${reportFilters.section}`}
                      </span>
                    </div>
                  )}
                  {reportFilters.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{reportFilters.category}</span>
                    </div>
                  )}
                  {reportFilters.track && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Track:</span>
                      <span className="font-medium text-gray-900">{reportFilters.track}</span>
                    </div>
                  )}
                  {reportFilters.elective && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Elective:</span>
                      <span className="font-medium text-gray-900">
                        {electives.find(e => e.id === reportFilters.elective)?.name}
                      </span>
                    </div>
                  )}
                  {!reportFilters.department && !reportFilters.semester && (!reportFilters.section || (Array.isArray(reportFilters.section) && reportFilters.section.length === 0)) && !reportFilters.category && !reportFilters.track && !reportFilters.elective && (
                    <div className="text-gray-600 text-center">All students (no filters applied)</div>
                  )}
                </div>
              </div>
              
              {/* Export Options */}
              <div className="space-y-3">
                <button
                  onClick={() => handleAdvancedExport('excel')}
                  disabled={getFilteredStudentsForReport().length === 0}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5 text-green-600 mr-3" />
                  <div className="text-left">
                    <span className="block text-gray-900 font-medium">Export as CSV (.csv)</span>
                    <span className="block text-sm text-gray-500">Student roster with basic information</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleAdvancedExport('pdf')}
                  disabled={getFilteredStudentsForReport().length === 0}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <FileText className="w-5 h-5 text-red-600 mr-3" />
                  <div className="text-left">
                    <span className="block text-gray-900 font-medium">Export as Report (.txt)</span>
                    <span className="block text-sm text-gray-500">Student roster report in text format</span>
                  </div>
                </button>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setReportFilters({ department: '', semester: '', section: '', category: '', track: '', elective: '' })}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setShowAdvancedReport(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AdminStudents;
