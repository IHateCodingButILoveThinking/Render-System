import crypto from 'crypto';
import db from '../lib/db.js';

function createUid() {
  return crypto.randomUUID();
}

export function registerAuthRoutes(app) {
  app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
      const uid = createUid();

      const [user] = await db('users')
        .insert({
          uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          created_at: new Date(),
        })
        .returning(['uid', 'name', 'email']);

      res.json(user);
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already exists' });
      }

      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      const input = email?.trim() || '';
      const query = input.includes('@')
        ? db('users').whereRaw('lower(email) = ?', [input.toLowerCase()])
        : db('users').whereRaw('lower(name) = ?', [input.toLowerCase()]);

      const user = await query.first();

      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password: _password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });
}
