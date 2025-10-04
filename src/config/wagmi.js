import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'wagmi/chains';

// 1. Get your project ID from https://cloud.walletconnect.com
export const projectId = 'dc14d146c0227704322ac9a46aaed7cd';

// 2. Create wagmiConfig
const metadata = {
  name: 'TimaxPay Bridge',
  description: 'Cross-chain bridge powered by LI.FI',
  url: 'https://swap.timaxpay.com', // Your production URL
  icons: ['https://swap.timaxpay.com/logo192.png']
};

const chains = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

// This configuration is now the single source of truth for your wallet connection.
// It is exported so it can be used by the LI.FI widget.
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

// 3. Create Web3Modal
createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
  },
});

