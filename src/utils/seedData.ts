// Utility to seed initial data for demo purposes
export const seedInitialData = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Add demo users if none exist
  if (users.length === 0) {
    const demoUsers = [
      {
        id: 'student1',
        name: 'John Smith',
        email: 'student@example.com',
        password: 'password123',
        role: 'student',
        rollNo: '20CS101',
        department: 'Computer Science & Engineering',
        semester: 6,
        section: 'A',
        isNewUser: false
      },
      {
        id: 'student2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'student',
        rollNo: '20CS102',
        department: 'Computer Science & Engineering',
        semester: 5,
        section: 'B',
        isNewUser: true
      },
      {
        id: 'admin1',
        name: 'Dr. Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isNewUser: false
      }
    ];

    localStorage.setItem('users', JSON.stringify(demoUsers));

    // No hardcoded student electives - students will select from admin-created electives
    console.log('Demo users created - electives will be managed by admin interface');
  }
};

// Call this to initialize demo data
export const initializeDemoData = () => {
  if (typeof window !== 'undefined') {
    // Clear any existing hardcoded data including any cached electives
    localStorage.removeItem('electives');
    localStorage.removeItem('studentElectives');
    localStorage.removeItem('electiveFeedback');
    
    seedInitialData();
  }
};

// Function to completely reset all demo data (for development)
export const resetAllData = () => {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    console.log('All localStorage data cleared - fresh start with admin-created electives only');
  }
};
