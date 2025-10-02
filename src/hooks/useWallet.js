import { useState, useEffect } from 'react';
import walletService from '../services/walletService';

export const useWallet = () => {
  const [wallet, setWallet] = useState({
    connected: false,
    address: null,
    chainId: null,
    provider: null,
    signer: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connect = async (walletType = 'metamask') => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (walletType === 'metamask') {
        result = await walletService.connectMetaMask();
      } else if (walletType === 'walletconnect') {
        result = await walletService.connectWalletConnect();
      } else {
        throw new Error('Unsupported wallet type');
      }

      setWallet({
        connected: true,
        ...result,
      });

      return result;
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    walletService.disconnect();
    setWallet({
      connected: false,
      address: null,
      chainId: null,
      provider: null,
      signer: null,
    });
    setError(null);
  };

  const switchNetwork = async (chainId) => {
    try {
      setLoading(true);
      setError(null);
      await walletService.switchNetwork(chainId);
    } catch (err) {
      setError(err.message || 'Failed to switch network');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if already connected
    if (walletService.isConnected()) {
      setWallet({
        connected: true,
        address: walletService.address,
        chainId: walletService.chainId,
        provider: walletService.provider,
        signer: walletService.signer,
      });
    }
  }, []);

  return {
    wallet,
    loading,
    error,
    connect,
    disconnect,
    switchNetwork,
  };
};