import { useState, useEffect } from 'react';
import lifiService from '../services/lifiService';

export const useLiFi = () => {
  const [chains, setChains] = useState([]);
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadChainsAndTokens = async () => {
    try {
      setLoading(true);
      setError(null);

      const [chainsData, tokensData] = await Promise.all([
        lifiService.getChains(),
        lifiService.getTokens(),
      ]);

      setChains(chainsData);
      setTokens(tokensData);
    } catch (err) {
      console.error('Failed to load chains/tokens:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getRoutes = async (params) => {
    try {
      setLoading(true);
      setError(null);

      const routes = await lifiService.getRoutes(params);
      return routes;
    } catch (err) {
      console.error('Failed to get routes:', err);
      setError(err.message || 'Failed to get routes');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStatus = async (bridge, fromChain, toChain, txHash) => {
    try {
      const status = await lifiService.getStatus(bridge, fromChain, toChain, txHash);
      return status;
    } catch (err) {
      console.error('Failed to get status:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadChainsAndTokens();
  }, []);

  return {
    chains,
    tokens,
    loading,
    error,
    getRoutes,
    getStatus,
    refetch: loadChainsAndTokens,
  };
};