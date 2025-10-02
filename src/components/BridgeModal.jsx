import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowDownUp, AlertCircle, ExternalLink, Check, QrCode, Loader2 } from 'lucide-react';

// ⚠️ CONFIGURATION - Replace with your actual values
const CONFIG = {
  LIFI_API_URL: 'https://li.quest/v1',
  LIFI_INTEGRATOR: 'Timax_swap',
  FEE_PERCENTAGE: 0.005, // This is a 0.5% integrator fee
  FEE_COLLECTOR_ADDRESS: '0x34accc793fD8C2A8e262C8C95b18D706bc6022f0',
  WALLETCONNECT_PROJECT_ID: 'dc14d146c0227704322ac9a46aaed7cd',
};

// QR Code Scanner Component
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
  const [step, setStep] = useState('wallet');
  const [wallet, setWallet] = useState({ connected: false, address: null, chainId: null });
  const [balance, setBalance] = useState('0');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

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

  useEffect(() => {
    if (isOpen) {
      loadChainsAndTokens();
    }
  }, [isOpen]);

  const getTokensByChain = useCallback((chainId) => {
    return tokens[chainId] || [];
  }, [tokens]);

  const loadBalance = useCallback(async () => {
    if (!provider || !wallet.address) return;

    try {
      const token = getTokensByChain(fromChain).find(t => t.symbol === fromToken);
      if (!token) return;

      let balanceBN;
      if (token.address === window.ethers.constants.AddressZero || !token.address) {
        balanceBN = await provider.getBalance(wallet.address);
      } else {
        const tokenContract = new window.ethers.Contract(
          token.address,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        balanceBN = await tokenContract.balanceOf(wallet.address);
      }

      const bal = window.ethers.utils.formatUnits(balanceBN, token.decimals);
      setBalance(parseFloat(bal).toFixed(6));
    } catch (err) {
      console.error('Failed to load balance:', err);
      setBalance('0');
    }
  }, [provider, wallet.address, fromChain, fromToken, getTokensByChain]);


  useEffect(() => {
    if (wallet.connected && fromChain && fromToken) {
      loadBalance();
    }
  }, [wallet.connected, fromChain, fromToken, loadBalance]);

  const loadChainsAndTokens = async () => {
    // Automatically loads all LI.FI supported chains and tokens upon modal opening.
    try {
      const [chainsRes, tokensRes] = await Promise.all([
        fetch(`${CONFIG.LIFI_API_URL}/chains`),
        fetch(`${CONFIG.LIFI_API_URL}/tokens`)
      ]);

      const chainsData = await chainsRes.json();
      const tokensData = await tokensRes.json();

      setChains(chainsData.chains || []);
      setTokens(tokensData.tokens || {});

      if (tokensData.tokens[1]?.length > 0) {
        setFromToken(tokensData.tokens[1][0].symbol);
      }
      if (tokensData.tokens[137]?.length > 0) {
        setToToken(tokensData.tokens[137][0].symbol);
      }
    } catch (err) {
      console.error('Failed to load chains/tokens:', err);
      setError('Failed to load network data');
    }
  };

  const connectWallet = async (walletType = 'metamask') => {
    try {
      setLoading(true);
      setError(null);

      if (walletType === 'metamask') {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const ethersProvider = new window.ethers.providers.Web3Provider(window.ethereum, 'any');
        const ethSigner = ethersProvider.getSigner();
        const address = await ethSigner.getAddress();
        const network = await ethersProvider.getNetwork();

        setProvider(ethersProvider);
        setSigner(ethSigner);
        setWallet({ connected: true, address, chainId: network.chainId });
        setFromChain(network.chainId);
        setStep('bridge');

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      window.location.reload();
    }
  };

  const disconnectWallet = () => {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
    setWallet({ connected: false, address: null, chainId: null });
    setProvider(null);
    setSigner(null);
    setStep('wallet');
  };

  const handleFromChainChange = (newChainId) => {
    setFromChain(newChainId);
    const tokensOnNewChain = getTokensByChain(newChainId);
    if (tokensOnNewChain.length > 0) {
      setFromToken(tokensOnNewChain[0].symbol);
    } else {
      setFromToken('');
    }
  };

  const handleToChainChange = (newChainId) => {
    setToChain(newChainId);
    const tokensOnNewChain = getTokensByChain(newChainId);
    if (tokensOnNewChain.length > 0) {
      setToToken(tokensOnNewChain[0].symbol);
    } else {
      setToToken('');
    }
  };

  const getQuotes = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    const fromTokenData = getTokensByChain(fromChain).find(t => t.symbol === fromToken);
    const toTokenData = getTokensByChain(toChain).find(t => t.symbol === toToken);

    if (!fromTokenData || !toTokenData) {
      setError('Invalid token selection. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        fromChainId: fromChain,
        toChainId: toChain,
        fromTokenAddress: fromTokenData.address,
        toTokenAddress: toTokenData.address,
        fromAmount: window.ethers.utils.parseUnits(amount, fromTokenData.decimals).toString(),
        fromAddress: wallet.address,
        integrator: CONFIG.LIFI_INTEGRATOR,
        fee: CONFIG.FEE_PERCENTAGE,
        feeCollector: CONFIG.FEE_COLLECTOR_ADDRESS
      };

      if (useCustomRecipient && customRecipient && window.ethers.utils.isAddress(customRecipient)) {
        requestBody.toAddress = customRecipient;
      }

      const response = await fetch(`${CONFIG.LIFI_API_URL}/advanced/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch routes');
      }

      const routesResponse = await response.json();
      const allRoutes = routesResponse.routes || [];

      // Filter to show only one (the first) route per unique provider to avoid clutter
      const uniqueRoutesByProvider = new Map();
      allRoutes.forEach(route => {
        const providerName = route.steps[0].toolDetails.name;
        if (!uniqueRoutesByProvider.has(providerName)) {
            uniqueRoutesByProvider.set(providerName, route);
        }
      });
      
      setRoutes(Array.from(uniqueRoutesByProvider.values()));
      setStep('routes');
    } catch (err) {
      console.error('Failed to get quotes:', err);
      setError(err.message || 'Failed to get quotes');
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async (route) => {
    if (!route || !signer) return;

    try {
      setSelectedRoute(route);
      setStep('executing');
      setLoading(true);
      setError(null);

      const currentChainId = await signer.getChainId();
      if (currentChainId !== parseInt(route.fromChainId)) {
        await switchNetwork(route.fromChainId);
      }

      const tx = await signer.sendTransaction(route.transactionRequest);
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

  const switchNetwork = async (chainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + parseInt(chainId, 10).toString(16) }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        setError('Please add this network to your wallet first');
      }
      throw switchError;
    }
  };

  const handleClose = () => {
    setStep('wallet');
    setAmount('');
    setRoutes([]);
    setSelectedRoute(null);
    setError(null);
    setTxHash(null);
    setUseCustomRecipient(false);
    setCustomRecipient('');
    onClose();
  };

  const selectedFromToken = getTokensByChain(fromChain).find(t => t.symbol === fromToken);
  const amountUSD = amount && selectedFromToken?.priceUSD
    ? (parseFloat(amount) * selectedFromToken.priceUSD).toFixed(2)
    : '0.00';

  const FeeDetails = ({ feeCosts }) => {
    if (!feeCosts || feeCosts.length === 0) {
      return null;
    }

    const totalFeeUSD = feeCosts.reduce((total, fee) => total + parseFloat(fee.amountUSD), 0).toFixed(2);

    return (
        <div className="text-xs text-gray-400 mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="flex justify-between font-semibold text-gray-300 mb-1">
                <span>Total Fees:</span>
                <span>~${totalFeeUSD}</span>
            </div>
            <ul className="space-y-1">
                {feeCosts.map((fee, index) => (
                    <li key={`${fee.name}-${index}`} className="flex justify-between items-center text-gray-500">
                        <span>{fee.name} ({fee.percentage * 100}%)</span>
                        <span>~${parseFloat(fee.amountUSD).toFixed(2)}</span>
                    </li>
                ))}
            </ul>
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
              {step !== 'wallet' && wallet.address && (
                <p className="text-xs text-gray-400 mt-1">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
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

                <div className="space-y-3">
                  <button
                    onClick={() => connectWallet('metamask')}
                    disabled={loading}
                    className="w-full p-4 rounded-xl border-2 border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all flex items-center gap-4"
                  >
                    <div className="text-3xl">🦊</div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">MetaMask</p>
                      <p className="text-xs text-gray-400">Connect using MetaMask</p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                  </button>
                </div>
              </div>
            )}

            {step === 'bridge' && (
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
                        <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
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
                  <button className="bg-gray-800 border-2 border-gray-700 rounded-full p-2 hover:rotate-180 transition-transform duration-300">
                    <ArrowDownUp className="w-5 h-5 text-indigo-400" />
                  </button>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">To (estimated)</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      readOnly
                      placeholder="0.0"
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-lg text-gray-500"
                    />
                    <select
                      value={toToken}
                      onChange={(e) => setToToken(e.target.value)}
                      className="bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 min-w-[100px]"
                    >
                      {getTokensByChain(toChain).map(token => (
                        <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
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
                    <input
                      type="checkbox"
                      checked={useCustomRecipient}
                      onChange={(e) => setUseCustomRecipient(e.target.checked)}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    Send to different address
                  </label>
                  {useCustomRecipient && (
                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={customRecipient}
                        onChange={(e) => setCustomRecipient(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => setShowQRScanner(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-400"
                      >
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
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Getting Quotes...
                    </>
                  ) : (
                    'Get Quotes'
                  )}
                </button>
              </div>
            )}

            {step === 'routes' && (
              <div className="space-y-4">
                <button onClick={() => setStep('bridge')} className="text-sm text-gray-400 hover:text-white">
                  ← Back
                </button>

                <h3 className="text-lg font-semibold text-white">Available Routes</h3>

                {routes.length > 0 ? (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {routes.map((route) => (
                      <div key={route.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-indigo-500 transition-all">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-white flex items-center gap-2">
                              {route.steps[0].toolDetails.name}
                              <img src={route.steps[0].toolDetails.logoURI} alt={route.steps[0].toolDetails.name} className="w-5 h-5 rounded-full bg-white/10" />
                            </p>
                            <p className="text-xs text-gray-400">
                              ~{Math.ceil((route.estimate?.executionDuration || 180) / 60)} min
                            </p>
                          </div>
                          <div className="text-right">
                            {(() => {
                              // Safely get the display amount, falling back from toAmount to toAmountMin
                              const displayAmount = route.estimate?.toAmount || route.estimate?.toAmountMin || '0';
                              // Safely resolve the output token, falling back from the last step to the route's root
                              const outputToken = route.steps?.[route.steps.length - 1]?.action?.toToken || route.toToken;
                              
                              if (!outputToken) {
                                return <p className="font-semibold text-red-400">Data Error</p>;
                              }

                              return (
                                <p className="font-semibold text-green-400">
                                  {parseFloat(
                                    window.ethers.utils.formatUnits(
                                      displayAmount,
                                      outputToken.decimals
                                    )
                                  ).toFixed(6)} {outputToken.symbol}
                                </p>
                              );
                            })()}
                            <p className="text-xs text-gray-400">
                              ~${parseFloat(route.estimate?.toAmountUSD || '0').toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <FeeDetails feeCosts={route.estimate?.feeCosts || []} />

                        <button
                          onClick={() => executeSwap(route)}
                          disabled={loading}
                          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold py-2 rounded-lg text-sm"
                        >
                          Execute Bridge
                        </button>
                      </div>
                    ))}
                  </div>
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
                <p className="text-gray-400">Confirm transaction via {selectedRoute.steps[0].toolDetails.name} in your wallet</p>
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
                    <a
                      href={`${explorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      View Transaction <ExternalLink className="w-4 h-4" />
                    </a>
                  )
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

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 mb-4">
          TimaxPay Bridge
        </h1>
        <p className="text-gray-300 text-lg md:text-xl mb-2">
          Seamless cross-chain bridging powered by LI.FI
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Bridge assets across 20+ networks with the best rates
        </p>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/50 text-lg"
        >
          Launch Bridge
        </button>

        <div className="mt-12 grid grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur rounded-lg p-4">
            <p className="text-2xl font-bold text-indigo-400">20+</p>
            <p className="text-sm text-gray-400">Networks</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-lg p-4">
            <p className="text-2xl font-bold text-pink-400">0.5%</p>
            <p className="text-sm text-gray-400">Fee</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-lg p-4">
            <p className="text-2xl font-bold text-purple-400">Fast</p>
            <p className="text-sm text-gray-400">Transfers</p>
          </div>
        </div>
      </div>

      <BridgeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}




