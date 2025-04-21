
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = document.getElementById('root');

// Make sure we have the root element before rendering
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error('Root element not found');
}
