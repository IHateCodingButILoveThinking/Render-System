import {StrictMode, createElement} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.js';
import './index.css';

const getPlatformClass = () => {
  const platform = (
    navigator.userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    ''
  ).toLowerCase();

  if (platform.includes('win')) return 'platform-windows';
  if (platform.includes('mac')) return 'platform-mac';
  return 'platform-default';
};

document.documentElement.classList.add(getPlatformClass());

createRoot(document.getElementById('root')).render(
  createElement(StrictMode, null, createElement(App)),
);
