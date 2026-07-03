import { createContext, useContext, useState, useCallback } from 'react';

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  const [activeConnection, setActiveConnection] = useState(null);

  const selectConnection = useCallback((connection) => {
    setActiveConnection(connection);
  }, []);

  const clearActiveConnection = useCallback(() => {
    setActiveConnection(null);
  }, []);

  return (
    <ConnectionContext.Provider
      value={{ activeConnection, selectConnection, clearActiveConnection }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}

export default ConnectionContext;
