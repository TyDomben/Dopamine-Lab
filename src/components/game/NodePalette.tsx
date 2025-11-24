import React from 'react';
import { motion } from 'framer-motion';
import type { NodeType, Resources } from '../../types/game';
import { NODE_DEFINITIONS } from '../../data/nodes';
import { ResourceManager } from '../../systems/resources/ResourceManager';
import { formatNumber } from '../../utils/format';
import clsx from 'clsx';

interface NodePaletteProps {
  unlockedNodes: NodeType[];
  resources: Resources;
  awarenessMode: boolean;
  onAddNode: (nodeType: NodeType, position: { x: number; y: number }) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({
  unlockedNodes,
  resources,
  awarenessMode,
  onAddNode,
}) => {
  const handleNodeClick = (nodeType: NodeType) => {
    // Add node to center of canvas
    const x = window.innerWidth / 2 - 300; // Offset for sidebar
    const y = window.innerHeight / 2 - 100;

    onAddNode(nodeType, { x, y });
  };

  const tierColors: Record<number, string> = {
    1: 'border-gray-500 hover:border-gray-400',
    2: 'border-game-cyan hover:border-cyan-400',
    3: 'border-game-purple hover:border-purple-400',
    4: 'border-game-gold hover:border-yellow-400',
  };

  return (
    <div className="fixed left-4 top-20 bottom-4 w-80 glass rounded-lg p-4 overflow-y-auto">
      <h3 className="text-lg font-bold text-white mb-4">Available Nodes</h3>

      <div className="space-y-2">
        {unlockedNodes.map(nodeType => {
          const definition = NODE_DEFINITIONS[nodeType];
          const canAfford = ResourceManager.canAfford(resources, definition.cost);

          return (
            <motion.div
              key={nodeType}
              className={clsx(
                'border-2 rounded-lg p-3 cursor-pointer transition-all',
                tierColors[definition.tier],
                canAfford ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
              )}
              whileHover={canAfford ? { scale: 1.02 } : {}}
              whileTap={canAfford ? { scale: 0.98 } : {}}
              onClick={() => canAfford && handleNodeClick(nodeType)}
            >
              {/* Node header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{definition.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Tier {definition.tier}
                  </div>
                </div>
                {definition.baseProduction > 0 && (
                  <div className="text-xs text-green-400">
                    +{formatNumber(definition.baseProduction)}/s
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="text-xs text-gray-300 mb-2">
                {definition.description}
              </div>

              {/* Cost */}
              <div className="flex flex-wrap gap-2 text-xs mb-2">
                {Object.entries(definition.cost).map(([resource, amount]) => {
                  const hasEnough = resources[resource as keyof Resources] >= amount;
                  return (
                    <div
                      key={resource}
                      className={clsx(
                        'px-2 py-1 rounded',
                        hasEnough ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      )}
                    >
                      {formatNumber(amount)} {resource === 'dopamine' ? '⚡' : resource === 'neural-connections' ? '🔗' : resource === 'insight-points' ? '👁️' : '⭐'}
                    </div>
                  );
                })}
              </div>

              {/* Awareness mode info */}
              {awarenessMode && (
                <div className="text-xs text-yellow-300 italic border-t border-white/10 pt-2">
                  "{definition.tooltip.manipulation}"
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Locked nodes hint */}
      {unlockedNodes.length < 15 && (
        <div className="mt-4 p-3 bg-black/30 rounded-lg">
          <div className="text-xs text-gray-500">
            {15 - unlockedNodes.length} nodes still locked
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Keep playing to unlock more manipulation mechanics
          </div>
        </div>
      )}
    </div>
  );
};
