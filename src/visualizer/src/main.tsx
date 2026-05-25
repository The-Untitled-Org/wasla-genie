import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { VisualizerApp } from './VisualizerApp';
import { createVisualizerTheme } from './theme/design-system';

function AppRoot() {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');
  return (
    <ThemeProvider theme={createVisualizerTheme(mode)}>
      <CssBaseline />
      <VisualizerApp
        mode={mode}
        onToggleMode={() => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
      />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
