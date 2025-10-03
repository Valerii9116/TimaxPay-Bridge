import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = 'dc14d146c0227704322ac9a46aaed7cd';

const metadata = {
  name: 'TimaxPay Bridge',
  description: 'Cross-chain bridge powered by LI.FI',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://swap.timaxpay.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '12px',
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  ]
});

export { WagmiConfig, QueryClientProvider, queryClient };