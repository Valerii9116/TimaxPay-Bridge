export const CONFIG = {
    LIFI_API_URL: process.env.REACT_APP_LIFI_API_URL || 'https://li.quest/v1',
    LIFI_INTEGRATOR: process.env.REACT_APP_LIFI_INTEGRATOR || 'Timax_swap',
    FEE_PERCENTAGE: parseFloat(process.env.REACT_APP_FEE_PERCENTAGE) || 0.005,
    FEE_COLLECTOR_ADDRESS: process.env.REACT_APP_FEE_COLLECTOR || '0x34accc793fD8C2A8e262C8C95b18D706bc6022f0',
    WALLETCONNECT_PROJECT_ID: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'dc14d146c0227704322ac9a46aaed7cd',
  };
  
  export const SUPPORTED_WALLETS = {
    METAMASK: 'MetaMask',
    WALLETCONNECT: 'WalletConnect',
    COINBASE: 'Coinbase Wallet',
    TRUST: 'Trust Wallet',
  };
  
  export const CHAIN_EXPLORER_URLS = {
    1: 'https://etherscan.io',
    10: 'https://optimistic.etherscan.io',
    56: 'https://bscscan.com',
    137: 'https://polygonscan.com',
    8453: 'https://basescan.org',
    42161: 'https://arbiscan.io',
    43114: 'https://snowtrace.io',
  };
  
  export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
  };