import type { NodeDefinition, NodeType } from '../types/game';

export const NODE_DEFINITIONS: Record<NodeType, NodeDefinition> = {
  // ===== TIER 1: BASIC =====
  'input': {
    type: 'input',
    tier: 1,
    name: 'Input Node',
    description: 'Generates base resources',
    psychologicalPrinciple: 'Foundation building - creates sense of agency',
    baseProduction: 1,
    cost: {
      dopamine: 0,
    },
    unlockRequirement: {
      phase: 'naive',
    },
    tooltip: {
      effect: 'Generates +1 dopamine/sec',
      manipulation: 'Starting small makes you feel in control. You\'re not.',
      stats: 'Tutorial completion rate: 98.7%',
    },
  },

  'amplifier': {
    type: 'amplifier',
    tier: 1,
    name: 'Amplifier',
    description: 'Multiplies connected input',
    psychologicalPrinciple: 'Progression reward - visible growth',
    baseProduction: 0,
    cost: {
      dopamine: 25,
    },
    unlockRequirement: {
      resource: { dopamine: 10 },
    },
    tooltip: {
      effect: 'Multiplies input by 3x',
      manipulation: 'That surge of progress? Designed to keep you clicking.',
      stats: 'First unlock avg time: 8.3 seconds',
    },
  },

  'reward-center': {
    type: 'reward-center',
    tier: 1,
    name: 'Reward Center',
    description: 'Converts resources to dopamine',
    psychologicalPrinciple: 'Operant conditioning - variable reinforcement',
    baseProduction: 5,
    cost: {
      dopamine: 50,
    },
    unlockRequirement: {
      resource: { dopamine: 30 },
    },
    tooltip: {
      effect: 'Converts resources to dopamine at +5/sec',
      manipulation: 'Named after the brain region we\'re hijacking.',
      stats: 'Player retention +47% after first reward',
    },
  },

  'feedback-loop': {
    type: 'feedback-loop',
    tier: 1,
    name: 'Feedback Loop',
    description: 'Creates circular dependencies',
    psychologicalPrinciple: 'Compulsion loop - self-reinforcing behavior',
    baseProduction: 0,
    cost: {
      dopamine: 100,
    },
    unlockRequirement: {
      resource: { dopamine: 75 },
    },
    tooltip: {
      effect: 'Output feeds back into input (+50% efficiency)',
      manipulation: 'The moment you stop needing external motivation.',
      stats: 'Addiction threshold marker for 73% of players',
    },
  },

  // ===== TIER 2: PSYCHOLOGICAL =====
  'anticipation-delay': {
    type: 'anticipation-delay',
    tier: 2,
    name: 'Anticipation Delay',
    description: 'Adds tension before rewards',
    psychologicalPrinciple: 'Delayed gratification - increases perceived value',
    baseProduction: 0,
    cost: {
      dopamine: 500,
      'neural-connections': 10,
    },
    unlockRequirement: {
      phase: 'architect',
      resource: { dopamine: 250 },
    },
    tooltip: {
      effect: '+0.5s delay, +30% satisfaction on reward',
      manipulation: 'Your brain releases MORE dopamine during the wait than the reward.',
      stats: 'A/B tested on 50,000 players - 30% engagement increase',
    },
  },

  'variable-reward': {
    type: 'variable-reward',
    tier: 2,
    name: 'Variable Reward Node',
    description: 'Randomized output multiplier',
    psychologicalPrinciple: 'Intermittent reinforcement - slot machine effect',
    baseProduction: 10,
    cost: {
      dopamine: 750,
      'neural-connections': 15,
    },
    unlockRequirement: {
      phase: 'architect',
      resource: { dopamine: 500 },
    },
    tooltip: {
      effect: 'Random 0.5x-3x multiplier per tick',
      manipulation: 'This is literally how slot machines work. You know this. Still clicking?',
      stats: 'Most effective retention mechanic - 87% play 2x longer',
    },
  },

  'near-miss': {
    type: 'near-miss',
    tier: 2,
    name: 'Near-Miss Generator',
    description: 'Shows "almost legendary" results',
    psychologicalPrinciple: 'Loss aversion - almost winning feels worse than losing',
    baseProduction: 0,
    cost: {
      dopamine: 1000,
      'neural-connections': 20,
    },
    unlockRequirement: {
      phase: 'architect',
      resource: { dopamine: 750 },
    },
    tooltip: {
      effect: 'Displays "97% legendary" messages (RNG unchanged)',
      manipulation: 'The RNG doesn\'t change. We just show you the near misses.',
      stats: 'Players retry 4.3x more after near-miss vs normal miss',
    },
  },

  'combo-multiplier': {
    type: 'combo-multiplier',
    tier: 2,
    name: 'Combo Multiplier',
    description: 'Escalating rewards for speed',
    psychologicalPrinciple: 'Flow state manipulation - time compression',
    baseProduction: 0,
    cost: {
      dopamine: 1500,
      'neural-connections': 25,
    },
    unlockRequirement: {
      phase: 'architect',
      resource: { dopamine: 1000 },
    },
    tooltip: {
      effect: 'Each action within 2s increases multiplier (1x→5x)',
      manipulation: 'Notice you\'re clicking faster? That\'s not you deciding to.',
      stats: 'Average APM increases from 12 to 47 after unlock',
    },
  },

  // ===== TIER 3: ADVANCED EXPLOITATION =====
  'streak-counter': {
    type: 'streak-counter',
    tier: 3,
    name: 'Streak Counter',
    description: 'Bonus for consecutive days',
    psychologicalPrinciple: 'Sunk cost fallacy - can\'t break the chain',
    baseProduction: 0,
    cost: {
      dopamine: 5000,
      'neural-connections': 50,
      'insight-points': 5,
    },
    unlockRequirement: {
      phase: 'aware',
      resource: { dopamine: 3000 },
    },
    tooltip: {
      effect: '+10% per consecutive day (max 100%)',
      manipulation: 'You\'ll feel physical anxiety about breaking your streak. That\'s the point.',
      stats: 'Daily active users +340% after streak implementation',
    },
  },

  'idle-processor': {
    type: 'idle-processor',
    tier: 3,
    name: 'Idle Processor',
    description: 'Rewards for leaving/returning',
    psychologicalPrinciple: 'Intermittent reinforcement - rewards unpredictable timing',
    baseProduction: 0,
    cost: {
      dopamine: 7500,
      'neural-connections': 75,
      'insight-points': 10,
    },
    unlockRequirement: {
      phase: 'aware',
      resource: { dopamine: 5000 },
    },
    tooltip: {
      effect: 'Accumulates resources while away, bonus on return',
      manipulation: 'Punishes you for playing, rewards you for leaving. So you always come back.',
      stats: 'Next-day retention: 23% → 71%',
    },
  },

  'progress-bar': {
    type: 'progress-bar',
    tier: 3,
    name: 'Progress Bar Renderer',
    description: 'Visual progression that never empties',
    psychologicalPrinciple: 'Goal gradient effect - acceleration near completion',
    baseProduction: 0,
    cost: {
      dopamine: 10000,
      'neural-connections': 100,
      'insight-points': 15,
    },
    unlockRequirement: {
      phase: 'aware',
      resource: { dopamine: 7500 },
    },
    tooltip: {
      effect: 'Always shows next goal at 15% after completion',
      manipulation: 'It never truly empties. There\'s always "just one more" goal.',
      stats: 'Session length +156% vs games without persistent progress',
    },
  },

  'fomo-timer': {
    type: 'fomo-timer',
    tier: 3,
    name: 'FOMO Timer',
    description: 'Limited-time multipliers',
    psychologicalPrinciple: 'Scarcity bias - artificial urgency',
    baseProduction: 0,
    cost: {
      dopamine: 15000,
      'neural-connections': 150,
      'insight-points': 25,
    },
    unlockRequirement: {
      phase: 'aware',
      resource: { dopamine: 10000 },
    },
    tooltip: {
      effect: '2x multiplier for 60 seconds, 5 minute cooldown',
      manipulation: 'The timer is arbitrary. But you\'ll click it anyway.',
      stats: 'Players check game 8x more frequently after FOMO unlock',
    },
  },

  // ===== TIER 4: META =====
  'analytics-module': {
    type: 'analytics-module',
    tier: 4,
    name: 'Analytics Module',
    description: 'Tracks your engagement',
    psychologicalPrinciple: 'Surveillance effect - behavior modification through observation',
    baseProduction: 0,
    cost: {
      dopamine: 25000,
      'neural-connections': 250,
      'insight-points': 50,
    },
    unlockRequirement: {
      phase: 'aware',
      resource: { 'insight-points': 30 },
    },
    tooltip: {
      effect: 'Shows real-time manipulation metrics',
      manipulation: 'Knowing you\'re being manipulated doesn\'t stop it from working.',
      stats: 'Players with analytics play 23% LONGER despite awareness',
    },
  },

  'awareness-override': {
    type: 'awareness-override',
    tier: 4,
    name: 'Awareness Override',
    description: 'Toggle manipulation visibility',
    psychologicalPrinciple: 'Illusion of control - false agency',
    baseProduction: 0,
    cost: {
      dopamine: 50000,
      'neural-connections': 500,
      'insight-points': 100,
    },
    unlockRequirement: {
      phase: 'aware',
      resource: { 'insight-points': 75 },
    },
    tooltip: {
      effect: 'Turn awareness mode ON/OFF',
      manipulation: 'You can hide the labels. The manipulation still works. You know this.',
      stats: '91% turn it OFF within 5 minutes. Then back ON. Then OFF again.',
    },
  },

  'efficiency-optimizer': {
    type: 'efficiency-optimizer',
    tier: 4,
    name: 'Efficiency Optimizer',
    description: 'Suggests better addiction',
    psychologicalPrinciple: 'Collaborative exploitation - making you complicit',
    baseProduction: 0,
    cost: {
      dopamine: 100000,
      'neural-connections': 1000,
      'insight-points': 200,
    },
    unlockRequirement: {
      phase: 'designer',
      resource: { 'prestige-tokens': 1 },
    },
    tooltip: {
      effect: 'AI suggests optimal circuit layouts for maximum dopamine',
      manipulation: 'Now you\'re not just the addict. You\'re the dealer optimizing your own addiction.',
      stats: 'Final stage. You\'ve become the experiment designer.',
    },
  },
};

export const getNodesByTier = (tier: number): NodeDefinition[] => {
  return Object.values(NODE_DEFINITIONS).filter(node => node.tier === tier);
};

export const getNodeDefinition = (type: NodeType): NodeDefinition => {
  return NODE_DEFINITIONS[type];
};
