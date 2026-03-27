import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  Banknote,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  LogOut,
  Package,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster, toast } from 'sonner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { getTranslations } from './services/translationService';

const PAYMENT_METHOD_LABELS = {
  wechat_pay: { en: 'WeChat Pay', zh: '微信支付' },
  alipay: { en: 'Alipay', zh: '支付宝' },
  cheque: { en: 'Cheque', zh: '支票' },
  cash: { en: 'Cash', zh: '现金' },
  bank_transfer: { en: 'Bank Transfer', zh: '银行转账' },
  usd: { en: 'US Dollars', zh: '美元' },
};

const QUALITY_OPTIONS = ['Best', 'Good', 'Normal', 'Bad', 'Worst'];

const createLotForm = () => ({
  product_name: '',
  sellerName: '',
  sellerPhone: '',
  purchase_date: new Date().toISOString().split('T')[0],
  bought_weight_tons: '',
  cost_per_ton: '',
  color: '',
  quality: 'Good',
  location: '',
  notes: '',
});

const createCompanyForm = () => ({
  name: '',
  contact_person: '',
  phone: '',
  address: '',
});

const createSellerForm = () => ({
  name: '',
  phone: '',
  address: '',
});

const normalizeName = (value) => value?.trim().toLowerCase() || '';

