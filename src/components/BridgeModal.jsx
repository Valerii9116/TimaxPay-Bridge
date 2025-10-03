import React, { useMemo } from 'react';
import { LiFiWidget } from '@lifi/widget';
import { X } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';

const BridgeModal = ({ isOpen, onClose }) => {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const widgetConfig = useMemo(() => {
    const config = {
      integrator: 'Timax_swap',
      // Integrator fee configuration
      fee: {
        amount: 0.005, // 0.5% fee
        recipient: '0x34accc793fD8C2A8e262C8C95b18D706bc6022f0',
      },
      containerStyle: {
        border: `1px solid rgb(55, 65, 81)`,
        borderRadius: '16px',
        minHeight: '550px',
        maxHeight: '85vh',
      },
      theme: {
        palette: {
          primary: { main: '#6366f1' },
          secondary: { main: '#a855f7' },
          background: {
            paper: '#1f2937',
            default: '#111827',
          },
          text: {
            primary: '#ffffff',
            secondary: '#d1d5db',
          },
        },
        shape: {
          borderRadius: '12px',
          borderRadiusSecondary: '12px',
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }
      },
      appearance: 'dark',
      variant: 'compact',
      chains: {
        allow: [1, 10, 56, 137, 250, 8453, 42161, 43114],
      },
      walletConfig: {
        walletConnect: {
          projectId: 'dc14d146c0227704322ac9a46aaed7cd',
        },
      },
      // Show wallet management and hide only appearance selector
      hiddenUI: ['appearance', 'poweredBy'],
    };

    if (isConnected && walletClient) {
      config.walletManagement = {
        signer: walletClient,
        connect: async () => {
          console.log('Wallet already connected');
        },
        disconnect: async () => {
          console.log('Disconnect handled by parent app');
        },
      };
    }

    return config;
  }, [isConnected, walletClient]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-[420px]">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-[60] p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="rounded-2xl overflow-hidden">
          <LiFiWidget config={widgetConfig} />
        </div>
      </div>
    </div>
  );
};

export default BridgeModal;