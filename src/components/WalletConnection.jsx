import React from 'react';
import { Loader2 } from 'lucide-react';

const WalletConnection = ({ onConnect, loading, error }) => {
  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask browser extension',
      available: typeof window.ethereum !== 'undefined',
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Scan with your mobile wallet',
      available: true,
    },
  ];

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="text-4xl">🔐</div>
      </div>
      
      <h3 className="text-2xl font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-gray-400 mb-8">
        Choose your preferred wallet to get started
      </p>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {walletOptions.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => onConnect(wallet.id)}
            disabled={!wallet.available || loading}
            className={`w-full p-4 rounded-xl border-2 transition-all ${
              wallet.available && !loading
                ? 'border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10 cursor-pointer'
                : 'border-gray-800 opacity-50 cursor-not-allowed'
            } ${loading ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{wallet.icon}</div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">{wallet.name}</p>
                <p className="text-xs text-gray-400">
                  {wallet.available
                    ? wallet.description
                    : 'Not available'}
                </p>
              </div>
              {loading && (
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default WalletConnection;