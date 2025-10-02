import WalletConnectProvider from '@walletconnect/web3-provider';
import { CONFIG } from '../utils/constants';

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
  }

  async connectMetaMask() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.provider = new window.ethers.providers.Web3Provider(
        window.ethereum,
        'any'
      );
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;

      this.setupListeners();

      return {
        provider: this.provider,
        signer: this.signer,
        address: this.address,
        chainId: this.chainId,
      };
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      throw error;
    }
  }

  async connectWalletConnect() {
    try {
      const wcProvider = new WalletConnectProvider({
        infuraId: CONFIG.WALLETCONNECT_PROJECT_ID,
        qrcodeModalOptions: {
          mobileLinks: [
            'metamask',
            'trust',
            'rainbow',
            'argent',
            'imtoken',
            'pillar',
          ],
        },
      });

      await wcProvider.enable();

      this.provider = new window.ethers.providers.Web3Provider(
        wcProvider,
        'any'
      );
      this.signer = this.provider.getSigner();
      this.address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;

      this.setupWalletConnectListeners(wcProvider);

      return {
        provider: this.provider,
        signer: this.signer,
        address: this.address,
        chainId: this.chainId,
      };
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw error;
    }
  }

  setupListeners() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountsChanged);
      window.ethereum.on('chainChanged', this.handleChainChanged);
      window.ethereum.on('disconnect', this.handleDisconnect);
    }
  }

  setupWalletConnectListeners(wcProvider) {
    wcProvider.on('accountsChanged', this.handleAccountsChanged);
    wcProvider.on('chainChanged', this.handleChainChanged);
    wcProvider.on('disconnect', this.handleDisconnect);
  }

  handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      this.disconnect();
    } else {
      window.location.reload();
    }
  };

  handleChainChanged = () => {
    window.location.reload();
  };

  handleDisconnect = () => {
    this.disconnect();
  };

  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: window.ethers.utils.hexlify(chainId) }],
      });
    } catch (error) {
      if (error.code === 4902) {
        throw new Error('Please add this network to your wallet');
      }
      throw error;
    }
  }

  async getBalance(address, tokenAddress) {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      if (!tokenAddress || tokenAddress === window.ethers.constants.AddressZero) {
        return await this.provider.getBalance(address);
      } else {
        const contract = new window.ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          this.provider
        );
        return await contract.balanceOf(address);
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  disconnect() {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
      window.ethereum.removeListener('disconnect', this.handleDisconnect);
    }

    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
  }

  isConnected() {
    return !!this.address && !!this.provider;
  }
}

export default new WalletService();