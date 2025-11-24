// Game validation and limits system
// Prevents exploits while maintaining game balance

import type { GameState, Node, Connection, Resources } from '../../types/game';

// ===== GAME LIMITS =====
export const LIMITS = {
  // Resource limits
  MAX_RESOURCE_VALUE: 1e15, // 1 quadrillion (prevents overflow)
  MIN_RESOURCE_VALUE: 0,
  MAX_RESOURCE_RATE: 1e12, // 1 trillion per second

  // Node limits
  MAX_NODES: 100, // Prevents performance death
  MAX_CONNECTIONS: 300,
  MAX_CONNECTIONS_PER_NODE: 10,
  MIN_NODE_SPACING: 50, // Prevents overlap exploits

  // Position limits
  CANVAS_MIN_X: -1000,
  CANVAS_MAX_X: 5000,
  CANVAS_MIN_Y: -1000,
  CANVAS_MAX_Y: 5000,

  // Time limits
  MAX_DELTA_TIME: 1000, // 1 second (prevents time manipulation)
  MIN_DELTA_TIME: 0,
  MAX_OFFLINE_TIME: 86400000, // 24 hours

  // Action rate limits (per second)
  MAX_CLICKS_PER_SECOND: 20,
  MAX_NODE_PLACEMENTS_PER_SECOND: 5,
  MAX_UNLOCKS_PER_SECOND: 3,

  // Prestige limits
  MIN_PRESTIGE_INTERVAL: 5000, // 5 seconds between prestiges
  MAX_PRESTIGE_LEVEL: 1000,
  MAX_MULTIPLIER: 1e6, // Prevents exponential explosion

  // Circuit complexity
  MAX_CIRCUIT_DEPTH: 20, // Max connection chain length
  MAX_FEEDBACK_LOOPS: 5, // Max circular dependencies
};

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate and clamp resource values
 */
export const validateResource = (value: number): number => {
  if (!isFinite(value) || isNaN(value)) {
    console.warn('[ANTI-CHEAT] Invalid resource value detected:', value);
    return 0;
  }
  return Math.max(
    LIMITS.MIN_RESOURCE_VALUE,
    Math.min(LIMITS.MAX_RESOURCE_VALUE, value)
  );
};

/**
 * Validate all resources in state
 */
export const validateResources = (resources: Resources): Resources => {
  return {
    dopamine: validateResource(resources.dopamine),
    'neural-connections': validateResource(resources['neural-connections']),
    'insight-points': validateResource(resources['insight-points']),
    'prestige-tokens': validateResource(resources['prestige-tokens']),
  };
};

/**
 * Validate resource rate
 */
export const validateRate = (rate: number): number => {
  if (!isFinite(rate) || isNaN(rate)) {
    console.warn('[ANTI-CHEAT] Invalid rate detected:', rate);
    return 0;
  }
  return Math.max(
    -LIMITS.MAX_RESOURCE_RATE,
    Math.min(LIMITS.MAX_RESOURCE_RATE, rate)
  );
};

/**
 * Validate node position
 */
export const validatePosition = (x: number, y: number): { x: number; y: number } => {
  const validX = isFinite(x) && !isNaN(x) ? x : 0;
  const validY = isFinite(y) && !isNaN(y) ? y : 0;

  return {
    x: Math.max(LIMITS.CANVAS_MIN_X, Math.min(LIMITS.CANVAS_MAX_X, validX)),
    y: Math.max(LIMITS.CANVAS_MIN_Y, Math.min(LIMITS.CANVAS_MAX_Y, validY)),
  };
};

/**
 * Check if node placement would overlap with existing nodes
 */
export const isValidNodePlacement = (
  newX: number,
  newY: number,
  existingNodes: Node[],
  excludeNodeId?: string
): boolean => {
  return existingNodes.every(node => {
    if (node.id === excludeNodeId) return true;

    const dx = Math.abs(node.position.x - newX);
    const dy = Math.abs(node.position.y - newY);

    return dx >= LIMITS.MIN_NODE_SPACING || dy >= LIMITS.MIN_NODE_SPACING;
  });
};

/**
 * Validate connection (no self-loops, no duplicates, not at limit)
 */
