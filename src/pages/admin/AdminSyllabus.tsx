import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { FileText, Upload, Eye, Download, Trash2 } from 'lucide-react';

const AdminSyllabus: React.FC = () => {
  const { 
    electives, 
    getAllSyllabi, 
    uploadSyllabus, 
    deleteSyllabus,
    getAvailableDepartments,
    getAvailableSemesters
  } = useData();
  const { addNotification } = useNotifications();

  const [selectedElective, setSelectedElective] = useState<string>('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'elective' | 'complete'>('elective');
  const [targetDepartment, setTargetDepartment] = useState<string>('all');
  const [targetSemester, setTargetSemester] = useState<string>('all');

  const allSyllabi = getAllSyllabi();
  const departments = getAvailableDepartments();
  const semesters = getAvailableSemesters();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const pdfFiles = Array.from(selectedFiles).filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length === 0) {
        addNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select PDF files only.'
        });
        return;
      }

      if (pdfFiles.length < selectedFiles.length) {
        addNotification({
          type: 'warning',
          title: 'Some Files Skipped',
          message: `${selectedFiles.length - pdfFiles.length} non-PDF file(s) were skipped.`
        });
      }

      setFiles(pdfFiles);
    }
  };

  const handleUpload = async () => {
    // For complete syllabus, we use a special ID
    const electiveId = uploadType === 'complete' ? 'COMPLETE_SYLLABUS' : selectedElective;
    const syllabusTitle = uploadType === 'complete' ? 'Complete Syllabus Document' : '';

    if ((uploadType === 'elective' && !selectedElective) || files.length === 0) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: uploadType === 'complete' 
          ? 'Please select at least one PDF file.' 
          : 'Please select an elective and at least one PDF file.'
      });
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Upload each file separately
      for (const file of files) {
        try {
          const success = await uploadSyllabus(
            electiveId, 
            file, 
            description || syllabusTitle,
            targetDepartment === 'all' ? undefined : targetDepartment,
            targetSemester === 'all' ? undefined : parseInt(targetSemester)
          );
          
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failCount++;
        }
      }

      // Show summary notification
      if (successCount > 0) {
        addNotification({
          type: 'success',
          title: 'Upload Complete',
          message: `Successfully uploaded ${successCount} file(s).${failCount > 0 ? ` ${failCount} file(s) failed.` : ''}`
        });
      }

      if (failCount > 0 && successCount === 0) {
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: 'All file uploads failed. Please try again.'
        });
      }

      // Reset form if at least one succeeded
      if (successCount > 0) {
        setSelectedElective('');
        setDescription('');
        setFiles([]);
        setTargetDepartment('all');
        setTargetSemester('all');
        const fileInput = document.getElementById('syllabusFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload syllabus files. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (syllabusId: string) => {
    if (window.confirm('Are you sure you want to delete this syllabus?')) {
      const success = await deleteSyllabus(syllabusId);
      if (success) {
        addNotification({
          type: 'success',
          title: 'Syllabus Deleted',
          message: 'The syllabus has been deleted successfully.'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete syllabus. Please try again.'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Syllabus Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload and manage syllabus PDFs for electives
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload New Syllabus
          </h2>

          {/* Upload Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Syllabus Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadType"
                  value="elective"
                  checked={uploadType === 'elective'}
                  onChange={(e) => setUploadType(e.target.value as 'elective' | 'complete')}
                  className="mr-2"
                />
                <span className="text-gray-900 dark:text-white">Individual Elective Syllabus</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadType"
                  value="complete"
                  checked={uploadType === 'complete'}
                  onChange={(e) => setUploadType(e.target.value as 'elective' | 'complete')}
                  className="mr-2"
                />
                <span className="text-gray-900 dark:text-white">Complete Syllabus Document (All Electives)</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {uploadType === 'elective' 
                ? 'Upload syllabus for a specific elective course' 
                : 'Upload a comprehensive syllabus document containing all electives'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {uploadType === 'elective' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Elective
                </label>
                <select
                  value={selectedElective}
                  onChange={(e) => setSelectedElective(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an elective...</option>
                  {electives.map(elective => (
                    <option key={elective.id} value={elective.id}>
                      {elective.name} ({elective.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={uploadType === 'complete' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PDF Files (Multiple files supported)
              </label>
              <input
                id="syllabusFile"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {files.length} file(s) selected:
                  </p>
                  {files.map((file, index) => (
                    <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                      • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Target Department and Semester Selection */}
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Department (Optional)
              </label>
              <select
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only students from selected department will see this syllabus
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Semester (Optional)
              </label>
              <select
                value={targetSemester}
                onChange={(e) => setTargetSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Semesters</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only students in selected semester will see this syllabus
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description for this syllabus..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading || (uploadType === 'elective' && !selectedElective) || files.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? `Uploading ${files.length} file(s)...` : `Upload ${files.length > 0 ? `${files.length} ` : ''}${uploadType === 'complete' ? 'Complete' : ''} Syllabus`}
            </button>
            {files.length > 0 && !uploading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Ready to upload {files.length} file(s){targetDepartment !== 'all' ? ` to ${targetDepartment}` : ''}{targetSemester !== 'all' ? `, Semester ${targetSemester}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Existing Syllabi */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Existing Syllabus ({allSyllabi.length})
          </h2>

          {allSyllabi.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Syllabus Uploaded
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload your first syllabus using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Show Complete Syllabus First */}
              {allSyllabi
                .filter(s => s.electiveId === 'COMPLETE_SYLLABUS')
                .map(syllabus => (
                  <div key={syllabus.id} className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-blue-900 dark:text-blue-100">
                            📚 Complete Syllabus Document
                          </h3>
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            All Electives
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {syllabus.pdfFileName}
                        </p>
                        {syllabus.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {syllabus.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Uploaded: {syllabus.uploadedAt.toLocaleDateString()}</span>
                          <span>Academic Year: {syllabus.academicYear}</span>
                          <span>Version: {syllabus.version}</span>
                          {syllabus.targetDepartment && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                              📍 {syllabus.targetDepartment}
                            </span>
                          )}
                          {syllabus.targetSemester && (
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                              📅 Sem {syllabus.targetSemester}
                            </span>
                          )}
                          {!syllabus.targetDepartment && !syllabus.targetSemester && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                              🌐 All Students
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            const win = window.open('', '_blank');
                            if (win) {
                              win.document.write(`
                                <html>
                                  <head><title>${syllabus.pdfFileName}</title></head>
                                  <body style="margin:0">
                                    <embed width="100%" height="100%" src="${syllabus.pdfData}" type="application/pdf" />
                                  </body>
                                </html>
                              `);
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors"
                          title="View PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = syllabus.pdfData;
                            link.download = syllabus.pdfFileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded-md transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(syllabus.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md transition-colors"
                          title="Delete Syllabus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Individual Elective Syllabi */}
              {allSyllabi
                .filter(s => s.electiveId !== 'COMPLETE_SYLLABUS')
                .map(syllabus => {
                const elective = electives.find(e => e.id === syllabus.electiveId);
                return (
                  <div key={syllabus.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {elective?.name || 'Unknown Elective'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {elective?.code} • {syllabus.pdfFileName}
                        </p>
                        {syllabus.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {syllabus.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Uploaded: {syllabus.uploadedAt.toLocaleDateString()}</span>
                          <span>Academic Year: {syllabus.academicYear}</span>
                          <span>Version: {syllabus.version}</span>
                          {syllabus.targetDepartment && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                              📍 {syllabus.targetDepartment}
                            </span>
                          )}
                          {syllabus.targetSemester && (
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                              📅 Sem {syllabus.targetSemester}
                            </span>
                          )}
                          {!syllabus.targetDepartment && !syllabus.targetSemester && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                              🌐 All Students
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            // Open PDF from base64 data
                            const win = window.open('', '_blank');
                            if (win) {
                              win.document.write(`
                                <html>
                                  <head><title>${syllabus.pdfFileName}</title></head>
                                  <body style="margin:0">
                                    <embed width="100%" height="100%" src="${syllabus.pdfData}" type="application/pdf" />
                                  </body>
                                </html>
                              `);
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="View PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = syllabus.pdfData;
                            link.download = syllabus.pdfFileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(syllabus.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete Syllabus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSyllabus;
