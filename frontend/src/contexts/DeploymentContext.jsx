import { createContext, useContext, useState } from 'react';

const DeploymentContext = createContext();

export function DeploymentProvider({ children }) {
  const [activeDeployment, setActiveDeployment] = useState(null);

  const setActiveDeploymentContext = (deployment) => {
    setActiveDeployment(deployment);
  };

  return (
    <DeploymentContext.Provider value={{ activeDeployment, setActiveDeployment: setActiveDeploymentContext }}>
      {children}
    </DeploymentContext.Provider>
  );
}

export function useDeployment() {
  const context = useContext(DeploymentContext);
  if (!context) {
    throw new Error('useDeployment must be used within a DeploymentProvider');
  }
  return context;
}
