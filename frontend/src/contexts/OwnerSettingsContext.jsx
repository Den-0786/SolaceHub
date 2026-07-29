import { createContext, useState, useEffect } from 'react';

const defaultSettings = {
  brandName: 'SolaceHub Event Systems',
  developerName: 'Dennis Opoku Amponsah',
  avatar: '/SolaceHubLogo.jpeg',
  systemVersion: 'SolaceHub v2.4-Stable',
  thermalPrinterStatus: 'Operational',
  storageStatus: 'Local Storage Active',
  masterUsername: 'Dennis_Opoku_Amponsah',
  masterEmail: 'dennisopokuamponsah86@gmail.com',
  phone: '+233 245660786',
  whatsapp: '+233 245660786',
  location: 'Kumasi, Ghana',
  portfolioUrl: 'https://neststack-tech.vercel.app/'
};

// eslint-disable-next-line react-refresh/only-export-components
export const OwnerSettingsContext = createContext();

export function OwnerSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('solacehub_owner_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem('solacehub_owner_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateContact = (contact) => {
    setSettings((prev) => ({
      ...prev,
      ...contact
    }));
  };

  return (
    <OwnerSettingsContext.Provider value={{ settings, updateSettings, updateContact }}>
      {children}
    </OwnerSettingsContext.Provider>
  );
}

