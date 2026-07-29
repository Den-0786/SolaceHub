import { useContext } from 'react';
import { OwnerSettingsContext } from '../contexts/OwnerSettingsContext.jsx';

export function useOwnerSettings() {
  const context = useContext(OwnerSettingsContext);
  if (!context) {
    throw new Error('useOwnerSettings must be used within an OwnerSettingsProvider');
  }
  return context;
}
