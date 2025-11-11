import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { initializeDemoData } from './utils/seedData';

// Initialize demo data
initializeDemoData();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FeedbackProvider>
      <App />
    </FeedbackProvider>
  </StrictMode>
);