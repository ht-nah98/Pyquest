// The only file that knows it runs in a worker (ADR 0002). @pyquest/runtime itself stays headless.
import { PyRunner } from '@pyquest/runtime';
import type { WorkerReply, WorkerRequest } from './protocol';

// The library's picture names, so draw_image("images/x.png", …) can check the path.
const manifests = import.meta.glob<{ assets: { id: string }[] }>(
  '@content/assets/library/manifest.json',
  {
    eager: true,
    import: 'default',
  },
);
const assetIds = Object.values(manifests).flatMap((m) => m.assets.map((a) => a.id));

const post = (reply: WorkerReply) => {
  self.postMessage(reply);
};

const ready = PyRunner.create({
  indexURL: new URL(`${import.meta.env.BASE_URL}pyodide/`, self.location.origin).href,
}).then(
  (py) => {
    py.setAssets(assetIds);
    post({ kind: 'ready' });
    return py;
  },
  (e: unknown) => {
    post({ kind: 'failed', message: e instanceof Error ? e.message : String(e) });
    throw e;
  },
);

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    const py = await ready;
    const result =
      req.kind === 'run'
        ? await py.runScript(req.files, req.main, { seed: req.seed, maxEvents: req.maxEvents })
        : req.kind === 'start'
          ? await py.startGame(req.files, req.main, { seed: req.seed })
          : req.kind === 'step'
            ? py.step(req.input)
            : py.parseBlocks(req.source);
    post({ id: req.id, ok: true, result });
  } catch (e) {
    post({ id: req.id, ok: false, message: e instanceof Error ? e.message : String(e) });
  }
};
