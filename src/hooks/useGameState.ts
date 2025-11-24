import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, Node, Connection, NodeType, Resources } from '../types/game';
import { ResourceManager } from '../systems/resources/ResourceManager';
import { NODE_DEFINITIONS } from '../data/nodes';
import { soundEngine } from '../systems/audio/SoundEngine';
import { generateId } from '../utils/format';
import {
  LIMITS,
  validateGameState,
  validateDeltaTime,
  validatePosition,
  validateResources,
  isValidConnection,
  isValidNodePlacement,
  detectFeedbackLoops,
  canPrestigeSafely,
  sanitizeResourceGain,
  rateLimiter,
  antiCheat,
} from '../systems/validation/GameValidator';

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
      // Validate and cap delta time (prevents time manipulation)
      const deltaTime = validateDeltaTime(action.deltaTime);

      // Update resources based on rates
      let newResources = ResourceManager.updateResources(
        state.resources,
        state.resourceRates,
        deltaTime
      );

      // Validate resources (prevents overflow/NaN)
      newResources = validateResources(newResources);

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
      // Rate limit node placement (prevents spam)
      if (!rateLimiter.canPerformAction('ADD_NODE', LIMITS.MAX_NODE_PLACEMENTS_PER_SECOND)) {
        antiCheat.reportSuspiciousActivity('NODE_SPAM', 2);
        return state;
      }

      // Check node limit (prevents performance death)
      if (state.nodes.length >= LIMITS.MAX_NODES) {
        console.warn('[LIMIT] Maximum nodes reached:', LIMITS.MAX_NODES);
        return state;
      }

      const definition = NODE_DEFINITIONS[action.nodeType];

      // Validate and clamp position
      const position = validatePosition(action.position.x, action.position.y);

      // Check node spacing (prevents overlap exploits)
      if (!isValidNodePlacement(position.x, position.y, state.nodes)) {
        console.warn('[VALIDATION] Node placement too close to existing node');
        return state;
      }

      // Check if can afford
      if (!ResourceManager.canAfford(state.resources, definition.cost)) {
        return state;
      }

      // Create new node
      const newNode: Node = {
        id: generateId(),
        type: action.nodeType,
        position,
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
        resources: validateResources(newResources),
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

      // Validate connection (prevents exploits)
      const validation = isValidConnection(
        action.fromId,
        action.toId,
        state.connections,
        state.nodes
      );

      if (!validation.valid) {
        console.warn('[VALIDATION] Invalid connection:', validation.reason);
        return state;
      }

      // Check for excessive feedback loops (prevents infinite recursion exploits)
      const currentLoops = detectFeedbackLoops(state.connections);
      if (currentLoops >= LIMITS.MAX_FEEDBACK_LOOPS) {
        console.warn('[LIMIT] Too many feedback loops:', currentLoops);
        return state;
      }

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
      // Rate limit unlocks (prevents rapid unlock spam)
      if (!rateLimiter.canPerformAction('UNLOCK_NODE', LIMITS.MAX_UNLOCKS_PER_SECOND)) {
        antiCheat.reportSuspiciousActivity('UNLOCK_SPAM', 1);
        return state;
      }

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

      // Validate prestige (prevents spam and exploits)
      const lastPrestige = state.lastTickTime; // Use last tick as proxy for last action
      const prestigeValidation = canPrestigeSafely(state, lastPrestige);

      if (!prestigeValidation.allowed) {
        console.warn('[VALIDATION] Prestige denied:', prestigeValidation.reason);
        antiCheat.reportSuspiciousActivity('PRESTIGE_SPAM', 3);
        return state;
      }

      const prestigeGain = ResourceManager.calculatePrestigeGain(state.resources);

      soundEngine.playPrestige();

      // Reset state but keep prestige bonuses
      const newState = createInitialState();

      // Validate multipliers (prevents exponential exploits)
      const newMultipliers = {
        production: Math.min(state.permanentMultipliers.production * 1.5, LIMITS.MAX_MULTIPLIER),
        unlockSpeed: Math.min(state.permanentMultipliers.unlockSpeed * 1.3, LIMITS.MAX_MULTIPLIER),
        awareness: Math.min(state.permanentMultipliers.awareness * 1.2, LIMITS.MAX_MULTIPLIER),
      };

      return {
        ...newState,
        prestigeLevel: Math.min(state.prestigeLevel + 1, LIMITS.MAX_PRESTIGE_LEVEL),
        resources: {
          ...newState.resources,
          'prestige-tokens': state.resources['prestige-tokens'] + prestigeGain,
        },
        permanentMultipliers: newMultipliers,
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
      // Sanitize resource gains (prevents injection exploits)
      const sanitizedGains = sanitizeResourceGain(action.resources);

      // Add resources with validation
      let newResources = ResourceManager.add(state.resources, sanitizedGains);
      newResources = validateResources(newResources);

      soundEngine.playResourceGain(sanitizedGains.dopamine || 0);

      return {
        ...state,
        resources: newResources,
      };
    }

    case 'TRACK_CLICK': {
      // Rate limit clicks (prevents autoclicker exploits)
      if (!rateLimiter.canPerformAction('TRACK_CLICK', LIMITS.MAX_CLICKS_PER_SECOND)) {
        antiCheat.reportSuspiciousActivity('CLICK_SPAM', 2);
        return state;
      }

      const clickCount = state.analytics.clickCount + 1;
      const sessionTime = (Date.now() - state.analytics.sessionStartTime) / 1000 / 60;
      const apm = sessionTime > 0 ? clickCount / sessionTime : 0;

      // Detect suspicious APM (autoclicker detection)
      if (apm > 120) {
        antiCheat.reportSuspiciousActivity('SUSPICIOUS_APM', 3);
        console.warn('[ANTI-CHEAT] Suspicious APM detected:', apm);
      }

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
      // Validate loaded state (prevents save file exploits)
      console.log('[LOAD] Validating loaded state...');
      const validatedState = validateGameState(action.state);

      // Check for tampering
      if (antiCheat.isLikelyCheating()) {
        console.warn('[ANTI-CHEAT] Suspicious activity detected in loaded state');
      }

      return validatedState;
    }

    default:
      return state;
  }
};

// Wrapper reducer with final validation pass
const validatedGameReducer = (state: GameState, action: GameAction): GameState => {
  const newState = gameReducer(state, action);

  // Final validation pass (safety net)
  if (action.type !== 'LOAD_STATE') {
    // Don't double-validate LOAD_STATE
    return validateGameState(newState);
  }

  return newState;
};

// Main hook
export const useGameState = () => {
  const [state, dispatch] = useReducer(validatedGameReducer, createInitialState());
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
