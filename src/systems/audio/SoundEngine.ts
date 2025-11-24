// Web Audio API sound system for HOOKED
// Every sound is carefully crafted to maximize dopamine response

export type SoundType =
  | 'click'
  | 'resource-gain'
  | 'combo-1x'
  | 'combo-2x'
  | 'combo-3x'
  | 'combo-4x'
  | 'combo-5x'
  | 'reward-common'
  | 'reward-uncommon'
  | 'reward-rare'
  | 'reward-legendary'
  | 'anticipation'
  | 'unlock'
  | 'achievement'
  | 'prestige';

class SoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOscillator: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private soundQueue: Array<{ type: SoundType; time: number }> = [];
  private maxSoundsPerSecond = 10;
  private enabled = true;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3; // Master volume
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private ensureContext() {
    if (!this.audioContext) {
      this.initialize();
    }
    // Resume context if suspended (due to browser autoplay policies)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public enable() {
    this.enabled = true;
    this.ensureContext();
  }

  public disable() {
    this.enabled = false;
    this.stopAmbient();
  }

  public setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  private canPlaySound(): boolean {
    if (!this.enabled || !this.audioContext || !this.masterGain) return false;

    // Throttle sounds
    const now = Date.now();
    this.soundQueue = this.soundQueue.filter(s => now - s.time < 1000);
    return this.soundQueue.length < this.maxSoundsPerSecond;
  }

  private trackSound(type: SoundType) {
    this.soundQueue.push({ type, time: Date.now() });
  }

  /**
   * Play click confirmation sound
   */
  public playClick() {
    if (!this.canPlaySound()) return;
    this.ensureContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 800;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.05);

    this.trackSound('click');
  }

  /**
   * Play resource gain sound (ascending notes)
   */
  public playResourceGain(amount: number = 1) {
    if (!this.canPlaySound()) return;
    this.ensureContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // C4 → E4 → G4 (major triad, sounds pleasant)
    const frequencies = [261.63, 329.63, 392.00];
    const volume = Math.min(0.2, 0.05 + amount * 0.01);

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      const startTime = now + i * 0.1;
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });

    this.trackSound('resource-gain');
  }

  /**
   * Play combo sound (pitch increases with combo level)
   */
  public playCombo(level: number) {
    if (!this.canPlaySound()) return;
    this.ensureContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const comboFrequencies = [523, 659, 784, 1047, 1047];
    const freq = comboFrequencies[Math.min(level - 1, 4)];
    const volume = Math.min(0.3, 0.1 + level * 0.03);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = freq;
    osc.type = level >= 5 ? 'triangle' : 'sine';

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    // Add harmonics for 5x+ combo
    if (level >= 5) {
      const harmonic = ctx.createOscillator();
      const harmonicGain = ctx.createGain();

      harmonic.frequency.value = freq * 1.5;
      harmonic.type = 'sine';

      harmonicGain.gain.setValueAtTime(volume * 0.3, now);
      harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      harmonic.connect(harmonicGain);
      harmonicGain.connect(this.masterGain!);

      harmonic.start(now);
      harmonic.stop(now + 0.2);
    }

    osc.start(now);
    osc.stop(now + 0.2);

    this.trackSound(`combo-${level}x` as SoundType);
  }

  /**
   * Play reward sound based on tier
   */
  public playReward(tier: 'common' | 'uncommon' | 'rare' | 'legendary') {
    if (!this.enabled) return;
    this.ensureContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    switch (tier) {
      case 'common':
        this.playSingleDing(now, 0.2);
        break;
      case 'uncommon':
        this.playDoubleChime(now, 0.4);
        break;
      case 'rare':
        this.playAscendingArpeggio(now, 0.8);
        break;
      case 'legendary':
        this.playFanfare(now, 1.5);
        break;
    }

    this.trackSound(`reward-${tier}` as SoundType);
  }

  private playSingleDing(startTime: number, duration: number) {
    const ctx = this.audioContext!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 880; // A5
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playDoubleChime(startTime: number, duration: number) {
    const ctx = this.audioContext!;
    const frequencies = [659, 880]; // E5, A5

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      const time = startTime + i * 0.15;
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  private playAscendingArpeggio(startTime: number, _duration: number) {
    const ctx = this.audioContext!;
    const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      const time = startTime + i * 0.1;
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 0.3);
    });

    // Add reverb-like echo
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      const time = startTime + i * 0.1 + 0.2;
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 0.3);
    });
  }

  private playFanfare(startTime: number, _duration: number) {
    const ctx = this.audioContext!;

    // Bass drop
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.frequency.value = 65.41; // C2
    bass.type = 'sawtooth';
    bassGain.gain.setValueAtTime(0.3, startTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
    bass.connect(bassGain);
    bassGain.connect(this.masterGain!);
    bass.start(startTime);
    bass.stop(startTime + 0.5);

    // Ascending fanfare
    const fanfareNotes = [523, 659, 784, 1047, 1319]; // C5 to E6
    fanfareNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'triangle';

      const time = startTime + 0.3 + i * 0.08;
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  /**
   * Play anticipation sound (rising pitch)
   */
  public playAnticipation(callback?: () => void) {
    if (!this.enabled) return;
    this.ensureContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(800, now + 1.5);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 1.5);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 1.5);

    if (callback) {
      setTimeout(callback, 1500);
    }

    this.trackSound('anticipation');
  }

  /**
   * Play unlock sound
   */
  public playUnlock() {
    if (!this.enabled) return;
    this.ensureContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Bright, ascending sound
    const frequencies = [659, 784, 1047, 1319];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'triangle';

      const time = now + i * 0.05;
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 0.3);
    });

    this.trackSound('unlock');
  }

  /**
   * Start ambient background hum
   */
  public startAmbient(productionRate: number = 0) {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    if (!this.ambientOscillator) {
      const ctx = this.audioContext!;

      this.ambientOscillator = ctx.createOscillator();
      this.ambientGain = ctx.createGain();

      this.ambientOscillator.frequency.value = 60; // Low hum
      this.ambientOscillator.type = 'sine';

      const volume = Math.min(0.3, 0.1 + productionRate * 0.001);
      this.ambientGain.gain.value = volume;

      this.ambientOscillator.connect(this.ambientGain);
      this.ambientGain.connect(this.masterGain!);

      this.ambientOscillator.start();
    } else if (this.ambientGain) {
      // Update volume based on production rate
      const volume = Math.min(0.3, 0.1 + productionRate * 0.001);
      this.ambientGain.gain.linearRampToValueAtTime(
        volume,
        this.audioContext!.currentTime + 0.5
      );
    }
  }

  /**
   * Stop ambient sound
   */
  public stopAmbient() {
    if (this.ambientOscillator) {
      this.ambientOscillator.stop();
      this.ambientOscillator = null;
      this.ambientGain = null;
    }
  }

  /**
   * Play achievement sound
   */
  public playAchievement() {
    this.playReward('rare');
    this.trackSound('achievement');
  }

  /**
   * Play prestige sound
   */
  public playPrestige() {
    this.playReward('legendary');
    setTimeout(() => {
      this.playReward('legendary');
    }, 500);
    this.trackSound('prestige');
  }
}

// Singleton instance
export const soundEngine = new SoundEngine();
