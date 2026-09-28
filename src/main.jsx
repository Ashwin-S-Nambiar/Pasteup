import './index.css';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { initTips } from './lib/tip.js';

const NotFound = lazy(() => import('./components/NotFound.jsx'));
const home = location.pathname === '/' || location.pathname === '/index.html';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {home ? (
      <App />
    ) : (
      <Suspense>
        <NotFound />
      </Suspense>
    )}
  </StrictMode>,
);

initTips();
