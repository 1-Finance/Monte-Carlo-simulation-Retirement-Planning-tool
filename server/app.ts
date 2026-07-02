import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStorageAdapter } from './storage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createApp() {
  const storage = await getStorageAdapter();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // --- Saved Simulations ---

  app.post('/api/simulations', async (req, res) => {
    try {
      const { userId, profileName, chartData, yearlySummary, swrResults } = req.body;
      if (!userId || !profileName || !chartData || !yearlySummary || !swrResults) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      await storage.saveSavedSimulation(userId, profileName, { chartData, yearlySummary, swrResults });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Save simulation error:', error);
      res.status(500).json({ error: 'Failed to save simulation' });
    }
  });

  app.get('/api/simulations/:userId/:profileName', async (req, res) => {
    try {
      const { userId, profileName } = req.params;
      const result = await storage.getSavedSimulation(userId, profileName);
      res.json(result ?? { chartData: null, yearlySummary: null, swrResults: null });
    } catch (error: any) {
      console.error('Fetch simulation error:', error);
      res.status(500).json({ error: 'Failed to fetch simulation' });
    }
  });

  // --- Parameters ---

  app.get('/api/parameters/:userId', async (req, res) => {
    try {
      const row = await storage.getParameters(req.params.userId);
      res.json(row || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/parameters', async (req, res) => {
    try {
      await storage.saveParameters(req.body.user_id, req.body);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Quarterly Returns (shared globally across all users) ---

  app.get('/api/quarterly-returns', async (_req, res) => {
    try {
      const result = await storage.getQuarterlyReturns();
      res.json(result ?? { data: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/quarterly-returns', async (req, res) => {
    try {
      const { data, fileName } = req.body;
      await storage.saveQuarterlyReturns({ data, fileName });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- User Expenses ---

  app.get('/api/expenses/:userId', async (req, res) => {
    try {
      const profiles = await storage.getExpenseProfiles(req.params.userId);
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const { userId, profileName, fileName, data } = req.body;
      const dict: Record<number, number> = {};
      data.forEach((r: any) => { dict[r.age] = r.totalWithdrawal; });
      await storage.saveExpenseProfile(userId, { name: profileName, fileName, data, dict });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/expenses/:userId/:profileName', async (req, res) => {
    try {
      await storage.deleteExpenseProfile(req.params.userId, req.params.profileName);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Handle aborted requests and payload-too-large errors (Express 5 surfaces these as thrown errors)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return;
    if (err.status === 413 || err.type === 'entity.too.large') {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }
    if (err.status === 400 || err.type === 'request.aborted' || err.message === 'request aborted') {
      res.status(400).json({ error: 'Request aborted' });
      return;
    }
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Serve built frontend in production (Node/standalone only — Netlify serves dist/ via its own CDN)
  if (process.env.NODE_ENV === 'production' && !process.env.NETLIFY) {
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('/*splat', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
