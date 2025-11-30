import React from 'react';

interface UIControlsProps {
  showPalette: boolean;
  showAnalytics: boolean;
  showHeader: boolean;
  onTogglePalette: () => void;
  onToggleAnalytics: () => void;
  onToggleHeader: () => void;
  onCenterView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zoom: number;
}

export const UIControls: React.FC<UIControlsProps> = ({
  showPalette,
  showAnalytics,
  showHeader,
  onTogglePalette,
  onToggleAnalytics,
  onToggleHeader,
  onCenterView,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  zoom,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* View Controls */}
      <div className="glass rounded-lg p-2 flex flex-col gap-2">
        <div className="text-xs text-gray-400 font-bold px-2">View</div>

        <button
          onClick={onZoomIn}
          className="px-3 py-2 bg-game-cyan/20 hover:bg-game-cyan/30 text-game-cyan rounded transition-colors text-sm"
          title="Zoom In"
        >
          🔍 +
        </button>

        <button
          onClick={onZoomOut}
          className="px-3 py-2 bg-game-cyan/20 hover:bg-game-cyan/30 text-game-cyan rounded transition-colors text-sm"
          title="Zoom Out"
        >
          🔍 −
        </button>

        <button
          onClick={onResetZoom}
          className="px-3 py-2 bg-game-purple/20 hover:bg-game-purple/30 text-game-purple rounded transition-colors text-xs"
          title="Reset Zoom"
        >
          {(zoom * 100).toFixed(0)}%
        </button>

        <button
          onClick={onCenterView}
          className="px-3 py-2 bg-game-gold/20 hover:bg-game-gold/30 text-game-gold rounded transition-colors text-sm"
          title="Center View"
        >
          🎯
        </button>
      </div>

      {/* Panel Toggles */}
      <div className="glass rounded-lg p-2 flex flex-col gap-2">
        <div className="text-xs text-gray-400 font-bold px-2">Panels</div>

        <button
          onClick={onTogglePalette}
          className={`px-3 py-2 rounded transition-colors text-sm ${
            showPalette
              ? 'bg-game-cyan/30 text-game-cyan'
              : 'bg-gray-700/30 text-gray-500'
          }`}
          title="Toggle Node Palette"
        >
          📦 Nodes
        </button>

        <button
          onClick={onToggleAnalytics}
          className={`px-3 py-2 rounded transition-colors text-sm ${
            showAnalytics
              ? 'bg-game-purple/30 text-game-purple'
              : 'bg-gray-700/30 text-gray-500'
          }`}
          title="Toggle Analytics"
        >
          📊 Stats
        </button>

        <button
          onClick={onToggleHeader}
          className={`px-3 py-2 rounded transition-colors text-sm ${
            showHeader
              ? 'bg-game-gold/30 text-game-gold'
              : 'bg-gray-700/30 text-gray-500'
          }`}
          title="Toggle Header"
        >
          📋 Header
        </button>
      </div>

      {/* Meta hint */}
      <div className="text-xs text-gray-600 italic px-2 max-w-[200px] text-right">
        Hide the UI. The manipulation continues anyway.
      </div>
    </div>
  );
};
