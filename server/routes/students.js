import express from 'express';
import StudentElective from '../models/StudentElective.js';
import { auth, isStudent, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get student selections (student only - returns their own selections)
router.get('/selections', auth, isStudent, async (req, res) => {
  try {
    console.log('📥 Fetching selections for student:', req.user.id, req.user.email);
    
    // Find all selections for this student (using 'student' field, not 'studentId')
    const selections = await StudentElective.find({ 
      student: req.user.id 
    })
    .populate('elective', 'name code credits track category electiveCategory semester')
    .sort({ semester: 1, selectedAt: 1 });

    console.log('✅ Found', selections.length, 'selections for student:', req.user.id);
    
    if (selections.length > 0) {
      console.log('📋 Sample selection:', {
        id: selections[0]._id,
        student: selections[0].student,
        elective: selections[0].elective?._id,
        electiveName: selections[0].elective?.name,
        semester: selections[0].semester
      });
    }
    
    // Map to match frontend expected format
    const mappedSelections = selections.map(sel => {
      // Extract ObjectId as string
      const electiveId = typeof sel.elective === 'object' && sel.elective !== null
        ? (sel.elective._id ? sel.elective._id.toString() : sel.elective.toString())
        : sel.elective.toString();
      
      return {
        _id: sel._id,
        studentId: sel.student.toString(),  // Map 'student' to 'studentId' for frontend
        electiveId: electiveId,  // Extract the actual ID from populated object
        semester: sel.semester,
        track: sel.track,
        category: sel.elective?.category || [],
        status: sel.status || 'selected',
        selectedAt: sel.selectedAt,
        createdAt: sel.createdAt
      };
    });
    
    res.json({
      success: true,
      selections: mappedSelections,
      count: mappedSelections.length
    });
  } catch (error) {
    console.error('❌ Get student selections error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get selections for a specific student (admin only)
router.get('/selections/:studentId', auth, isAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('📥 Admin fetching selections for student:', studentId);
    
    // Use 'student' field, not 'studentId'
    const selections = await StudentElective.find({ 
      student: studentId 
    })
    .populate('elective', 'name code credits track category electiveCategory semester')
    .sort({ semester: 1, selectedAt: 1 });

    console.log('✅ Found', selections.length, 'selections');
    
    // Map to match frontend expected format
    const mappedSelections = selections.map(sel => {
      // Extract ObjectId as string
      const electiveId = typeof sel.elective === 'object' && sel.elective !== null
        ? (sel.elective._id ? sel.elective._id.toString() : sel.elective.toString())
        : sel.elective.toString();
      
      return {
        _id: sel._id,
        studentId: sel.student.toString(),
        electiveId: electiveId,
        semester: sel.semester,
        track: sel.track,
        category: sel.elective?.category || [],
        status: sel.status || 'selected',
        selectedAt: sel.selectedAt
      };
    });
    
    res.json({
      success: true,
      selections: mappedSelections,
      count: mappedSelections.length
    });
  } catch (error) {
    console.error('❌ Get student selections error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get ALL student selections (admin only) - for reports
router.get('/all-selections', auth, isAdmin, async (req, res) => {
  try {
    console.log('📥 Admin fetching ALL student selections');
    
    // Get all selections across all students
    const selections = await StudentElective.find({})
      .populate('elective', 'name code credits track category electiveCategory semester')
      .populate('student', 'name email rollNumber department semester section')
      .sort({ student: 1, semester: 1, selectedAt: 1 });

    console.log('✅ Found', selections.length, 'total selections across all students');
    
    if (selections.length > 0) {
      console.log('📋 Sample selection (first one):');
      console.log('  - student field type:', typeof selections[0].student);
      console.log('  - student._id:', selections[0].student?._id);
      console.log('  - elective field type:', typeof selections[0].elective);
      console.log('  - elective._id:', selections[0].elective?._id);
    }
    
    // Map to match frontend expected format
    const mappedSelections = selections.map((sel, index) => {
      // Extract the actual ObjectId strings from populated documents
      const studentId = typeof sel.student === 'object' && sel.student !== null
        ? (sel.student._id ? sel.student._id.toString() : sel.student.toString())
        : sel.student.toString();
      
      const electiveId = typeof sel.elective === 'object' && sel.elective !== null
        ? (sel.elective._id ? sel.elective._id.toString() : sel.elective.toString())
        : sel.elective.toString();
      
      if (index < 3) {
        console.log(`   [${index + 1}] Mapped selection:`, {
          originalStudentId: sel.student,
          mappedStudentId: studentId,
          originalElectiveId: sel.elective,
          mappedElectiveId: electiveId,
          electiveName: sel.elective?.name,
          track: sel.track
        });
      }
      
      return {
        _id: sel._id,
        studentId: studentId,
        electiveId: electiveId,
        semester: sel.semester,
        track: sel.track,
        category: sel.elective?.category || [],
        status: sel.status || 'selected',
        selectedAt: sel.selectedAt,
        createdAt: sel.createdAt
      };
    });
    
    console.log('✅ Mapped', mappedSelections.length, 'selections successfully');
    
    res.json({
      success: true,
      selections: mappedSelections,
      count: mappedSelections.length
    });
  } catch (error) {
    console.error('❌ Get all student selections error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;
