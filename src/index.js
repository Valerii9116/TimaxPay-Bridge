import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './index.css';
import App from './App';
import { wagmiConfig } from './config/wagmi'; // Correctly import wagmiConfig
import reportWebVitals from './reportWebVitals';

// Create a client for react-query
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Wrap the App in the necessary providers */}
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
);

reportWebVitals();

