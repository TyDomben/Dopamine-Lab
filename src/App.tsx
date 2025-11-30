import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from './hooks/useGameState';
import { ResourceDisplay } from './components/ui/ResourceDisplay';
import { CircuitCanvas } from './components/game/CircuitCanvas';
import { NodePalette } from './components/game/NodePalette';
import { AnalyticsDashboard } from './components/game/AnalyticsDashboard';
import { UIControls } from './components/ui/UIControls';
import { soundEngine } from './systems/audio/SoundEngine';
import { ResourceManager } from './systems/resources/ResourceManager';
import { formatNumber } from './utils/format';

function App() {
  const { state, actions } = useGameState();
  const [showWelcome, setShowWelcome] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // UI control state
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showPalette, setShowPalette] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showHeader, setShowHeader] = useState(true);

  // Initialize sound engine on first interaction
  useEffect(() => {
    const handleFirstClick = () => {
      soundEngine.enable();
      window.removeEventListener('click', handleFirstClick);
    };

    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, []);

  // Auto-unlock nodes based on progression
  useEffect(() => {
    const checkUnlocks = () => {
      // Tier 2 unlocks in architect phase
      if (state.phase === 'architect') {
        ['anticipation-delay', 'variable-reward', 'near-miss', 'combo-multiplier'].forEach(nodeType => {
          if (!state.unlockedNodes.includes(nodeType as any)) {
            actions.unlockNode(nodeType as any);
          }
        });
      }

      // Tier 3 unlocks in aware phase
      if (state.phase === 'aware') {
        ['streak-counter', 'idle-processor', 'progress-bar', 'fomo-timer'].forEach(nodeType => {
          if (!state.unlockedNodes.includes(nodeType as any)) {
            actions.unlockNode(nodeType as any);
          }
        });
      }

      // Tier 4 unlocks in designer phase
      if (state.phase === 'designer') {
        ['analytics-module', 'awareness-override', 'efficiency-optimizer'].forEach(nodeType => {
          if (!state.unlockedNodes.includes(nodeType as any)) {
            actions.unlockNode(nodeType as any);
          }
        });
      }
    };

    checkUnlocks();
  }, [state.phase, state.unlockedNodes, actions]);

  // Handle node movement
  const handleNodeMove = (nodeId: string, x: number, y: number) => {
    // This would require a new action - simplified for now
    console.log(`Move node ${nodeId} to ${x}, ${y}`);
  };

  const handleAddNode = (nodeType: any, position: { x: number; y: number }) => {
    actions.addNode(nodeType, position);
  };

  const handleGenerateClick = () => {
    actions.trackClick();
    actions.addResources({ dopamine: 1 });

    // Create particle effect
    const newParticle = {
      id: Date.now(),
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    setParticles(prev => [...prev, newParticle]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  };

  // Zoom and pan handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetZoom = () => setZoom(1.0);

  const handleCenterView = () => {
    if (state.nodes.length === 0) {
      setPanX(0);
      setPanY(0);
      return;
    }

    // Calculate center of all nodes
    const avgX = state.nodes.reduce((sum, node) => sum + node.position.x, 0) / state.nodes.length;
    const avgY = state.nodes.reduce((sum, node) => sum + node.position.y, 0) / state.nodes.length;

    // Center on that point
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    setPanX(viewportWidth / 2 - avgX * zoom);
    setPanY(viewportHeight / 2 - avgY * zoom);
  };

  const handlePan = (x: number, y: number) => {
    setPanX(x);
    setPanY(y);
  };

  const canPrestige = ResourceManager.canPrestige(state.resources);
  const prestigeGain = ResourceManager.calculatePrestigeGain(state.resources);

  return (
    <div className="w-screen h-screen bg-game-bg text-white overflow-hidden">
      {/* Welcome screen */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="max-w-2xl p-8 text-center">
              <motion.h1
                className="text-6xl font-bold mb-6 text-game-cyan"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                HOOKED
              </motion.h1>
              <p className="text-xl text-gray-300 mb-8">
                A brutally self-aware meta-game about dopamine reward systems.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                You'll architect psychological manipulation circuits while the game
                openly shows you how you're being manipulated.
              </p>
              <p className="text-xs text-yellow-300 italic mb-8">
                Knowledge doesn't equal immunity.
              </p>
              <motion.button
                className="px-8 py-4 bg-game-purple text-white font-bold rounded-lg text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowWelcome(false);
                  soundEngine.playUnlock();
                }}
              >
                Begin the Experiment
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      {showHeader && (
        <div className="absolute top-0 left-0 right-0 z-40 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-game-cyan">HOOKED</h1>
              <div className="text-sm text-gray-400">
                Phase: <span className="text-game-purple font-bold uppercase">{state.phase}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Awareness toggle */}
              <button
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  state.awarenessMode
                    ? 'bg-game-gold text-black'
                    : 'bg-gray-700 text-gray-300'
                }`}
                onClick={actions.toggleAwareness}
              >
                🧠 Awareness: {state.awarenessMode ? 'ON' : 'OFF'}
              </button>

              {/* Prestige button */}
              {canPrestige && (
                <motion.button
                  className="px-6 py-2 bg-game-gold text-black font-bold rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={actions.prestige}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ⭐ PRESTIGE (+{prestigeGain} tokens)
                </motion.button>
              )}
            </div>
          </div>

          {/* Resource display */}
          <ResourceDisplay resources={state.resources} rates={state.resourceRates} compact />
        </div>
      )}

      {/* Node palette */}
      {showPalette && (
        <NodePalette
          unlockedNodes={state.unlockedNodes}
          resources={state.resources}
          awarenessMode={state.awarenessMode}
          onAddNode={handleAddNode}
        />
      )}

      {/* Circuit canvas */}
      <CircuitCanvas
        nodes={state.nodes}
        connections={state.connections}
        selectedNode={state.selectedNode}
        hoveredNode={state.hoveredNode}
        awarenessMode={state.awarenessMode}
        onSelectNode={actions.selectNode}
        onHoverNode={actions.hoverNode}
        onNodeMove={handleNodeMove}
        zoom={zoom}
        panX={panX}
        panY={panY}
        onPan={handlePan}
        onZoom={setZoom}
      />

      {/* Analytics dashboard */}
      {showAnalytics && (
        <AnalyticsDashboard
          analytics={state.analytics}
          visible={state.showAnalyticsDashboard}
          awarenessMode={state.awarenessMode}
        />
      )}

      {/* Tutorial overlay */}
      {!state.tutorialCompleted && state.nodes.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-30">
          <motion.div
            className="bg-black/80 p-8 rounded-lg max-w-md pointer-events-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-game-cyan mb-4">Getting Started</h2>
            <p className="text-gray-300 mb-4">
              Click on a node in the left sidebar to add it to your circuit.
            </p>
            <p className="text-sm text-gray-400">
              Or click the button below to generate your first dopamine hit.
            </p>
            <motion.button
              className="mt-4 w-full px-6 py-3 bg-game-purple text-white font-bold rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateClick}
            >
              Generate Dopamine (+1)
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Particle system */}
      <div className="particle-container">
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="particle"
            style={{
              left: particle.x,
              top: particle.y,
              width: 10,
              height: 10,
              background: 'radial-gradient(circle, #00d9ff 0%, transparent 70%)',
            }}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -100, scale: 0.5 }}
            transition={{ duration: 1 }}
          />
        ))}
      </div>

      {/* Phase transition notifications */}
      <AnimatePresence>
        {state.phase === 'architect' && state.totalPlayTime > 180000 && state.totalPlayTime < 185000 && (
          <motion.div
            className="fixed top-1/3 left-1/2 transform -translate-x-1/2 bg-game-cyan/90 text-black px-8 py-4 rounded-lg font-bold text-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            Entering ARCHITECT phase...
          </motion.div>
        )}
        {state.phase === 'aware' && state.awarenessMode && state.analytics.playTimeAfterAwareness < 5000 && (
          <motion.div
            className="fixed top-1/3 left-1/2 transform -translate-x-1/2 bg-game-purple/90 text-white px-8 py-4 rounded-lg font-bold text-xl max-w-md text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            Welcome to AWARENESS.
            <div className="text-sm mt-2 font-normal">
              You can now see the manipulation. Still playing?
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meta commentary footer */}
      {state.awarenessMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 italic">
          Session time: {formatNumber(state.totalPlayTime / 1000)}s |
          You know what this is. Why are you still here?
        </div>
      )}

      {/* UI Controls */}
      <UIControls
        showPalette={showPalette}
        showAnalytics={showAnalytics}
        showHeader={showHeader}
        onTogglePalette={() => setShowPalette(prev => !prev)}
        onToggleAnalytics={() => setShowAnalytics(prev => !prev)}
        onToggleHeader={() => setShowHeader(prev => !prev)}
        onCenterView={handleCenterView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        zoom={zoom}
      />
    </div>
  );
}

export default App;
