import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// CRITICAL: Use your own WalletConnect Project ID from https://cloud.walletconnect.com
const projectId = 'dc14d146c0227704322ac9a46aaed7cd';

// Get the actual URL dynamically
const getAppUrl = () => {
  if (typeof window === 'undefined') return 'https://swap.timaxpay.com';
  return window.location.origin;
};

const metadata = {
  name: 'TimaxPay Bridge',
  description: 'Cross-chain bridge powered by LI.FI',
  url: getAppUrl(),
  icons: [`${getAppUrl()}/logo192.png`],
  verifyUrl: getAppUrl(),
};

const chains = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

// Configure Wagmi with mobile-friendly settings
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
  enableEmail: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 30000,
    },
  },
});

// Create Web3Modal with optimized mobile settings
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  defaultChain: mainnet,
  
  // Theme settings
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  // Mobile optimizations
  enableAnalytics: false,
  enableOnramp: false,
  
  // Featured wallets for better mobile experience
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    '163d2cf19babf05eb8962e9748f9ebe613ed52ebf9c8107c9a0f104bfcf161b3', // Blockchain.com
  ],
  
  // Include recommended wallets
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
  ],
  
  // Mobile-specific settings
  mobileWallets: [
    {
      id: 'metamask',
      name: 'MetaMask',
      links: {
        native: 'metamask:',
        universal: 'https://metamask.app.link',
      },
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      links: {
        native: 'trust:',
        universal: 'https://link.trustwallet.com',
      },
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      links: {
        native: 'rainbow:',
        universal: 'https://rainbow.me',
      },
    },
  ],
  
  // Desktop wallets
  desktopWallets: [
    {
      id: 'metamask',
      name: 'MetaMask',
      links: {
        native: '',
        universal: 'https://metamask.io',
      },
    },
  ],
});

export { WagmiConfig, QueryClientProvider, queryClient };