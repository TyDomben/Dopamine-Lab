// Core game types for HOOKED

export type NodeType =
  // Tier 1 - Basic
  | 'input'
  | 'amplifier'
  | 'reward-center'
  | 'feedback-loop'
  // Tier 2 - Psychological
  | 'anticipation-delay'
  | 'variable-reward'
  | 'near-miss'
  | 'combo-multiplier'
  // Tier 3 - Advanced Exploitation
  | 'streak-counter'
  | 'idle-processor'
  | 'progress-bar'
  | 'fomo-timer'
  // Tier 4 - Meta
  | 'analytics-module'
  | 'awareness-override'
  | 'efficiency-optimizer';

export type NodeTier = 1 | 2 | 3 | 4;

export type ResourceType =
  | 'dopamine'
  | 'neural-connections'
  | 'insight-points'
  | 'prestige-tokens';

export type GamePhase =
  | 'naive'           // 0-3 min
  | 'architect'       // 3-10 min
  | 'aware'           // 10-30 min
  | 'designer';       // Prestige+

export type RewardTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  tier: NodeTier;
  level: number;
  connections: string[]; // IDs of connected nodes
  isActive: boolean;
  productionRate: number; // Units per second
  effectivenessMultiplier: number;
  lastProcessedTime: number;
}

export interface NodeDefinition {
  type: NodeType;
  tier: NodeTier;
  name: string;
  description: string;
  psychologicalPrinciple: string;
  baseProduction: number;
  cost: Partial<Record<ResourceType, number>>;
  unlockRequirement: {
    resource?: Partial<Record<ResourceType, number>>;
    phase?: GamePhase;
    achievement?: string;
  };
  tooltip: {
    effect: string;
    manipulation: string; // The honest part
    stats?: string;
  };
}

export interface Connection {
  id: string;
  from: string; // Node ID
  to: string;   // Node ID
  throughput: number; // Resources per second
  particleSpeed: number;
  isActive: boolean;
}

export interface Resources {
  dopamine: number;
  'neural-connections': number;
  'insight-points': number;
  'prestige-tokens': number;
}

export interface ResourceRates {
  dopamine: number;
  'neural-connections': number;
  'insight-points': number;
  'prestige-tokens': number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  metaCommentary: string; // The self-aware part
  unlocked: boolean;
  unlockedAt?: number;
  tier: RewardTier;
  condition: (state: GameState) => boolean;
}

export interface AnalyticsData {
  sessionStartTime: number;
  totalSessionTime: number;
  actionsPerMinute: number;
  dopaminePerAction: number;
  mostEffectiveHook: string;
  clickCount: number;
  prestigeCount: number;
  awarenessActivatedAt?: number;
  playTimeAfterAwareness: number;
}

export interface GameState {
  // Core resources
  resources: Resources;
  resourceRates: ResourceRates;

  // Circuit state
  nodes: Node[];
  connections: Connection[];

  // Progression
  phase: GamePhase;
  unlockedNodes: NodeType[];
  achievements: Achievement[];

  // Meta
  awarenessMode: boolean;
  analytics: AnalyticsData;

  // Prestige
  prestigeLevel: number;
  permanentMultipliers: {
    production: number;
    unlockSpeed: number;
    awareness: number;
  };

  // Tutorial
  tutorialStep: number;
  tutorialCompleted: boolean;

  // UI State
  selectedNode: string | null;
  hoveredNode: string | null;
  showAnalyticsDashboard: boolean;

  // Time tracking
  lastTickTime: number;
  totalPlayTime: number;
}

export interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
}

export interface ProgressBarState {
  current: number;
  target: number;
  speed: number;
  tier: RewardTier;
}
