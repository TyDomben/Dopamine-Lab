// Utility functions for formatting numbers and resources

/**
 * Format large numbers with K, M, B, T suffixes
 * Examples: 1500 -> 1.5K, 2400000 -> 2.4M
 */
export const formatNumber = (num: number, decimals: number = 1): string => {
  if (num < 1000) {
    return Math.floor(num).toString();
  }

  const suffixes = ['', 'K', 'M', 'B', 'T', 'Q'];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);

  if (tier <= 0) {
    return Math.floor(num).toString();
  }

  const suffix = suffixes[tier] || 'Q+';
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;

  return scaled.toFixed(decimals) + suffix;
};

/**
 * Get color class based on number tier
 */
export const getNumberColor = (num: number): string => {
  if (num < 1000) return 'text-white';
  if (num < 1000000) return 'text-game-cyan';
  if (num < 1000000000) return 'text-game-purple';
  return 'text-game-gold';
};

/**
 * Format rate display (e.g., +127/sec)
 */
export const formatRate = (rate: number): string => {
  if (rate === 0) return '';
  const sign = rate > 0 ? '+' : '';
  return `${sign}${formatNumber(rate)}/sec`;
};

/**
 * Format time duration
 */
export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Ease out cubic function for smooth animations
 */
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Calculate progress bar speed (rubber-banding)
 * Fast 0-20%, slow 70-95%, instant 95-100%
 */
export const calculateProgressSpeed = (progress: number): number => {
  if (progress < 0.2) return 2.0; // Fast
  if (progress < 0.7) return 1.0; // Normal
  if (progress < 0.95) return 0.3; // Slow
  return 10.0; // Instant
};

/**
 * Get reward tier based on value
 */
export const getRewardTier = (value: number): 'common' | 'uncommon' | 'rare' | 'legendary' => {
  if (value >= 1001) return 'legendary';
  if (value >= 101) return 'rare';
  if (value >= 11) return 'uncommon';
  return 'common';
};

/**
 * Calculate near-miss percentage (always high, for manipulation)
 */
export const calculateNearMiss = (): number => {
  // Always between 85-99% to create false sense of "almost"
  return 85 + Math.random() * 14;
};

/**
 * Throttle function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};
