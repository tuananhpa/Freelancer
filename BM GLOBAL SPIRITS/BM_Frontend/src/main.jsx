import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/main.css';
import { App } from './App';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
