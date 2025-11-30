import React, { useState, useRef, useEffect } from 'react';
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
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0, side: 'right' as 'right' | 'left' | 'top' | 'bottom' });
  const nodeRef = useRef<HTMLDivElement>(null);
  const definition = NODE_DEFINITIONS[node.type];

  // Calculate smart tooltip position
  useEffect(() => {
    if (showTooltip && nodeRef.current) {
      const tooltipWidth = 320; // Estimated tooltip width
      const tooltipHeight = awarenessMode ? 250 : 150; // Estimated height
      const padding = 16;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = node.position.x + 170; // Default: right side
      let top = node.position.y;
      let side: 'right' | 'left' | 'top' | 'bottom' = 'right';

      // Check if tooltip goes off right edge
      if (left + tooltipWidth + padding > viewportWidth) {
        // Try left side
        left = node.position.x - tooltipWidth - 10;
        side = 'left';

        // If still off screen, try top
        if (left < padding) {
          left = node.position.x;
          top = node.position.y - tooltipHeight - 10;
          side = 'top';

          // If still off screen, try bottom
          if (top < padding) {
            top = node.position.y + 100; // Below node
            side = 'bottom';
          }
        }
      }

      // Check if tooltip goes off bottom edge
      if (top + tooltipHeight + padding > viewportHeight && side === 'right') {
        top = Math.max(padding, viewportHeight - tooltipHeight - padding);
      }

      // Check if tooltip goes off top edge
      if (top < padding) {
        top = padding;
      }

      setTooltipPosition({ left, top, side });
    }
  }, [showTooltip, node.position, awarenessMode]);

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
        ref={nodeRef}
        className={clsx(
          'absolute cursor-pointer rounded-lg border-2 p-4 min-w-[120px] select-none',
          tierColors[node.tier],
          isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-game-bg',
          isHovered && tierGlows[node.tier],
          node.isActive && 'animate-pulse-glow'
        )}
        style={{
          left: node.position.x,
          top: node.position.y,
          width: '160px',
          zIndex: isSelected ? 100 : isHovered ? 50 : 10,
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

      {/* Smart Tooltip */}
      {showTooltip && (
        <motion.div
          className="fixed pointer-events-none"
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            zIndex: 1000,
            maxWidth: '320px',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <div className="bg-game-bg/98 border-2 border-game-cyan/40 rounded-lg p-4 shadow-2xl backdrop-blur-sm">
            <div className="font-bold text-game-cyan mb-2 flex items-center gap-2">
              {definition.name}
              <span className="text-xs opacity-50">T{node.tier}</span>
            </div>
            <div className="text-sm text-gray-300 mb-2">{definition.description}</div>
            <div className="text-xs text-gray-400 mb-2">
              <strong className="text-white">Effect:</strong> {definition.tooltip.effect}
            </div>

            {awarenessMode && (
              <>
                <div className="text-xs text-game-purple mb-1 border-t border-game-purple/30 pt-2 mt-2">
                  <strong>Psychological Principle:</strong> {definition.psychologicalPrinciple}
                </div>
                <div className="text-xs text-yellow-300 italic mt-2 p-2 bg-yellow-900/10 rounded border border-yellow-300/20">
                  "{definition.tooltip.manipulation}"
                </div>
                {definition.tooltip.stats && (
                  <div className="text-xs text-gray-500 mt-2 italic">
                    📊 {definition.tooltip.stats}
                  </div>
                )}
              </>
            )}

            {/* Position indicator arrow */}
            <div
              className={clsx(
                'absolute w-3 h-3 bg-game-cyan/40 rotate-45',
                tooltipPosition.side === 'right' && '-left-1.5 top-4',
                tooltipPosition.side === 'left' && '-right-1.5 top-4',
                tooltipPosition.side === 'top' && 'left-4 -bottom-1.5',
                tooltipPosition.side === 'bottom' && 'left-4 -top-1.5'
              )}
            />
          </div>
        </motion.div>
      )}
    </>
  );
};