const formatCurrency = (value) =>
  `¥${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatWeight = (value) =>
  `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} T`;

const Button = ({ children, className = '', variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-zinc-800',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    outline: 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    ghost: 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };

  return (
    <button
      {...props}
      className={`px-4 py-2.5 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, className = '', ...props }) => (
  <label className={`flex flex-col gap-1.5 ${className}`}>
    {label ? (
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    ) : null}
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black ${props.className || ''}`}
    />
  </label>
);

const Select = ({ label, options, className = '', ...props }) => (
  <label className={`flex flex-col gap-1.5 ${className}`}>
    {label ? (
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    ) : null}
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black ${props.className || ''}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const StatCard = ({ title, value, hint }) => (
  <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{title}</p>
    <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{value}</p>
    {hint ? <p className="mt-2 text-xs text-zinc-400">{hint}</p> : null}
  </div>
);

const EmptyState = ({ title, message }) => (
  <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-10 text-center">
    <p className="text-lg font-bold text-zinc-700">{title}</p>
    <p className="mt-2 text-sm text-zinc-400">{message}</p>
  </div>
);

export default function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <AppContent />
    </>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('zh');
  const [t, setT] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboard, setDashboard] = useState({
    lots: [],
    sales: [],
    companies: [],
    sellers: [],
    paymentMethods: Object.keys(PAYMENT_METHOD_LABELS),
  });
  const [lotForm, setLotForm] = useState(createLotForm());
  const [companyForm, setCompanyForm] = useState(createCompanyForm());
  const [sellerForm, setSellerForm] = useState(createSellerForm());
  const [saleForms, setSaleForms] = useState({});
  const [companyPaymentForms, setCompanyPaymentForms] = useState({});
  const [sellerPaymentForms, setSellerPaymentForms] = useState({});
  const [submittingKey, setSubmittingKey] = useState('');
  const [showLotModal, setShowLotModal] = useState(false);

  useEffect(() => {
    getTranslations(lang).then(setT);
  }, [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    refreshDashboard(user.uid);
  }, [user]);

  const paymentMethodOptions = dashboard.paymentMethods.map((method) => ({
    value: method,
    label: PAYMENT_METHOD_LABELS[method]?.[lang] || method,
  }));

  const text = {
    appTitle: t?.appTitle,
    appSubtitle: t?.appSubtitle,
    inventoryLots: t?.inventoryLots,
    sales: t?.sales,
    inventoryCost: t?.inventoryCost,
    remainingWeight: t?.remainingWeight,
    soldValue: t?.soldValue,
    received: t?.received,
    noLotsYet: t?.noLotsYet,
    createFirstLot: t?.createFirstLot,
    buyFromSellers: t?.buyFromSellers,
    searchLots: t?.searchLots,
    saveLot: t?.saveLot,
    lotSaved: t?.lotSaved,
    deleteLotConfirm: t?.deleteLotConfirm,
    lotDeleted: t?.lotDeleted,
    noSellerLinked: t?.noSellerLinked,
    bought: t?.bought,
    sold: t?.sold,
    remaining: t?.remaining,
    sellThisLot: t?.sellThisLot,
    oneLotManySales: t?.oneLotManySales,
    saleDate: t?.saleDate,
    weightSoldShort: t?.weightSoldShort,
    boughtWeight: t?.boughtWeight,
    costPerTon: t?.costPerTon,
    addSale: t?.addSale,
    noSalesForLot: t?.noSalesForLot,
    outstanding: t?.outstanding,
    companySaved: t?.companySaved,
    sellerSaved: t?.sellerSaved,
    companyRequired: t?.companyRequired,
    saleRecorded: t?.saleRecorded,
    companyPaymentAdded: t?.companyPaymentAdded,
    sellerPaymentAdded: t?.sellerPaymentAdded,
    loggedIn: t?.loggedIn,
    registered: t?.registered,
    saveCompany: t?.saveCompany,
    saveSeller: t?.saveSeller,
    contactPerson: t?.contactPerson,
    address: t?.address,
    recordReceivedPayment: t?.recordReceivedPayment,
    recordSellerPayment: t?.recordSellerPayment,
    method: t?.method,
    savePayment: t?.savePayment,
    noSalesForCompany: t?.noSalesForCompany,
    noLotsForSeller: t?.noLotsForSeller,
    balance: t?.balance,
    paymentWaiting: t?.paymentWaiting,
    purchaseRecords: t?.purchaseRecords,
    resalesLinked: t?.resalesLinked,
    customersBuying: t?.customersBuying,
    suppliersYouBuy: t?.suppliersYouBuy,
    lotWorkflowTitle: t?.lotWorkflowTitle,
    lotWorkflowSubtitle: t?.lotWorkflowSubtitle,
    lotBasics: t?.lotBasics,
    purchaseDetails: t?.purchaseDetails,
    visualRecord: t?.visualRecord,
    companyLogicText: t?.companyLogicText,
    sellerLogicText: t?.sellerLogicText,
    salesHistoryTitle: t?.salesHistoryTitle,
    salesHistorySubtitle: t?.salesHistorySubtitle,
    noSalesYet: t?.noSalesYet,
    noSalesYetMessage: t?.noSalesYetMessage,
    analyticsLots: t?.analyticsLots,
    analyticsSales: t?.analyticsSales,
    analyticsCompanies: t?.analyticsCompanies,
    analyticsSellers: t?.analyticsSellers,
    collectionRate: t?.collectionRate,
    avgUnpaidAge: t?.avgUnpaidAge,
    bestMarketPrice: t?.bestMarketPrice,
    bestQualityMargin: t?.bestQualityMargin,
    sellingVsReceiving: t?.sellingVsReceiving,
    companyPaymentDiscipline: t?.companyPaymentDiscipline,
    qualityPriceLadder: t?.qualityPriceLadder,
    companyMarketPricing: t?.companyMarketPricing,
    pricingInsight: t?.pricingInsight,
    receivedFromSold: t?.receivedFromSold,
    unpaidBalanceAgeHint: t?.unpaidBalanceAgeHint,
    noCompanyMarketPricing: t?.noCompanyMarketPricing,
    bestPriceCompanyHint: t?.bestPriceCompanyHint,
    bestQualityMarginHint: t?.bestQualityMarginHint,
    noQualityMarginData: t?.noQualityMarginData,
    monthlyFlowSubtitle: t?.monthlyFlowSubtitle,
    paymentDisciplineSubtitle: t?.paymentDisciplineSubtitle,
    qualityPriceSubtitle: t?.qualityPriceSubtitle,
    marketPricingSubtitle: t?.marketPricingSubtitle,
    pricingInsightBody: t?.pricingInsightBody,
    noCompanySalesYet: t?.noCompanySalesYet,
    badCreditFlagged: t?.badCreditFlagged,
    creditStatusNormal: t?.creditStatusNormal,
    outstandingBalance: t?.outstandingBalance,
    oldestUnpaid: t?.oldestUnpaid,
    avgPayDelay: t?.avgPayDelay,
    onTimeRate: t?.onTimeRate,
    noQualityPricingYet: t?.noQualityPricingYet,
    buyPerTonShort: t?.buyPerTonShort,
    sellPerTonShort: t?.sellPerTonShort,
    marginPerTonShort: t?.marginPerTonShort,
    noMarketPricingYet: t?.noMarketPricingYet,
    soldShort: t?.soldShort,
    profitShort: t?.profitShort,
    markBadCredit: t?.markBadCredit,
    clearBadCredit: t?.clearBadCredit,
    deleteCompany: t?.deleteCompany,
    companyHasBadCredit: t?.companyHasBadCredit,
    main: t?.main,
    logout: t?.logout,
    notes: t?.notes,
  };

  const filteredLots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return dashboard.lots;

    return dashboard.lots.filter((lot) => {
      return (
        lot.product_name?.toLowerCase().includes(query) ||
        lot.seller_name?.toLowerCase().includes(query) ||
        lot.color?.toLowerCase().includes(query)
      );
    });
  }, [dashboard.lots, searchQuery]);

  const overview = useMemo(() => {
    const totalInventoryCost = dashboard.lots.reduce((sum, lot) => sum + Number(lot.total_cost || 0), 0);
    const totalRemainingWeight = dashboard.lots.reduce((sum, lot) => sum + Number(lot.remaining_weight_tons || 0), 0);
    const totalSoldValue = dashboard.sales.reduce((sum, sale) => sum + Number(sale.sale_value || 0), 0);
    const totalReceived = dashboard.sales.reduce((sum, sale) => sum + Number(sale.received_amount || 0), 0);

    return {
      totalInventoryCost,
      totalRemainingWeight,
      totalSoldValue,
      totalReceived,
    };
  }, [dashboard]);

  async function apiFetch(path, options = {}) {
    const response = await fetch(path, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async function refreshDashboard(targetUid = user?.uid) {
    if (!targetUid) return;

    try {
      const data = await apiFetch(`/api/dashboard?uid=${targetUid}`);
      setDashboard(data);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function ensureSeller(name, phone = '', address = '') {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const existingSeller = dashboard.sellers.find(
      (seller) => normalizeName(seller.name) === normalizeName(trimmedName)
    );

    if (existingSeller) {
      return existingSeller;
    }

    return apiFetch('/api/sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        name: trimmedName,
        phone,
        address,
      }),
    });
  }

  async function ensureCompany(name, contactPerson = '', phone = '', address = '') {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const existingCompany = dashboard.companies.find(
      (company) => normalizeName(company.name) === normalizeName(trimmedName)
    );

    if (existingCompany) {
      return existingCompany;
    }

    return apiFetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        name: trimmedName,
        contact_person: contactPerson,
        phone,
        address,
      }),
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success(text.loggedIn);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const data = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password }),
      });

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success(text.registered);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem('user');
    setDashboard({
      lots: [],
      sales: [],
      companies: [],
      sellers: [],
      paymentMethods: Object.keys(PAYMENT_METHOD_LABELS),
    });
  }

  async function handleCreateLot(event) {
    event.preventDefault();
    setSubmittingKey('lot');

    try {
      const seller = lotForm.sellerName
        ? await ensureSeller(lotForm.sellerName, lotForm.sellerPhone)
        : null;

      await apiFetch('/api/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          seller_id: seller?.id || null,
          product_name: lotForm.product_name,
          color: lotForm.color,
          quality: lotForm.quality,
          purchase_date: lotForm.purchase_date,
          bought_weight_tons: lotForm.bought_weight_tons,
          cost_per_ton: lotForm.cost_per_ton,
          location: lotForm.location,
          notes: lotForm.notes,
        }),
      });

      setLotForm(createLotForm());
      setShowLotModal(false);
      await refreshDashboard();
      toast.success(text.lotSaved);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleDeleteLot(lotId) {
    if (!window.confirm(text.deleteLotConfirm)) return;

    try {
      await apiFetch(`/api/lots/${lotId}?uid=${user.uid}`, {
        method: 'DELETE',
      });

      await refreshDashboard();
      toast.success(text.lotDeleted);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCreateCompany(event) {
    event.preventDefault();
    setSubmittingKey('company');

    try {
      await ensureCompany(
        companyForm.name,
        companyForm.contact_person,
        companyForm.phone,
        companyForm.address
      );

      setCompanyForm(createCompanyForm());
      await refreshDashboard();
      toast.success(text.companySaved);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleCreateSeller(event) {
    event.preventDefault();
    setSubmittingKey('seller');

    try {
      await ensureSeller(sellerForm.name, sellerForm.phone, sellerForm.address);
      setSellerForm(createSellerForm());
      await refreshDashboard();
      toast.success(text.sellerSaved);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleCreateSale(lot) {
    const form = saleForms[lot.id] || {};
    setSubmittingKey(`sale-${lot.id}`);

    try {
      const company = await ensureCompany(form.companyName || '');
      if (!company) {
        throw new Error(text.companyRequired);
      }

      await apiFetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          lot_id: lot.id,
          company_id: company.id,
          sale_date: form.sale_date || new Date().toISOString().split('T')[0],
          sold_weight_tons: form.sold_weight_tons,
          price_per_ton: form.price_per_ton,
          location: form.location || '',
          notes: form.notes || '',
        }),
      });

      setSaleForms((current) => ({
        ...current,
        [lot.id]: {
          companyName: '',
          sale_date: new Date().toISOString().split('T')[0],
          sold_weight_tons: '',
          price_per_ton: '',
          location: '',
          notes: '',
        },
      }));

      await refreshDashboard();
      toast.success(text.saleRecorded);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleCompanyPayment(company) {
    const form = companyPaymentForms[company.id] || {};
    setSubmittingKey(`company-payment-${company.id}`);

    try {
      await apiFetch(`/api/companies/${company.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          amount: form.amount,
          payment_method: form.payment_method,
          payment_date: form.payment_date || new Date().toISOString().split('T')[0],
          note: form.note || '',
        }),
      });

      setCompanyPaymentForms((current) => ({
        ...current,
        [company.id]: {
          amount: '',
          payment_method: 'wechat_pay',
          payment_date: new Date().toISOString().split('T')[0],
          note: '',
        },
      }));

      await refreshDashboard();
      toast.success(text.companyPaymentAdded);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleToggleCompanyCredit(company) {
    setSubmittingKey(`company-credit-${company.id}`);

    try {
      await apiFetch(`/api/companies/${company.id}/credit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          bad_credit: !company.bad_credit,
        }),
      });

      await refreshDashboard();
      toast.success(!company.bad_credit ? text.markBadCredit : text.clearBadCredit);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleDeleteCompany(company) {
    if (!window.confirm(`${text.deleteCompany}: ${company.name}?`)) return;

    setSubmittingKey(`company-delete-${company.id}`);

    try {
      await apiFetch(`/api/companies/${company.id}?uid=${user.uid}`, {
        method: 'DELETE',
      });

      await refreshDashboard();
      toast.success(text.deleteCompany);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleSellerPayment(seller) {
    const form = sellerPaymentForms[seller.id] || {};
    setSubmittingKey(`seller-payment-${seller.id}`);

    try {
      await apiFetch(`/api/sellers/${seller.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          amount: form.amount,
          payment_method: form.payment_method,
          payment_date: form.payment_date || new Date().toISOString().split('T')[0],
          note: form.note || '',
        }),
      });

      setSellerPaymentForms((current) => ({
        ...current,
        [seller.id]: {
          amount: '',
          payment_method: 'cash',
          payment_date: new Date().toISOString().split('T')[0],
          note: '',
        },
      }));

      await refreshDashboard();
      toast.success(text.sellerPaymentAdded);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  if (loading || !t) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-xl shadow-black/5"
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">
                {isRegistering ? t.register : t.login}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">{text.appSubtitle}</p>
            </div>
            <Button variant="ghost" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </Button>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering ? (
              <Input label={t.name} value={fullName} onChange={(event) => setFullName(event.target.value)} />
            ) : null}
            <Input label={t.email} value={email} onChange={(event) => setEmail(event.target.value)} />
            <Input
              label={t.password}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button type="submit" className="w-full py-3" disabled={authLoading}>
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isRegistering ? t.register : t.login}
            </Button>
          </form>

          <button
            onClick={() => setIsRegistering((current) => !current)}
            className="mt-6 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {isRegistering ? t.alreadyHaveAccount : t.dontHaveAccount}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">{text.appTitle}</h1>
              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              {text.logout}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm h-fit">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.main}</p>
            <div className="mt-3 space-y-2">
              <NavButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package className="w-5 h-5" />}>
                {text.inventoryLots}
              </NavButton>
              <NavButton active={activeTab === 'companies'} onClick={() => setActiveTab('companies')} icon={<Building2 className="w-5 h-5" />}>
                {t.companies}
              </NavButton>
              <NavButton active={activeTab === 'sellers'} onClick={() => setActiveTab('sellers')} icon={<Users className="w-5 h-5" />}>
                {t.sellers}
              </NavButton>
              <NavButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<ArrowRightLeft className="w-5 h-5" />}>
                {text.sales}
              </NavButton>
              <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<Wallet className="w-5 h-5" />}>
                {t.analytics}
              </NavButton>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title={text.inventoryCost} value={formatCurrency(overview.totalInventoryCost)} />
              <StatCard title={text.remainingWeight} value={formatWeight(overview.totalRemainingWeight)} />
              <StatCard title={text.soldValue} value={formatCurrency(overview.totalSoldValue)} />
              <StatCard title={text.received} value={formatCurrency(overview.totalReceived)} />
            </div>

            {activeTab === 'inventory' ? (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black tracking-tight">{text.inventoryLots}</h2>
                      <p className="text-sm text-zinc-400">{text.buyFromSellers}</p>
                    </div>
                    <div className="flex w-full max-w-xl gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder={text.searchLots}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black"
                        />
                      </div>
                      <Button className="shrink-0" onClick={() => setShowLotModal(true)}>
                        <Plus className="w-4 h-4" />
                        {t.addProduct}
                      </Button>
                    </div>
                  </div>
                </div>

                {filteredLots.length === 0 ? (
                  <EmptyState title={text.noLotsYet} message={text.createFirstLot} />
                ) : (
                  <div className="grid gap-5 xl:grid-cols-2">
                    {filteredLots.map((lot) => {
                      const saleForm = saleForms[lot.id] || {
                        companyName: '',
                        sale_date: new Date().toISOString().split('T')[0],
                        sold_weight_tons: '',
                        price_per_ton: '',
                        location: '',
                        notes: '',
                      };

                      return (
                        <div key={lot.id} className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-sm">
                          <div className="flex gap-4 border-b border-zinc-100 p-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
                              <Package className="w-7 h-7 text-zinc-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="text-lg font-black text-zinc-900">{lot.product_name}</h3>
                                  <p className="text-sm text-zinc-400">{lot.seller_name || text.noSellerLinked} • {lot.purchase_date}</p>
                                </div>
                                <Button variant="ghost" onClick={() => handleDeleteLot(lot.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <MiniMetric label={text.bought} value={formatWeight(lot.bought_weight_tons)} />
                                <MiniMetric label={text.sold} value={formatWeight(lot.sold_weight_tons)} />
                                <MiniMetric label={text.remaining} value={formatWeight(lot.remaining_weight_tons)} />
                                <MiniMetric label={t.totalCost} value={formatCurrency(lot.total_cost)} />
                              </div>
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="rounded-3xl bg-zinc-50 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.sellThisLot}</h4>
                                <span className="text-xs font-semibold text-zinc-400">{text.oneLotManySales}</span>
                              </div>
                              <div className="grid gap-3 md:grid-cols-3">
                                <Input label={t.company} list={`company-options-${lot.id}`} value={saleForm.companyName} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, companyName: event.target.value } }))} placeholder={t.company} />
                                <Input label={text.saleDate} type="date" value={saleForm.sale_date} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, sale_date: event.target.value } }))} />
                                <Input label={text.weightSoldShort} type="number" step="0.001" value={saleForm.sold_weight_tons} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, sold_weight_tons: event.target.value } }))} />
                                <Input label={t.pricePerTon} type="number" step="0.01" value={saleForm.price_per_ton} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, price_per_ton: event.target.value } }))} />
                                <Input label={t.location} value={saleForm.location} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, location: event.target.value } }))} />
                                <div className="flex items-end">
                                  <Button className="w-full h-[50px]" onClick={() => handleCreateSale(lot)} disabled={submittingKey === `sale-${lot.id}`}>
                                    {submittingKey === `sale-${lot.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {text.addSale}
                                  </Button>
                                </div>
                                <datalist id={`company-options-${lot.id}`}>
                                  {dashboard.companies.map((company) => (
                                    <option key={company.id} value={company.name} />
                                  ))}
                                </datalist>
                              </div>
                            </div>

                            <div className="mt-4 space-y-3">
                              {lot.sales.length === 0 ? (
                                <p className="text-sm text-zinc-400">{text.noSalesForLot}</p>
                              ) : (
                                lot.sales.map((sale) => (
                                  <div key={sale.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <p className="font-bold text-zinc-900">{sale.company_name}</p>
                                        <p className="text-sm text-zinc-400">{sale.sale_date} • {formatWeight(sale.sold_weight_tons)} at {formatCurrency(sale.price_per_ton)}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-black text-zinc-900">{formatCurrency(sale.sale_value)}</p>
                                        <p className={`text-xs font-bold ${sale.outstanding_amount > 0 ? 'text-orange-500' : 'text-emerald-600'}`}>
                                          {text.outstanding} {formatCurrency(sale.outstanding_amount)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === 'companies' ? (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black tracking-tight">{t.companies}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{text.companyLogicText}</p>
                  <form onSubmit={handleCreateCompany} className="mt-5 grid gap-4 md:grid-cols-4">
                    <Input label={t.company} value={companyForm.name} onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))} />
                    <Input label={text.contactPerson} value={companyForm.contact_person} onChange={(event) => setCompanyForm((current) => ({ ...current, contact_person: event.target.value }))} />
                    <Input label={t.phone} value={companyForm.phone} onChange={(event) => setCompanyForm((current) => ({ ...current, phone: event.target.value }))} />
                    <div className="flex items-end">
                      <Button type="submit" className="w-full h-[50px]" disabled={submittingKey === 'company'}>
                        {submittingKey === 'company' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {text.saveCompany}
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="grid gap-6 2xl:grid-cols-2">
                  {dashboard.companies.map((company) => {
                    const paymentForm = companyPaymentForms[company.id] || {
                      amount: '',
                      payment_method: 'wechat_pay',
                      payment_date: new Date().toISOString().split('T')[0],
                      note: '',
                    };
                    const companyPayments = company.sales
                      .flatMap((sale) =>
                        (sale.payments || []).map((payment) => ({
                          ...payment,
                          sale_label: sale.lot_product_name,
                        }))
                      )
                      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

                    return (
                      <div key={company.id} className={`rounded-[2rem] border p-6 shadow-sm transition-all ${
                        company.bad_credit
                          ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white'
                          : 'border-zinc-100 bg-gradient-to-br from-white via-white to-sky-50/50'
                      }`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-lg font-black">{company.name}</h3>
                            <p className="text-sm text-zinc-400">{company.contact_person || 'No contact person'} • {company.phone || 'No phone'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {company.bad_credit ? (
                              <div className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-600">
                                {text.companyHasBadCredit}
                              </div>
                            ) : null}
                            <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-600">
                              {company.sales.length} {text.sales}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-white/90 px-4 py-4 border border-zinc-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.bought}</p>
                            <p className="mt-1 text-lg font-black">{formatCurrency(company.total_bought_cost)}</p>
                          </div>
                          <div className="rounded-2xl bg-white/90 px-4 py-4 border border-zinc-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.soldValue}</p>
                            <p className="mt-1 text-lg font-black">{formatCurrency(company.total_sold_value)}</p>
                          </div>
                          <div className="rounded-2xl bg-emerald-50 px-4 py-4 border border-emerald-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{text.received}</p>
                            <p className="mt-1 text-lg font-black text-emerald-700">{formatCurrency(company.total_received)}</p>
                          </div>
                          <div className={`rounded-2xl px-4 py-4 border ${
                            Number(company.balance_owed) > 0 ? 'bg-orange-50 border-orange-100' : 'bg-zinc-900 border-zinc-900'
                          }`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${
                              Number(company.balance_owed) > 0 ? 'text-orange-600' : 'text-zinc-400'
                            }`}>{t.balanceOwed}</p>
                            <p className={`mt-1 text-lg font-black ${
                              Number(company.balance_owed) > 0 ? 'text-orange-700' : 'text-white'
                            }`}>{formatCurrency(company.balance_owed)}</p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-[1.75rem] border border-zinc-200 bg-white/85 p-4 shadow-sm">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.recordReceivedPayment}</h4>
                              <p className="mt-1 text-sm text-zinc-400">{companyPayments.length} saved records</p>
                            </div>
                            <p className="text-xs font-semibold text-zinc-400">{text.received} {formatCurrency(company.total_received)}</p>
                          </div>
                          <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr_auto]">
                            <Input label={t.amount} type="number" step="0.01" value={paymentForm.amount} onChange={(event) => setCompanyPaymentForms((current) => ({ ...current, [company.id]: { ...paymentForm, amount: event.target.value } }))} />
                            <Select label={text.method} value={paymentForm.payment_method} onChange={(event) => setCompanyPaymentForms((current) => ({ ...current, [company.id]: { ...paymentForm, payment_method: event.target.value } }))} options={paymentMethodOptions} />
                            <Input label={t.paymentDate} type="date" value={paymentForm.payment_date} onChange={(event) => setCompanyPaymentForms((current) => ({ ...current, [company.id]: { ...paymentForm, payment_date: event.target.value } }))} />
                            <div className="flex items-end">
                              <Button className="h-[50px] w-full lg:w-auto lg:px-6" variant="success" onClick={() => handleCompanyPayment(company)} disabled={submittingKey === `company-payment-${company.id}`}>
                                {submittingKey === `company-payment-${company.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                                {text.savePayment}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            variant={company.bad_credit ? 'secondary' : 'outline'}
                            onClick={() => handleToggleCompanyCredit(company)}
                            disabled={submittingKey === `company-credit-${company.id}`}
                          >
                            {submittingKey === `company-credit-${company.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                            {company.bad_credit ? text.clearBadCredit : text.markBadCredit}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteCompany(company)}
                            disabled={submittingKey === `company-delete-${company.id}`}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            {submittingKey === `company-delete-${company.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            {text.deleteCompany}
                          </Button>
                        </div>

                        <div className="mt-5 space-y-4">
                          {companyPayments.length > 0 ? (
                            <div className="rounded-[1.75rem] border border-zinc-100 bg-zinc-50/80 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.recordReceivedPayment}</h4>
                                <span className="text-xs font-semibold text-zinc-400">{companyPayments.length} items</span>
                              </div>
                              <div className="space-y-2">
                                {companyPayments.slice(0, 5).map((payment) => (
                                  <PaymentRecordRow
                                    key={payment.id}
                                    amount={payment.amount}
                                    method={payment.payment_method}
                                    date={payment.payment_date}
                                    detail={payment.sale_label}
                                    lang={lang}
                                    tone="emerald"
                                  />
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {company.sales.length === 0 ? (
                            <p className="text-sm text-zinc-400">{text.noSalesForCompany}</p>
                          ) : (
                            company.sales.map((sale) => (
                              <div key={sale.id} className="rounded-[1.75rem] border border-zinc-100 bg-zinc-50/70 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-bold">{sale.lot_product_name}</p>
                                    <p className="text-sm text-zinc-400">{sale.sale_date} • {formatWeight(sale.sold_weight_tons)}</p>
                                  </div>
                                  <div className="sm:text-right">
                                    <p className="font-black">{formatCurrency(sale.sale_value)}</p>
                                    <p className="text-xs text-zinc-400">{t.totalCost} {formatCurrency(sale.lot_cost)}</p>
                                  </div>
                                </div>
                                {sale.payments.length > 0 ? (
                                  <div className="mt-4 space-y-2 border-t border-zinc-200 pt-3">
                                    {sale.payments.map((payment) => (
                                      <PaymentRecordRow
                                        key={payment.id}
                                        amount={payment.amount}
                                        method={payment.payment_method}
                                        date={payment.payment_date}
                                        lang={lang}
                                        tone="emerald"
                                      />
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {activeTab === 'sellers' ? (
              <section className="space-y-6">
                <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black tracking-tight">{t.sellers}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{text.sellerLogicText}</p>
                  <form onSubmit={handleCreateSeller} className="mt-5 grid gap-4 md:grid-cols-4">
                    <Input label={t.seller} value={sellerForm.name} onChange={(event) => setSellerForm((current) => ({ ...current, name: event.target.value }))} />
                    <Input label={t.phone} value={sellerForm.phone} onChange={(event) => setSellerForm((current) => ({ ...current, phone: event.target.value }))} />
                    <Input label={text.address} value={sellerForm.address} onChange={(event) => setSellerForm((current) => ({ ...current, address: event.target.value }))} />
                    <div className="flex items-end">
                      <Button type="submit" className="w-full h-[50px]" disabled={submittingKey === 'seller'}>
                        {submittingKey === 'seller' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {text.saveSeller}
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="grid gap-6 2xl:grid-cols-2">
                  {dashboard.sellers.map((seller) => {
                    const paymentForm = sellerPaymentForms[seller.id] || {
                      amount: '',
                      payment_method: 'cash',
                      payment_date: new Date().toISOString().split('T')[0],
                      note: '',
                    };
                    const sellerPayments = seller.lots
                      .flatMap((lot) =>
                        (lot.seller_payments || []).map((payment) => ({
                          ...payment,
                          lot_label: lot.product_name,
                        }))
                      )
                      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

                    return (
                      <div key={seller.id} className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-lg font-black">{seller.name}</h3>
                            <p className="text-sm text-zinc-400">{seller.phone || 'No phone'} • {seller.address || 'No address'}</p>
                          </div>
                          <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-600">
                            {seller.lots.length} lots
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <MiniMetric label={text.bought} value={formatCurrency(seller.total_bought_cost)} />
                          <MiniMetric label={t.paid} value={formatCurrency(seller.total_paid)} tone="emerald" />
                          <MiniMetric label={text.balance} value={formatCurrency(seller.balance_owed)} tone={Number(seller.balance_owed) > 0 ? 'orange' : 'dark'} />
                        </div>

                        <div className="mt-5 rounded-[1.75rem] border border-zinc-200 bg-white/85 p-4 shadow-sm">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.recordSellerPayment}</h4>
                              <p className="mt-1 text-sm text-zinc-400">{sellerPayments.length} saved records</p>
                            </div>
                            <p className="text-xs font-semibold text-zinc-400">{t.paid} {formatCurrency(seller.total_paid)}</p>
                          </div>
                          <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr_auto]">
                            <Input label={t.amount} type="number" step="0.01" value={paymentForm.amount} onChange={(event) => setSellerPaymentForms((current) => ({ ...current, [seller.id]: { ...paymentForm, amount: event.target.value } }))} />
                            <Select label={text.method} value={paymentForm.payment_method} onChange={(event) => setSellerPaymentForms((current) => ({ ...current, [seller.id]: { ...paymentForm, payment_method: event.target.value } }))} options={paymentMethodOptions} />
                            <Input label={t.paymentDate} type="date" value={paymentForm.payment_date} onChange={(event) => setSellerPaymentForms((current) => ({ ...current, [seller.id]: { ...paymentForm, payment_date: event.target.value } }))} />
                            <div className="flex items-end">
                              <Button className="h-[50px] w-full lg:w-auto lg:px-6" variant="success" onClick={() => handleSellerPayment(seller)} disabled={submittingKey === `seller-payment-${seller.id}`}>
                                {submittingKey === `seller-payment-${seller.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                                {text.savePayment}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {sellerPayments.length > 0 ? (
                            <div className="rounded-[1.75rem] border border-zinc-100 bg-zinc-50/80 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.recordSellerPayment}</h4>
                                <span className="text-xs font-semibold text-zinc-400">{sellerPayments.length} items</span>
                              </div>
                              <div className="space-y-2">
                                {sellerPayments.slice(0, 5).map((payment) => (
                                  <PaymentRecordRow
                                    key={payment.id}
                                    amount={payment.amount}
                                    method={payment.payment_method}
                                    date={payment.payment_date}
                                    detail={payment.lot_label}
                                    lang={lang}
                                    tone="emerald"
                                  />
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {seller.lots.length === 0 ? (
                            <p className="text-sm text-zinc-400">{text.noLotsForSeller}</p>
                          ) : (
                            seller.lots.map((lot) => (
                              <div key={lot.id} className="rounded-[1.75rem] border border-zinc-100 bg-zinc-50/70 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-bold">{lot.product_name}</p>
                                    <p className="text-sm text-zinc-400">{formatWeight(lot.bought_weight_tons)} • {lot.purchase_date}</p>
                                  </div>
                                  <div className="sm:text-right">
                                    <p className="font-black">{formatCurrency(lot.total_cost)}</p>
                                    <p className="text-xs text-zinc-400">{t.paid} {formatCurrency(lot.seller_paid_amount)}</p>
                                  </div>
                                </div>
                                {lot.seller_payments?.length > 0 ? (
                                  <div className="mt-4 space-y-2 border-t border-zinc-200 pt-3">
                                    {lot.seller_payments.map((payment) => (
                                      <PaymentRecordRow
                                        key={payment.id}
                                        amount={payment.amount}
                                        method={payment.payment_method}
                                        date={payment.payment_date}
                                        lang={lang}
                                        tone="emerald"
                                      />
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {activeTab === 'sales' ? (
              <section className="space-y-4">
                <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black tracking-tight">{text.salesHistoryTitle}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{text.salesHistorySubtitle}</p>
                </div>
                {dashboard.sales.length === 0 ? (
                  <EmptyState title={text.noSalesYet} message={text.noSalesYetMessage} />
                ) : (
                  <div className="space-y-3">
                    {dashboard.sales.map((sale) => (
                      <div key={sale.id} className="rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black">{sale.lot_product_name}</h3>
                            <p className="text-sm text-zinc-400">{sale.company_name} • {sale.sale_date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black">{formatCurrency(sale.sale_value)}</p>
                            <p className="text-xs text-zinc-400">{formatWeight(sale.sold_weight_tons)} • {t.summary} {formatCurrency(sale.profit)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {sale.payments.map((payment) => (
                            <span key={payment.id} className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
                              {payment.payment_date} • {PAYMENT_METHOD_LABELS[payment.payment_method]?.[lang]} • {formatCurrency(payment.amount)}
                            </span>
                          ))}
                          {sale.payments.length === 0 ? (
                            <span className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-xs font-semibold text-orange-500">
                              {text.paymentWaiting}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === 'analytics' ? (
              <AnalyticsDashboard dashboard={dashboard} text={text} lang={lang} />
            ) : null}
          </main>
        </div>
      </div>

      {showLotModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLotModal(false)} />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-black tracking-tight">{text.lotWorkflowTitle}</h3>
                <p className="mt-1 text-sm text-zinc-400">{text.lotWorkflowSubtitle}</p>
              </div>
              <button
                onClick={() => setShowLotModal(false)}
                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="space-y-6 p-6">
              <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.lotBasics}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input label={t.productName} value={lotForm.product_name} onChange={(event) => setLotForm((current) => ({ ...current, product_name: event.target.value }))} />
                      <Input label={t.seller} list="seller-name-options" value={lotForm.sellerName} onChange={(event) => setLotForm((current) => ({ ...current, sellerName: event.target.value }))} placeholder={t.seller} />
                      <Input label={t.phone} value={lotForm.sellerPhone} onChange={(event) => setLotForm((current) => ({ ...current, sellerPhone: event.target.value }))} />
                      <Input label={t.date} type="date" value={lotForm.purchase_date} onChange={(event) => setLotForm((current) => ({ ...current, purchase_date: event.target.value }))} />
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/50 p-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-amber-600">{text.purchaseDetails}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input label={text.boughtWeight} type="number" step="0.001" value={lotForm.bought_weight_tons} onChange={(event) => setLotForm((current) => ({ ...current, bought_weight_tons: event.target.value }))} />
                      <Input label={text.costPerTon} type="number" step="0.01" value={lotForm.cost_per_ton} onChange={(event) => setLotForm((current) => ({ ...current, cost_per_ton: event.target.value }))} />
                      <Input label={t.color} value={lotForm.color} onChange={(event) => setLotForm((current) => ({ ...current, color: event.target.value }))} />
                      <Select
                        label={t.quality}
                        value={lotForm.quality}
                        onChange={(event) => setLotForm((current) => ({ ...current, quality: event.target.value }))}
                        options={QUALITY_OPTIONS.map((quality) => ({ value: quality, label: t[quality.toLowerCase()] || quality }))}
                      />
                      <Input label={t.location} value={lotForm.location} onChange={(event) => setLotForm((current) => ({ ...current, location: event.target.value }))} />
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.notes}</span>
                        <textarea
                          value={lotForm.notes}
                          onChange={(event) => setLotForm((current) => ({ ...current, notes: event.target.value }))}
                          className="min-h-[48px] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.75rem] border border-zinc-100 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 text-white">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.visualRecord}</p>
                  <div className="flex min-h-[260px] flex-col justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <div>
                      <p className="text-2xl font-black tracking-tight">{lotForm.product_name || t.addProduct}</p>
                      <p className="mt-2 text-sm text-zinc-300">{lotForm.sellerName || t.seller}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.boughtWeight}</p>
                        <p className="mt-1 text-sm font-black text-white">{lotForm.bought_weight_tons || '0'} T</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.costPerTon}</p>
                        <p className="mt-1 text-sm font-black text-white">{lotForm.cost_per_ton ? formatCurrency(lotForm.cost_per_ton) : formatCurrency(0)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.quality}</p>
                        <p className="mt-1 text-sm font-black text-white">{lotForm.quality}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.color}</p>
                        <p className="mt-1 text-sm font-black text-white">{lotForm.color || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-5">
                <Button type="button" variant="secondary" onClick={() => setShowLotModal(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={submittingKey === 'lot'}>
                  {submittingKey === 'lot' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {text.saveLot}
                </Button>
              </div>

              <datalist id="seller-name-options">
                {dashboard.sellers.map((seller) => (
                  <option key={seller.id} value={seller.name} />
                ))}
              </datalist>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavButton({ children, active, icon, ...props }) {
  return (
    <button
      {...props}
      className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all flex items-center gap-3 ${
        active ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function MiniMetric({ label, value, tone = 'default' }) {
  const tones = {
    default: 'border-zinc-100 bg-white text-zinc-900 label:text-zinc-400',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800 label:text-emerald-600',
    orange: 'border-orange-100 bg-orange-50 text-orange-800 label:text-orange-600',
    dark: 'border-zinc-900 bg-zinc-900 text-white label:text-zinc-400',
  };

  const toneClass = tones[tone] || tones.default;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${tone === 'default' ? 'text-zinc-400' : tone === 'emerald' ? 'text-emerald-600' : tone === 'orange' ? 'text-orange-600' : 'text-zinc-400'}`}>{label}</p>
      <p className={`mt-1 text-sm font-black ${tone === 'dark' ? 'text-white' : tone === 'emerald' ? 'text-emerald-800' : tone === 'orange' ? 'text-orange-800' : 'text-zinc-900'}`}>{value}</p>
    </div>
  );
}

function PaymentRecordRow({ amount, method, date, detail, lang, tone = 'emerald' }) {
  const accent = tone === 'emerald'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-zinc-100 text-zinc-700 border-zinc-200';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${accent}`}>
          {PAYMENT_METHOD_LABELS[method]?.[lang] || method}
        </div>
        <p className="mt-2 text-sm font-semibold text-zinc-900">{formatCurrency(amount)}</p>
        {detail ? <p className="mt-1 truncate text-xs text-zinc-400">{detail}</p> : null}
      </div>
      <div className="text-sm font-medium text-zinc-500 sm:text-right">{date}</div>
    </div>
  );
}
