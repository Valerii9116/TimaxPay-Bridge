export const shortenAddress = (address, chars = 4) => {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  };
  
  export const formatNumber = (num, decimals = 4) => {
    if (!num) return '0';
    const number = parseFloat(num);
    if (number < 0.0001) return '< 0.0001';
    return number.toFixed(decimals);
  };
  
  export const formatUSD = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  export const isValidAddress = (address) => {
    if (!window.ethers) return false;
    return window.ethers.utils.isAddress(address);
  };
  
  export const getExplorerUrl = (chainId, txHash) => {
    const baseUrls = {
      1: 'https://etherscan.io',
      10: 'https://optimistic.etherscan.io',
      56: 'https://bscscan.com',
      137: 'https://polygonscan.com',
      8453: 'https://basescan.org',
      42161: 'https://arbiscan.io',
      43114: 'https://snowtrace.io',
    };
    
    const baseUrl = baseUrls[chainId] || 'https://etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  };