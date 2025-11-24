import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalyticsData } from '../../types/game';
import { formatTime, formatNumber } from '../../utils/format';

interface AnalyticsDashboardProps {
  analytics: AnalyticsData;
  visible: boolean;
  awarenessMode: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  visible,
  awarenessMode,
}) => {
  if (!visible) return null;

  const sessionTime = formatTime(analytics.totalSessionTime);
  const apm = analytics.actionsPerMinute.toFixed(1);
  const dpa = formatNumber(analytics.dopaminePerAction, 2);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-20 right-4 w-80 glass rounded-lg p-4 z-50"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
      >
        <div className="border-b border-white/20 pb-2 mb-3">
          <h3 className="text-lg font-bold text-game-cyan">ENGAGEMENT METRICS</h3>
          {awarenessMode && (
            <p className="text-xs text-yellow-300 italic mt-1">
              You're seeing the manipulation in real-time.
            </p>
          )}
        </div>

        <div className="space-y-3">
          {/* Session time */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Session time:</span>
            <span className="text-sm font-mono text-white">{sessionTime}</span>
          </div>

          {/* Actions per minute */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Actions/min:</span>
            <motion.span
              className="text-sm font-mono text-game-cyan"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              {apm}
            </motion.span>
          </div>

          {/* Dopamine per action */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Dopamine/action:</span>
            <span className="text-sm font-mono text-game-purple">
              {dpa}
              {analytics.dopaminePerAction > 0 && (
                <span className="text-green-400 ml-1">↗</span>
              )}
            </span>
          </div>

          {/* Total clicks */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total actions:</span>
            <span className="text-sm font-mono text-white">
              {formatNumber(analytics.clickCount)}
            </span>
          </div>

          {/* Most effective hook */}
          {analytics.mostEffectiveHook !== 'none' && (
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="text-xs text-gray-500 mb-1">Most Effective Hook:</div>
              <div className="text-sm font-bold text-game-gold">
                ► {analytics.mostEffectiveHook}
              </div>
              {awarenessMode && (
                <div className="text-xs text-yellow-300 italic mt-1">
                  This is what's keeping you hooked.
                </div>
              )}
            </div>
          )}

          {/* Prestige count */}
          {analytics.prestigeCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Prestige count:</span>
              <span className="text-sm font-mono text-game-gold">
                {analytics.prestigeCount}
              </span>
            </div>
          )}

          {/* Awareness tracking */}
          {awarenessMode && analytics.awarenessActivatedAt && (
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="text-xs text-gray-500 mb-1">Time since awareness:</div>
              <div className="text-sm font-mono text-game-purple">
                {formatTime(analytics.playTimeAfterAwareness)}
              </div>
              <div className="text-xs text-yellow-300 italic mt-2">
                You know what this is. Still playing?
              </div>
            </div>
          )}
        </div>

        {/* Meta commentary */}
        {awarenessMode && (
          <motion.div
            className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-400 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Every number here is designed to keep you engaged.
            <br />
            Knowing this doesn't make you immune.
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
