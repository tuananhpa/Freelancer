"""VieNeu-TTS worker (offline, free, Apache-2.0). Node starts it once and keeps it alive:
loading the model takes ~1 min, each request after that is fast.

stdin : one JSON per line  {"id": "...", "text": "...", "voice": "Adam", "out": "C:/.../x.wav"}
stdout: one JSON per line  {"ready": true, "voices": [...]} then {"id": ..., "progress": 0.4}* {"id": ..., "ok": true} / {"id": ..., "error": "..."}
Setup: pip install vieneu   (model downloads from Hugging Face on first run, then works offline)
"""
import json
import os
import re
import sys

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
sys.stdin.reconfigure(encoding="utf-8")
out = sys.stdout
sys.stdout = sys.stderr  # library logs must not corrupt the JSON channel


def send(obj):
    out.write(json.dumps(obj, ensure_ascii=False) + "\n")
    out.flush()


try:
    from vieneu import Vieneu
    tts = Vieneu(mode=os.environ.get("VIENEU_MODE", "v3turbo"), precision=os.environ.get("VIENEU_PRECISION", "fp32"))
    voices = []
    for v in tts.list_preset_voices():
        label, name = v  # ("⭐ Adam · Nam · Nam …", "Adam")
        voices.append({"name": name, "label": label})
    send({"ready": True, "voices": voices})
except Exception as e:  # noqa: BLE001 — report any load failure to Node
    send({"ready": False, "error": f"{type(e).__name__}: {e}"})
    sys.exit(1)

def groups(text, limit=500):
    """Split long text at sentence / line ends into pieces <= limit chars (so we can report progress)."""
    out, cur = [], ""
    for s in re.split(r"(?<=[.!?…;:])\s+|\n+", text):
        s = s.strip()
        if not s:
            continue
        if cur and len(cur) + len(s) + 1 > limit:
            out.append(cur)
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    if cur:
        out.append(cur)
    return out or [text]


for line in sys.stdin:
    if not line.strip():
        continue
    req = {}
    try:
        req = json.loads(line)
        voice = tts.get_preset_voice(req.get("voice") or None)
        parts = groups(req["text"])
        pause = np.zeros(int(0.35 * tts.sample_rate), dtype=np.float32)
        wavs = []
        for i, part in enumerate(parts):
            if wavs:
                wavs.append(pause)
            wavs.append(np.asarray(tts.infer(part, voice=voice), dtype=np.float32))
            if len(parts) > 1:
                send({"id": req.get("id"), "progress": (i + 1) / len(parts)})
        tts.save(np.concatenate(wavs), req["out"])
        send({"id": req.get("id"), "ok": True})
    except Exception as e:  # noqa: BLE001
        send({"id": req.get("id"), "error": f"{type(e).__name__}: {e}"})
