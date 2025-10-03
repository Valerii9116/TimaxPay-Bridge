import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'wagmi/chains';

// 1. Get your projectId from https://cloud.walletconnect.com
const projectId = 'dc14d146c0227704322ac9a46aaed7cd';

// 2. Create wagmiConfig
const metadata = {
  name: 'TimaxPay Bridge',
  description: 'Cross-chain bridge powered by LI.FI',
  url: 'https://swap.timaxpay.com', // Your production URL
  icons: ['https://swap.timaxpay.com/logo192.png']
};

const chains = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

// Use defaultWagmiConfig which is designed to work seamlessly with Web3Modal
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableCoinbase: true, // Optional: Shows Coinbase Wallet option
  enableInjected: true, // Optional: Enables MetaMask and other browser extensions
});

// 3. Create Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }
});

