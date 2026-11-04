// The only file that knows it runs in a worker (ADR 0002). @pyquest/runtime itself stays headless.
import { PyRunner } from '@pyquest/runtime';
import type { WorkerReply, WorkerRequest } from './protocol';

const post = (reply: WorkerReply) => {
  self.postMessage(reply);
};

const ready = PyRunner.create({ indexURL: `${self.location.origin}/pyodide/` }).then(
  (py) => {
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
