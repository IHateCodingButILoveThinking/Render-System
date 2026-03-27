import db from '../lib/db.js';

export function registerUserRoutes(app) {
  app.get('/api/users', async (req, res) => {
    const { name } = req.query;

    try {
      const user = await db('users').where('name', name).first();
      res.json(user || null);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });
}
