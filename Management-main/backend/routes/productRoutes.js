import db from '../lib/db.js';

const PAYMENT_METHODS = [
  'wechat_pay',
  'alipay',
  'cheque',
  'cash',
  'bank_transfer',
  'usd',
];

function parseNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function requireUid(req, res) {
  const uid = req.query.uid || req.body.uid || req.body.owner_uid;
  if (!uid) {
    res.status(400).json({ error: 'uid is required' });
    return null;
  }

  return uid;
}

async function fetchDashboard(uid) {
  const [lots, sales, companies, sellers, companyPayments, sellerPayments] = await Promise.all([
    db('inventory_lots as lot')
      .leftJoin('sellers as seller', 'seller.id', 'lot.seller_id')
      .select(
        'lot.*',
        'seller.name as seller_name',
        'seller.phone as seller_phone'
      )
      .where('lot.owner_uid', uid)
      .orderBy('lot.purchase_date', 'desc'),
    db('sales as sale')
      .leftJoin('companies as company', 'company.id', 'sale.company_id')
      .leftJoin('inventory_lots as lot', 'lot.id', 'sale.lot_id')
      .select(
        'sale.*',
        'company.name as company_name',
        'lot.product_name as lot_product_name',
        'lot.cost_per_ton as lot_cost_per_ton'
      )
      .where('sale.owner_uid', uid)
      .orderBy('sale.sale_date', 'desc'),
    db('companies').where('owner_uid', uid).orderBy('name', 'asc'),
    db('sellers').where('owner_uid', uid).orderBy('name', 'asc'),
    db('company_payments as payment')
      .leftJoin('sales as sale', 'sale.id', 'payment.sale_id')
      .leftJoin('companies as company', 'company.id', 'sale.company_id')
      .select(
        'payment.*',
        'company.name as company_name',
        'sale.lot_id',
        'sale.company_id'
      )
      .where('payment.owner_uid', uid)
      .orderBy('payment.payment_date', 'desc'),
    db('seller_payments as payment')
      .leftJoin('inventory_lots as lot', 'lot.id', 'payment.lot_id')
      .leftJoin('sellers as seller', 'seller.id', 'lot.seller_id')
      .select(
        'payment.*',
        'seller.name as seller_name',
        'lot.seller_id'
      )
      .where('payment.owner_uid', uid)
      .orderBy('payment.payment_date', 'desc'),
  ]);

  const salePaymentsBySale = new Map();
  for (const payment of companyPayments) {
    const list = salePaymentsBySale.get(payment.sale_id) || [];
    list.push({ ...payment, amount: parseNumber(payment.amount) });
    salePaymentsBySale.set(payment.sale_id, list);
  }

  const sellerPaymentsByLot = new Map();
  for (const payment of sellerPayments) {
    const list = sellerPaymentsByLot.get(payment.lot_id) || [];
    list.push({ ...payment, amount: parseNumber(payment.amount) });
    sellerPaymentsByLot.set(payment.lot_id, list);
  }

  const salesWithTotals = sales.map((sale) => {
    const payments = salePaymentsBySale.get(sale.id) || [];
    const soldWeightTons = parseNumber(sale.sold_weight_tons);
    const pricePerTon = parseNumber(sale.price_per_ton);
    const saleValue = soldWeightTons * pricePerTon;
    const receivedAmount = payments.reduce((sum, payment) => sum + parseNumber(payment.amount), 0);
    const lotCost = soldWeightTons * parseNumber(sale.lot_cost_per_ton);

    return {
      ...sale,
      sold_weight_tons: soldWeightTons,
      price_per_ton: pricePerTon,
      sale_value: saleValue,
      received_amount: receivedAmount,
      outstanding_amount: saleValue - receivedAmount,
      lot_cost: lotCost,
      profit: saleValue - lotCost,
      payments,
    };
  });

  const salesByLot = new Map();
  for (const sale of salesWithTotals) {
    const list = salesByLot.get(sale.lot_id) || [];
    list.push(sale);
    salesByLot.set(sale.lot_id, list);
  }

  const lotsWithTotals = lots.map((lot) => {
    const linkedSales = salesByLot.get(lot.id) || [];
    const paidToSeller = (sellerPaymentsByLot.get(lot.id) || []).reduce(
      (sum, payment) => sum + parseNumber(payment.amount),
      0
    );
    const boughtWeight = parseNumber(lot.bought_weight_tons);
    const soldWeight = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.sold_weight_tons), 0);
    const remainingWeight = boughtWeight - soldWeight;
    const totalCost = boughtWeight * parseNumber(lot.cost_per_ton);
    const salesRevenue = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.sale_value), 0);
    const receivedAmount = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.received_amount), 0);

    return {
      ...lot,
      bought_weight_tons: boughtWeight,
      cost_per_ton: parseNumber(lot.cost_per_ton),
      sold_weight_tons: soldWeight,
      remaining_weight_tons: remainingWeight,
      total_cost: totalCost,
      sales_revenue: salesRevenue,
      received_amount: receivedAmount,
      seller_paid_amount: paidToSeller,
      seller_balance: totalCost - paidToSeller,
      sales: linkedSales,
      seller_payments: sellerPaymentsByLot.get(lot.id) || [],
    };
  });

  const companySummaries = companies.map((company) => {
    const linkedSales = salesWithTotals.filter((sale) => sale.company_id === company.id);
    const totalBoughtCost = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.lot_cost), 0);
    const totalSoldValue = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.sale_value), 0);
    const totalReceived = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.received_amount), 0);

    return {
      ...company,
      total_bought_cost: totalBoughtCost,
      total_sold_value: totalSoldValue,
      total_received: totalReceived,
      balance_owed: totalSoldValue - totalReceived,
      profit: totalSoldValue - totalBoughtCost,
      sales: linkedSales,
    };
  });

  const sellerSummaries = sellers.map((seller) => {
    const linkedLots = lotsWithTotals.filter((lot) => lot.seller_id === seller.id);
    const totalBoughtCost = linkedLots.reduce((sum, lot) => sum + parseNumber(lot.total_cost), 0);
    const totalPaid = linkedLots.reduce((sum, lot) => sum + parseNumber(lot.seller_paid_amount), 0);

    return {
      ...seller,
      total_bought_cost: totalBoughtCost,
      total_paid: totalPaid,
      balance_owed: totalBoughtCost - totalPaid,
      lots: linkedLots,
    };
  });

  return {
    lots: lotsWithTotals,
    sales: salesWithTotals,
    companies: companySummaries,
    sellers: sellerSummaries,
    paymentMethods: PAYMENT_METHODS,
  };
}

