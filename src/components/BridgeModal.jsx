import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowDownUp, AlertCircle, ExternalLink, Check, QrCode, Loader2 } from 'lucide-react';
import {
  useAccount,
  useDisconnect,
  useSwitchNetwork,
  useBalance,
  useSendTransaction,
  useWaitForTransaction
} from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { parseUnits, formatUnits } from 'viem';
import { utils } from 'ethers'; // Keep ethers' utils for isAddress

// Configuration - Keep it consistent
const CONFIG = {
  LIFI_API_URL: 'https://li.quest/v1',
  LIFI_INTEGRATOR: 'Timax_swap',
};

// QRScanner component restored from your original file
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
            // NOTE: You will need to add a QR scanning library like jsQR here
            // and call onScan(decodedData) when a QR code is detected.
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


// Main Component - Restored structure with wagmi hooks
const BridgeModal = ({ isOpen, onClose }) => {
  // --- Wagmi Hooks ---
  const { address, isConnected, chainId: connectedChainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useSwitchNetwork();
  const { open } = useWeb3Modal();

  // --- Component State (Restored from your original) ---
  const [step, setStep] = useState('wallet');
  const [chains, setChains] = useState([]);
  const [tokens, setTokens] = useState({});
  const [fromChain, setFromChain] = useState(1);
  const [toChain, setToChain] = useState(137);
  const [fromToken, setFromToken] = useState('0x0000000000000000000000000000000000000000');
  const [toToken, setToToken] = useState('0x0000000000000000000000000000000000000000');
  const [amount, setAmount] = useState('');
  const [customRecipient, setCustomRecipient] = useState('');
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // --- Transaction State using Wagmi hooks ---
  const { data: txResponse, sendTransaction } = useSendTransaction();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransaction({
    hash: txResponse?.hash,
  });

  // --- Data Fetching & Derived State ---
  const fromTokenData = tokens[fromChain]?.find(t => t.address.toLowerCase() === fromToken.toLowerCase());
  const toTokenData = tokens[toChain]?.find(t => t.address.toLowerCase() === toToken.toLowerCase());

  const { data: balanceData } = useBalance({
    address,
    token: fromTokenData?.address === '0x0000000000000000000000000000000000000000' ? undefined : fromTokenData?.address,
    chainId: fromChain,
    watch: true,
  });

  const balance = balanceData ? parseFloat(balanceData.formatted).toFixed(4) : '0.00';
  const amountUSD = amount && fromTokenData?.priceUSD ? (parseFloat(amount) * fromTokenData.priceUSD).toFixed(2) : '0.00';

  // --- Effects ---

  // Main effect to control the modal step based on wallet connection
  useEffect(() => {
    if (isConnected) {
      setStep('bridge');
      if (connectedChainId && connectedChainId !== fromChain) {
        setFromChain(connectedChainId);
      }
    } else {
      setStep('wallet');
    }
  }, [isConnected, connectedChainId, fromChain]);

  // Effect to load chains and tokens from Li.Fi
  useEffect(() => {
    const loadChainsAndTokens = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const [chainsRes, tokensRes] = await Promise.all([
          fetch(`${CONFIG.LIFI_API_URL}/chains`),
          fetch(`${CONFIG.LIFI_API_URL}/tokens`)
        ]);
        const chainsData = await chainsRes.json();
        const tokensData = await tokensRes.json();
        
        const normalizedTokens = {};
        for (const chainId in tokensData.tokens) {
            normalizedTokens[chainId] = tokensData.tokens[chainId].map(token => ({
                ...token,
                address: token.address.toLowerCase()
            }));
        }

        setChains(chainsData.chains || []);
        setTokens(normalizedTokens || {});

      } catch (err) {
        setError('Failed to load network data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadChainsAndTokens();
  }, [isOpen]);

  // Effect to handle transaction success
  useEffect(() => {
    if (isTxSuccess) {
      setStep('success');
    }
  }, [isTxSuccess]);

  // --- Callbacks & Handlers ---

  const handleClose = useCallback(() => {
    setStep(isConnected ? 'bridge' : 'wallet');
    setAmount('');
    setSelectedRoute(null);
    setError(null);
    setUseCustomRecipient(false);
    setCustomRecipient('');
    onClose();
  }, [isConnected, onClose]);

  const handleFromChainChange = (newChainIdStr) => {
    const newChainId = parseInt(newChainIdStr, 10);
    setFromChain(newChainId);
    const nativeToken = tokens[newChainId]?.find(t => t.address === '0x0000000000000000000000000000000000000000');
    setFromToken(nativeToken?.address.toLowerCase() || '');
    setAmount('');
    if (connectedChainId !== newChainId) {
      switchNetwork?.(newChainId);
    }
  };
  
  const handleToChainChange = (newChainIdStr) => {
    const newChainId = parseInt(newChainIdStr, 10);
    setToChain(newChainId);
    const nativeToken = tokens[newChainId]?.find(t => t.address === '0x0000000000000000000000000000000000000000');
    setToToken(nativeToken?.address.toLowerCase() || '');
  };

  const handleSwapChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const getQuotes = async () => {
    if (!amount || parseFloat(amount) <= 0 || !fromTokenData || !toTokenData) {
        setError('Please enter a valid amount and select tokens.');
        return;
      }
  
      setLoading(true);
      setError(null);
      setSelectedRoute(null);
  
      try {
        const parsedAmount = parseUnits(amount, fromTokenData.decimals).toString();
        const params = new URLSearchParams({
          fromChain: String(fromChain),
          toChain: String(toChain),
          fromToken: fromTokenData.symbol,
          toToken: toTokenData.symbol,
          fromAmount: parsedAmount,
          fromAddress: address,
          integrator: CONFIG.LIFI_INTEGRATOR,
        });
        
        if (useCustomRecipient && customRecipient && utils.isAddress(customRecipient)) {
            params.append('toAddress', customRecipient);
        }
  
        const response = await fetch(`${CONFIG.LIFI_API_URL}/quote?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch quote.');
        }
        
        const quoteResponse = await response.json();
        
        if (!quoteResponse.id) {
          setError('No routes found for this swap.');
        } else {
          setSelectedRoute(quoteResponse);
          setStep('routes');
        }
      } catch (err) {
        console.error('Failed to get quotes:', err);
        setError(err.message || 'Could not find a quote for this trade.');
      } finally {
        setLoading(false);
      }
  };

  const executeSwap = () => {
    if (!selectedRoute) return setError("No route selected.");
    
    setStep('executing');
    setError(null);

    if (connectedChainId !== selectedRoute.action.fromChainId) {
        switchNetwork?.(selectedRoute.action.fromChainId);
        setError("Please confirm the network switch in your wallet and try again.");
        setStep('routes');
        return;
    }

    try {
      const { transactionRequest } = selectedRoute;
      const tx = {
        to: transactionRequest.to,
        data: transactionRequest.data,
        value: BigInt(transactionRequest.value || '0'),
      };
      
      sendTransaction(tx);
    } catch (e) {
      console.error(e);
      setError("There was an error preparing the transaction. Your environment may not support BigInt.");
      setStep('routes');
    }
  };

  const getFormattedToAmount = (route) => {
    if (!route || !toTokenData) return "0.0";
    try {
      return parseFloat(formatUnits(BigInt(route.estimate.toAmount), toTokenData.decimals)).toFixed(4);
    } catch (e) {
      console.error("Could not format 'toAmount':", e);
      return "Error";
    }
  }
  
  if (!isOpen) return null;
  
  // --- Render (Your original JSX structure is preserved) ---

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
                <h3 className="text-xl font-semibold mb-2 text-white">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-8">Choose your wallet to start bridging</p>
                <button
                  onClick={() => open()}
                  className="w-full p-4 rounded-xl border-2 border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-4 text-white font-semibold"
                >
                  Connect Wallet
                </button>
              </div>
            )}
            
            {step === 'bridge' && (
              <div className="space-y-4">
                 <div className="flex justify-end mb-2">
                  <button
                    onClick={() => disconnect()}
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
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-lg text-white" />
                    <select value={fromToken} onChange={(e) => setFromToken(e.target.value)} className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2">
                      {tokens[fromChain]?.map(token => <option key={token.address} value={token.address}>{token.symbol}</option>)}
                    </select>
                  </div>
                  {amount && <p className="text-xs text-gray-400 text-right">~${amountUSD}</p>}
                  <select value={fromChain} onChange={(e) => handleFromChainChange(e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 mt-2">
                    {chains.map(chain => <option key={chain.id} value={chain.id}>{chain.name}</option>)}
                  </select>
                </div>

                <div className="flex justify-center -my-2 z-10 relative">
                  <button onClick={handleSwapChains} className="bg-gray-800 border-2 border-gray-700 rounded-full p-2 hover:rotate-180 transition-transform duration-300">
                    <ArrowDownUp className="w-5 h-5 text-indigo-400" />
                  </button>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <span className="text-sm text-gray-400">To (estimated)</span>
                  <div className="flex gap-2 my-2">
                    <input type="text" readOnly value={getFormattedToAmount(selectedRoute)} className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-lg text-gray-500" />
                    <select value={toToken} onChange={(e) => setToToken(e.target.value)} className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2">
                      {tokens[toChain]?.map(token => <option key={token.address} value={token.address}>{token.symbol}</option>)}
                    </select>
                  </div>
                  <select value={toChain} onChange={(e) => handleToChainChange(e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 mt-2">
                      {chains.filter(c => c.id !== fromChain).map(chain => <option key={chain.id} value={chain.id}>{chain.name}</option>)}
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
                  disabled={!amount || parseFloat(amount) <= 0 || loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold py-3 rounded-xl transition-all mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Getting Quotes...</> : 'Get Quote'}
                </button>
              </div>
            )}
            
            {step === 'routes' && (
              <div>
                  <button onClick={() => setStep('bridge')} className="text-sm text-gray-400 hover:text-white mb-4">← Back</button>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-white">{parseFloat(amount).toFixed(4)}</p>
                    <p className="text-xl font-semibold text-gray-300">{fromTokenData?.symbol}</p>
                  </div>
                  <div className="flex justify-center my-4"><ArrowDownUp className="w-6 h-6 text-indigo-400" /></div>
                   <div className="text-center">
                      <p className="text-4xl font-bold text-white">
                        {getFormattedToAmount(selectedRoute)}
                      </p>
                      <p className="text-xl font-semibold text-gray-300">{toTokenData?.symbol}</p>
                  </div>

                  <RouteDetails route={selectedRoute} chains={chains} />

                  <button
                      onClick={executeSwap}
                      disabled={isTxLoading}
                      className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold py-3 rounded-xl text-lg transition-all"
                  >
                      {isTxLoading ? 'Processing...' : `Execute via ${selectedRoute?.toolDetails?.name || 'LI.FI'}`}
                  </button>
              </div>
            )}

            {(step === 'executing' || isTxLoading) && (
              <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-2 text-white">Processing Transaction...</h3>
                  <p className="text-gray-400">Please confirm in your wallet. This may take a moment.</p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Bridge Initiated!</h3>
                  <p className="text-gray-400 mb-6">Your transaction has been submitted successfully.</p>
                  {txResponse?.hash && (
                      <a href={`${chains.find(c => c.id === fromChain)?.metamask.blockExplorerUrls[0]}/tx/${txResponse.hash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm">
                          View Transaction <ExternalLink className="w-4 h-4" />
                      </a>
                  )}
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

const RouteDetails = ({ route, chains }) => {
    if (!route) return null;
    const { estimate, action } = route;
    
    const fromChainInfo = chains.find(c => c.id === action.fromChainId);
    const toChainInfo = chains.find(c => c.id === action.toChainId);
    
    const totalGasUSD = estimate.gasCosts?.reduce((sum, cost) => sum + parseFloat(cost.amountUSD), 0) || 0;
    
    return (
        <div className="text-sm mt-4 p-4 bg-gray-900/50 rounded-2xl border border-gray-700 space-y-3 text-white">
            <div className="flex justify-between items-center">
                <span className="text-gray-400">Route</span>
                <div className="flex items-center gap-2 font-semibold">
                    {fromChainInfo?.logoURI && <img src={fromChainInfo.logoURI} alt="" className="w-5 h-5 rounded-full" />}
                    <span>{fromChainInfo?.name} → {toChainInfo?.name}</span>
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
        </div>
    );
};

export default BridgeModal;

