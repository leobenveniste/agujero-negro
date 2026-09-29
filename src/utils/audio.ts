// Procedural Web Audio API Cosmic Drone Synthesizer

class CosmicAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch {
      console.warn('Web Audio API not supported on this device');
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;

    try {
      const now = this.ctx.currentTime;

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.18, now + 3);
      this.masterGain.connect(this.ctx.destination);

      // Low pass filter
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(110, now);
      this.filter.Q.setValueAtTime(3.5, now);
      this.filter.connect(this.masterGain);

      // Low sub bass (fundamental cosmic tone 45 Hz - close to gravitational wave chirp)
      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'sine';
      this.oscSub.frequency.setValueAtTime(43.65, now); // F1 note

      // Detuned harmonic 1 (55 Hz - A1 note)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.setValueAtTime(55, now);

      // Detuned harmonic 2 (65.4 Hz - C2 note)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(65.4, now);

      // LFO for slow breathing filter sweep (emulating space resonance)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.setValueAtTime(0.08, now); // 12.5 second breath period
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(35, now);
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.filter.frequency);

      // Connect oscillators
      const oscGain1 = this.ctx.createGain();
      oscGain1.gain.setValueAtTime(0.3, now);
      this.osc1.connect(oscGain1);
      oscGain1.connect(this.filter);

      const oscGain2 = this.ctx.createGain();
      oscGain2.gain.setValueAtTime(0.25, now);
      this.osc2.connect(oscGain2);
      oscGain2.connect(this.filter);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.7, now);
      this.oscSub.connect(subGain);
      subGain.connect(this.filter);

      // Start oscillators
      this.oscSub.start(now);
      this.osc1.start(now);
      this.osc2.start(now);
      this.lfo.start(now);

      this.isPlaying = true;
    } catch (err) {
      console.error('Failed to start cosmic audio:', err);
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      setTimeout(() => {
        try {
          this.oscSub?.stop();
          this.osc1?.stop();
          this.osc2?.stop();
          this.lfo?.stop();
          this.oscSub?.disconnect();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.lfo?.disconnect();
          this.masterGain?.disconnect();
        } catch {
          // ignore cleanup errors
        }
        this.isPlaying = false;
      }, 1300);
    } catch {
      this.isPlaying = false;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const cosmicAudio = new CosmicAudioEngine();
