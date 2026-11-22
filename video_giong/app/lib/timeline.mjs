// Timeline model (CapCut-style). Times are in output seconds.
// clip = { id, track: 'voice'|'music'|'bg', src: 'assets/<id>.mp3'|'tts/<hash>.wav', name,
//          start, in, dur, srcDur, rate, volume, fadeIn, fadeOut, loop?, blockId?, auto? }
// Source position of timeline time t inside a clip = (in + t - start) * rate.
import { uid } from './docparse.mjs';

export const GAP = 0.6;   // pause between auto-placed clips
export const RAMP = 0.5;  // background duck fade
export const TAIL = 1.5;

export const clipEnd = c => c.start + c.dur;
export const programEnd = clips => clips.reduce((m, c) => (c.track === 'bg' ? m : Math.max(m, clipEnd(c))), 0);

/**
 * Bring the timeline in line with the script without throwing away manual edits.
 * voiceInfo: Map(blockId -> {src, srcDur}) for approved voice blocks that have audio
 * assetDur:  Map(assetId -> seconds)
 */
export function syncTimeline(project, voiceInfo, assetDur) {
  const blocks = new Map(project.blocks.map(b => [b.id, b]));
  let clips = (project.timeline?.clips || []).filter(c => !c.blockId || blocks.has(c.blockId));
  let cursor = programEnd(clips);
  const place = c => { c.start = cursor ? cursor + GAP : 0; cursor = clipEnd(c); clips.push(c); };

  for (const b of project.blocks) {
    const info = b.type === 'voice' ? voiceInfo.get(b.id) : b.assetId && { src: `assets/${b.assetId}.mp3`, srcDur: assetDur.get(b.assetId) };
    if (!info?.srcDur) continue;
    const rate = b.type === 'voice' ? b.rate || 1 : 1;
    const mine = clips.filter(c => c.blockId === b.id);
    if (mine.length && mine.every(c => c.src === info.src)) continue; // unchanged audio: keep user's edit
    const fresh = { id: uid('c'), track: b.type === 'voice' ? 'voice' : 'music', src: info.src, name: b.title, in: 0, srcDur: info.srcDur,
      dur: info.srcDur / rate, rate, volume: b.volume ?? 1, fadeIn: 0, fadeOut: 0, blockId: b.id };
    if (mine.length) { // audio changed (text, voice, file): replace at the same spot
      fresh.start = Math.min(...mine.map(c => c.start));
      clips = clips.filter(c => c.blockId !== b.id);
      clips.push(fresh);
    } else place(fresh);
  }

  // auto background bed: follows the project setting and program length
  clips = clips.filter(c => !(c.track === 'bg' && c.auto));
  if (project.bg?.assetId && assetDur.get(project.bg.assetId) && !clips.some(c => c.track === 'bg')) {
    clips.push({ id: uid('c'), track: 'bg', src: `assets/${project.bg.assetId}.mp3`, name: 'Nhạc nền', start: 0, in: 0,
      srcDur: assetDur.get(project.bg.assetId), dur: programEnd(clips) + TAIL, rate: 1, volume: project.bg.volume ?? 0.15,
      fadeIn: 1, fadeOut: 2, loop: true, auto: true });
  }
  return { clips: clips.sort((a, b) => a.start - b.start) };
}

const n = x => Number(x.toFixed(3));

// Background gain expression (in the clip's local time): 1, dipping to 0 under music clips.
export function duckExpr(bg, clips) {
  const parts = clips.filter(c => c.track === 'music' && c.start < clipEnd(bg) && clipEnd(c) > bg.start).map(c => {
    const a = n(c.start - bg.start), b = n(clipEnd(c) - bg.start);
    return `clip((t-${n(a - RAMP)})/${RAMP},0,1)*clip((${n(b + RAMP)}-t)/${RAMP},0,1)`;
  });
  if (!parts.length) return '1';
  return '(1-' + parts.reduce((acc, p) => (acc ? `max(${acc},${p})` : p), '') + ')';
}

/**
 * ffmpeg inputs + filter graph that mixes every clip at its timeline position.
 * resolve(src) -> absolute file path.
 */
export function buildMix(clips, resolve) {
  const use = clips.filter(c => c.dur > 0.01 && c.volume > 0);
  if (!use.length) throw new Error('Timeline chưa có clip nào để xuất');
  const inputs = [], chains = [];
  use.forEach((c, i) => {
    if (c.loop) inputs.push('-stream_loop', '-1');
    inputs.push('-i', resolve(c.src));
    const f = ['aresample=44100', 'aformat=channel_layouts=stereo'];
    if ((c.rate || 1) !== 1) f.push(`atempo=${Math.min(2, Math.max(0.5, c.rate))}`);
    f.push(`atrim=start=${n(c.in)}:duration=${n(c.dur)}`, 'asetpts=PTS-STARTPTS');
    const duck = c.track === 'bg' ? duckExpr(c, clips) : '1';
    f.push(duck === '1' ? `volume=${n(c.volume)}` : `volume='${n(c.volume)}*${duck}':eval=frame`);
    if (c.fadeIn > 0) f.push(`afade=t=in:st=0:d=${n(Math.min(c.fadeIn, c.dur))}`);
    if (c.fadeOut > 0) f.push(`afade=t=out:st=${n(Math.max(0, c.dur - c.fadeOut))}:d=${n(Math.min(c.fadeOut, c.dur))}`);
    f.push(`adelay=${Math.round(c.start * 1000)}:all=1`);
    chains.push(`[${i}:a]${f.join(',')}[c${i}]`);
  });
  const total = Math.max(...use.map(clipEnd)) + 0.5;
  const filter = chains.join(';') + ';' + use.map((_, i) => `[c${i}]`).join('') +
    `amix=inputs=${use.length}:normalize=0:dropout_transition=0,alimiter=limit=0.95:level=0,atrim=duration=${n(total)}[out]`;
  return { inputs, filter, total };
}
