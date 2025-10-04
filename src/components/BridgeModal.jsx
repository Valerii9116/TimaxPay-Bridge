import React, { useMemo } from 'react';
import { LiFiWidget } from '@lifi/widget';
import { X, Loader2 } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useWalletClient } from 'wagmi';
import { providers } from 'ethers';

// This helper function safely converts the modern `wagmi` wallet client
// into the `ethers.js` signer format that the LI.FI widget requires.
function walletClientToSigner(walletClient) {
  if (!walletClient) {
    return undefined;
  }
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

const BridgeModal = ({ isOpen, onClose }) => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Create the ethers.js signer that the widget needs.
  const signer = useMemo(() => walletClientToSigner(walletClient), [walletClient]);

  const widgetConfig = {
    integrator: 'Timax_swap',
    fee: {
      amount: 0.005, // 0.5% integrator fee
      recipient: '0x34accc793fD8C2A8e262C8C95b18D706bc6022f0',
    },
    signer,
    containerStyle: {
      border: `1px solid rgb(55, 65, 81)`,
      borderRadius: '16px',
    },
    theme: {
      palette: {
        primary: { main: '#6366f1' },
        secondary: { main: '#a855f7' },
        background: { paper: '#1f2937', default: '#111827' },
        text: { primary: '#ffffff', secondary: '#d1d5db' },
      },
      shape: { borderRadius: '12px', borderRadiusSecondary: '12px' },
      typography: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
    },
    appearance: 'dark',
    hiddenUI: ['walletMenu'],
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 py-8 flex justify-center items-start bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* ✨ FIX: The component now has three states for a robust user experience */}
        {isConnected && signer ? (
          // 1. If connected AND the signer is ready, show the widget.
          // The `key` prop forces a complete re-render when the user connects.
          <LiFiWidget config={widgetConfig} key={address} />
        ) : isConnected && !signer ? (
          // 2. If connected but the signer is NOT ready yet, show a loading spinner.
          // This prevents the widget from rendering in a broken "read-only" state.
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 h-[600px] flex items-center justify-center">
             <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
          </div>
        ) : (
          // 3. If not connected at all, show the connect prompt.
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="text-4xl">🔗</div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Connect Your Wallet</h3>
              <p className="text-gray-400 mb-8">Please connect your wallet to launch the bridge.</p>
              <button
                onClick={() => open()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/50"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BridgeModal;

