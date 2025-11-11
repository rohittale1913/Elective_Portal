import express from 'express';
import SystemConfig from '../models/SystemConfig.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get system configuration
router.get('/', auth, async (req, res) => {
  try {
    console.log('📥 Fetching system configuration');
    
    // Find the main config (there should only be one)
    let config = await SystemConfig.findOne({ configId: 'main' });
    
    // If no config exists, create default one
    if (!config) {
      console.log('⚠️ No system config found, creating default');
      config = new SystemConfig({
        configId: 'main',
        departments: ['Artificial Intelligence', 'Computer Science', 'Information Technology'],
        sections: ['A', 'B', 'C'],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
        electiveCategories: ['Program Elective (PEC)', 'Open Elective (OEC)', 'Humanities and Social Sciences (HSMC)', 'Indian Knowledge System (IKS)']
      });
      await config.save();
      console.log('✅ Created default system config');
    }
    
    console.log('✅ System config found:', {
      departments: config.departments?.length || 0,
      sections: config.sections?.length || 0,
      semesters: config.semesters?.length || 0,
      electiveCategories: config.electiveCategories?.length || 0
    });
    
    res.json({
      success: true,
      config: {
        departments: config.departments || [],
        sections: config.sections || [],
        semesters: config.semesters || [],
        electiveCategories: config.electiveCategories || []
      }
    });
  } catch (error) {
    console.error('❌ Get system config error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update system configuration (admin only)
router.put('/', auth, isAdmin, async (req, res) => {
  try {
    console.log('📥 Updating system configuration');
    console.log('📝 Update data:', req.body);
    
    // Find or create the main config
    let config = await SystemConfig.findOne({ configId: 'main' });
    
    if (!config) {
      console.log('⚠️ No config found, creating new one');
      config = new SystemConfig({ configId: 'main' });
    }
    
    // Update fields if provided
    if (req.body.departments !== undefined) {
      config.departments = req.body.departments;
      console.log('✅ Updated departments:', config.departments.length);
    }
    if (req.body.sections !== undefined) {
      config.sections = req.body.sections;
      console.log('✅ Updated sections:', config.sections.length);
    }
    if (req.body.semesters !== undefined) {
      config.semesters = req.body.semesters;
      console.log('✅ Updated semesters:', config.semesters.length);
    }
    if (req.body.electiveCategories !== undefined) {
      config.electiveCategories = req.body.electiveCategories;
      console.log('✅ Updated electiveCategories:', config.electiveCategories.length, config.electiveCategories);
    }
    
    await config.save();
    console.log('✅ System config saved to MongoDB');
    
    res.json({
      success: true,
      message: 'System configuration updated successfully',
      config: {
        departments: config.departments || [],
        sections: config.sections || [],
        semesters: config.semesters || [],
        electiveCategories: config.electiveCategories || []
      }
    });
  } catch (error) {
    console.error('❌ Update system config error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;
