class SoundService {
  private ctx: AudioContext | null = null;
  private volume: number = 0.2;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private playOscillator(
    freq: number, 
    type: OscillatorType, 
    duration: number, 
    startTime: number = 0,
    volMultiplier: number = 1
  ) {
    try {
      const ctx = this.getContext();
      // Resume context if suspended (browser policy)
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      
      // Envelope
      gain.gain.setValueAtTime(this.volume * volMultiplier, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }

  // UI Interaction
  playClick() {
    this.playOscillator(1800, 'sine', 0.05, 0, 0.5);
  }

  // Quest Completion (Positive Chime)
  playQuestComplete() {
    const now = 0;
    this.playOscillator(523.25, 'sine', 0.3, now, 0.8); // C5
    this.playOscillator(659.25, 'sine', 0.3, now + 0.1, 0.8); // E5
    this.playOscillator(783.99, 'sine', 0.6, now + 0.2, 0.8); // G5
  }

  // Level Up (Power Up Sweep)
  playLevelUp() {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const t = ctx.currentTime;
      
      // Sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.6);
      
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);

      // Sparkles
      this.playOscillator(1046.50, 'sine', 0.2, 0.3, 0.6); // C6
      this.playOscillator(1318.51, 'sine', 0.2, 0.45, 0.6); // E6
      this.playOscillator(1567.98, 'sine', 0.8, 0.6, 0.6); // G6
      this.playOscillator(2093.00, 'sine', 1.0, 0.7, 0.4); // C7
    } catch (e) { console.warn(e); }
  }

  // Boss Battle Warning (Low Alarm)
  playBossStart() {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(110, t); // Low A
      osc.frequency.linearRampToValueAtTime(55, t + 0.8); // Drop down
      
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0, t + 1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1);
    } catch (e) { console.warn(e); }
  }

  // Quiz Correct (High Ping)
  playCorrect() {
    this.playOscillator(1200, 'sine', 0.1, 0, 0.8);
    this.playOscillator(2400, 'sine', 0.2, 0.05, 0.6);
  }

  // Quiz Wrong (Error Buzz)
  playWrong() {
    this.playOscillator(150, 'sawtooth', 0.4, 0, 0.8);
  }

  // Defeat (Descending)
  playFail() {
    this.playOscillator(300, 'triangle', 0.4, 0, 0.8);
    this.playOscillator(200, 'triangle', 0.6, 0.3, 0.8);
  }
}

export const soundService = new SoundService();