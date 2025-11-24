import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, Node, Connection, NodeType, Resources } from '../types/game';
import { ResourceManager } from '../systems/resources/ResourceManager';
import { NODE_DEFINITIONS } from '../data/nodes';
import { soundEngine } from '../systems/audio/SoundEngine';
import { generateId } from '../utils/format';

// Initial game state
const createInitialState = (): GameState => ({
  resources: {
    dopamine: 0,
    'neural-connections': 100,
    'insight-points': 0,
    'prestige-tokens': 0,
  },
  resourceRates: {
    dopamine: 0,
    'neural-connections': 0,
    'insight-points': 0,
    'prestige-tokens': 0,
  },
  nodes: [],
  connections: [],
  phase: 'naive',
  unlockedNodes: ['input', 'amplifier', 'reward-center'],
  achievements: [],
  awarenessMode: false,
  analytics: {
    sessionStartTime: Date.now(),
    totalSessionTime: 0,
    actionsPerMinute: 0,
    dopaminePerAction: 0,
    mostEffectiveHook: 'none',
    clickCount: 0,
    prestigeCount: 0,
    playTimeAfterAwareness: 0,
  },
  prestigeLevel: 0,
  permanentMultipliers: {
    production: 1,
    unlockSpeed: 1,
    awareness: 1,
  },
  tutorialStep: 0,
  tutorialCompleted: false,
  selectedNode: null,
  hoveredNode: null,
  showAnalyticsDashboard: false,
  lastTickTime: Date.now(),
  totalPlayTime: 0,
});

// Game actions
type GameAction =
  | { type: 'TICK'; deltaTime: number }
  | { type: 'ADD_NODE'; nodeType: NodeType; position: { x: number; y: number } }
  | { type: 'REMOVE_NODE'; nodeId: string }
  | { type: 'CONNECT_NODES'; fromId: string; toId: string }
  | { type: 'DISCONNECT_NODES'; connectionId: string }
  | { type: 'UNLOCK_NODE'; nodeType: NodeType }
  | { type: 'TOGGLE_AWARENESS' }
  | { type: 'PRESTIGE' }
  | { type: 'SELECT_NODE'; nodeId: string | null }
  | { type: 'HOVER_NODE'; nodeId: string | null }
  | { type: 'COMPLETE_TUTORIAL_STEP' }
  | { type: 'ADD_RESOURCES'; resources: Partial<Record<keyof Resources, number>> }
  | { type: 'TRACK_CLICK' }
  | { type: 'LOAD_STATE'; state: GameState };

