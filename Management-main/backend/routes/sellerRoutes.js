import db from '../lib/db.js';

function requireUid(req, res) {
  const uid = req.query.uid || req.body.owner_uid || req.body.uid;
  if (!uid) {
    res.status(400).json({ error: 'uid is required' });
    return null;
  }

  return uid;
}

export function registerSellerRoutes(app) {
  app.get('/api/sellers', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    try {
      const sellers = await db('sellers')
        .where('owner_uid', uid)
        .orderBy('name', 'asc');

      res.json(sellers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sellers' });
    }
  });

  app.post('/api/sellers', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { name, phone, address } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Seller name is required' });
    }

    try {
      const [seller] = await db('sellers')
        .insert({
          owner_uid: uid,
          name: name.trim(),
          phone: phone || null,
          address: address || null,
          created_at: new Date(),
        })
        .onConflict(['owner_uid', 'name'])
        .merge({
          phone: phone || null,
          address: address || null,
        })
        .returning(['id', 'owner_uid', 'name', 'phone', 'address']);

      res.json(seller);
    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({ error: 'User session is not linked to the current database. Please log out and register or log in again.' });
      }
      if (error.code === '22P02') {
        return res.status(400).json({ error: 'Invalid uid format. Please log out and sign in again.' });
      }
      if (error.code === '42703' || error.code === '42P01') {
        return res.status(500).json({ error: 'Database schema does not match the app yet. Please double-check the SQL tables and columns.' });
      }
      res.status(500).json({ error: 'Failed to save seller' });
    }
  });

  app.post('/api/sellers/:sellerId/payments', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { sellerId } = req.params;
    const amount = Number(req.body.amount);
    const paymentMethod = req.body.payment_method;
    const paymentDate = req.body.payment_date || new Date().toISOString().split('T')[0];
    const note = req.body.note || null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'payment_method is required' });
    }

    try {
      const lots = await db('inventory_lots as lot')
        .leftJoin('seller_payments as payment', 'payment.lot_id', 'lot.id')
        .select(
          'lot.id',
          'lot.bought_weight_tons',
          'lot.cost_per_ton',
          db.raw('COALESCE(sum(payment.amount), 0) as paid_total')
        )
        .where('lot.owner_uid', uid)
        .andWhere('lot.seller_id', sellerId)
        .groupBy('lot.id')
        .orderBy('lot.purchase_date', 'asc');

      if (lots.length === 0) {
        return res.status(400).json({ error: 'Seller has no purchase lots yet' });
      }

      let remainingAmount = amount;
      let inserted = 0;

      for (const lot of lots) {
        if (remainingAmount <= 0) break;

        const totalCost = Number(lot.bought_weight_tons) * Number(lot.cost_per_ton);
        const paidTotal = Number(lot.paid_total || 0);
        const balance = Math.max(totalCost - paidTotal, 0);
        const appliedAmount = Math.min(balance, remainingAmount);

        if (appliedAmount <= 0) continue;

        await db('seller_payments').insert({
          owner_uid: uid,
          lot_id: lot.id,
          amount: appliedAmount,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          note,
          created_at: new Date(),
        });

        remainingAmount -= appliedAmount;
        inserted += 1;
      }

      if (inserted === 0) {
        return res.status(400).json({ error: 'No unpaid seller balance found' });
      }

      res.json({ success: true, inserted });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add seller payment' });
    }
  });
}
