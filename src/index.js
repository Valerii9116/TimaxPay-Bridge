import React from 'react';
import ReactDOM from 'react-dom/client';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { wagmiConfig, projectId } from './config/wagmi';
import './index.css';
import reportWebVitals from './reportWebVitals';

// ✨ FIX: All providers and the Web3Modal instance must be created here,
// at the very top level of your application. This is the correct pattern.

// 1. Create a query client
const queryClient = new QueryClient();

// 2. Create Web3Modal
createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId,
  chains: wagmiConfig.chains, // Use chains from your config
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Wrap your entire application with the necessary providers */}
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
);

reportWebVitals();

