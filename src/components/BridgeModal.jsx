import React, { useMemo } from 'react';
import { LiFiWidget } from '@lifi/widget';
import { X, Loader2 } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useWalletClient } from 'wagmi';
import { providers } from 'ethers';

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
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();

  const signer = useMemo(() => walletClientToSigner(walletClient), [walletClient]);

  const widgetConfig = useMemo(() => {
    const config = {
      integrator: 'Timax_swap',
      fee: 0.005,
      variant: 'compact',
      subvariant: 'split',
      containerStyle: {
        border: `1px solid rgb(55, 65, 81)`,
        borderRadius: '16px',
        height: '680px',
      },
      theme: {
        palette: {
          primary: { main: '#6366f1' },
          secondary: { main: '#a855f7' },
          background: { paper: '#1f2937', default: '#111827' },
          text: { primary: '#ffffff', secondary: '#d1d5db' },
        },
        shape: { borderRadius: 12, borderRadiusSecondary: 12 },
        typography: { 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
        },
      },
      appearance: 'dark',
      hiddenUI: ['language', 'appearance'],
      sdkConfig: {
        defaultRouteOptions: {
          fee: 0.005,
          integrator: 'Timax_swap',
        },
      },
    };

    if (signer && address) {
      config.walletManagement = {
        signer,
        connect: async () => {
          await open();
          return signer;
        },
        disconnect: async () => {},
      };
    }

    return config;
  }, [signer, address, open]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 py-8 flex justify-center items-start bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {isConnected && address && (
          <div className="mb-3 px-4 py-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl border border-indigo-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Connected</span>
              </div>
              <div className="flex items-center gap-2">
                {chain && <span className="text-xs text-indigo-400 font-medium">{chain.name}</span>}
                <span className="text-sm text-white font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {isConnected && signer ? (
          <LiFiWidget config={widgetConfig} key={address} />
        ) : isConnected && !signer ? (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 h-[680px] flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
          </div>
        ) : (
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