export function registerProductRoutes(app) {
  app.get('/api/dashboard', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    try {
      res.json(await fetchDashboard(uid));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  });

  app.get('/api/payment-methods', (_req, res) => {
    res.json(PAYMENT_METHODS);
  });

  app.post('/api/lots', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const {
      seller_id,
      product_name,
      color,
      quality,
      image_url,
      purchase_date,
      bought_weight_tons,
      cost_per_ton,
      location,
      notes,
    } = req.body;

    if (!product_name?.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    if (!purchase_date) {
      return res.status(400).json({ error: 'Purchase date is required' });
    }

    if (parseNumber(bought_weight_tons) <= 0 || parseNumber(cost_per_ton) < 0) {
      return res.status(400).json({ error: 'Weight and cost must be valid numbers' });
    }

    try {
      const [lot] = await db('inventory_lots')
        .insert({
          owner_uid: uid,
          seller_id: seller_id || null,
          product_name: product_name.trim(),
          color: color || null,
          quality: quality || null,
          image_url: image_url || null,
          purchase_date,
          bought_weight_tons: parseNumber(bought_weight_tons),
          cost_per_ton: parseNumber(cost_per_ton),
          location: location || null,
          notes: notes || null,
          created_at: new Date(),
        })
        .returning(['id']);

      res.json({ id: lot.id });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({ error: 'User or seller reference is invalid for this database. Please sign in again and check the selected seller.' });
      }
      if (error.code === '42703' || error.code === '42P01') {
        return res.status(500).json({ error: 'Database schema does not match the app yet. Please double-check the SQL tables and columns.' });
      }
      res.status(500).json({ error: 'Failed to save lot' });
    }
  });

  app.put('/api/lots/:id', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { id } = req.params;
    const updates = {
      seller_id: req.body.seller_id || null,
      product_name: req.body.product_name?.trim(),
      color: req.body.color || null,
      quality: req.body.quality || null,
      image_url: req.body.image_url || null,
      purchase_date: req.body.purchase_date,
      bought_weight_tons: parseNumber(req.body.bought_weight_tons),
      cost_per_ton: parseNumber(req.body.cost_per_ton),
      location: req.body.location || null,
      notes: req.body.notes || null,
    };

    try {
      const existingSales = await db('sales')
        .where({ owner_uid: uid, lot_id: id })
        .sum({ sold_weight: 'sold_weight_tons' })
        .first();

      const totalSoldWeight = parseNumber(existingSales?.sold_weight);
      if (updates.bought_weight_tons < totalSoldWeight) {
        return res.status(400).json({ error: 'Bought weight cannot be less than already sold weight' });
      }

      await db('inventory_lots').where({ id, owner_uid: uid }).update(updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update lot' });
    }
  });

  app.delete('/api/lots/:id', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    try {
      await db('inventory_lots').where({ id: req.params.id, owner_uid: uid }).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete lot' });
    }
  });

  app.patch('/api/lots/:id/photo', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { id } = req.params;
    const imageUrl = req.body.image_url || null;

    try {
      const [lot] = await db('inventory_lots')
        .where({ id, owner_uid: uid })
        .update({ image_url: imageUrl })
        .returning(['id', 'image_url']);

      if (!lot) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      res.json(lot);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update lot photo' });
    }
  });

  app.post('/api/sales', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const {
      lot_id,
      company_id,
      sale_date,
      sold_weight_tons,
      price_per_ton,
      location,
      notes,
    } = req.body;

    if (!lot_id || !company_id || !sale_date) {
      return res.status(400).json({ error: 'lot_id, company_id, and sale_date are required' });
    }

    const soldWeight = parseNumber(sold_weight_tons);
    const pricePerTon = parseNumber(price_per_ton);
    if (soldWeight <= 0 || pricePerTon < 0) {
      return res.status(400).json({ error: 'Sale weight and price must be valid numbers' });
    }

    try {
      const lot = await db('inventory_lots')
        .where({ id: lot_id, owner_uid: uid })
        .first();

      if (!lot) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      const existingSales = await db('sales')
        .where({ owner_uid: uid, lot_id })
        .sum({ sold_weight: 'sold_weight_tons' })
        .first();

      const alreadySold = parseNumber(existingSales?.sold_weight);
      const boughtWeight = parseNumber(lot.bought_weight_tons);

      if (alreadySold + soldWeight > boughtWeight) {
        return res.status(400).json({ error: 'Sold weight exceeds remaining lot weight' });
      }

      const [sale] = await db('sales')
        .insert({
          owner_uid: uid,
          lot_id,
          company_id,
          sale_date,
          sold_weight_tons: soldWeight,
          price_per_ton: pricePerTon,
          location: location || null,
          notes: notes || null,
          created_at: new Date(),
        })
        .returning(['id']);

      res.json({ id: sale.id });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Lot or company reference is invalid for this database.' });
      }
      if (error.code === '42703' || error.code === '42P01') {
        return res.status(500).json({ error: 'Database schema does not match the app yet. Please double-check the SQL tables and columns.' });
      }
      res.status(500).json({ error: 'Failed to save sale' });
    }
  });
}
