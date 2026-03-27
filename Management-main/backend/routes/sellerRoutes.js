import db from '../lib/db.js';
const SELLER_RETURN_ALERT_THRESHOLD = Number.parseInt(process.env.SELLER_RETURN_ALERT_THRESHOLD || '3', 10);

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
    const amountInput = Number(req.body.amount);
    const paymentMethod = req.body.payment_method;
    const paymentDate = req.body.payment_date || new Date().toISOString().split('T')[0];
    const note = req.body.note || null;

    if (!Number.isFinite(amountInput) || amountInput <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'payment_method is required' });
    }

    // Amounts are tracked in RMB. USD inputs are converted to RMB automatically.
    const amount = paymentMethod === 'usd' ? amountInput * 7 : amountInput;

    try {
      const paymentTotals = db('seller_payments')
        .select('lot_id')
        .sum({ paid_total: 'amount' })
        .where('owner_uid', uid)
        .groupBy('lot_id')
        .as('payment_totals');
      const returnTotals = db('seller_returns')
        .select('lot_id')
        .sum({ returned_total: 'return_amount' })
        .where('owner_uid', uid)
        .groupBy('lot_id')
        .as('return_totals');

      const lots = await db('inventory_lots as lot')
        .leftJoin(paymentTotals, 'payment_totals.lot_id', 'lot.id')
        .leftJoin(returnTotals, 'return_totals.lot_id', 'lot.id')
        .select(
          'lot.id',
          'lot.bought_weight_tons',
          'lot.cost_per_ton',
          db.raw('COALESCE(payment_totals.paid_total, 0) as paid_total'),
          db.raw('COALESCE(return_totals.returned_total, 0) as returned_total')
        )
        .where('lot.owner_uid', uid)
        .andWhere('lot.seller_id', sellerId)
        .orderBy('lot.purchase_date', 'asc');

      if (lots.length === 0) {
        return res.status(400).json({ error: 'Seller has no purchase lots yet' });
      }

      let remainingAmount = amount;
      let inserted = 0;

      for (const lot of lots) {
        if (remainingAmount <= 0) break;

        const grossTotalCost = Number(lot.bought_weight_tons) * Number(lot.cost_per_ton);
        const returnedTotal = Number(lot.returned_total || 0);
        const totalCost = Math.max(grossTotalCost - returnedTotal, 0);
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

  app.post('/api/sellers/:sellerId/returns', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { sellerId } = req.params;
    const sellerIdNum = Number(sellerId);
    const lotId = Number(req.body.lot_id);
    const returnWeight = Number(req.body.return_weight_tons);
    const returnDate = req.body.return_date || new Date().toISOString().split('T')[0];
    const returnReason = req.body.return_reason || null;
    const threshold = Number.isFinite(SELLER_RETURN_ALERT_THRESHOLD) && SELLER_RETURN_ALERT_THRESHOLD > 0
      ? SELLER_RETURN_ALERT_THRESHOLD
      : 3;

    if (!Number.isFinite(sellerIdNum) || sellerIdNum <= 0) {
      return res.status(400).json({ error: 'Valid seller id is required' });
    }

    if (!Number.isFinite(lotId) || lotId <= 0) {
      return res.status(400).json({ error: 'lot_id is required' });
    }

    if (!Number.isFinite(returnWeight) || returnWeight <= 0) {
      return res.status(400).json({ error: 'Valid return_weight_tons is required' });
    }

    try {
      const lot = await db('inventory_lots')
        .where({ id: lotId, owner_uid: uid, seller_id: sellerIdNum })
        .first();

      if (!lot) {
        return res.status(404).json({ error: 'Lot not found for this seller' });
      }

      const [soldSummary, returnedSummary] = await Promise.all([
        db('sales')
          .where({ owner_uid: uid, lot_id: lotId })
          .sum({ sold_weight: 'sold_weight_tons' })
          .first(),
        db('seller_returns')
          .where({ owner_uid: uid, lot_id: lotId })
          .sum({ returned_weight: 'return_weight_tons' })
          .first(),
      ]);

      const soldWeight = Number(soldSummary?.sold_weight || 0);
      const alreadyReturnedWeight = Number(returnedSummary?.returned_weight || 0);
      const boughtWeight = Number(lot.bought_weight_tons || 0);
      const returnableWeight = Math.max(boughtWeight - soldWeight - alreadyReturnedWeight, 0);

      if (returnableWeight <= 0) {
        return res.status(400).json({ error: 'This lot has no remaining returnable weight' });
      }

      if (returnWeight - returnableWeight > 0.000001) {
        return res.status(400).json({ error: 'Return weight exceeds remaining unsold lot weight' });
      }

      // Return amount always follows business rule:
      // returned tons × original buy cost per ton.
      const returnAmount = returnWeight * Number(lot.cost_per_ton || 0);

      await db('seller_returns').insert({
        owner_uid: uid,
        seller_id: sellerIdNum,
        lot_id: lotId,
        return_weight_tons: returnWeight,
        return_amount: returnAmount,
        return_reason: returnReason,
        return_date: returnDate,
        created_at: new Date(),
      });

      const [{ total_returns: totalReturns }] = await db('seller_returns')
        .where({ owner_uid: uid, seller_id: sellerIdNum })
        .count({ total_returns: '*' });

      const returnCount = Number(totalReturns || 0);

      await db('sellers')
        .where({ owner_uid: uid, id: sellerIdNum })
        .update({ bad_quality: returnCount >= threshold });

      res.json({
        success: true,
        return_count: returnCount,
        threshold,
        return_amount: returnAmount,
      });
    } catch (error) {
      if (error.code === '42P01') {
        return res.status(500).json({
          error: 'Missing seller_returns table. Please run the SQL migration for seller returns first.',
        });
      }
      if (error.code === '42703') {
        return res.status(500).json({
          error: 'Missing sellers.bad_quality column. Please run the SQL migration for seller quality flags.',
        });
      }
      res.status(500).json({ error: 'Failed to record seller return' });
    }
  });

  app.patch('/api/sellers/:sellerId/quality', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { sellerId } = req.params;
    const rawBadQuality = req.body.bad_quality;
    const badQuality = rawBadQuality === true || rawBadQuality === 'true' || rawBadQuality === 1 || rawBadQuality === '1';

    try {
      const [seller] = await db('sellers')
        .where({ id: sellerId, owner_uid: uid })
        .update({ bad_quality: badQuality })
        .returning(['id', 'bad_quality']);

      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      res.json(seller);
    } catch (error) {
      if (error.code === '42703') {
        return res.status(500).json({
          error: 'Missing sellers.bad_quality column. Please run the SQL migration for seller quality flags.',
        });
      }
      res.status(500).json({ error: 'Failed to update seller quality status' });
    }
  });

  app.delete('/api/sellers/:sellerId', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { sellerId } = req.params;

    try {
      const deletedCount = await db.transaction(async (trx) => {
        // Keep historical lot records and detach them from this seller.
        await trx('inventory_lots')
          .where({ owner_uid: uid, seller_id: sellerId })
          .update({ seller_id: null });

        const deleted = await trx('sellers')
          .where({ id: sellerId, owner_uid: uid })
          .delete();

        return deleted;
      });

      if (!deletedCount) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete seller' });
    }
  });
}