// Game reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'TICK': {
      const deltaTime = action.deltaTime;

      // Update resources based on rates
      const newResources = ResourceManager.updateResources(
        state.resources,
        state.resourceRates,
        deltaTime
      );

      // Update analytics
      const sessionTime = Date.now() - state.analytics.sessionStartTime;
      const totalTime = state.totalPlayTime + deltaTime;

      const analytics = {
        ...state.analytics,
        totalSessionTime: sessionTime,
        playTimeAfterAwareness: state.awarenessMode && state.analytics.awarenessActivatedAt
          ? Date.now() - state.analytics.awarenessActivatedAt
          : state.analytics.playTimeAfterAwareness,
      };

      // Calculate rates
      let rates = ResourceManager.calculateRates(state.nodes, state.connections);

      // Add insight points in aware phase
      if (state.phase === 'aware' || state.phase === 'designer') {
        rates['insight-points'] = 0.5;
      }

      // Apply prestige multipliers
      rates = ResourceManager.applyPrestigeMultipliers(rates, state.permanentMultipliers);

      // Update analytics - most effective hook
      const nodeTypes = state.nodes.map(n => n.type);
      const hookScores: Record<string, number> = {};

      nodeTypes.forEach(type => {
        const def = NODE_DEFINITIONS[type];
        if (def.tier >= 2) {
          hookScores[def.name] = (hookScores[def.name] || 0) + def.baseProduction;
        }
      });

      const mostEffectiveHook = Object.keys(hookScores).length > 0
        ? Object.entries(hookScores).sort((a, b) => b[1] - a[1])[0][0]
        : 'none';

      // Check phase transitions
      let newPhase = state.phase;
      const playTimeMinutes = totalTime / 1000 / 60;

      if (playTimeMinutes >= 30 && state.phase === 'aware') {
        // Auto-transition to designer possible via prestige
      } else if (playTimeMinutes >= 10 && state.phase === 'architect') {
        newPhase = 'aware';
      } else if (playTimeMinutes >= 3 && state.phase === 'naive') {
        newPhase = 'architect';
      }

      return {
        ...state,
        resources: newResources,
        resourceRates: rates,
        lastTickTime: Date.now(),
        totalPlayTime: totalTime,
        phase: newPhase,
        analytics: {
          ...analytics,
          mostEffectiveHook,
        },
      };
    }

    case 'ADD_NODE': {
      const definition = NODE_DEFINITIONS[action.nodeType];

      // Check if can afford
      if (!ResourceManager.canAfford(state.resources, definition.cost)) {
        return state;
      }

      // Create new node
      const newNode: Node = {
        id: generateId(),
        type: action.nodeType,
        position: action.position,
        tier: definition.tier,
        level: 1,
        connections: [],
        isActive: true,
        productionRate: definition.baseProduction,
        effectivenessMultiplier: 1,
        lastProcessedTime: Date.now(),
      };

      // Spend resources
      const newResources = ResourceManager.spend(state.resources, definition.cost);

      soundEngine.playUnlock();

      return {
        ...state,
        nodes: [...state.nodes, newNode],
        resources: newResources,
      };
    }

    case 'REMOVE_NODE': {
      const nodeToRemove = state.nodes.find(n => n.id === action.nodeId);
      if (!nodeToRemove) return state;

      // Remove connections related to this node
      const newConnections = state.connections.filter(
        c => c.from !== action.nodeId && c.to !== action.nodeId
      );

      const newNodes = state.nodes.filter(n => n.id !== action.nodeId);

      return {
        ...state,
        nodes: newNodes,
        connections: newConnections,
        selectedNode: state.selectedNode === action.nodeId ? null : state.selectedNode,
      };
    }

    case 'CONNECT_NODES': {
      const fromNode = state.nodes.find(n => n.id === action.fromId);
      const toNode = state.nodes.find(n => n.id === action.toId);

      if (!fromNode || !toNode) return state;

      // Check if connection already exists
      const existingConnection = state.connections.find(
        c => c.from === action.fromId && c.to === action.toId
      );

      if (existingConnection) return state;

      const newConnection: Connection = {
        id: generateId(),
        from: action.fromId,
        to: action.toId,
        throughput: 1,
        particleSpeed: 1,
        isActive: true,
      };

      soundEngine.playClick();

      return {
        ...state,
        connections: [...state.connections, newConnection],
      };
    }

    case 'DISCONNECT_NODES': {
      return {
        ...state,
        connections: state.connections.filter(c => c.id !== action.connectionId),
      };
    }

    case 'UNLOCK_NODE': {
      if (state.unlockedNodes.includes(action.nodeType)) {
        return state;
      }

      soundEngine.playUnlock();

      return {
        ...state,
        unlockedNodes: [...state.unlockedNodes, action.nodeType],
      };
    }

    case 'TOGGLE_AWARENESS': {
      const newAwarenessMode = !state.awarenessMode;

      return {
        ...state,
        awarenessMode: newAwarenessMode,
        showAnalyticsDashboard: newAwarenessMode,
        analytics: {
          ...state.analytics,
          awarenessActivatedAt: newAwarenessMode && !state.analytics.awarenessActivatedAt
            ? Date.now()
            : state.analytics.awarenessActivatedAt,
        },
      };
    }

    case 'PRESTIGE': {
      if (!ResourceManager.canPrestige(state.resources)) {
        return state;
      }

      const prestigeGain = ResourceManager.calculatePrestigeGain(state.resources);

      soundEngine.playPrestige();

      // Reset state but keep prestige bonuses
      const newState = createInitialState();
      return {
        ...newState,
        prestigeLevel: state.prestigeLevel + 1,
        resources: {
          ...newState.resources,
          'prestige-tokens': state.resources['prestige-tokens'] + prestigeGain,
        },
        permanentMultipliers: {
          production: state.permanentMultipliers.production * 1.5,
          unlockSpeed: state.permanentMultipliers.unlockSpeed * 1.3,
          awareness: state.permanentMultipliers.awareness * 1.2,
        },
        analytics: {
          ...newState.analytics,
          prestigeCount: state.analytics.prestigeCount + 1,
        },
        phase: 'designer',
        awarenessMode: true, // Once aware, always aware
      };
    }

    case 'SELECT_NODE': {
      return {
        ...state,
        selectedNode: action.nodeId,
      };
    }

    case 'HOVER_NODE': {
      return {
        ...state,
        hoveredNode: action.nodeId,
      };
    }

    case 'COMPLETE_TUTORIAL_STEP': {
      return {
        ...state,
        tutorialStep: state.tutorialStep + 1,
        tutorialCompleted: state.tutorialStep >= 5,
      };
    }

    case 'ADD_RESOURCES': {
      const newResources = ResourceManager.add(state.resources, action.resources);
      soundEngine.playResourceGain(action.resources.dopamine || 0);

      return {
        ...state,
        resources: newResources,
      };
    }

    case 'TRACK_CLICK': {
      const clickCount = state.analytics.clickCount + 1;
      const sessionTime = (Date.now() - state.analytics.sessionStartTime) / 1000 / 60;
      const apm = sessionTime > 0 ? clickCount / sessionTime : 0;

      return {
        ...state,
        analytics: {
          ...state.analytics,
          clickCount,
          actionsPerMinute: apm,
          dopaminePerAction: clickCount > 0 ? state.resources.dopamine / clickCount : 0,
        },
      };
    }

    case 'LOAD_STATE': {
      return action.state;
    }

    default:
      return state;
  }
};

