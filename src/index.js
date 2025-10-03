import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Web3ModalProvider } from './config/wagmi';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Web3ModalProvider>
      <App />
    </Web3ModalProvider>
  </React.StrictMode>
);

reportWebVitals();
