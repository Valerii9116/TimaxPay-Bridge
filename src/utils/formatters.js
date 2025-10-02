export const formatBalance = (balance, decimals = 18, displayDecimals = 6) => {
    if (!balance || !window.ethers) return '0';
    
    try {
      const formatted = window.ethers.utils.formatUnits(balance, decimals);
      return parseFloat(formatted).toFixed(displayDecimals);
    } catch (error) {
      console.error('Error formatting balance:', error);
      return '0';
    }
  };
  
  export const parseAmount = (amount, decimals = 18) => {
    if (!amount || !window.ethers) return '0';
    
    try {
      return window.ethers.utils.parseUnits(amount.toString(), decimals).toString();
    } catch (error) {
      console.error('Error parsing amount:', error);
      return '0';
    }
  };
  
  export const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };
  
  export const formatGasPrice = (gwei) => {
    if (!gwei) return 'N/A';
    return `${parseFloat(gwei).toFixed(2)} Gwei`;
  };