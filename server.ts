import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  type SurveySubmissionRecord,
  validateSurveyPayload,
} from './src/data/surveySchema.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'research-store.json');

interface AdminCredentialRecord {
  salt: string;
  hash: string;
  claimedAt: string;
}

interface ResearchStore {
  adminCredential: AdminCredentialRecord | null;
  responses: SurveySubmissionRecord[];
}

const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

let writeChain: Promise<void> = Promise.resolve();

function ensureStoreExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: ResearchStore = {
      adminCredential: null,
      responses: [],
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf8');
  }
}

function readStore(): ResearchStore {
  ensureStoreExists();
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Partial<ResearchStore>;
  return {
    adminCredential: parsed.adminCredential ?? null,
    responses: Array.isArray(parsed.responses) ? parsed.responses : [],
  };
}

function mutateStore<T>(updater: (store: ResearchStore) => T): Promise<T> {
  const run = writeChain.then(() => {
    const store = readStore();
    const result = updater(store);
    const tmpPath = `${STORE_PATH}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tmpPath, STORE_PATH);
    return result;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function getEnvAdminPasscode(): string {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

function hashPasswordScrypt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64).toString('hex');
}

function safeEqualStrings(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function verifyAdminPassword(password: string, store: ResearchStore): boolean {
  const envPass = getEnvAdminPasscode();
  if (envPass.length > 0) {
    return safeEqualStrings(password, envPass);
  }
  if (!store.adminCredential) {
    return false;
  }
  const derivedHex = hashPasswordScrypt(password, store.adminCredential.salt);
  const derivedBuf = Buffer.from(derivedHex, 'hex');
  const storedBuf = Buffer.from(store.adminCredential.hash, 'hex');
  if (derivedBuf.length !== storedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(derivedBuf, storedBuf);
}

function issueAdminToken(): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    role: 'admin',
    iat: nowSec,
    exp: nowSec + 12 * 60 * 60,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sigB64}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    const nowSec = Math.floor(Date.now() / 1000);
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > nowSec;
  } catch {
    return false;
  }
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Administrator authentication required.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Invalid or expired administrator session.' });
    return;
  }
  next();
}

function escapeCsvCell(value: string | null | undefined): string {
  const raw = value ?? '';
  const neutralized = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  const escaped = neutralized.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildCsvExport(responses: SurveySubmissionRecord[]): string {
  const headers = [
    'Response ID',
    'Submitted At',
    'Q1 Age Group',
    'Q2 Gender',
    'Q3 District',
    'Q4 Area Type',
    'Q5 Educational / Employment Status',
    'Q6 Preferred Career Field',
    'Q7 Subquestion ID',
    'Q7 Knowledge Answer',
    'Q8 Qualification & Skill Awareness',
    'Q9 Non-Traditional Career Familiarity',
    'Q10 Main Career Choice Influence',
    'Q11 School Career Familiarity',
    'Q12 Career Information Source',
    'Q13 School Discussion Frequency',
    'Q14 Personalised Guidance Received',
    'Q15 Missed Opportunity Due to Info Gap',
    'Q16 Biggest Career Challenge',
    'Q17 Family Influence Level',
    'Q18 Helpful Support Type',
    'Q19 Useful Platform Feature',
    'Q20 Willingness to Use Platform',
  ];

  const rows = responses.map((r) => [
    r.id,
    r.submittedAt,
    r.q1,
    r.q2,
    r.q3,
    r.q4,
    r.q5,
    r.q6,
    r.q7SubId ?? 'N/A',
    r.q7 ?? 'Not Applicable (Other)',
    r.q8,
    r.q9,
    r.q10,
    r.q11,
    r.q12,
    r.q13,
    r.q14,
    r.q15,
    r.q16,
    r.q17,
    r.q18,
    r.q19,
    r.q20,
  ]);

  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(',')
  );
  return `\uFEFF${lines.join('\r\n')}`;
}

async function startServer() {
  ensureStoreExists();
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // Public anonymous survey submission endpoint (write-only for public respondents)
  app.post('/api/responses', async (req: Request, res: Response) => {
    const validated = validateSurveyPayload(req.body);
    if (!validated.valid) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const record: SurveySubmissionRecord = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      ...validated.data,
    };

    try {
      await mutateStore((store) => {
        store.responses.push(record);
      });
      res.status(201).json({
        success: true,
        id: record.id,
        submittedAt: record.submittedAt,
      });
    } catch {
      res.status(500).json({ error: 'Unable to save survey response.' });
    }
  });

  // Admin auth status (never returns credentials or response counts publicly)
  app.get('/api/admin/auth-status', (_req: Request, res: Response) => {
    const envPass = getEnvAdminPasscode();
    if (envPass.length > 0) {
      res.json({ configured: true, needsBootstrap: false, source: 'env' });
      return;
    }
    const store = readStore();
    const hasClaimed = Boolean(store.adminCredential);
    res.json({
      configured: hasClaimed,
      needsBootstrap: !hasClaimed,
      source: hasClaimed ? 'claimed' : 'none',
    });
  });

  // One-time first-run admin passcode claim (locked once claimed or when env var is set)
  app.post('/api/admin/bootstrap', async (req: Request, res: Response) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 8 || passcode.length > 128) {
      res.status(400).json({ error: 'Admin passcode must be between 8 and 128 characters.' });
      return;
    }

    if (getEnvAdminPasscode().length > 0) {
      res.status(409).json({ error: 'Admin passcode is already configured via environment secrets.' });
      return;
    }

    try {
      const outcome = await mutateStore((store) => {
        if (store.adminCredential) {
          return 'already_claimed' as const;
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPasswordScrypt(passcode, salt);
        store.adminCredential = {
          salt,
          hash,
          claimedAt: new Date().toISOString(),
        };
        return 'claimed' as const;
      });

      if (outcome === 'already_claimed') {
        res.status(409).json({ error: 'Admin passcode has already been claimed.' });
        return;
      }

      const token = issueAdminToken();
      res.status(201).json({ token });
    } catch {
      res.status(500).json({ error: 'Failed to save administrator passcode.' });
    }
  });

  // Admin login
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (!passcode) {
      res.status(400).json({ error: 'Passcode is required.' });
      return;
    }

    const store = readStore();
    if (!getEnvAdminPasscode() && !store.adminCredential) {
      res.status(409).json({ error: 'Administrator passcode is not configured yet.' });
      return;
    }

    if (!verifyAdminPassword(passcode, store)) {
      res.status(401).json({ error: 'Invalid administrator passcode.' });
      return;
    }

    const token = issueAdminToken();
    res.json({ token });
  });

  // Admin session check
  app.get('/api/admin/session', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ authenticated: true });
  });

  // Protected research responses endpoint
  app.get('/api/admin/responses', requireAdminAuth, (_req: Request, res: Response) => {
    const store = readStore();
    const sorted = [...store.responses].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    res.json({
      responses: sorted,
      total: sorted.length,
    });
  });

  // Protected CSV export endpoint
  app.get('/api/admin/export.csv', requireAdminAuth, (_req: Request, res: Response) => {
    const store = readStore();
    const sorted = [...store.responses].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );
    const csv = buildCsvExport(sorted);
    const dateStamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="find-your-path-responses-${dateStamp}.csv"`
    );
    res.send(csv);
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Find Your Path server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
