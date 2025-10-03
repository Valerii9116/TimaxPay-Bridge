import React from 'react';
import { LiFiWidget } from '@lifi/widget';
import { X } from 'lucide-react';

// This is the official LI.FI Widget configuration.
// It will handle all wallet interactions, network switching, and transactions.
// eslint-disable-next-line no-unused-vars
const widgetConfig = {
  integrator: 'Timax_swap',
  
  fee: {
    amount: 0.005, // Represents 0.5%
    recipient: '0x34accc793fD8C2A8e262C8C95b18D706bc6022f0',
  },

  containerStyle: {
    border: `1px solid rgb(55, 65, 81)`,
    borderRadius: '16px',
  },
  theme: {
    palette: {
      primary: { main: '#6366f1' },
      secondary: { main: '#a855f7' },
      background: {
        paper: '#1f2937', // bg-gray-800
        default: '#111827', // bg-gray-900
      },
      text: {
          primary: '#ffffff',
          secondary: '#d1d5db', // text-gray-300
      },
    },
    shape: {
      borderRadius: '12px',
      borderRadiusSecondary: '12px',
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }
  },
  appearance: 'dark',
};


const BridgeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    // ✨ FIX: Changed flex centering to be scrollable and aligned to the top.
    // This ensures the modal is never cut off on smaller screens.
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 py-8 flex justify-center items-start">
      <div className="relative w-full max-w-md">
        {/* We use a custom close button so it's styled like the rest of your app */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* The official LI.FI Widget */}
        <LiFiWidget config={widgetConfig} />
      </div>
    </div>
  );
};

export default BridgeModal;

