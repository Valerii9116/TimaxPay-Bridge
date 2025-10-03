import React, { useState } from 'react';
import BridgeModal from './components/BridgeModal';
import './App.css';

// This is the main App component. It's now only responsible for the main page UI
// and for showing or hiding the BridgeModal.
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
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

          {/* This button now simply opens the modal. */}
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

