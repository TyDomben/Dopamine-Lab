import type { Resources, ResourceRates, ResourceType, Node, Connection } from '../../types/game';
import { NODE_DEFINITIONS } from '../../data/nodes';

export class ResourceManager {
  /**
   * Calculate production rates based on active nodes and connections
   */
  static calculateRates(nodes: Node[], connections: Connection[]): ResourceRates {
    const rates: ResourceRates = {
      dopamine: 0,
      'neural-connections': 0,
      'insight-points': 0,
      'prestige-tokens': 0,
    };

    // Calculate base production from nodes
    nodes.forEach(node => {
      if (!node.isActive) return;

      const definition = NODE_DEFINITIONS[node.type];
      const baseProduction = definition.baseProduction;

      // Apply node's effectiveness multiplier
      const production = baseProduction * node.effectivenessMultiplier;

      // Most nodes produce dopamine
      rates.dopamine += production;
    });

    // Apply connection bonuses
    connections.forEach(connection => {
      if (connection.isActive) {
        rates.dopamine += connection.throughput;
      }
    });

    // Insight points accumulate slowly during aware phase
    // Will be set by game state manager based on phase

    return rates;
  }

  /**
   * Update resources based on delta time
   */
  static updateResources(
    resources: Resources,
    rates: ResourceRates,
    deltaTime: number
  ): Resources {
    const updated = { ...resources };

    // Convert delta time from ms to seconds
    const deltaSeconds = deltaTime / 1000;

    Object.keys(rates).forEach(key => {
      const resourceKey = key as ResourceType;
      updated[resourceKey] += rates[resourceKey] * deltaSeconds;
    });

    return updated;
  }

  /**
   * Check if player can afford a cost
   */
  static canAfford(
    resources: Resources,
    cost: Partial<Record<ResourceType, number>>
  ): boolean {
    return Object.entries(cost).every(([resource, amount]) => {
      return resources[resource as ResourceType] >= amount;
    });
  }

  /**
   * Spend resources
   */
  static spend(
    resources: Resources,
    cost: Partial<Record<ResourceType, number>>
  ): Resources {
    if (!this.canAfford(resources, cost)) {
      throw new Error('Cannot afford cost');
    }

    const updated = { ...resources };
    Object.entries(cost).forEach(([resource, amount]) => {
      updated[resource as ResourceType] -= amount;
    });

    return updated;
  }

  /**
   * Add resources
   */
  static add(
    resources: Resources,
    gains: Partial<Record<ResourceType, number>>
  ): Resources {
    const updated = { ...resources };
    Object.entries(gains).forEach(([resource, amount]) => {
      updated[resource as ResourceType] += amount;
    });

    return updated;
  }

  /**
   * Calculate node effectiveness based on connections
   */
  static calculateNodeEffectiveness(
    node: Node,
    connections: Connection[]
  ): number {
    let effectiveness = 1.0;

    // Count input connections
    const inputConnections = connections.filter(c => c.to === node.id && c.isActive);

    // Each input connection adds 10% effectiveness
    effectiveness += inputConnections.length * 0.1;

    // Cap at 3x effectiveness
    return Math.min(effectiveness, 3.0);
  }

  /**
   * Apply prestige multipliers
   */
  static applyPrestigeMultipliers(
    rates: ResourceRates,
    multipliers: {
      production: number;
      unlockSpeed: number;
      awareness: number;
    }
  ): ResourceRates {
    return {
      dopamine: rates.dopamine * multipliers.production,
      'neural-connections': rates['neural-connections'] * multipliers.production,
      'insight-points': rates['insight-points'] * multipliers.awareness,
      'prestige-tokens': rates['prestige-tokens'],
    };
  }

  /**
   * Calculate prestige gain based on current resources
   */
  static calculatePrestigeGain(resources: Resources): number {
    // Prestige tokens = sqrt(dopamine) / 10000
    const tokens = Math.floor(Math.sqrt(resources.dopamine) / 10000);
    return Math.max(1, tokens);
  }

  /**
   * Check if prestige is available
   */
  static canPrestige(resources: Resources): boolean {
    return resources.dopamine >= 100000000; // 100M dopamine
  }

  /**
   * Apply idle gains (rewards for being away)
   */
  static calculateIdleGains(
    rates: ResourceRates,
    offlineTime: number,
    hasIdleProcessor: boolean
  ): Partial<Record<ResourceType, number>> {
    if (!hasIdleProcessor) {
      return {};
    }

    // Idle time in seconds
    const idleSeconds = Math.min(offlineTime / 1000, 3600 * 24); // Cap at 24 hours

    // Idle production is 50% of normal rate
    const idleMultiplier = 0.5;

    // Plus bonus on return
    const returnBonus = 1.5;

    const gains: Partial<Record<ResourceType, number>> = {
      dopamine: rates.dopamine * idleSeconds * idleMultiplier * returnBonus,
    };

    return gains;
  }
}
