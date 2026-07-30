import { createContext, useState, useEffect } from 'react';
import { API_CONFIG, fetchWithAuth } from '../config/api.js';

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
  portfolioUrl: 'https://neststack-tech.vercel.app/',
  // Multi-tier credentials
  clientUsername: '',
  clientPassword: '',
  clientTempLogin: true,
  deskOperatorUsername: '',
  deskOperatorPassword: '',
  deskOperatorName: 'Samuel Adjetey',
  masterFallbackUsername: '',
  masterFallbackPassword: '',
  sessionExpired: false
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

  // Fetch credentials from backend API
  const fetchCredentialsFromBackend = async () => {
    // Only fetch if user is authenticated
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      return;
    }

    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.CREDENTIALS);
      if (response.ok) {
        const credentials = await response.json();
        const credentialMap = {};
        credentials.forEach(cred => {
          credentialMap[cred.credential_type] = cred;
        });

        const newSettings = {
          ...settings,
          clientUsername: credentialMap.client?.username || '',
          clientPassword: credentialMap.client?.password_hash || '',
          clientTempLogin: credentialMap.client?.temp_login ?? true,
          deskOperatorUsername: credentialMap.desk_operator?.username || '',
          deskOperatorPassword: credentialMap.desk_operator?.password_hash || '',
          deskOperatorName: credentialMap.desk_operator?.desk_operator_name || '',
          masterFallbackUsername: credentialMap.master_fallback?.username || '',
          masterFallbackPassword: credentialMap.master_fallback?.password_hash || '',
          sessionExpired: credentialMap.client?.session_expired ?? false
        };
        setSettings(newSettings);
        localStorage.setItem('solacehub_owner_settings', JSON.stringify(newSettings));
      }
    } catch (err) {
      console.error('Failed to fetch credentials from backend:', err);
    }
  };

  // Save credentials to backend API
  const saveCredentialsToBackend = async (credentialType, data) => {
    try {
      const response = await fetchWithAuth(API_CONFIG.ENDPOINTS.CREDENTIALS_UPDATE, {
        method: 'POST',
        body: JSON.stringify({ credential_type: credentialType, ...data }),
      });
      if (response.ok) {
        const updated = await response.json();
        return updated;
      }
    } catch (err) {
      console.error('Failed to save credentials to backend:', err);
    }
    return null;
  };

  useEffect(() => {
    fetchCredentialsFromBackend();
  }, []);

  useEffect(() => {
    localStorage.setItem('solacehub_owner_settings', JSON.stringify(settings));
  }, [settings]);

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'solacehub_owner_settings' && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSettings(newSettings);
        } catch (err) {
          console.error('Failed to sync settings from other tab:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = async (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    // Sync specific credential changes to backend
    if (newSettings.clientUsername !== undefined || newSettings.clientPassword !== undefined) {
      await saveCredentialsToBackend('client', {
        username: newSettings.clientUsername || settings.clientUsername,
        password: newSettings.clientPassword || settings.clientPassword,
        temp_login: newSettings.clientTempLogin !== undefined ? newSettings.clientTempLogin : settings.clientTempLogin,
        session_expired: newSettings.sessionExpired !== undefined ? newSettings.sessionExpired : settings.sessionExpired
      });
    }
    if (newSettings.deskOperatorUsername !== undefined || newSettings.deskOperatorPassword !== undefined || newSettings.deskOperatorName !== undefined) {
      await saveCredentialsToBackend('desk_operator', {
        username: newSettings.deskOperatorUsername || settings.deskOperatorUsername,
        password: newSettings.deskOperatorPassword || settings.deskOperatorPassword,
        desk_operator_name: newSettings.deskOperatorName || settings.deskOperatorName
      });
    }
    if (newSettings.masterFallbackUsername !== undefined || newSettings.masterFallbackPassword !== undefined) {
      await saveCredentialsToBackend('master_fallback', {
        username: newSettings.masterFallbackUsername || settings.masterFallbackUsername,
        password: newSettings.masterFallbackPassword || settings.masterFallbackPassword
      });
    }
    if (newSettings.sessionExpired !== undefined) {
      await saveCredentialsToBackend('client', { session_expired: newSettings.sessionExpired });
    }
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