export const isValidConnection = (
  fromId: string,
  toId: string,
  existingConnections: Connection[],
  _nodes: Node[]
): { valid: boolean; reason?: string } => {
  // No self-loops
  if (fromId === toId) {
    return { valid: false, reason: 'Cannot connect node to itself' };
  }

  // Check if connection already exists
  const duplicate = existingConnections.some(
    c => c.from === fromId && c.to === toId
  );
  if (duplicate) {
    return { valid: false, reason: 'Connection already exists' };
  }

  // Check connection limits
  const fromConnections = existingConnections.filter(c => c.from === fromId).length;
  const toConnections = existingConnections.filter(c => c.to === toId).length;

  if (fromConnections >= LIMITS.MAX_CONNECTIONS_PER_NODE) {
    return { valid: false, reason: 'Source node at connection limit' };
  }

  if (toConnections >= LIMITS.MAX_CONNECTIONS_PER_NODE) {
    return { valid: false, reason: 'Target node at connection limit' };
  }

  // Check if this would create too deep a chain
  const depth = calculateConnectionDepth(fromId, toId, existingConnections);
  if (depth > LIMITS.MAX_CIRCUIT_DEPTH) {
    return { valid: false, reason: 'Circuit too complex (max depth exceeded)' };
  }

  // Check total connections limit
  if (existingConnections.length >= LIMITS.MAX_CONNECTIONS) {
    return { valid: false, reason: 'Maximum total connections reached' };
  }

  return { valid: true };
};

/**
 * Calculate circuit depth (prevents infinite recursion exploits)
 */
const calculateConnectionDepth = (
  fromId: string,
  toId: string,
  connections: Connection[],
  visited: Set<string> = new Set(),
  depth: number = 0
): number => {
  if (depth > LIMITS.MAX_CIRCUIT_DEPTH) return depth;
  if (visited.has(fromId)) return depth; // Circular reference detected

  visited.add(fromId);

  const outgoing = connections.filter(c => c.from === fromId);
  if (outgoing.length === 0) return depth;

  const maxChildDepth = outgoing.reduce((max, conn) => {
    const childDepth = calculateConnectionDepth(conn.to, toId, connections, new Set(visited), depth + 1);
    return Math.max(max, childDepth);
  }, depth);

  return maxChildDepth;
};

/**
 * Detect and count feedback loops in circuit
 */
