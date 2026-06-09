/*
 * generate-ad-music.js
 *
 * Procedurally synthesizes an ORIGINAL, royalty-free 30-second background music
 * track for a SaaS product ad and writes it as a 16-bit PCM stereo WAV file.
 *
 * 100% DSP-generated. No samples, no downloads, no external assets, no npm deps.
 * Pure Node `fs` only. RIFF/WAVE header written manually via Buffer math.
 *
 * Musical design:
 *   - 44100 Hz, 16-bit, stereo, exactly 30.000 s
 *   - 120 BPM (0.5 s/beat, 2.0 s/bar), key of A minor
 *   - 4-chord loop: Am - F - C - G  (2 s per chord, repeating)
 *   - Layers: warm pad (triads), plucky arp lead, sub bass, soft kick + hats
 *   - Energy arc: intro (pad+sub) -> arp in -> hats lift -> full -> resolve/fade
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 2;
const DURATION_SEC = 30.0;
const TOTAL_SAMPLES = Math.round(SAMPLE_RATE * DURATION_SEC); // 1,323,000
const BPM = 120;
const SEC_PER_BEAT = 60 / BPM; // 0.5
const SEC_PER_BAR = SEC_PER_BEAT * 4; // 2.0
const TWO_PI = Math.PI * 2;

// Output buffers (float, mixed then converted to PCM at the end).
const left = new Float64Array(TOTAL_SAMPLES);
const right = new Float64Array(TOTAL_SAMPLES);

// ---------------------------------------------------------------------------
// Music theory helpers
// ---------------------------------------------------------------------------
// Equal-temperament frequency from a MIDI note number (A4 = 69 = 440 Hz).
function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

// Note-name -> MIDI helper for readability.
const NOTE_OFFSET = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function note(name) {
  // e.g. "A3", "C4", "F#4"
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error('Bad note: ' + name);
  let semis = NOTE_OFFSET[m[1]];
  if (m[2] === '#') semis += 1;
  if (m[2] === 'b') semis -= 1;
  const octave = parseInt(m[3], 10);
  return 12 * (octave + 1) + semis; // MIDI: C-1 = 0
}

// Chord progression. Each chord: root (for bass) + triad notes (for pad).
// Am  = A C E
// F   = F A C
// C   = C E G
// G   = G B D
const PROGRESSION = [
  {
    name: 'Am',
    root: note('A2'),
    triad: [note('A3'), note('C4'), note('E4')],
    arpNotes: [note('A4'), note('C5'), note('E5'), note('C5')],
  },
  {
    name: 'F',
    root: note('F2'),
    triad: [note('F3'), note('A3'), note('C4')],
    arpNotes: [note('F4'), note('A4'), note('C5'), note('A4')],
  },
  {
    name: 'C',
    root: note('C3'),
    triad: [note('C4'), note('E4'), note('G4')],
    arpNotes: [note('C5'), note('E5'), note('G5'), note('E5')],
  },
  {
    name: 'G',
    root: note('G2'),
    triad: [note('G3'), note('B3'), note('D4')],
    arpNotes: [note('G4'), note('B4'), note('D5'), note('B4')],
  },
];

// 15 bars of chords (0..29.x s). Bar 16 (28-30s) is a resolving Am that rings.
// We loop the 4-chord progression across the 30s timeline.
const NUM_BARS = Math.floor(DURATION_SEC / SEC_PER_BAR); // 15

// ---------------------------------------------------------------------------
// Oscillators
// ---------------------------------------------------------------------------
function sine(phase) {
  return Math.sin(phase);
}
function triangle(phase) {
  // phase in radians; map to [0,1)
  const t = (phase / TWO_PI) % 1;
  const x = t < 0 ? t + 1 : t;
  // triangle in [-1,1]
  return 4 * Math.abs(x - 0.5) - 1;
}
// Polyblep-ish soft saw (band-limited-ish via mild smoothing) — keep it gentle.
function softSaw(phase) {
  const t = (phase / TWO_PI) % 1;
  const x = (t < 0 ? t + 1 : t);
  const saw = 2 * x - 1;
  // soften the discontinuity a touch
  return saw - 0.18 * Math.sin(phase); // slight harmonic taming
}

// ---------------------------------------------------------------------------
// Envelope (ADSR) — returns gain at a given time since note-on.
// All times in seconds. Includes release tail starting at noteDur.
// ---------------------------------------------------------------------------
function adsr(t, noteDur, a, d, s, r) {
  if (t < 0) return 0;
  if (t < a) {
    // attack 0 -> 1 (linear, smooth enough with small a)
    return t / a;
  }
  if (t < a + d) {
    // decay 1 -> s
    const x = (t - a) / d;
    return 1 + (s - 1) * x;
  }
  if (t < noteDur) {
    // sustain
    return s;
  }
  // release s -> 0
  const rt = t - noteDur;
  if (rt < r) {
    return s * (1 - rt / r);
  }
  return 0;
}

// Exponential pluck envelope (fast attack, exponential decay) for arp.
function pluckEnv(t, attack, decayTau, dur) {
  if (t < 0) return 0;
  let amp;
  if (t < attack) {
    amp = t / attack;
  } else {
    amp = Math.exp(-(t - attack) / decayTau);
  }
  // gentle tail cutoff to avoid lingering past note slot
  if (t > dur) {
    const fade = Math.max(0, 1 - (t - dur) / 0.03);
    amp *= fade;
  }
  return amp;
}

// ---------------------------------------------------------------------------
// Mixing helper: add a mono sample to stereo with constant-power pan.
// pan in [-1 (L) .. +1 (R)]
// ---------------------------------------------------------------------------
function addPanned(i, value, pan) {
  if (i < 0 || i >= TOTAL_SAMPLES) return;
  const angle = (pan + 1) * 0.25 * Math.PI; // 0..pi/2
  const gl = Math.cos(angle);
  const gr = Math.sin(angle);
  left[i] += value * gl;
  right[i] += value * gr;
}

// ---------------------------------------------------------------------------
// Layer level automation (energy arc). Returns 0..1 multiplier per layer at a
// given time. This drives the arrangement.
// ---------------------------------------------------------------------------
function smoothstep(edge0, edge1, x) {
  if (edge1 === edge0) return x < edge0 ? 0 : 1;
  let t = (x - edge0) / (edge1 - edge0);
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

// Pad: present from start, soft, swells slightly into full section.
function padLevel(tSec) {
  const intro = 0.55 + 0.25 * smoothstep(0, 2.0, tSec); // soft fade in of presence
  const full = 0.85 + 0.15 * smoothstep(18, 22, tSec);
  return Math.min(intro, 1) * (full / 1.0);
}
// Sub bass: present from start.
function subLevel(tSec) {
  return 0.85 + 0.15 * smoothstep(18, 22, tSec);
}
// Arp: enters at ~4.5s, brighter/louder at the lift (~12s) and full (~20s).
function arpLevel(tSec) {
  const enter = smoothstep(4.0, 5.0, tSec);
  const lift = 0.7 + 0.3 * smoothstep(11.5, 13, tSec);
  const full = 0.85 + 0.15 * smoothstep(19, 21, tSec);
  return enter * lift * full;
}
// Kick: enters with a soft pulse around the arp, fuller at 20s.
function kickLevel(tSec) {
  const enter = smoothstep(7.5, 8.5, tSec);
  const full = 0.7 + 0.3 * smoothstep(19, 21, tSec);
  return enter * full;
}
// Hats: lift section onward (~12s), full at 20s, taste-controlled.
function hatLevel(tSec) {
  const enter = smoothstep(11.5, 13, tSec);
  const full = 0.7 + 0.3 * smoothstep(19, 21, tSec);
  return enter * full;
}

// ---------------------------------------------------------------------------
// SYNTHESIS
// ---------------------------------------------------------------------------

// Per-voice base gains (pre-arc, pre-master). Tuned for headroom: pad quiet,
// arp medium, kick controlled, sub solid but not boomy.
const G_PAD = 0.085;  // per pad voice (3 triad notes x ~2 detune osc)
const G_SUB = 0.32;
const G_ARP = 0.20;
const G_KICK = 0.55;
const G_HAT = 0.06;

// ---- 1) WARM PAD (detuned sine/triangle per triad tone, slow attack) -------
// One pad note per bar covering the chord triad. Slight detune for width and
// alternating pan per voice for stereo spread.
(function renderPad() {
  for (let bar = 0; bar < NUM_BARS; bar++) {
    const chord = PROGRESSION[bar % PROGRESSION.length];
    const barStart = bar * SEC_PER_BAR;
    const noteDur = SEC_PER_BAR; // sustain across the bar
    // Slow attack pad; long release into next bar for smooth legato.
    const A = 0.35, D = 0.4, S = 0.8, R = 0.6;
    const startSample = Math.floor(barStart * SAMPLE_RATE);
    const endSample = Math.min(
      TOTAL_SAMPLES,
      Math.floor((barStart + noteDur + R) * SAMPLE_RATE)
    );
    chord.triad.forEach((midi, vi) => {
      const f = midiToFreq(midi);
      // Detune cents for width: -7, 0, +7-ish across voices
      const detunes = [-6, 6]; // two detuned layers per tone
      const pan = vi === 0 ? -0.35 : vi === 1 ? 0.0 : 0.35;
      for (let i = startSample; i < endSample; i++) {
        const tSec = i / SAMPLE_RATE;
        const tRel = tSec - barStart;
        const env = adsr(tRel, noteDur, A, D, S, R);
        if (env <= 0) continue;
        const arc = padLevel(tSec);
        let s = 0;
        for (let di = 0; di < detunes.length; di++) {
          const cents = detunes[di];
          const ff = f * Math.pow(2, cents / 1200);
          const ph = TWO_PI * ff * tSec;
          // mix sine + triangle for warmth
          s += 0.6 * sine(ph) + 0.4 * triangle(ph);
        }
        s /= detunes.length;
        const val = s * env * G_PAD * arc;
        addPanned(i, val, pan);
      }
    });
  }
})();

// ---- 3) SUB / BASS sine on chord root, one note per bar ---------------------
(function renderSub() {
  for (let bar = 0; bar < NUM_BARS; bar++) {
    const chord = PROGRESSION[bar % PROGRESSION.length];
    const barStart = bar * SEC_PER_BAR;
    const noteDur = SEC_PER_BAR * 0.92;
    const A = 0.02, D = 0.1, S = 0.85, R = 0.12;
    const f = midiToFreq(chord.root);
    const startSample = Math.floor(barStart * SAMPLE_RATE);
    const endSample = Math.min(
      TOTAL_SAMPLES,
      Math.floor((barStart + noteDur + R) * SAMPLE_RATE)
    );
    for (let i = startSample; i < endSample; i++) {
      const tSec = i / SAMPLE_RATE;
      const tRel = tSec - barStart;
      const env = adsr(tRel, noteDur, A, D, S, R);
      if (env <= 0) continue;
      const arc = subLevel(tSec);
      const ph = TWO_PI * f * tSec;
      // pure sine sub + tiny 2nd harmonic for audibility on small speakers
      const s = sine(ph) + 0.12 * sine(2 * ph);
      const val = s * env * G_SUB * arc;
      // centered
      left[i] += val;
      right[i] += val;
    }
  }
})();

// ---- 2) PLUCKY ARP LEAD (16th-ish via 8th notes, exp decay) ----------------
// Render to a dedicated mono buffer first so we can add a light feedback delay.
const arpBuf = new Float64Array(TOTAL_SAMPLES);
const arpPan = new Float64Array(TOTAL_SAMPLES); // store pan per sample is heavy;
// instead we pan at delay-mix time using a per-note pan. Simpler: pan each note
// as we write into stereo-ish via two buffers.
const arpBufL = new Float64Array(TOTAL_SAMPLES);
const arpBufR = new Float64Array(TOTAL_SAMPLES);

(function renderArp() {
  // 8th notes => 8 per bar (0.25 s each). We outline each chord with a 4-note
  // pattern played twice per bar (up-ish motion) for energy.
  const stepDur = SEC_PER_BEAT / 2; // 0.25 s (8th note)
  const stepsPerBar = Math.round(SEC_PER_BAR / stepDur); // 8
  for (let bar = 0; bar < NUM_BARS; bar++) {
    const chord = PROGRESSION[bar % PROGRESSION.length];
    const barStart = bar * SEC_PER_BAR;
    for (let st = 0; st < stepsPerBar; st++) {
      const midi = chord.arpNotes[st % chord.arpNotes.length];
      const f = midiToFreq(midi);
      const noteStart = barStart + st * stepDur;
      if (noteStart >= DURATION_SEC) break;
      const attack = 0.005;
      const decayTau = 0.12; // exponential decay time constant
      const dur = stepDur * 0.95;
      // Alternate pan slightly L/R per step for movement.
      const pan = (st % 2 === 0) ? -0.25 : 0.25;
      const angle = (pan + 1) * 0.25 * Math.PI;
      const gl = Math.cos(angle);
      const gr = Math.sin(angle);
      const sStart = Math.floor(noteStart * SAMPLE_RATE);
      const sEnd = Math.min(
        TOTAL_SAMPLES,
        Math.floor((noteStart + dur + 0.05) * SAMPLE_RATE)
      );
      for (let i = sStart; i < sEnd; i++) {
        const tSec = i / SAMPLE_RATE;
        const tRel = tSec - noteStart;
        const env = pluckEnv(tRel, attack, decayTau, dur);
        if (env <= 0) continue;
        const ph = TWO_PI * f * tSec;
        // soft saw + triangle blend for a bright but smooth pluck
        const s = 0.55 * softSaw(ph) + 0.45 * triangle(ph);
        const val = s * env * G_ARP;
        arpBufL[i] += val * gl;
        arpBufR[i] += val * gr;
      }
    }
  }
})();

// Light feedback delay on the arp (ping-pong-ish), cheap and tasteful.
(function applyArpDelay() {
  const delaySec = SEC_PER_BEAT * 0.75; // dotted-8th-ish = 0.375 s
  const delaySamp = Math.round(delaySec * SAMPLE_RATE);
  const feedback = 0.33;
  const wet = 0.28;
  // Process L using R's delayed signal and vice versa for subtle ping-pong.
  const dlL = new Float64Array(TOTAL_SAMPLES);
  const dlR = new Float64Array(TOTAL_SAMPLES);
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const di = i - delaySamp;
    const fbL = di >= 0 ? dlR[di] : 0; // cross-feed
    const fbR = di >= 0 ? dlL[di] : 0;
    dlL[i] = arpBufL[i] + feedback * fbL;
    dlR[i] = arpBufR[i] + feedback * fbR;
  }
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const tSec = i / SAMPLE_RATE;
    const arc = arpLevel(tSec);
    arpBufL[i] = (arpBufL[i] + wet * (dlL[i] - arpBufL[i])) * arc;
    arpBufR[i] = (arpBufR[i] + wet * (dlR[i] - arpBufR[i])) * arc;
  }
  // Fold the arp buffers into the master.
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    left[i] += arpBufL[i];
    right[i] += arpBufR[i];
  }
})();

// ---- 4a) SOFT KICK: pitched sine drop ~120 -> 50 Hz, fast decay, on beats ---
(function renderKick() {
  const totalBeats = Math.floor(DURATION_SEC / SEC_PER_BEAT); // 60
  for (let b = 0; b < totalBeats; b++) {
    const tStart = b * SEC_PER_BEAT;
    if (tStart >= DURATION_SEC) break;
    const dur = 0.28;
    const sStart = Math.floor(tStart * SAMPLE_RATE);
    const sEnd = Math.min(TOTAL_SAMPLES, Math.floor((tStart + dur) * SAMPLE_RATE));
    let phase = 0;
    for (let i = sStart; i < sEnd; i++) {
      const tSec = i / SAMPLE_RATE;
      const tRel = tSec - tStart;
      const arc = kickLevel(tSec);
      if (arc <= 0) continue;
      // pitch envelope 120 -> 50 Hz exponentially over ~60ms
      const fInst = 50 + (120 - 50) * Math.exp(-tRel / 0.03);
      phase += TWO_PI * fInst / SAMPLE_RATE;
      // amplitude envelope: fast attack, exp decay
      const amp = (tRel < 0.004 ? tRel / 0.004 : Math.exp(-(tRel - 0.004) / 0.08));
      const s = Math.sin(phase);
      const val = s * amp * G_KICK * arc;
      left[i] += val;
      right[i] += val;
    }
  }
})();

// ---- 4b) SOFT HAT: short filtered noise burst on offbeats ('and' of beats) --
(function renderHats() {
  const totalBeats = Math.floor(DURATION_SEC / SEC_PER_BEAT);
  // offbeats = beat + 0.5 beat
  let noisePrev = 0;
  for (let b = 0; b < totalBeats; b++) {
    const tStart = b * SEC_PER_BEAT + SEC_PER_BEAT * 0.5;
    if (tStart >= DURATION_SEC) break;
    const dur = 0.05;
    const sStart = Math.floor(tStart * SAMPLE_RATE);
    const sEnd = Math.min(TOTAL_SAMPLES, Math.floor((tStart + dur) * SAMPLE_RATE));
    // tiny deterministic-ish noise via simple LCG so output is reproducible
    let seed = (b * 2654435761) >>> 0;
    const rnd = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return (seed / 0xffffffff) * 2 - 1;
    };
    noisePrev = 0;
    for (let i = sStart; i < sEnd; i++) {
      const tSec = i / SAMPLE_RATE;
      const tRel = tSec - tStart;
      const arc = hatLevel(tSec);
      if (arc <= 0) continue;
      const white = rnd();
      // high-pass-ish: differentiate to brighten (remove low rumble)
      const hp = white - noisePrev;
      noisePrev = white;
      // short exp decay
      const amp = Math.exp(-tRel / 0.012);
      const val = hp * amp * G_HAT * arc;
      // slight stereo: hats panned subtly opposite to arp emphasis
      left[i] += val * 0.95;
      right[i] += val * 1.0;
    }
  }
})();

// ---- Final resolving chord (28-30s): a soft Am triad pad that rings/fades ----
(function renderResolve() {
  const chord = PROGRESSION[0]; // Am
  const tStart = 28.0;
  const A = 0.08, D = 0.3, S = 0.85, R = 1.6;
  const noteDur = 1.0;
  const startSample = Math.floor(tStart * SAMPLE_RATE);
  chord.triad.forEach((midi, vi) => {
    const f = midiToFreq(midi);
    const pan = vi === 0 ? -0.3 : vi === 1 ? 0.0 : 0.3;
    for (let i = startSample; i < TOTAL_SAMPLES; i++) {
      const tSec = i / SAMPLE_RATE;
      const tRel = tSec - tStart;
      const env = adsr(tRel, noteDur, A, D, S, R);
      if (env <= 0) continue;
      const ph = TWO_PI * f * tSec;
      const s = 0.6 * sine(ph) + 0.4 * triangle(ph);
      const val = s * env * G_PAD * 1.4;
      addPanned(i, val, pan);
    }
  });
})();

// ---------------------------------------------------------------------------
// MASTER BUS: fades, soft-clip (tanh) limiting, normalize to ~ -1 dBFS.
// ---------------------------------------------------------------------------
(function master() {
  // 0.3 s fade-in, ~2 s fade-out.
  const fadeInSamp = Math.floor(0.3 * SAMPLE_RATE);
  const fadeOutSamp = Math.floor(2.0 * SAMPLE_RATE);
  const fadeOutStart = TOTAL_SAMPLES - fadeOutSamp;

  // Drive for gentle tanh saturation — keeps things glued without harsh clip.
  const drive = 1.15;

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    let l = left[i] * drive;
    let r = right[i] * drive;
    // soft clip
    l = Math.tanh(l);
    r = Math.tanh(r);
    // fades
    let g = 1;
    if (i < fadeInSamp) {
      g = i / fadeInSamp;
    } else if (i >= fadeOutStart) {
      const x = (i - fadeOutStart) / fadeOutSamp;
      // smooth cosine fade-out
      g = 0.5 * (1 + Math.cos(Math.PI * x));
    }
    left[i] = l * g;
    right[i] = r * g;
  }

  // Find peak and normalize to -1 dBFS (~0.891).
  let peak = 0;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const a = Math.abs(left[i]);
    const b = Math.abs(right[i]);
    if (a > peak) peak = a;
    if (b > peak) peak = b;
  }
  const target = 0.891; // -1 dBFS
  const norm = peak > 0 ? target / peak : 1;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    left[i] *= norm;
    right[i] *= norm;
  }
  console.log(
    `[master] pre-norm peak=${peak.toFixed(4)} norm gain=${norm.toFixed(4)} -> target ${target}`
  );
})();

// ---------------------------------------------------------------------------
// WAV ENCODE — manual RIFF/WAVE header + interleaved 16-bit PCM data.
// ---------------------------------------------------------------------------
function encodeWav() {
  const bytesPerSample = BITS_PER_SAMPLE / 8; // 2
  const blockAlign = CHANNELS * bytesPerSample; // 4
  const byteRate = SAMPLE_RATE * blockAlign; // 176400
  const dataSize = TOTAL_SAMPLES * blockAlign; // samples * 4
  const headerSize = 44;
  const buf = Buffer.alloc(headerSize + dataSize);

  // RIFF chunk descriptor
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataSize, 4); // ChunkSize = 4 + (8+16) + (8+dataSize)
  buf.write('WAVE', 8, 'ascii');

  // fmt subchunk
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  buf.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  buf.writeUInt16LE(CHANNELS, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(BITS_PER_SAMPLE, 34);

  // data subchunk
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataSize, 40);

  // PCM samples (interleaved L,R)
  let off = 44;
  const MAX = 32767;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    let l = left[i];
    let r = right[i];
    // hard safety clamp (should already be < 1 after normalize)
    if (l > 1) l = 1; else if (l < -1) l = -1;
    if (r > 1) r = 1; else if (r < -1) r = -1;
    buf.writeInt16LE(Math.round(l * MAX), off);
    buf.writeInt16LE(Math.round(r * MAX), off + 2);
    off += 4;
  }
  return buf;
}

const outPath = 'C:/Users/owen/downloads/projects/flux/public/audio/flux-ad-theme.wav';
const outDir = path.dirname(outPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const wav = encodeWav();
fs.writeFileSync(outPath, wav);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const stat = fs.statSync(outPath);
const sizeMB = stat.size / (1024 * 1024);
const durFromData =
  (wav.readUInt32LE(40) / (CHANNELS * (BITS_PER_SAMPLE / 8))) / SAMPLE_RATE;

console.log('-----------------------------------------------------------');
console.log('WAV written successfully.');
console.log('Path           :', outPath);
console.log('File size      :', stat.size, 'bytes  (' + sizeMB.toFixed(3) + ' MB)');
console.log('RIFF tag       :', wav.toString('ascii', 0, 4));
console.log('WAVE tag       :', wav.toString('ascii', 8, 12));
console.log('AudioFormat    :', wav.readUInt16LE(20), '(1 = PCM)');
console.log('Channels       :', wav.readUInt16LE(22));
console.log('Sample rate    :', wav.readUInt32LE(24), 'Hz');
console.log('Byte rate      :', wav.readUInt32LE(28));
console.log('Block align    :', wav.readUInt16LE(32));
console.log('Bits/sample    :', wav.readUInt16LE(34));
console.log('Data bytes     :', wav.readUInt32LE(40));
console.log('Total samples  :', TOTAL_SAMPLES, 'per channel');
console.log('Duration       :', durFromData.toFixed(3), 's');
console.log('-----------------------------------------------------------');
