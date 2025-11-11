import express from 'express';
import Elective from '../models/Elective.js';
import StudentElective from '../models/StudentElective.js';
import ElectiveFeedback from '../models/ElectiveFeedback.js';
import { auth, isAdmin, isStudent } from '../middleware/auth.js';

const router = express.Router();

// Get all electives (public)
router.get('/', async (req, res) => {
  try {
    const { category, department, semester, track } = req.query;
    
    let filter = { isActive: true };
    
    if (category) filter.electiveCategory = category;
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (track) filter.track = track;

    const electives = await Elective.find(filter)
      .populate('prerequisites', 'name code')
      .populate('futureOptions', 'name code semester')
      .sort({ semester: 1, name: 1 });

    res.json(electives);
  } catch (error) {
    console.error('Get electives error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get elective by ID
router.get('/:id', async (req, res) => {
  try {
    const elective = await Elective.findById(req.params.id)
      .populate('prerequisites', 'name code')
      .populate('futureOptions', 'name code semester')
      .populate('createdBy', 'name email');

    if (!elective) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    res.json(elective);
  } catch (error) {
    console.error('Get elective error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new elective (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const electiveData = {
      ...req.body,
      createdBy: req.user.id
    };

    const elective = new Elective(electiveData);
    await elective.save();

    const populatedElective = await Elective.findById(elective._id)
      .populate('prerequisites', 'name code')
      .populate('futureOptions', 'name code semester');

    res.status(201).json({
      message: 'Elective created successfully',
      elective: populatedElective
    });
  } catch (error) {
    console.error('Create elective error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Elective code already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Clear enrollment count (admin only) - MUST come before /:id routes
router.put('/:id/clear-enrollment', auth, isAdmin, async (req, res) => {
  try {
    const elective = await Elective.findByIdAndUpdate(
      req.params.id,
      { enrolledStudents: 0 },
      { new: true, runValidators: true }
    );

    if (!elective) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    res.json({
      success: true,
      message: 'Enrollment cleared successfully',
      elective
    });
  } catch (error) {
    console.error('Clear enrollment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update elective (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const elective = await Elective.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('prerequisites', 'name code')
     .populate('futureOptions', 'name code semester');

    if (!elective) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    res.json({
      message: 'Elective updated successfully',
      elective
    });
  } catch (error) {
    console.error('Update elective error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete elective (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const elective = await Elective.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!elective) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    res.json({ message: 'Elective deleted successfully' });
  } catch (error) {
    console.error('Delete elective error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Select elective (student only)
// Select an elective (student only) - NEW ENDPOINT to match frontend
router.post('/select/:id', auth, isStudent, async (req, res) => {
  try {
    const electiveId = req.params.id;
    const { studentId, semester } = req.body;

    console.log('📥 Received elective selection request:', { 
      electiveId, 
      studentId, 
      semester,
      authenticatedUser: req.user.id 
    });

    // Check if elective exists and is active
    const elective = await Elective.findById(electiveId);
    if (!elective || !elective.isActive) {
      console.log('❌ Elective not found or inactive:', electiveId);
      return res.status(404).json({ 
        success: false,
        error: 'Elective not found or is not active' 
      });
    }

    console.log('✅ Elective found:', elective.name, elective.code);

    // Check deadline
    if (elective.selectionDeadline && new Date() > elective.selectionDeadline) {
      console.log('❌ Selection deadline passed for:', elective.name);
      return res.status(400).json({ 
        success: false,
        error: 'Selection deadline has passed' 
      });
    }

    // Check if student already selected this elective for this semester
    // NOTE: Model uses 'student' and 'elective' fields, not 'studentId' and 'electiveId'
    const existingSelection = await StudentElective.findOne({
      student: studentId || req.user.id,
      elective: electiveId,
      semester: semester
    });

    if (existingSelection) {
      console.log('⚠️ Student already selected this elective:', existingSelection);
      return res.status(400).json({ 
        success: false,
        error: 'You have already selected this elective for this semester' 
      });
    }

    console.log('✅ No existing selection found, proceeding to create new selection');

    // Create selection using correct model field names
    const studentElective = new StudentElective({
      student: studentId || req.user.id,  // Uses 'student' not 'studentId'
      elective: electiveId,  // Uses 'elective' not 'electiveId'
      semester: semester,
      track: elective.track,
      status: 'selected',
      selectedAt: new Date()
    });

    await studentElective.save();
    console.log('✅ Selection saved to MongoDB:', studentElective);

    // Populate the elective details before returning
    await studentElective.populate('elective', 'name code credits track category');
    
    res.status(201).json({
      success: true,
      message: 'Elective selected successfully',
      selection: studentElective
    });
  } catch (error) {
    console.error('❌ Select elective error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Select an elective (student only) - ORIGINAL ENDPOINT
router.post('/:id/select', auth, isStudent, async (req, res) => {
  try {
    const electiveId = req.params.id;
    const { semester } = req.body;

    // Check if elective exists and is active
    const elective = await Elective.findById(electiveId);
    if (!elective || !elective.isActive) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    // Check deadline
    if (elective.selectionDeadline && new Date() > elective.selectionDeadline) {
      return res.status(400).json({ message: 'Selection deadline has passed' });
    }

    // Check if student already selected this elective
    const existingSelection = await StudentElective.findOne({
      student: req.user.id,
      elective: electiveId
    });

    if (existingSelection) {
      return res.status(400).json({ message: 'You have already selected this elective' });
    }

    // Check if student already selected an elective for this semester
    const semesterSelection = await StudentElective.findOne({
      student: req.user.id,
      semester: semester || req.user.semester
    });

    if (semesterSelection) {
      return res.status(400).json({ message: 'You have already selected an elective for this semester' });
    }

    // Check prerequisites
    if (elective.prerequisites && elective.prerequisites.length > 0) {
      const completedElectives = await StudentElective.find({
        student: req.user.id,
        status: 'completed'
      }).select('elective');

      const completedIds = completedElectives.map(se => se.elective.toString());
      const prerequisiteIds = elective.prerequisites.map(p => p.toString());
      
      const hasAllPrerequisites = prerequisiteIds.every(prereq => 
        completedIds.includes(prereq)
      );

      if (!hasAllPrerequisites) {
        return res.status(400).json({ message: 'You do not meet the prerequisites for this elective' });
      }
    }

    // Create selection
    const studentElective = new StudentElective({
      student: req.user.id,
      elective: electiveId,
      semester: semester || req.user.semester,
      track: elective.track
    });

    await studentElective.save();

    res.status(201).json({
      message: 'Elective selected successfully',
      selection: studentElective
    });
  } catch (error) {
    console.error('Select elective error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student's electives
router.get('/student/my-electives', auth, isStudent, async (req, res) => {
  try {
    const studentElectives = await StudentElective.find({ student: req.user.id })
      .populate('elective', 'name code semester track description credits category electiveCategory')
      .sort({ semester: 1, selectedAt: 1 });

    res.json(studentElectives);
  } catch (error) {
    console.error('Get student electives error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit elective feedback
router.post('/feedback', auth, isStudent, async (req, res) => {
  try {
    const { previousElectiveId, semester, feedback } = req.body;

    // Check if feedback already exists
    const existingFeedback = await ElectiveFeedback.findOne({
      student: req.user.id,
      previousElective: previousElectiveId
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this elective' });
    }

    const electiveFeedback = new ElectiveFeedback({
      student: req.user.id,
      previousElective: previousElectiveId,
      semester,
      feedback
    });

    await electiveFeedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: electiveFeedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get elective recommendations
router.post('/recommendations', auth, isStudent, async (req, res) => {
  try {
    const { interests, careerGoals, difficulty } = req.body;
    
    // Get completed electives
    const completedElectives = await StudentElective.find({
      student: req.user.id,
      status: { $in: ['completed', 'selected'] }
    }).select('elective');

    const completedIds = completedElectives.map(se => se.elective.toString());

    // Get available electives
    const availableElectives = await Elective.find({
      _id: { $nin: completedIds },
      isActive: true,
      semester: { $gte: req.user.semester }
    });

    // Score and sort electives
    const scoredElectives = availableElectives.map(elective => {
      let score = 0;
      
      // Interest matching
      if (interests.includes(elective.track)) score += 3;
      
      // Career goal matching
      if (elective.description.toLowerCase().includes(careerGoals.toLowerCase())) score += 2;
      
      // Difficulty preference
      if (difficulty === 'easy' && elective.category === 'Theory') score += 1;
      if (difficulty === 'challenging' && elective.category === 'Practical') score += 1;
      
      return { ...elective.toObject(), score };
    });

    // Sort by score and return top 5
    const recommendations = scoredElectives
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
