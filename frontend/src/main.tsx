import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root was not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
      registration.update();
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
