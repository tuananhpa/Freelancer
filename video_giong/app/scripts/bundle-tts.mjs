// Build tts/offline: a private Python + VieNeu (ONNX on CPU, no torch) + model files, so the packaged
// app speaks offline on a machine with nothing installed. Needs Python 3.12 + internet on THIS machine.
// Run: npm run bundle:tts   (then npm run dist ships it as resources/tts-runtime)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tts', 'offline');
const PY = process.env.PYTHON || 'python';
// versions tested with tts/vieneu_worker.py. Left out on purpose: gradio (vieneu's web UI) and librosa
// (optional, vieneu falls back to soundfile + soxr; it would drag in scipy/numba/sklearn, ~600 MB)
const DEPS = ['huggingface_hub==1.33.0', 'kaldi-native-fbank==1.23.0', 'numpy==2.5.4', 'onnxruntime==1.20.1',
  'PyYAML==6.0.2', 'sea-g2p==0.10.0', 'soundfile==0.13.1', 'soxr==0.5.0.post1', 'tokenizers==0.22.1'];
const run = (cmd, args, env) => execFileSync(cmd, args, { stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8', ...env } });

const [base, ver] = execFileSync(PY, ['-c', 'import sys;print(sys.base_prefix);print(f"{sys.version_info[0]}{sys.version_info[1]}")']).toString().trim().split(/\r?\n/);
if (ver !== '312') throw new Error(`Cần Python 3.12 (đang là ${ver}); đặt biến PYTHON trỏ tới python 3.12`);
const HF = path.join(OUT, 'hf'), HF_KEEP = path.join(ROOT, 'tts', 'hf-keep');
if (fs.existsSync(HF)) fs.renameSync(HF, HF_KEEP); // rebuilds reuse the downloaded model
fs.rmSync(OUT, { recursive: true, force: true });
const pyDir = path.join(OUT, 'python');
fs.mkdirSync(pyDir, { recursive: true });

console.log('1/4 Chép Python từ', base);
for (const f of fs.readdirSync(base)) if (/\.(exe|dll)$|^LICENSE/i.test(f)) fs.copyFileSync(path.join(base, f), path.join(pyDir, f));
fs.cpSync(path.join(base, 'DLLs'), path.join(pyDir, 'DLLs'), { recursive: true });
const SKIP = new Set(['site-packages', 'test', 'idlelib', 'tkinter', 'turtledemo', 'ensurepip', '__pycache__']);
fs.cpSync(path.join(base, 'Lib'), path.join(pyDir, 'Lib'), { recursive: true, filter: src => !SKIP.has(path.basename(src)) });
// ._pth = isolated: ignores PYTHONPATH; no "import site" line, or the user's own site-packages (torch...) leak in
fs.writeFileSync(path.join(pyDir, `python${ver}._pth`), 'Lib\nDLLs\n..\\site-packages\n');

console.log('2/4 Cài thư viện VieNeu');
const sp = path.join(OUT, 'site-packages');
const pip = ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-warn-script-location', '--target', sp];
run(PY, [...pip, ...DEPS]);
run(PY, [...pip, '--no-deps', 'vieneu==3.8.3']);
// onnxruntime lists sympy for its graph tools only; inference never imports it (~200 MB)
for (const f of fs.readdirSync(sp)) if (/^(sympy|mpmath|isympy)/i.test(f)) fs.rmSync(path.join(sp, f), { recursive: true, force: true });
if (fs.existsSync(HF_KEEP)) fs.renameSync(HF_KEEP, HF);

const py = path.join(pyDir, 'python.exe');
const hf = { HF_HOME: HF };
const probe = path.join(OUT, 'probe.wav');
const say = `import sys;from vieneu import Vieneu;t=Vieneu(mode="v3turbo",precision="fp32");t.save(t.infer("Xin chào các đồng chí.",voice=t.get_preset_voice("Adam")),sys.argv[1])`;
console.log('3/4 Tải model (một lần) và đọc thử');
run(py, ['-c', `import sys;assert not any('site-packages' in p and 'offline' not in p for p in sys.path), sys.path;${say}`, probe], hf);
console.log('4/4 Đọc thử khi tắt mạng');
fs.rmSync(probe, { force: true });
run(py, ['-c', say, probe], { ...hf, HF_HUB_OFFLINE: '1' });
if (!fs.statSync(probe).size) throw new Error('Không tạo được âm thanh');
fs.rmSync(probe);
fs.rmSync(path.join(HF, 'xet'), { recursive: true, force: true }); // download logs
for (const d of ['python', 'site-packages', 'hf']) for (const f of fs.readdirSync(path.join(OUT, d), { recursive: true }))
  if (f.endsWith('__pycache__')) fs.rmSync(path.join(OUT, d, f), { recursive: true, force: true });
console.log('Xong:', OUT);
