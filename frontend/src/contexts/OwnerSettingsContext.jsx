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
  deskOperatorName: '',
  donationOperatorName: '',
  chitOperatorName: '',
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
          clientPassword: '', // Don't store hashed password
          clientTempLogin: credentialMap.client?.temp_login ?? true,
          deskOperatorUsername: credentialMap.desk_operator?.username || '',
          deskOperatorPassword: '', // Don't store hashed password
          deskOperatorName: credentialMap.desk_operator?.desk_operator_name || '',
          masterFallbackUsername: credentialMap.master_fallback?.username || '',
          masterFallbackPassword: '', // Don't store hashed password
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
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        return { ok: true, data: body };
      }
      return { ok: false, error: body.error || body.message || `Failed to save ${credentialType} credentials (${response.status})` };
    } catch (err) {
      console.error('Failed to save credentials to backend:', err);
      return { ok: false, error: 'Connection error. Could not reach the server.' };
    }
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
    // Only send password if it's explicitly being changed (not the stored hashed password)
    const errors = [];
    if (newSettings.clientUsername !== undefined || newSettings.clientPassword !== undefined) {
      const payload = {
        username: newSettings.clientUsername || settings.clientUsername,
        temp_login: newSettings.clientTempLogin !== undefined ? newSettings.clientTempLogin : settings.clientTempLogin,
        session_expired: newSettings.sessionExpired !== undefined ? newSettings.sessionExpired : settings.sessionExpired
      };
      // Only include password if it's explicitly being set (not the stored hash)
      if (newSettings.clientPassword !== undefined && newSettings.clientPassword !== settings.clientPassword) {
        payload.password = newSettings.clientPassword;
      }
      const result = await saveCredentialsToBackend('client', payload);
      if (!result.ok) errors.push(`Client credentials: ${result.error}`);
    }
    if (newSettings.deskOperatorUsername !== undefined || newSettings.deskOperatorPassword !== undefined || newSettings.deskOperatorName !== undefined) {
      const payload = {
        username: newSettings.deskOperatorUsername || settings.deskOperatorUsername,
        desk_operator_name: newSettings.deskOperatorName || settings.deskOperatorName
      };
      // Only include password if it's explicitly being set (not the stored hash)
      if (newSettings.deskOperatorPassword !== undefined && newSettings.deskOperatorPassword !== settings.deskOperatorPassword) {
        payload.password = newSettings.deskOperatorPassword;
      }
      const result = await saveCredentialsToBackend('desk_operator', payload);
      if (!result.ok) errors.push(`Desk operator credentials: ${result.error}`);
    }
    if (newSettings.masterFallbackUsername !== undefined || newSettings.masterFallbackPassword !== undefined) {
      const payload = {
        username: newSettings.masterFallbackUsername || settings.masterFallbackUsername
      };
      // Only include password if it's explicitly being set (not the stored hash)
      if (newSettings.masterFallbackPassword !== undefined && newSettings.masterFallbackPassword !== settings.masterFallbackPassword) {
        payload.password = newSettings.masterFallbackPassword;
      }
      const result = await saveCredentialsToBackend('master_fallback', payload);
      if (!result.ok) errors.push(`Master fallback key: ${result.error}`);
    }
    if (newSettings.sessionExpired !== undefined && newSettings.clientUsername === undefined) {
      const result = await saveCredentialsToBackend('client', { session_expired: newSettings.sessionExpired });
      if (!result.ok) errors.push(`Session state: ${result.error}`);
    }
    return errors;
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