export const detectFeedbackLoops = (connections: Connection[]): number => {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  let loopCount = 0;

  const hasCycle = (nodeId: string): boolean => {
    if (recursionStack.has(nodeId)) {
      loopCount++;
      return true;
    }
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoing = connections.filter(c => c.from === nodeId);
    for (const conn of outgoing) {
      if (hasCycle(conn.to)) {
        // Cycle detected
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  // Check all nodes
  const allNodeIds = new Set<string>();
  connections.forEach(c => {
    allNodeIds.add(c.from);
    allNodeIds.add(c.to);
  });

  allNodeIds.forEach(nodeId => {
    if (!visited.has(nodeId)) {
      hasCycle(nodeId);
    }
  });

  return loopCount;
};

/**
 * Validate delta time (prevents time manipulation exploits)
 */
export const validateDeltaTime = (deltaTime: number): number => {
  if (!isFinite(deltaTime) || isNaN(deltaTime) || deltaTime < 0) {
    return 0;
  }
  return Math.min(deltaTime, LIMITS.MAX_DELTA_TIME);
};

/**
 * Validate prestige multiplier (prevents exponential exploits)
 */
export const validateMultiplier = (multiplier: number): number => {
  if (!isFinite(multiplier) || isNaN(multiplier) || multiplier < 1) {
    return 1;
  }
  return Math.min(multiplier, LIMITS.MAX_MULTIPLIER);
};

/**
 * Rate limiter class for action throttling
 */
export class RateLimiter {
  private actionTimestamps: Map<string, number[]> = new Map();

  canPerformAction(actionType: string, maxPerSecond: number): boolean {
    const now = Date.now();
    const timestamps = this.actionTimestamps.get(actionType) || [];

    // Remove timestamps older than 1 second
    const recentTimestamps = timestamps.filter(t => now - t < 1000);

    if (recentTimestamps.length >= maxPerSecond) {
      console.warn(`[RATE LIMIT] ${actionType} exceeded ${maxPerSecond}/sec`);
      return false;
    }

    recentTimestamps.push(now);
    this.actionTimestamps.set(actionType, recentTimestamps);
    return true;
  }

  reset() {
    this.actionTimestamps.clear();
  }
}

/**
 * Anti-cheat detection system
 */
export class AntiCheatDetector {
  private suspiciousActions: Array<{ type: string; timestamp: number }> = [];
  private cheatScore: number = 0;

  reportSuspiciousActivity(type: string, severity: number = 1) {
    this.suspiciousActions.push({ type, timestamp: Date.now() });
    this.cheatScore += severity;

    if (this.cheatScore > 10) {
      console.warn('[ANTI-CHEAT] High cheat score detected:', this.cheatScore);
      console.warn('[ANTI-CHEAT] Suspicious actions:', this.suspiciousActions);
    }
  }

  getCheatScore(): number {
    return this.cheatScore;
  }

  isLikelyCheating(): boolean {
    return this.cheatScore > 20;
  }

  reset() {
    this.suspiciousActions = [];
    this.cheatScore = 0;
  }
}

/**
 * Validate entire game state
 */
export const validateGameState = (state: GameState): GameState => {
  const validated = { ...state };

  // Validate resources
  validated.resources = validateResources(state.resources);

  // Validate rates
  validated.resourceRates = {
    dopamine: validateRate(state.resourceRates.dopamine),
    'neural-connections': validateRate(state.resourceRates['neural-connections']),
    'insight-points': validateRate(state.resourceRates['insight-points']),
    'prestige-tokens': validateRate(state.resourceRates['prestige-tokens']),
  };

  // Validate node count
  if (validated.nodes.length > LIMITS.MAX_NODES) {
    console.warn('[ANTI-CHEAT] Too many nodes, capping at', LIMITS.MAX_NODES);
    validated.nodes = validated.nodes.slice(0, LIMITS.MAX_NODES);
  }

  // Validate node positions
  validated.nodes = validated.nodes.map((node: Node) => ({
    ...node,
    position: validatePosition(node.position.x, node.position.y),
    productionRate: validateRate(node.productionRate),
    effectivenessMultiplier: validateMultiplier(node.effectivenessMultiplier),
  }));

  // Validate connections
  if (validated.connections.length > LIMITS.MAX_CONNECTIONS) {
    console.warn('[ANTI-CHEAT] Too many connections, capping at', LIMITS.MAX_CONNECTIONS);
    validated.connections = validated.connections.slice(0, LIMITS.MAX_CONNECTIONS);
  }

  // Validate prestige
  if (validated.prestigeLevel > LIMITS.MAX_PRESTIGE_LEVEL) {
    validated.prestigeLevel = LIMITS.MAX_PRESTIGE_LEVEL;
  }

  validated.permanentMultipliers = {
    production: validateMultiplier(state.permanentMultipliers.production),
    unlockSpeed: validateMultiplier(state.permanentMultipliers.unlockSpeed),
    awareness: validateMultiplier(state.permanentMultipliers.awareness),
  };

  // Validate time values
  if (!isFinite(validated.totalPlayTime) || isNaN(validated.totalPlayTime)) {
    validated.totalPlayTime = 0;
  }

  return validated;
};

/**
 * Sanitize resource gain (prevents injection attacks)
 */
export const sanitizeResourceGain = (
  resources: Partial<Record<keyof Resources, number>>
): Partial<Record<keyof Resources, number>> => {
  const sanitized: Partial<Record<keyof Resources, number>> = {};

  Object.entries(resources).forEach(([key, value]) => {
    if (typeof value === 'number' && isFinite(value) && !isNaN(value)) {
      // Cap gains to prevent exploits
      sanitized[key as keyof Resources] = Math.max(0, Math.min(value, LIMITS.MAX_RESOURCE_VALUE / 100));
    }
  });

  return sanitized;
};

/**
 * Check if prestige is being abused
 */
export const canPrestigeSafely = (
  state: GameState,
  lastPrestigeTime: number
): { allowed: boolean; reason?: string } => {
  const now = Date.now();

  // Check cooldown
  if (now - lastPrestigeTime < LIMITS.MIN_PRESTIGE_INTERVAL) {
    return {
      allowed: false,
      reason: 'Prestige cooldown active (prevents spam)',
    };
  }

  // Check resources are valid
  if (state.resources.dopamine < 0 || !isFinite(state.resources.dopamine)) {
    return {
      allowed: false,
      reason: 'Invalid resource state',
    };
  }

  // Check prestige level
  if (state.prestigeLevel >= LIMITS.MAX_PRESTIGE_LEVEL) {
    return {
      allowed: false,
      reason: 'Maximum prestige level reached',
    };
  }

  return { allowed: true };
};

// Export singleton instances
export const rateLimiter = new RateLimiter();
export const antiCheat = new AntiCheatDetector();
