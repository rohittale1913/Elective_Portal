import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StudentRedirect: React.FC = () => {
  const { user, markUserAsExperienced } = useAuth();
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    // Mark user as experienced when they access the app (only once)
    if (user?.isNewUser && !hasMarkedRef.current) {
      hasMarkedRef.current = true;
      markUserAsExperienced();
    }
  }, [user?.isNewUser, markUserAsExperienced]);

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  // Redirect all students to electives page
  return <Navigate to="/electives" replace />;
};

export default StudentRedirect;
