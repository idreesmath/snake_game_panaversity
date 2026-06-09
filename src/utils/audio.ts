class AudioManager {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private volumeValue: number = 0.5;
  private isMuted: boolean = false;
  private synthInterval: any = null;
  private isPlayingMusic: boolean = false;
  private synthStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : this.volumeValue, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);
    } catch (e) {
      console.error('Web Audio API not supported in this browser', e);
    }
  }

  public setVolume(vol: number) {
    this.volumeValue = Math.max(0, Math.min(1, vol));
    this.init();
    if (this.masterVolume && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volumeValue;
      this.masterVolume.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
    }
  }

  public getVolume(): number {
    return this.volumeValue;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.init();
    if (this.masterVolume && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volumeValue;
      this.masterVolume.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  public playClick() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterVolume || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playEat() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Arpeggio sound: quick slidesup
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.setValueAtTime(450, this.ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.masterVolume || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  public playPowerUp() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(1000, now + 0.3);

    osc2.frequency.setValueAtTime(204, now);
    osc2.frequency.exponentialRampToValueAtTime(1004, now + 0.3);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterVolume || this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public playLevelUp() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C major chord arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterVolume || this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }

  public playGameOver() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.6);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.masterVolume || this.ctx.destination);

    osc.start();
    osc.stop(now + 0.65);
  }

  public playCollision() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.setValueAtTime(90, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterVolume || this.ctx.destination);

    osc.start();
    osc.stop(now + 0.15);
  }

  public startMusic() {
    this.init();
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;

    // We generate a retro-game synth sequence loop
    const tempInterval = setInterval(() => {
      if (this.isMuted || !this.ctx || !this.isPlayingMusic) return;
      this.resumeContext();

      // Simple 8-step epic neon-wave bass pattern
      const notes = [110.00, 110.00, 130.81, 110.00, 146.83, 146.83, 164.81, 130.81]; // A, A, C, A, D, D, E, C
      const baseNote = notes[this.synthStep % notes.length];
      
      const now = this.ctx.currentTime;

      // Play bass note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = baseNote / 2; // Low pitch (one octave down)
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      // Low pass filter to make it warmer/cyberpunk
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume || this.ctx.destination);

      osc.start();
      osc.stop(now + 0.28);

      // Occasionally trigger a high glowing synth beep
      if (this.synthStep % 4 === 1 || this.synthStep % 8 === 7) {
        const melodNotes = [440, 523.25, 587.33, 659.25, 783.99];
        const highMelod = melodNotes[(this.synthStep * 3) % melodNotes.length];
        
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(highMelod, now);
        
        mGain.gain.setValueAtTime(0.015, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        mOsc.connect(mGain);
        mGain.connect(this.masterVolume || this.ctx.destination);
        mOsc.start();
        mOsc.stop(now + 0.38);
      }

      this.synthStep++;
    }, 180); // 133 BPM approx

    this.synthInterval = tempInterval;
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  private resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audio = new AudioManager();
