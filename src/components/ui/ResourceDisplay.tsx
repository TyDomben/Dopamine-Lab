import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Resources, ResourceRates, ResourceType } from '../../types/game';
import { formatNumber, formatRate, getNumberColor } from '../../utils/format';

interface ResourceDisplayProps {
  resources: Resources;
  rates: ResourceRates;
  compact?: boolean;
}

const ResourceIcon: React.FC<{ type: ResourceType }> = ({ type }) => {
  const icons: Record<ResourceType, string> = {
    dopamine: '⚡',
    'neural-connections': '🔗',
    'insight-points': '👁️',
    'prestige-tokens': '⭐',
  };

  return <span className="text-xl">{icons[type]}</span>;
};

const ResourceCounter: React.FC<{
  type: ResourceType;
  amount: number;
  rate: number;
  compact?: boolean;
}> = ({ type, amount, rate, compact }) => {
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const prevAmount = useRef(amount);

  useEffect(() => {
    if (amount !== prevAmount.current) {
      setIsIncreasing(amount > prevAmount.current);
      setDisplayAmount(amount);
      prevAmount.current = amount;

      // Trigger animation
      const timeout = setTimeout(() => setIsIncreasing(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [amount]);

  const labels: Record<ResourceType, string> = {
    dopamine: 'Dopamine',
    'neural-connections': 'Neural Connections',
    'insight-points': 'Insight Points',
    'prestige-tokens': 'Prestige Tokens',
  };

  return (
    <motion.div
      className={`flex items-center gap-3 ${compact ? 'flex-row' : 'flex-col md:flex-row'} glass rounded-lg p-3`}
      whileHover={{ scale: 1.02 }}
      animate={isIncreasing ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <ResourceIcon type={type} />
      <div className="flex-1">
        {!compact && (
          <div className="text-xs text-gray-400 mb-1">{labels[type]}</div>
        )}
        <div className="flex items-baseline gap-2">
          <motion.span
            className={`text-2xl font-bold ${getNumberColor(displayAmount)} number-increment`}
            key={Math.floor(displayAmount)}
          >
            {formatNumber(displayAmount, 1)}
          </motion.span>
          {rate !== 0 && (
            <span className={`text-sm ${rate > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatRate(rate)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({
  resources,
  rates,
  compact = false,
}) => {
  return (
    <div className={`${compact ? 'flex gap-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'} w-full`}>
      <ResourceCounter
        type="dopamine"
        amount={resources.dopamine}
        rate={rates.dopamine}
        compact={compact}
      />
      <ResourceCounter
        type="neural-connections"
        amount={resources['neural-connections']}
        rate={rates['neural-connections']}
        compact={compact}
      />
      <ResourceCounter
        type="insight-points"
        amount={resources['insight-points']}
        rate={rates['insight-points']}
        compact={compact}
      />
      <ResourceCounter
        type="prestige-tokens"
        amount={resources['prestige-tokens']}
        rate={rates['prestige-tokens']}
        compact={compact}
      />
    </div>
  );
};
