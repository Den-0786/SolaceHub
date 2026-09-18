import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const DeploymentContext = createContext();

export function DeploymentProvider({ children }) {
  const [activeDeployment, setActiveDeployment] = useState(null);

  const setActiveDeploymentContext = useCallback((deployment) => {
    setActiveDeployment(deployment);
  }, []);

  const value = useMemo(
    () => ({ activeDeployment, setActiveDeployment: setActiveDeploymentContext }),
    [activeDeployment, setActiveDeploymentContext]
  );

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDeployment() {
  const context = useContext(DeploymentContext);
  if (!context) {
    throw new Error('useDeployment must be used within a DeploymentProvider');
  }
  return context;
}
