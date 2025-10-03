import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


// 1. Get projectId from https://cloud.walletconnect.com
const projectId = 'dc14d146c0227704322ac9a46aaed7cd';

// --- IMPORTANT SETUP STEP ---
// 2. Get an Alchemy API key from https://www.alchemy.com/
// Replace `YOUR_ALCHEMY_API_KEY` with your actual key.
const alchemyApiKey = 'dGmZ3QehQO2xkopzyGqc9';


// 3. Create wagmiConfig
const metadata = {
  name: 'TimaxPay Bridge',
  description: 'Cross-chain bridge powered by LI.FI',
  // IMPORTANT: This URL must match the domain listed in your WalletConnect Cloud project.
  url: 'https://swap.timaxpay.com',
  icons: ['https://swap.timaxpay.com/logo192.png']
};

// Configure chains & providers with Alchemy and a public fallback.
const { chains, publicClient } = configureChains(
  [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche],
  [
    alchemyProvider({ apiKey: alchemyApiKey }),
    publicProvider()
  ]
);


export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({ chains, options: { projectId, showQrModal: false, metadata } }),
    new InjectedConnector({ chains, options: { shimDisconnect: true } }),
    new CoinbaseWalletConnector({ chains, options: { appName: metadata.name } })
  ],
  publicClient
})


// 4. Create modal
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

// 5. Create QueryClient and Provider
export const queryClient = new QueryClient();

export function Web3ModalProvider({ children }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  );
}

