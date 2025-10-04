import React, { useState } from 'react';
import BridgeModal from './components/BridgeModal';
import './App.css';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ✨ FIX: The main App component is now the single source of truth for wallet state.
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        {/* ✨ FIX: A persistent, global wallet button provides the best UX. */}
        <div className="absolute top-6 right-6">
          {isConnected ? (
            <div className="flex items-center gap-4 bg-gray-800/50 p-2 rounded-lg backdrop-blur-sm border border-gray-700">
               <p className="text-white font-mono text-sm px-2">{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</p>
               <button onClick={() => disconnect()} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 font-semibold px-4 py-2 rounded-md transition-colors">
                Disconnect
               </button>
            </div>
          ) : (
            <button
              onClick={() => open()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/50"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <div className="text-center max-w-2xl w-full">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 mb-4">
              TimaxPay Bridge
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mb-2">
              Seamless cross-chain bridging powered by LI.FI
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Bridge assets across 20+ networks with the best rates
            </p>
          </div>

          <button
            onClick={openModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/50 text-lg"
          >
            Launch Bridge
          </button>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
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
      </div>

      <BridgeModal
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
}

export default App;

