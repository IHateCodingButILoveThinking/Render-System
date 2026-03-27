import db from '../lib/db.js';

const PAYMENT_METHODS = [
  'wechat_pay',
  'alipay',
  'cheque',
  'cash',
  'bank_transfer',
  'usd',
];
const SELLER_RETURN_ALERT_THRESHOLD = Number.parseInt(process.env.SELLER_RETURN_ALERT_THRESHOLD || '3', 10);

function parseNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
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
  const [lots, sales, companies, sellers, companyPayments, sellerPayments, sellerReturns, operationalCosts] = await Promise.all([
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
    db('seller_returns as returned')
      .leftJoin('inventory_lots as lot', 'lot.id', 'returned.lot_id')
      .leftJoin('sellers as seller', 'seller.id', 'returned.seller_id')
      .select(
        'returned.*',
        'lot.product_name as lot_product_name',
        'seller.name as seller_name'
      )
      .where('returned.owner_uid', uid)
      .orderBy('returned.return_date', 'desc'),
    db('operational_costs')
      .where('owner_uid', uid)
      .orderBy('cost_date', 'desc')
      .orderBy('created_at', 'desc'),
  ]);

  const salePaymentsBySale = new Map();
  for (const payment of companyPayments) {
    const saleId = normalizeId(payment.sale_id);
    const list = salePaymentsBySale.get(saleId) || [];
    list.push({ ...payment, amount: parseNumber(payment.amount) });
    salePaymentsBySale.set(saleId, list);
  }

  const sellerPaymentsByLot = new Map();
  for (const payment of sellerPayments) {
    const lotId = normalizeId(payment.lot_id);
    const list = sellerPaymentsByLot.get(lotId) || [];
    list.push({ ...payment, amount: parseNumber(payment.amount) });
    sellerPaymentsByLot.set(lotId, list);
  }

  const sellerReturnsByLot = new Map();
  for (const returned of sellerReturns) {
    const lotId = normalizeId(returned.lot_id);
    const list = sellerReturnsByLot.get(lotId) || [];
    list.push({
      ...returned,
      return_weight_tons: parseNumber(returned.return_weight_tons),
      return_amount: parseNumber(returned.return_amount),
    });
    sellerReturnsByLot.set(lotId, list);
  }

  const operationalCostsWithTotals = operationalCosts.map((cost) => ({
    ...cost,
    amount: parseNumber(cost.amount),
    quantity: parseNumber(cost.quantity, 1),
    unit_cost: cost.unit_cost === null || cost.unit_cost === undefined
      ? null
      : parseNumber(cost.unit_cost),
  }));

  const salesWithTotals = sales.map((sale) => {
    const payments = salePaymentsBySale.get(normalizeId(sale.id)) || [];
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
    const lotId = normalizeId(sale.lot_id);
    const list = salesByLot.get(lotId) || [];
    list.push(sale);
    salesByLot.set(lotId, list);
  }

  const lotsWithTotals = lots.map((lot) => {
    const lotId = normalizeId(lot.id);
    const linkedSales = salesByLot.get(lotId) || [];
    const linkedReturns = sellerReturnsByLot.get(lotId) || [];
    const paidToSeller = (sellerPaymentsByLot.get(lotId) || []).reduce(
      (sum, payment) => sum + parseNumber(payment.amount),
      0
    );
    const boughtWeight = parseNumber(lot.bought_weight_tons);
    const soldWeight = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.sold_weight_tons), 0);
    const returnedWeight = linkedReturns.reduce((sum, returned) => sum + parseNumber(returned.return_weight_tons), 0);
    const remainingWeight = boughtWeight - soldWeight - returnedWeight;
    const totalCost = boughtWeight * parseNumber(lot.cost_per_ton);
    const returnedAmount = linkedReturns.reduce((sum, returned) => sum + parseNumber(returned.return_amount), 0);
    const adjustedTotalCost = Math.max(totalCost - returnedAmount, 0);
    const salesRevenue = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.sale_value), 0);
    const receivedAmount = linkedSales.reduce((sum, sale) => sum + parseNumber(sale.received_amount), 0);

    return {
      ...lot,
      bought_weight_tons: boughtWeight,
      cost_per_ton: parseNumber(lot.cost_per_ton),
      sold_weight_tons: soldWeight,
      remaining_weight_tons: remainingWeight,
      total_cost: adjustedTotalCost,
      gross_total_cost: totalCost,
      returned_weight_tons: returnedWeight,
      returned_amount: returnedAmount,
      sales_revenue: salesRevenue,
      received_amount: receivedAmount,
      seller_paid_amount: paidToSeller,
      seller_balance: adjustedTotalCost - paidToSeller,
      sales: linkedSales,
      seller_payments: sellerPaymentsByLot.get(lotId) || [],
      seller_returns: linkedReturns,
      return_count: linkedReturns.length,
    };
  });

  const companySummaries = companies.map((company) => {
    const linkedSales = salesWithTotals.filter((sale) => normalizeId(sale.company_id) === normalizeId(company.id));
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
    const linkedLots = lotsWithTotals.filter((lot) => normalizeId(lot.seller_id) === normalizeId(seller.id));
    const totalGrossCost = linkedLots.reduce((sum, lot) => sum + parseNumber(lot.gross_total_cost), 0);
    const totalBoughtCost = linkedLots.reduce((sum, lot) => sum + parseNumber(lot.total_cost), 0);
    const totalPaid = linkedLots.reduce((sum, lot) => sum + parseNumber(lot.seller_paid_amount), 0);
    const totalReturnedAmount = linkedLots.reduce((sum, lot) => sum + parseNumber(lot.returned_amount), 0);
    const totalReturnedWeight = linkedLots.reduce((sum, lot) => sum + parseNumber(lot.returned_weight_tons), 0);
    const totalReturnCount = linkedLots.reduce((sum, lot) => sum + Number(lot.return_count || 0), 0);
    const sellerReturnThreshold = Number.isFinite(SELLER_RETURN_ALERT_THRESHOLD) && SELLER_RETURN_ALERT_THRESHOLD > 0
      ? SELLER_RETURN_ALERT_THRESHOLD
      : 3;

    return {
      ...seller,
      bad_quality: Boolean(seller.bad_quality) || totalReturnCount >= sellerReturnThreshold,
      total_bought_cost: totalBoughtCost,
      total_gross_cost: totalGrossCost,
      total_paid: totalPaid,
      balance_owed: totalBoughtCost - totalPaid,
      total_returned_amount: totalReturnedAmount,
      total_returned_weight_tons: totalReturnedWeight,
      return_count: totalReturnCount,
      lots: linkedLots,
    };
  });

  return {
    lots: lotsWithTotals,
    sales: salesWithTotals,
    companies: companySummaries,
    sellers: sellerSummaries,
    paymentMethods: PAYMENT_METHODS,
    returnAlertThreshold: Number.isFinite(SELLER_RETURN_ALERT_THRESHOLD) && SELLER_RETURN_ALERT_THRESHOLD > 0
      ? SELLER_RETURN_ALERT_THRESHOLD
      : 3,
    operationalCosts: operationalCostsWithTotals,
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
      const existingReturns = await db('seller_returns')
        .where({ owner_uid: uid, lot_id: id })
        .sum({ returned_weight: 'return_weight_tons' })
        .first();

      const totalSoldWeight = parseNumber(existingSales?.sold_weight);
      const totalReturnedWeight = parseNumber(existingReturns?.returned_weight);
      if (updates.bought_weight_tons < totalSoldWeight + totalReturnedWeight) {
        return res.status(400).json({ error: 'Bought weight cannot be less than sold weight plus returned weight' });
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
      const existingReturns = await db('seller_returns')
        .where({ owner_uid: uid, lot_id })
        .sum({ returned_weight: 'return_weight_tons' })
        .first();

      const alreadySold = parseNumber(existingSales?.sold_weight);
      const alreadyReturned = parseNumber(existingReturns?.returned_weight);
      const boughtWeight = parseNumber(lot.bought_weight_tons);

      if (alreadySold + soldWeight > boughtWeight - alreadyReturned) {
        return res.status(400).json({ error: 'Sold weight exceeds remaining lot weight after returns' });
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

  app.post('/api/operational-costs', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const rawCategory = String(req.body.category || '').trim().toLowerCase();
    const category = ['driver', 'labour', 'other'].includes(rawCategory) ? rawCategory : 'other';
    const rawCostType = String(req.body.cost_type || '').trim();
    const fallbackTypeByCategory = {
      driver: 'Driver',
      labour: 'Labour',
      other: 'Other',
    };
    const costType = rawCostType || fallbackTypeByCategory[category];
    const quantity = parseNumber(req.body.quantity, 1);
    const unitCostRaw = req.body.unit_cost;
    const unitCost = unitCostRaw === '' || unitCostRaw === null || unitCostRaw === undefined
      ? null
      : parseNumber(unitCostRaw, Number.NaN);
    const providedAmount = Number(req.body.amount);
    const costDate = req.body.cost_date || new Date().toISOString().split('T')[0];
    const note = req.body.note || null;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive number' });
    }

    let amount = Number.isFinite(providedAmount) ? providedAmount : Number.NaN;
    if (!Number.isFinite(amount)) {
      if (Number.isFinite(unitCost) && unitCost >= 0) {
        amount = quantity * unitCost;
      }
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: 'Valid amount is required, or provide unit_cost and quantity for auto-calculation' });
    }

    try {
      const [record] = await db('operational_costs')
        .insert({
          owner_uid: uid,
          category,
          cost_type: costType,
          quantity,
          unit_cost: Number.isFinite(unitCost) ? unitCost : null,
          amount,
          cost_date: costDate,
          note,
          created_at: new Date(),
        })
        .returning(['id']);

      res.json({ success: true, id: record.id });
    } catch (error) {
      if (error.code === '42P01') {
        return res.status(500).json({ error: 'Missing operational_costs table. Please run the SQL migration for operational costs first.' });
      }
      if (error.code === '42703') {
        return res.status(500).json({ error: 'Database schema does not match operational costs columns. Please run the SQL migration.' });
      }
      res.status(500).json({ error: 'Failed to save operational cost' });
    }
  });

  app.delete('/api/operational-costs/:id', async (req, res) => {
    const uid = requireUid(req, res);
    if (!uid) return;

    const { id } = req.params;

    try {
      const deletedCount = await db('operational_costs')
        .where({ id, owner_uid: uid })
        .delete();

      if (!deletedCount) {
        return res.status(404).json({ error: 'Operational cost record not found' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete operational cost' });
    }
  });
}
