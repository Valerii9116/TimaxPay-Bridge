import { useState, useEffect, useCallback } from 'react';
import walletService from '../services/walletService';
import { formatBalance } from '../utils/formatters';

export const useBalance = (address, tokenAddress, tokenDecimals = 18) => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !walletService.isConnected()) {
      setBalance('0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const balanceBN = await walletService.getBalance(address, tokenAddress);
      const formatted = formatBalance(balanceBN, tokenDecimals, 6);
      setBalance(formatted);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError(err.message);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [address, tokenAddress, tokenDecimals]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
};