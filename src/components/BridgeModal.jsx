import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowDownUp, AlertCircle, ExternalLink, Check, QrCode, Loader2 } from 'lucide-react';
import { useAccount, useDisconnect, useSwitchNetwork } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { providers, Contract, utils } from 'ethers';

const CONFIG = {
  LIFI_API_URL: 'https://li.quest/v1',
  LIFI_INTEGRATOR: 'Timax_swap',
  FEE_PERCENTAGE: 0.005,
  FEE_COLLECTOR_ADDRESS: '0x34accc793fD8C2A8e262C8C95b18D706bc6022f0',
};

const QRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  
  useEffect(() => {
    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        setError('Camera access denied or not available');
      }
    };
    startScanner();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Scan QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        {error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="relative">
            <video ref={videoRef} className="w-full rounded-lg" playsInline />
          </div>
        )}
      </div>
    </div>
  );
};

const BridgeModal = ({ isOpen, onClose }) => {
  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const { open } = useWeb3Modal();
  
  const [step, setStep] = useState('wallet');
  const [balance, setBalance] = useState('0');
  const [ethersProvider, setEthersProvider] = useState(null);
  const [ethersSigner, setEthersSigner] = useState(null);
  
  const [chains, setChains] = useState([]);
  const [tokens, setTokens] = useState({});
  const [fromChain, setFromChain] = useState(1);
  const [toChain, setToChain] = useState(137);
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [amount, setAmount] = useState('');
  const [customRecipient, setCustomRecipient] = useState('');
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // Initialize provider when wallet connects
  useEffect(() => {
    const initProvider = async () => {
      if (isConnected && window.ethereum) {
        try {
          const provider = new providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          setEthersProvider(provider);
          setEthersSigner(signer);
          if (chain?.id) {
            setFromChain(chain.id);
          }
          setStep('bridge');
        } catch (err) {
          console.error('Failed to init provider:', err);
        }
      } else {
        setEthersProvider(null);
        setEthersSigner(null);
        setStep('wallet');
      }
    };
    initProvider();
  }, [isConnected, chain]);

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await open();
    } catch (err) {
      console.error("Could not connect wallet", err);
      setError("Failed to connect wallet.");
    } finally {
      setLoading(false);
    }
  }, [open]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setStep('wallet');
  }, [disconnect]);

  const getTokensByChain = useCallback((chainId) => {
    return tokens[chainId] || [];
  }, [tokens]);

  const loadBalance = useCallback(async () => {
    if (!ethersProvider || !address || !fromToken) return;
    try {
      const token = getTokensByChain(fromChain).find(t => t.address === fromToken);
      if (!token) return;

      let balanceBN;
      if (token.address === '0x0000000000000000000000000000000000000000' || !token.address) {
        balanceBN = await ethersProvider.getBalance(address);
      } else {
        const tokenContract = new Contract(
          token.address,
          ['function balanceOf(address) view returns (uint256)'],
          ethersProvider
        );
        balanceBN = await tokenContract.balanceOf(address);
      }
      const bal = utils.formatUnits(balanceBN, token.decimals);
      setBalance(parseFloat(bal).toFixed(6));
    } catch (err) {
      console.error('Failed to load balance:', err);
      setBalance('0');
    }
  }, [ethersProvider, address, fromChain, fromToken, getTokensByChain]);

  useEffect(() => {
    const loadChainsAndTokens = async () => {
      try {
        const [chainsRes, tokensRes] = await Promise.all([
          fetch(`${CONFIG.LIFI_API_URL}/chains`),
          fetch(`${CONFIG.LIFI_API_URL}/tokens`)
        ]);
        const chainsData = await chainsRes.json();
        const tokensData = await tokensRes.json();
        setChains(chainsData.chains || []);
        setTokens(tokensData.tokens || {});
        if (!fromToken && tokensData.tokens[1]?.length > 0) {
          setFromToken(tokensData.tokens[1][0].address);
        }
        if (!toToken && tokensData.tokens[137]?.length > 0) {
          setToToken(tokensData.tokens[137][0].address);
        }
      } catch (err) {
        console.error('Failed to load chains/tokens:', err);
        setError('Failed to load network data');
      }
    };
    if (isOpen) {
      loadChainsAndTokens();
    }
  }, [isOpen, fromToken, toToken]);

  useEffect(() => {
    if (isConnected && fromChain && fromToken) {
      loadBalance();
    }
  }, [isConnected, fromChain, fromToken, loadBalance]);

  const handleSwapChains = () => {
    const tempChain = fromChain;
    setFromChain(toChain);
    setToChain(tempChain);
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
  };

  const handleFromChainChange = async (newChainId) => {
    setFromChain(newChainId);
    const tokensOnNewChain = getTokensByChain(newChainId);
    if (tokensOnNewChain.length > 0) {
      setFromToken(tokensOnNewChain[0].address);
    } else {
      setFromToken('');
    }
    
    // Switch network if different from current
    if (chain?.id !== newChainId && switchNetwork) {
      try {
        switchNetwork(newChainId);
      } catch (err) {
        console.error('Failed to switch chain:', err);
        setError('Please switch network in your wallet');
      }
    }
  };

  const handleToChainChange = (newChainId) => {
    setToChain(newChainId);
    const tokensOnNewChain = getTokensByChain(newChainId);
    if (tokensOnNewChain.length > 0) {
      setToToken(tokensOnNewChain[0].address);
    } else {
      setToToken('');
    }
  };

  const fromTokenData = getTokensByChain(fromChain).find(t => t.address === fromToken);
  const toTokenData = getTokensByChain(toChain).find(t => t.address === toToken);
  
  const getQuotes = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!fromTokenData || !toTokenData) {
      setError('Token data is not yet loaded. Please wait a moment and try again.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        fromChain: fromChain,
        toChain: toChain,
        fromToken: fromTokenData.symbol,
        toToken: toTokenData.symbol,
        fromAmount: utils.parseUnits(amount, fromTokenData.decimals).toString(),
        fromAddress: address,
        integrator: CONFIG.LIFI_INTEGRATOR,
      });
      if (useCustomRecipient && customRecipient && utils.isAddress(customRecipient)) {
        params.append('toAddress', customRecipient);
      }
      const response = await fetch(`${CONFIG.LIFI_API_URL}/quote?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch quote');
      }
      const quoteResponse = await response.json();
      setRoutes(quoteResponse.transactionRequest ? [quoteResponse] : []);
      setStep('routes');
    } catch (err) {
      console.error('Failed to get quotes:', err);
      setError(err.message || 'Failed to get quotes');
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async (route) => {
    if (!route || !ethersSigner) return;
    try {
      setSelectedRoute(route);
      setStep('executing');
      setLoading(true);
      setError(null);
      
      const currentChainId = (await ethersSigner.getChainId()).toString();
      if (currentChainId !== route.action.fromChainId.toString()) {
        setError(`Please switch your wallet to ${chains.find(c => c.id === route.action.fromChainId)?.name || 'the correct network'}.`);
        throw new Error("Wrong network");
      }

      const tx = await ethersSigner.sendTransaction(route.transactionRequest);
      setTxHash(tx.hash);
      await tx.wait();
      setStep('success');
      setTimeout(() => handleClose(), 5000);
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err.message || 'Transaction failed');
      setStep('routes');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isConnected) {
      setStep('wallet');
    }
    setAmount('');
    setRoutes([]);
    setSelectedRoute(null);
    setError(null);
    setTxHash(null);
    setUseCustomRecipient(false);
    setCustomRecipient('');
    onClose();
  };

  const selectedFromToken = getTokensByChain(fromChain).find(t => t.address === fromToken);
  const amountUSD = amount && selectedFromToken?.priceUSD
    ? (parseFloat(amount) * selectedFromToken.priceUSD).toFixed(2)
    : '0.00';
    
  const RouteDetails = ({ route, chains }) => {
    if (!route) return null;
    const { estimate, action } = route;
    const fromToken = action.fromToken;
    const toToken = action.toToken;
    const fromChainInfo = chains.find(c => c.id === action.fromChainId);
    const toChainInfo = chains.find(c => c.id === action.toChainId);
    const totalGasUSD = estimate.gasCosts?.reduce((sum, cost) => sum + parseFloat(cost.amountUSD), 0) || 0;
    const providerAndIntegratorFees = estimate.feeCosts?.filter(fee => fee.type !== 'gas');
    const totalFeePercentage = providerAndIntegratorFees?.reduce((sum, fee) => sum + parseFloat(fee.percentage || 0), 0) || 0;
    const totalFeeUSD = providerAndIntegratorFees?.reduce((sum, fee) => sum + parseFloat(fee.amountUSD), 0) || 0;
    const fromAmountFormatted = parseFloat(utils.formatUnits(action.fromAmount, fromToken.decimals));
    const toAmountFormatted = parseFloat(utils.formatUnits(estimate.toAmount, toToken.decimals));
    const exchangeRate = toAmountFormatted > 0 && fromAmountFormatted > 0 ? toAmountFormatted / fromAmountFormatted : 0;
    const priceImpact = estimate.priceImpact ? `${(parseFloat(estimate.priceImpact) * 100).toFixed(2)}%` : '0.00%';
    
    return (
      <div className="text-sm mt-4 p-4 bg-gray-900/50 rounded-2xl border border-gray-700 space-y-3 text-white">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Route</span>
          <div className="flex items-center gap-2 font-semibold">
            {fromChainInfo?.logoURI && <img src={fromChainInfo.logoURI} alt={fromChainInfo.name} className="w-5 h-5 rounded-full" />}
            <span>{fromChainInfo?.name}</span>
            <span className="text-indigo-400">→</span>
            {toChainInfo?.logoURI && <img src={toChainInfo.logoURI} alt={toChainInfo.name} className="w-5 h-5 rounded-full" />}
            <span>{toChainInfo?.name}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Network Fee</span>
          <span>~${totalGasUSD.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Time</span>
          <span>~{Math.ceil(estimate.executionDuration / 60)} min</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Quote</span>
          <span className="font-semibold">{`1 ${fromToken.symbol} = ${exchangeRate.toFixed(4)} ${toToken.symbol}`}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Price Impact</span>
          <span>{priceImpact}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Slippage</span>
          <span>0.5%</span>
        </div>
        <div className="pt-2 mt-2 text-center text-xs text-gray-500 border-t border-gray-700/50">
          Includes {(totalFeePercentage * 100).toFixed(2)}% in Provider & Integrator fees (~${totalFeeUSD.toFixed(2)})
        </div>
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur px-6 py-4 border-b border-gray-700 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                TimaxPay Bridge
              </h2>
              {isConnected && address && (
                <p className="text-xs text-gray-400 mt-1">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              )}
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          <div className="p-6">
            {step === 'wallet' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="text-4xl">🔗</div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-8">Choose your wallet to start bridging</p>
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="w-full p-4 rounded-xl border-2 border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-4 text-white font-semibold"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect Wallet'}
                </button>
              </div>
            )}
            
            {step === 'bridge' && isConnected && (
              <div className="space-y-4">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={disconnectWallet}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">From</span>
                    <span className="text-xs text-gray-400">Balance: {balance}</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={fromToken}
                      onChange={(e) => setFromToken(e.target.value)}
                      className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 min-w-[100px]"
                    >
                      {getTokensByChain(fromChain).map(token => (
                        <option key={token.address} value={token.address}>{token.symbol}</option>
                      ))}
                    </select>
                  </div>
                  {amount && <p className="text-xs text-gray-400 text-right">~${amountUSD}</p>}
                  <select
                    value={fromChain}
                    onChange={(e) => handleFromChainChange(parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 mt-2 focus:outline-none focus:border-indigo-500"
                  >
                    {chains.map(chain => (
                      <option key={chain.id} value={chain.id}>{chain.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center -my-2">
                  <button onClick={handleSwapChains} className="bg-gray-800 border-2 border-gray-700 rounded-full p-2 hover:rotate-180 transition-transform duration-300">
                    <ArrowDownUp className="w-5 h-5 text-indigo-400" />
                  </button>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">To (estimated)</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input type="text" readOnly placeholder="0.0" className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-lg text-gray-500" />
                    <select
                      value={toToken}
                      onChange={(e) => setToToken(e.target.value)}
                      className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 min-w-[100px]"
                    >
                      {getTokensByChain(toChain).map(token => (
                        <option key={token.address} value={token.address}>{token.symbol}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={toChain}
                    onChange={(e) => handleToChainChange(parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 mt-2 focus:outline-none focus:border-indigo-500"
                  >
                    {chains.filter(c => c.id !== fromChain).map(chain => (
                      <option key={chain.id} value={chain.id}>{chain.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={useCustomRecipient} onChange={(e) => setUseCustomRecipient(e.target.checked)} className="rounded bg-gray-700 border-gray-600" />
                    Send to different address
                  </label>
                  {useCustomRecipient && (
                    <div className="relative mt-2">
                      <input type="text" value={customRecipient} onChange={(e) => setCustomRecipient(e.target.value)} placeholder="0x..." className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:border-indigo-500" />
                      <button onClick={() => setShowQRScanner(true)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-400">
                        <QrCode className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={getQuotes}
                  disabled={!amount || parseFloat(amount) <= 0 || loading || !fromTokenData || !toTokenData}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold py-3 rounded-xl transition-all mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? ( <><Loader2 className="w-5 h-5 animate-spin" /> Getting Quote...</> ) : ( 'Get Quote' )}
                </button>
              </div>
            )}
            
            {step === 'routes' && (
              <div className="space-y-4">
                <button onClick={() => setStep('bridge')} className="text-sm text-gray-400 hover:text-white mb-4">
                  ← Back
                </button>
                {routes.length > 0 ? (
                  (() => {
                    const route = routes[0];
                    if (!route) return <p className="text-center text-red-400">Failed to parse route.</p>;
                    const fromAmountFormatted = parseFloat(utils.formatUnits(route.action.fromAmount, route.action.fromToken.decimals)).toFixed(4);
                    const toAmountFormatted = Number(parseFloat(utils.formatUnits(route.estimate.toAmount, route.action.toToken.decimals)).toFixed(6));
                    const shortenAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
                    const fromAddressShort = shortenAddress(address);
                    const toAddress = useCustomRecipient && customRecipient ? customRecipient : address;
                    const toAddressShort = shortenAddress(toAddress);
                    
                    return (
                      <div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-white">{fromAmountFormatted}</p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <img src={route.action.fromToken.logoURI} alt={route.action.fromToken.symbol} className="w-6 h-6 rounded-full" />
                            <span className="text-xl font-semibold text-gray-300">{route.action.fromToken.symbol}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{fromAddressShort}</p>
                        </div>
                        <div className="flex justify-center my-4"><ArrowDownUp className="w-6 h-6 text-indigo-400" /></div>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-white">{toAmountFormatted}</p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <img src={route.action.toToken.logoURI} alt={route.action.toToken.symbol} className="w-6 h-6 rounded-full" />
                            <span className="text-xl font-semibold text-gray-300">{route.action.toToken.symbol}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{toAddressShort}</p>
                        </div>
                        <RouteDetails route={route} chains={chains} />
                        <button
                          onClick={() => executeSwap(route)}
                          disabled={loading}
                          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold py-3 rounded-xl text-lg transition-all"
                        >
                          Execute Bridge via {route.toolDetails?.name || 'LI.FI'}
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No routes found for the selected pair.</p>
                  </div>
                )}
              </div>
            )}
            
            {step === 'executing' && selectedRoute && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-2 text-white">Processing...</h3>
                <p className="text-gray-400">Confirm transaction via {selectedRoute.toolDetails?.name || 'LI.FI'} in your wallet</p>
              </div>
            )}
            
            {step === 'success' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Bridge Initiated!</h3>
                <p className="text-gray-400 mb-6">Transaction submitted successfully</p>
                {txHash && (() => {
                  const fromChainData = chains.find(c => c.id === fromChain);
                  const explorerUrl = fromChainData?.metamask?.blockExplorerUrls?.[0] || 'https://etherscan.io';
                  return (
                    <a href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm">
                      View Transaction <ExternalLink className="w-4 h-4" />
                    </a>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showQRScanner && (
        <QRScanner
          onScan={(address) => {
            setCustomRecipient(address);
            setShowQRScanner(false);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </>
  );
};

export default BridgeModal;