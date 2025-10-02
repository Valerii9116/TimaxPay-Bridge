import React from 'react';
import { formatNumber, formatUSD } from '../utils/helpers';

const RouteCard = ({ route, isSelected, onClick, toToken }) => {
  if (!route) return null;

  const toAmount = window.ethers.utils.formatUnits(
    route.toAmount,
    route.toToken?.decimals || 18
  );

  const estimatedTime = Math.ceil(
    (route.steps[0]?.estimate?.executionDuration || 180) / 60
  );

  const gasCostUSD = route.gasCostUSD ? parseFloat(route.gasCostUSD) : 0;
  
  const totalFees = route.steps.reduce((acc, step) => {
    return acc + (step.estimate?.feeCosts?.reduce((sum, fee) => {
      return sum + parseFloat(fee.amountUSD || 0);
    }, 0) || 0);
  }, gasCostUSD);

  const providerName = route.steps[0]?.toolDetails?.name || 'Route';

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800/50 rounded-xl p-4 border cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
          : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-white">{providerName}</p>
          <p className="text-xs text-gray-400">≈ {estimatedTime} min</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-green-400">
            {formatNumber(toAmount, 6)} {toToken}
          </p>
          <p className="text-xs text-gray-400">{formatUSD(totalFees)} fees</p>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="space-y-1 text-xs text-gray-400 border-t border-gray-700 pt-2 mb-2">
        <div className="flex justify-between">
          <span>Gas Cost</span>
          <span>{formatUSD(gasCostUSD)}</span>
        </div>
        {route.steps[0]?.estimate?.feeCosts?.map((fee, idx) => (
          <div key={idx} className="flex justify-between">
            <span>{fee.name}</span>
            <span>{formatUSD(fee.amountUSD)}</span>
          </div>
        ))}
      </div>

      {/* Route Steps */}
      {isSelected && route.steps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2 font-semibold">Route Steps:</p>
          <div className="space-y-1">
            {route.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-indigo-400 font-semibold mt-0.5">
                  {idx + 1}.
                </span>
                <div className="flex-1">
                  <span className="text-gray-300">
                    {step.type === 'swap' ? 'Swap' : 'Bridge'} via {step.toolDetails?.name || step.tool}
                  </span>
                  {step.estimate?.fromAmount && step.estimate?.toAmount && (
                    <div className="text-gray-500 text-[10px] mt-0.5">
                      {formatNumber(
                        window.ethers.utils.formatUnits(
                          step.estimate.fromAmount,
                          step.action.fromToken.decimals
                        ),
                        4
                      )}{' '}
                      {step.action.fromToken.symbol} →{' '}
                      {formatNumber(
                        window.ethers.utils.formatUnits(
                          step.estimate.toAmount,
                          step.action.toToken.decimals
                        ),
                        4
                      )}{' '}
                      {step.action.toToken.symbol}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="mt-3 flex items-center justify-center gap-2 text-indigo-400 text-sm">
          <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
          <span>Selected</span>
        </div>
      )}
    </div>
  );
};

export default RouteCard;