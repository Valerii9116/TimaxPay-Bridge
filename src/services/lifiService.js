import { CONFIG } from '../utils/constants';

class LiFiService {
  constructor() {
    this.baseURL = CONFIG.LIFI_API_URL;
    this.integrator = CONFIG.LIFI_INTEGRATOR;
  }

  async getChains() {
    try {
      const response = await fetch(`${this.baseURL}/chains`);
      const data = await response.json();
      return data.chains || [];
    } catch (error) {
      console.error('Failed to fetch chains:', error);
      throw error;
    }
  }

  async getTokens() {
    try {
      const response = await fetch(`${this.baseURL}/tokens`);
      const data = await response.json();
      return data.tokens || {};
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      throw error;
    }
  }

  async getRoutes(params) {
    const {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      fromAddress,
      toAddress,
    } = params;

    try {
      const queryParams = new URLSearchParams({
        fromChain: fromChain.toString(),
        toChain: toChain.toString(),
        fromToken,
        toToken,
        fromAmount,
        fromAddress,
        integrator: this.integrator,
        fee: CONFIG.FEE_PERCENTAGE.toString(),
        feeCollector: CONFIG.FEE_COLLECTOR_ADDRESS,
      });

      if (toAddress) {
        queryParams.set('toAddress', toAddress);
      }

      const response = await fetch(
        `${this.baseURL}/advanced/routes?${queryParams}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch routes');
      }

      const data = await response.json();
      return data.routes || [];
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      throw error;
    }
  }

  async getStatus(bridge, fromChain, toChain, txHash) {
    try {
      const response = await fetch(
        `${this.baseURL}/status?bridge=${bridge}&fromChain=${fromChain}&toChain=${toChain}&txHash=${txHash}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch status:', error);
      throw error;
    }
  }
}

export default new LiFiService();