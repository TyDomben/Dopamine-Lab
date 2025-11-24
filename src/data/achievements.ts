import type { Achievement, GameState } from '../types/game';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-hit',
    name: 'The First One\'s Free',
    description: 'Generate your first dopamine',
    metaCommentary: 'They always give you the first hit for free.',
    unlocked: false,
    tier: 'common',
    condition: (state: GameState) => state.resources.dopamine > 0,
  },
  {
    id: 'first-circuit',
    name: 'Wired In',
    description: 'Create your first complete circuit',
    metaCommentary: 'From user to circuit. The transformation begins.',
    unlocked: false,
    tier: 'common',
    condition: (state: GameState) => state.connections.length > 0,
  },
  {
    id: 'i-see-you',
    name: 'I See You',
    description: 'Activate awareness mode',
    metaCommentary: 'Congratulations. You\'re now consciously participating in your own manipulation.',
    unlocked: false,
    tier: 'uncommon',
    condition: (state: GameState) => state.awarenessMode === true,
  },
  {
    id: 'still-here',
    name: 'Still Here?',
    description: 'Play for 15 minutes after activating awareness mode',
    metaCommentary: 'You know what this is. You know what it\'s doing. You\'re still here.',
    unlocked: false,
    tier: 'rare',
    condition: (state: GameState) =>
      state.awarenessMode &&
      state.analytics.awarenessActivatedAt !== undefined &&
      state.analytics.playTimeAfterAwareness > 15 * 60 * 1000,
  },
  {
    id: 'stockholm-syndrome',
    name: 'Stockholm Syndrome',
    description: 'Prestige despite knowing',
    metaCommentary: 'You understand it\'s a reset. You understand it\'s manipulation. You did it anyway.',
    unlocked: false,
    tier: 'rare',
    condition: (state: GameState) =>
      state.prestigeLevel > 0 && state.awarenessMode,
  },
  {
    id: 'one-more',
    name: 'One More',
    description: 'Reach prestige threshold 3 times without prestiging',
    metaCommentary: 'The ultimate power move: denying the dopamine you know is there.',
    unlocked: false,
    tier: 'rare',
    condition: (_state: GameState) => {
      // This would need additional tracking in game state
      return false; // Placeholder
    },
  },
  {
    id: 'fomo-aware',
    name: 'I Know',
    description: 'Trigger FOMO timer after seeing the manipulation tooltip',
    metaCommentary: 'Saw the trick. Fell for it anyway. We all do.',
    unlocked: false,
    tier: 'uncommon',
    condition: (_state: GameState) => {
      // Would need additional tracking
      return false; // Placeholder
    },
  },
  {
    id: 'dealer',
    name: 'The Dealer',
    description: 'Reach designer phase',
    metaCommentary: 'Now you\'re the dealer. The experiment is complete.',
    unlocked: false,
    tier: 'legendary',
    condition: (state: GameState) => state.phase === 'designer',
  },
  {
    id: 'awareness-toggle',
    name: 'Schrödinger\'s Awareness',
    description: 'Toggle awareness mode ON and OFF 10 times',
    metaCommentary: 'Can\'t decide if you want to see the manipulation or not.',
    unlocked: false,
    tier: 'uncommon',
    condition: (_state: GameState) => {
      // Would need toggle counter
      return false; // Placeholder
    },
  },
  {
    id: 'idle-check',
    name: 'Just Checking',
    description: 'Return to game within 60 seconds of leaving 5 times',
    metaCommentary: 'The idle processor trained you well.',
    unlocked: false,
    tier: 'uncommon',
    condition: (_state: GameState) => {
      // Would need return tracking
      return false; // Placeholder
    },
  },
  {
    id: 'speed-demon',
    name: 'Flow State',
    description: 'Maintain 5x combo for 30 seconds',
    metaCommentary: 'Time compression achieved. You stopped thinking and just... clicked.',
    unlocked: false,
    tier: 'rare',
    condition: (_state: GameState) => {
      // Would need combo tracking
      return false; // Placeholder
    },
  },
  {
    id: 'near-miss-victim',
    name: 'So Close',
    description: 'Experience 10 near-miss legendaries',
    metaCommentary: 'None of them were actually close. The RNG decided instantly.',
    unlocked: false,
    tier: 'common',
    condition: (_state: GameState) => {
      // Would need near-miss counter
      return false; // Placeholder
    },
  },
  {
    id: 'architect-god',
    name: 'Neural Architect',
    description: 'Build a circuit with 20+ nodes',
    metaCommentary: 'You\'ve built a beautiful prison for yourself.',
    unlocked: false,
    tier: 'rare',
    condition: (state: GameState) => state.nodes.length >= 20,
  },
  {
    id: 'completionist',
    name: 'Full Stack',
    description: 'Unlock all node types',
    metaCommentary: 'Every tool of psychological manipulation, now at your fingertips.',
    unlocked: false,
    tier: 'legendary',
    condition: (state: GameState) => state.unlockedNodes.length >= 15,
  },
  {
    id: 'number-go-up',
    name: 'Number Go Up',
    description: 'Reach 1 million dopamine',
    metaCommentary: 'Meaningless number hits meaningless threshold. Brain feels good anyway.',
    unlocked: false,
    tier: 'uncommon',
    condition: (state: GameState) => state.resources.dopamine >= 1000000,
  },
];

export const checkAchievements = (state: GameState): string[] => {
  const newlyUnlocked: string[] = [];

  ACHIEVEMENTS.forEach(achievement => {
    if (!achievement.unlocked && achievement.condition(state)) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      newlyUnlocked.push(achievement.id);
    }
  });

  return newlyUnlocked;
};

export const getAchievement = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};
