import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyThemeSetting, loadThemeSetting } from './design/theme';
import '@fontsource-variable/inter';
import './design/tokens.css';
import './styles.css';
import './design/brand.css';
import './layout.css';
import './analysis.css';
import './records.css';

// Before the first render, so a saved light theme does not flash dark.
applyThemeSetting(loadThemeSetting());

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
