import db from '../lib/db.js';

function requireUid(req, res) {
  const uid = req.query.uid || req.body.owner_uid || req.body.uid;
  if (!uid) {
    res.status(400).json({ error: 'uid is required' });
    return null;
  }

  return uid;
}

export function registerCompanyRoutes(app) {
  app.get('/api/companies', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    try {
      const companies = await db('companies')
        .where('owner_uid', uid)
        .orderBy('name', 'asc');

      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  });

  app.post('/api/companies', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { name, contact_person, phone, address } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    try {
      const [company] = await db('companies')
        .insert({
          owner_uid: uid,
          name: name.trim(),
          contact_person: contact_person || null,
          phone: phone || null,
          address: address || null,
          created_at: new Date(),
        })
        .onConflict(['owner_uid', 'name'])
        .merge({
          contact_person: contact_person || null,
          phone: phone || null,
          address: address || null,
        })
        .returning(['id', 'owner_uid', 'name', 'contact_person', 'phone', 'address']);

      res.json(company);
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
      res.status(500).json({ error: 'Failed to save company' });
    }
  });

  app.post('/api/companies/:companyId/payments', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { companyId } = req.params;
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
      const sales = await db('sales as sale')
        .leftJoin('company_payments as payment', 'payment.sale_id', 'sale.id')
        .select(
          'sale.id',
          'sale.sold_weight_tons',
          'sale.price_per_ton',
          db.raw('COALESCE(sum(payment.amount), 0) as received_total')
        )
        .where('sale.owner_uid', uid)
        .andWhere('sale.company_id', companyId)
        .groupBy('sale.id')
        .orderBy('sale.sale_date', 'asc');

      if (sales.length === 0) {
        return res.status(400).json({ error: 'Company has no sales yet' });
      }

      let remainingAmount = amount;
      let inserted = 0;

      for (const sale of sales) {
        if (remainingAmount <= 0) break;

        const saleValue = Number(sale.sold_weight_tons) * Number(sale.price_per_ton);
        const receivedTotal = Number(sale.received_total || 0);
        const balance = Math.max(saleValue - receivedTotal, 0);
        const appliedAmount = Math.min(balance, remainingAmount);

        if (appliedAmount <= 0) continue;

        await db('company_payments').insert({
          owner_uid: uid,
          sale_id: sale.id,
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
        return res.status(400).json({ error: 'No unpaid company balance found' });
      }

      res.json({ success: true, inserted });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add company payment' });
    }
  });

  app.patch('/api/companies/:companyId/credit', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { companyId } = req.params;
    const badCredit = Boolean(req.body.bad_credit);

    try {
      const [company] = await db('companies')
        .where({ id: companyId, owner_uid: uid })
        .update({ bad_credit: badCredit })
        .returning(['id', 'bad_credit']);

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json(company);
    } catch (error) {
      if (error.code === '42703') {
        return res.status(500).json({ error: 'Missing bad_credit column. Please run: ALTER TABLE companies ADD COLUMN bad_credit boolean not null default false;' });
      }
      res.status(500).json({ error: 'Failed to update company credit status' });
    }
  });

  app.delete('/api/companies/:companyId', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { companyId } = req.params;

    try {
      const deletedCount = await db('companies')
        .where({ id: companyId, owner_uid: uid })
        .delete();

      if (!deletedCount) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json({ success: true });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({ error: 'This company already has sales records, so it cannot be deleted.' });
      }
      res.status(500).json({ error: 'Failed to delete company' });
    }
  });
}
