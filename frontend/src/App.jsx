import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ShellSummaryProvider } from './context/ShellSummaryContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ShellSummaryProvider>
          <AppRoutes />
        </ShellSummaryProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
