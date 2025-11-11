import React, { createContext, useContext, useState, useEffect } from 'react';

interface ElectiveFeedback {
  id: string;
  studentId: string;
  electiveId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface FeedbackContextType {
  feedbacks: ElectiveFeedback[];
  addFeedback: (feedback: Omit<ElectiveFeedback, 'id' | 'createdAt'>) => void;
  getElectiveFeedback: (electiveId: string) => ElectiveFeedback[];
  getAverageRating: (electiveId: string) => number;
  hasUserRated: (studentId: string, electiveId: string) => boolean;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedbacks, setFeedbacks] = useState<ElectiveFeedback[]>([]);

  useEffect(() => {
    const storedFeedbacks = localStorage.getItem('electiveFeedbacks');
    if (storedFeedbacks) {
      setFeedbacks(JSON.parse(storedFeedbacks).map((f: any) => ({
        ...f,
        createdAt: new Date(f.createdAt)
      })));
    }
  }, []);

  const addFeedback = (feedback: Omit<ElectiveFeedback, 'id' | 'createdAt'>) => {
    const newFeedback: ElectiveFeedback = {
      ...feedback,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    const updatedFeedbacks = [...feedbacks, newFeedback];
    setFeedbacks(updatedFeedbacks);
    localStorage.setItem('electiveFeedbacks', JSON.stringify(updatedFeedbacks));
  };

  const getElectiveFeedback = (electiveId: string): ElectiveFeedback[] => {
    return feedbacks.filter(f => f.electiveId === electiveId);
  };

  const getAverageRating = (electiveId: string): number => {
    const electiveFeedbacks = getElectiveFeedback(electiveId);
    if (electiveFeedbacks.length === 0) return 0;
    
    const totalRating = electiveFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    return totalRating / electiveFeedbacks.length;
  };

  const hasUserRated = (studentId: string, electiveId: string): boolean => {
    return feedbacks.some(f => f.studentId === studentId && f.electiveId === electiveId);
  };

  return (
    <FeedbackContext.Provider value={{
      feedbacks,
      addFeedback,
      getElectiveFeedback,
      getAverageRating,
      hasUserRated,
    }}>
      {children}
    </FeedbackContext.Provider>
  );
};