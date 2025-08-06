
import { useState, useEffect } from 'react';

/**
 * Hook to manage optimization state
 */
export const useOptimization = () => {
  // Initialize from sessionStorage or default to true
  const [showOptimization, setShowOptimization] = useState(() => {
    const stored = sessionStorage.getItem('show_optimization');
    // If value exists in storage, parse it. Otherwise default to true
    return stored !== null ? stored === 'true' : true;
  });
  
  // Save to sessionStorage when value changes
  useEffect(() => {
    sessionStorage.setItem('show_optimization', showOptimization.toString());
  }, [showOptimization]);
  
  return {
    showOptimization,
    setShowOptimization
  };
};