// Main hook
export const useGameState = () => {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const frameRef = useRef<number | undefined>(undefined);
  const lastFrameTime = useRef<number>(Date.now());

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = Math.min(now - lastFrameTime.current, 100); // Cap at 100ms
      lastFrameTime.current = now;

      dispatch({ type: 'TICK', deltaTime });

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Actions
  const addNode = useCallback((nodeType: NodeType, position: { x: number; y: number }) => {
    dispatch({ type: 'ADD_NODE', nodeType, position });
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    dispatch({ type: 'REMOVE_NODE', nodeId });
  }, []);

  const connectNodes = useCallback((fromId: string, toId: string) => {
    dispatch({ type: 'CONNECT_NODES', fromId, toId });
  }, []);

  const disconnectNodes = useCallback((connectionId: string) => {
    dispatch({ type: 'DISCONNECT_NODES', connectionId });
  }, []);

  const unlockNode = useCallback((nodeType: NodeType) => {
    dispatch({ type: 'UNLOCK_NODE', nodeType });
  }, []);

  const toggleAwareness = useCallback(() => {
    dispatch({ type: 'TOGGLE_AWARENESS' });
  }, []);

  const prestige = useCallback(() => {
    dispatch({ type: 'PRESTIGE' });
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SELECT_NODE', nodeId });
  }, []);

  const hoverNode = useCallback((nodeId: string | null) => {
    dispatch({ type: 'HOVER_NODE', nodeId });
  }, []);

  const completeTutorialStep = useCallback(() => {
    dispatch({ type: 'COMPLETE_TUTORIAL_STEP' });
  }, []);

  const addResources = useCallback((resources: Partial<Record<keyof Resources, number>>) => {
    dispatch({ type: 'ADD_RESOURCES', resources });
  }, []);

  const trackClick = useCallback(() => {
    dispatch({ type: 'TRACK_CLICK' });
    soundEngine.playClick();
  }, []);

  return {
    state,
    actions: {
      addNode,
      removeNode,
      connectNodes,
      disconnectNodes,
      unlockNode,
      toggleAwareness,
      prestige,
      selectNode,
      hoverNode,
      completeTutorialStep,
      addResources,
      trackClick,
    },
  };
};
