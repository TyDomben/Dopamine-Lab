import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Node as GameNode } from '../../types/game';
import { NODE_DEFINITIONS } from '../../data/nodes';
import { formatNumber } from '../../utils/format';
import clsx from 'clsx';

interface NodeComponentProps {
  node: GameNode;
  isSelected: boolean;
  isHovered: boolean;
  awarenessMode: boolean;
  onSelect: () => void;
  onHover: (hover: boolean) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  isHovered,
  awarenessMode,
  onSelect,
  onHover,
  onDragStart,
  onDragEnd,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const definition = NODE_DEFINITIONS[node.type];

  const tierColors: Record<number, string> = {
    1: 'border-gray-500 bg-gray-900',
    2: 'border-game-cyan bg-cyan-900/30',
    3: 'border-game-purple bg-purple-900/30',
    4: 'border-game-gold bg-yellow-900/30',
  };

  const tierGlows: Record<number, string> = {
    1: '',
    2: 'glow-cyan',
    3: 'glow-purple',
    4: 'glow-gold',
  };

  return (
    <>
      <motion.div
        className={clsx(
          'absolute cursor-pointer rounded-lg border-2 p-4 min-w-[120px]',
          tierColors[node.tier],
          isSelected && 'ring-2 ring-white',
          isHovered && tierGlows[node.tier],
          node.isActive && 'animate-pulse-glow'
        )}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: '160px',
        }}
        draggable={!!onDragStart}
        {...(onDragStart && { onDragStart: onDragStart as any })}
        {...(onDragEnd && { onDragEnd: onDragEnd as any })}
        onClick={onSelect}
        onMouseEnter={() => {
          onHover(true);
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          onHover(false);
          setShowTooltip(false);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          opacity: node.isActive ? 1 : 0.6,
        }}
      >
        {/* Node header */}
        <div className="text-xs font-bold text-white/90 mb-2 truncate">
          {definition.name}
        </div>

        {/* Production indicator */}
        {node.productionRate > 0 && (
          <div className="text-xs text-green-400 mb-1">
            +{formatNumber(node.productionRate * node.effectivenessMultiplier)}/s
          </div>
        )}

        {/* Effectiveness indicator */}
        {node.effectivenessMultiplier > 1 && (
          <div className="text-xs text-game-cyan">
            {(node.effectivenessMultiplier * 100).toFixed(0)}% effective
          </div>
        )}

        {/* Active indicator */}
        {node.isActive && (
          <motion.div
            className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}

        {/* Tier badge */}
        <div className="absolute bottom-2 right-2 text-xs opacity-50">
          T{node.tier}
        </div>
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          className="tooltip"
          style={{
            left: node.position.x + 170,
            top: node.position.y,
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
        >
          <div className="font-bold text-game-cyan mb-2">{definition.name}</div>
          <div className="text-sm text-gray-300 mb-2">{definition.description}</div>
          <div className="text-xs text-gray-400 mb-2">
            <strong>Effect:</strong> {definition.tooltip.effect}
          </div>

          {awarenessMode && (
            <>
              <div className="text-xs text-game-purple mb-1 border-t border-game-purple/30 pt-2">
                <strong>Psychological Principle:</strong> {definition.psychologicalPrinciple}
              </div>
              <div className="text-xs text-yellow-300 italic">
                "{definition.tooltip.manipulation}"
              </div>
              {definition.tooltip.stats && (
                <div className="text-xs text-gray-500 mt-1">
                  {definition.tooltip.stats}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </>
  );
};
