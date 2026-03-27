import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
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
const USD_EXCHANGE_RATE = 7;
const SINGAPORE_TIMEZONE = 'Asia/Singapore';

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

const createOperationalCostForm = () => ({
  cost_type: '',
  calc_mode: 'amount',
  quantity: '1',
  unit_cost: '',
  amount: '',
  cost_date: new Date().toISOString().split('T')[0],
  note: '',
});

function inferOperationalCostCategory(costType) {
  const value = String(costType || '').trim().toLowerCase();
  if (!value) return 'other';

  if (
    value.includes('driver') ||
    value.includes('transport') ||
    value.includes('truck') ||
    value.includes('fuel') ||
    value.includes('petrol') ||
    value.includes('toll') ||
    value.includes('司机') ||
    value.includes('运输') ||
    value.includes('油') ||
    value.includes('路费')
  ) {
    return 'driver';
  }

  if (
    value.includes('labour') ||
    value.includes('labor') ||
    value.includes('loading') ||
    value.includes('unload') ||
    value.includes('搬运') ||
    value.includes('装货') ||
    value.includes('卸货')
  ) {
    return 'labour';
  }

  return 'other';
}

const createLotReturnForm = () => ({
  return_weight_tons: '',
  return_date: new Date().toISOString().split('T')[0],
  return_reason: '',
});

const normalizeName = (value) => value?.trim().toLowerCase() || '';

const formatCurrency = (value) =>
  `¥${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatUsd = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

function formatPaymentAmount(amount, method, lang = 'en') {
  const cnyAmount = Number(amount || 0);
  if (method === 'usd') {
    const usdAmount = cnyAmount / USD_EXCHANGE_RATE;
    if (lang === 'zh') {
      return `${formatUsd(usdAmount)}（${formatCurrency(cnyAmount)} 人民币，汇率 x${USD_EXCHANGE_RATE}）`;
    }
    return `${formatUsd(usdAmount)} (${formatCurrency(cnyAmount)} CNY, x${USD_EXCHANGE_RATE})`;
  }
  return formatCurrency(cnyAmount);
}

const formatWeight = (value, lang = 'en') =>
  `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} ${lang === 'zh' ? '吨' : 'tons'}`;

function formatDateTimeInSingapore(value, lang = 'en') {
  if (!value) return '-';

  const raw = String(value).trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const parsed = isDateOnly
    ? new Date(`${raw}T00:00:00+08:00`)
    : new Date(raw);

  if (Number.isNaN(parsed.getTime())) return raw;

  const locale = lang === 'zh' ? 'zh-CN' : 'en-SG';
  const options = isDateOnly
    ? {
        timeZone: SINGAPORE_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }
    : {
        timeZone: SINGAPORE_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };

  const formatted = new Intl.DateTimeFormat(locale, options).format(parsed);
  return isDateOnly ? formatted : `${formatted} SGT`;
}

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
      className={`min-h-[46px] px-4 py-2.5 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-center ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, className = '', size = 'default', ...props }) => (
  <label className={`min-w-0 flex flex-col gap-1.5 ${className}`}>
    {label ? (
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    ) : null}
    <input
      {...props}
      className={`w-full min-w-0 border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black ${
        size === 'compact'
          ? 'rounded-lg px-3 py-2 text-[13px]'
          : 'rounded-xl px-3 py-2.5 text-[14px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm'
      } ${props.className || ''}`}
    />
  </label>
);

const Select = ({ label, options, className = '', size = 'default', ...props }) => (
  <label className={`min-w-0 flex flex-col gap-1.5 ${className}`}>
    {label ? (
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    ) : null}
    <select
      {...props}
      className={`w-full min-w-0 border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black ${
        size === 'compact'
          ? 'rounded-lg px-3 py-2 text-[13px]'
          : 'rounded-xl px-3 py-2.5 text-[14px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm'
      } ${props.className || ''}`}
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
  <div className="max-w-full rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{title}</p>
    <p className="mt-2 break-words text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">{value}</p>
    {hint ? <p className="mt-2 text-xs text-zinc-400">{hint}</p> : null}
  </div>
);

const EmptyState = ({ title, message }) => (
  <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-10 text-center">
    <p className="text-lg font-bold text-zinc-700">{title}</p>
    <p className="mt-2 text-sm text-zinc-400">{message}</p>
  </div>
);

const MobileDisclosure = ({ title, subtitle, defaultOpen = false, children }) => (
  <details
    open={defaultOpen}
    className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 group"
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-black text-zinc-900">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p> : null}
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="mt-3">{children}</div>
  </details>
);

const DesktopDisclosure = ({ title, subtitle, defaultOpen = false, children }) => (
  <details
    open={defaultOpen}
    className="rounded-[1.75rem] border border-zinc-100 bg-zinc-50/80 p-4 group"
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
      <div className="min-w-0">
        <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{title}</h4>
        {subtitle ? <p className="mt-1 text-xs text-zinc-400">{subtitle}</p> : null}
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="mt-4">{children}</div>
  </details>
);

function MobileTabBar({ activeTab, onChange, items }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto max-w-md rounded-[1.7rem] border border-white/60 bg-white/85 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl">
        <div className="grid grid-cols-6 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={`flex min-h-[58px] flex-col items-center justify-center rounded-2xl px-1 py-1 text-center transition-all ${
                  active ? 'bg-black text-white shadow-md shadow-black/20' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="mt-1 text-[10px] font-semibold leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
    operationalCosts: [],
    returnAlertThreshold: 3,
  });
  const [lotForm, setLotForm] = useState(createLotForm());
  const [companyForm, setCompanyForm] = useState(createCompanyForm());
  const [sellerForm, setSellerForm] = useState(createSellerForm());
  const [operationalCostForm, setOperationalCostForm] = useState(createOperationalCostForm());
  const [saleForms, setSaleForms] = useState({});
  const [companyPaymentForms, setCompanyPaymentForms] = useState({});
  const [sellerPaymentForms, setSellerPaymentForms] = useState({});
  const [lotReturnForms, setLotReturnForms] = useState({});
  const [lotQualityDrafts, setLotQualityDrafts] = useState({});
  const [expandedLotIds, setExpandedLotIds] = useState({});
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
  const operationalCostTypeSuggestions = [
    t?.categoryDriver || 'Driver fee',
    t?.categoryLabour || 'Labour',
    lang === 'zh' ? '装卸费' : 'Truck loading',
    lang === 'zh' ? '过磅费' : 'Weighbridge fee',
    lang === 'zh' ? '油费' : 'Fuel',
    lang === 'zh' ? '路费' : 'Toll',
    t?.categoryOther || 'Other',
  ];
  const operationalCostCalcModeOptions = [
    { value: 'amount', label: t?.calcByAmount || 'Direct amount' },
    { value: 'quantity', label: t?.calcByQuantity || 'Quantity × unit cost' },
  ];

  const text = {
    appTitle: t?.appTitle,
    appSubtitle: t?.appSubtitle,
    inventoryLots: t?.inventoryLots,
    sales: t?.sales,
    inventoryCost: t?.inventoryCost,
    remainingWeight: t?.remainingWeight,
    soldValue: t?.soldValue,
    received: t?.received,
    totalCost: t?.totalCost,
    today: t?.today,
    thisMonth: t?.thisMonth,
    thisYear: t?.thisYear,
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
    createSellerFirst: t?.createSellerFirst,
    outstanding: t?.outstanding,
    companySaved: t?.companySaved,
    sellerSaved: t?.sellerSaved,
    companyRequired: t?.companyRequired,
    createCompanyFirst: t?.createCompanyFirst,
    saleRecorded: t?.saleRecorded,
    companyPaymentAdded: t?.companyPaymentAdded,
    sellerPaymentAdded: t?.sellerPaymentAdded,
    loggedIn: t?.loggedIn,
    registered: t?.registered,
    saveCompany: t?.saveCompany,
    saveSeller: t?.saveSeller,
    contactPerson: t?.contactPerson,
    address: t?.address,
    noContactPerson: t?.noContactPerson,
    noPhone: t?.noPhone,
    noAddress: t?.noAddress,
    recordReceivedPayment: t?.recordReceivedPayment,
    recordSellerPayment: t?.recordSellerPayment,
    recordSellerReturn: t?.recordSellerReturn,
    method: t?.method,
    productLot: t?.productLot,
    returnWeight: t?.returnWeight,
    returnDate: t?.returnDate,
    returnReason: t?.returnReason,
    returnAmount: t?.returnAmount,
    returnAmountAutoHint: t?.returnAmountAutoHint,
    saveReturn: t?.saveReturn,
    sellerReturnAdded: t?.sellerReturnAdded,
    updateQuality: t?.updateQuality,
    qualityUpdated: t?.qualityUpdated,
    noReturnRecords: t?.noReturnRecords,
    returnCount: t?.returnCount,
    qualityRisk: t?.qualityRisk,
    savePayment: t?.savePayment,
    recordsLabel: t?.recordsLabel,
    noPaymentRecords: t?.noPaymentRecords,
    usdAutoConvertHint: t?.usdAutoConvertHint,
    noSalesForCompany: t?.noSalesForCompany,
    noLotsForSeller: t?.noLotsForSeller,
    balance: t?.balance,
    oweSeller: t?.oweSeller,
    paymentWaiting: t?.paymentWaiting,
    purchaseRecords: t?.purchaseRecords,
    resalesLinked: t?.resalesLinked,
    customersBuying: t?.customersBuying,
    suppliersYouBuy: t?.suppliersYouBuy,
    operationalCosts: t?.operationalCosts,
    saveOperationalCost: t?.saveOperationalCost,
    operationalCostSubtitle: t?.operationalCostSubtitle,
    costCategory: t?.costCategory,
    costType: t?.costType,
    costTypePlaceholder: t?.costTypePlaceholder,
    calcMode: t?.calcMode,
    calcByAmount: t?.calcByAmount,
    calcByQuantity: t?.calcByQuantity,
    calculatedAmount: t?.calculatedAmount,
    categoryDriver: t?.categoryDriver,
    categoryLabour: t?.categoryLabour,
    categoryOther: t?.categoryOther,
    quantityLabel: t?.quantityLabel,
    unitCostLabel: t?.unitCostLabel,
    costDate: t?.costDate,
    costNote: t?.costNote,
    amountOptional: t?.amountOptional,
    noOperationalCostsYet: t?.noOperationalCostsYet,
    operationalCostSaved: t?.operationalCostSaved,
    operationalCostDeleted: t?.operationalCostDeleted,
    thisMonthOtherCost: t?.thisMonthOtherCost,
    thisMonthOtherCostHint: t?.thisMonthOtherCostHint,
    thisMonthCostChartTitle: t?.thisMonthCostChartTitle,
    thisMonthCostChartSubtitle: t?.thisMonthCostChartSubtitle,
    costByCategory: t?.costByCategory,
    operationalCostRecordsTitle: t?.operationalCostRecordsTitle,
    recordCountUnit: t?.recordCountUnit,
    lotWorkflowTitle: t?.lotWorkflowTitle,
    lotWorkflowSubtitle: t?.lotWorkflowSubtitle,
    lotBasics: t?.lotBasics,
    purchaseDetails: t?.purchaseDetails,
    visualRecord: t?.visualRecord,
    companyLogicText: t?.companyLogicText,
    sellerLogicText: t?.sellerLogicText,
    markBadSeller: t?.markBadSeller,
    clearBadSeller: t?.clearBadSeller,
    deleteSeller: t?.deleteSeller,
    deleteSellerConfirm: t?.deleteSellerConfirm,
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
    totalProfit: t?.totalProfit,
    totalProfitHint: t?.totalProfitHint,
    totalProfitPanel: t?.totalProfitPanel,
    totalProfitPanelSubtitle: t?.totalProfitPanelSubtitle,
    topProfitCompany: t?.topProfitCompany,
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
    best: t?.best,
    good: t?.good,
    normal: t?.normal,
    bad: t?.bad,
    worst: t?.worst,
    buyPerTonShort: t?.buyPerTonShort,
    sellPerTonShort: t?.sellPerTonShort,
    marginPerTonShort: t?.marginPerTonShort,
    noMarketPricingYet: t?.noMarketPricingYet,
    soldShort: t?.soldShort,
    profitShort: t?.profitShort,
    tonsUnit: t?.tonsUnit,
    tonUnit: t?.tonUnit,
    dayUnit: t?.dayUnit,
    markBadCredit: t?.markBadCredit,
    clearBadCredit: t?.clearBadCredit,
    deleteCompany: t?.deleteCompany,
    companyHasBadCredit: t?.companyHasBadCredit,
    main: t?.main,
    logout: t?.logout,
  };

  const formatWeightDisplay = (value) => formatWeight(value, lang);
  const formatPaymentAmountDisplay = (amount, method) => formatPaymentAmount(amount, method, lang);
  const formatDateDisplay = (value) => formatDateTimeInSingapore(value, lang);
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
  const operationalCostSummary = useMemo(() => {
    const todayInSingapore = new Intl.DateTimeFormat('en-CA', {
      timeZone: SINGAPORE_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const thisMonthPrefix = todayInSingapore.slice(0, 7);
    const thisYearPrefix = todayInSingapore.slice(0, 4);
    const thisMonthTypeMap = new Map();
    let thisDayTotal = 0;
    let lifetimeTotal = 0;
    let thisMonthTotal = 0;
    let thisYearTotal = 0;

    (dashboard.operationalCosts || []).forEach((cost) => {
      const amount = Number(cost.amount || 0);
      const costDate = String(cost.cost_date || '').slice(0, 10);
      const costType = String(cost.cost_type || cost.category || 'other').trim() || 'other';

      lifetimeTotal += amount;
      if (!costDate) return;
      if (costDate.startsWith(thisYearPrefix)) {
        thisYearTotal += amount;
      }
      if (costDate === todayInSingapore) {
        thisDayTotal += amount;
      }
      if (costDate.startsWith(thisMonthPrefix)) {
        thisMonthTotal += amount;
        thisMonthTypeMap.set(costType, (thisMonthTypeMap.get(costType) || 0) + amount);
      }
    });

    const thisMonthRows = Array.from(thisMonthTypeMap.entries())
      .map(([type, amount]) => ({
        type,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      thisDayTotal,
      lifetimeTotal,
      thisMonthTotal,
      thisYearTotal,
      thisMonthRows,
    };
  }, [dashboard.operationalCosts]);
  const operationalCostComputedAmount = Number(operationalCostForm.quantity || 0) * Number(operationalCostForm.unit_cost || 0);
  const isOperationalCostQuantityMode = operationalCostForm.calc_mode === 'quantity';
  const localizedApiErrorMap = {
    'Request failed': '请求失败',
    'uid is required': '缺少用户信息，请重新登录。',
    'Seller name is required': '必须填写卖家名称。',
    'Failed to fetch sellers': '获取卖家列表失败。',
    'Failed to save seller': '保存卖家失败。',
    'Valid payment amount is required': '请输入有效付款金额。',
    'payment_method is required': '请选择付款方式。',
    'Seller has no purchase lots yet': '该卖家还没有进货批次。',
    'No unpaid seller balance found': '没有可付款的欠款记录。',
    'Failed to add seller payment': '添加卖家付款失败。',
    'Valid seller id is required': '卖家信息无效。',
    'lot_id is required': '缺少产品批次信息。',
    'Valid return_weight_tons is required': '请输入有效退货重量。',
    'Lot not found for this seller': '未找到该卖家的对应批次。',
    'This lot has no remaining returnable weight': '该批次没有可退货重量。',
    'Return weight exceeds remaining unsold lot weight': '退货重量超过当前可退重量。',
    'Failed to record seller return': '保存退货失败。',
    'Seller not found': '卖家不存在。',
    'Failed to update seller quality status': '更新卖家品质状态失败。',
    'Failed to delete seller': '删除卖家失败。',
    'Product name is required': '必须填写产品名称。',
    'Purchase date is required': '必须填写进货日期。',
    'Weight and cost must be valid numbers': '重量和成本必须是有效数字。',
    'Failed to save lot': '保存产品失败。',
    'Bought weight cannot be less than sold weight plus returned weight': '进货重量不能小于已售重量与已退货重量之和。',
    'Failed to update lot': '更新产品失败。',
    'Failed to delete lot': '删除产品失败。',
    'Lot not found': '未找到该批次。',
    'Failed to update lot photo': '更新产品图片失败。',
    'lot_id, company_id, and sale_date are required': '缺少销售必填信息（批次、公司、日期）。',
    'Sale weight and price must be valid numbers': '销售重量和单价必须是有效数字。',
    'Sold weight exceeds remaining lot weight after returns': '销售重量超过剩余可售重量（已扣除退货）。',
    'Lot or company reference is invalid for this database.': '产品批次或公司数据无效，请检查后重试。',
    'Failed to save sale': '保存销售失败。',
    'quantity must be a positive number': '数量必须大于 0。',
    'Valid amount is required, or provide unit_cost and quantity for auto-calculation': '请填写有效金额，或填写数量和单价进行自动计算。',
    'Missing operational_costs table. Please run the SQL migration for operational costs first.': '缺少日常成本数据表，请先执行数据库迁移。',
    'Database schema does not match operational costs columns. Please run the SQL migration.': '日常成本表结构不匹配，请先执行数据库迁移。',
    'Failed to save operational cost': '保存日常成本失败。',
    'Operational cost record not found': '未找到该日常成本记录。',
    'Failed to delete operational cost': '删除日常成本失败。',
    'Database schema does not match the app yet. Please double-check the SQL tables and columns.': '数据库结构与系统不匹配，请检查 SQL 表和字段。',
    'User or seller reference is invalid for this database. Please sign in again and check the selected seller.': '用户或卖家数据无效，请重新登录后再试。',
    'Lot or company reference is invalid for this database.': '产品批次或公司数据无效。',
    'Missing seller_returns table. Please run the SQL migration for seller returns first.': '缺少退货数据表，请先执行数据库迁移。',
    'Missing sellers.bad_quality column. Please run the SQL migration for seller quality flags.': '缺少卖家品质字段，请先执行数据库迁移。',
    'User session is not linked to the current database. Please log out and register or log in again.': '当前登录会话与数据库不匹配，请退出后重新登录。',
    'Invalid uid format. Please log out and sign in again.': '用户信息格式无效，请退出后重新登录。',
  };

  function localizeErrorMessage(message) {
    const normalized = String(message || '').trim();
    if (!normalized) return lang === 'zh' ? '请求失败' : 'Request failed';
    if (lang !== 'zh') return normalized;
    return localizedApiErrorMap[normalized] || normalized;
  }

  async function apiFetch(path, options = {}) {
    const response = await fetch(path, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(localizeErrorMessage(data.error || 'Request failed'));
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
      operationalCosts: [],
      returnAlertThreshold: 3,
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
      const typedCompanyName = String(form.companyName || '').trim();
      if (!typedCompanyName) {
        throw new Error(text.companyRequired || (lang === 'zh' ? '必须填写公司' : 'Company is required'));
      }

      const company = dashboard.companies.find(
        (item) => normalizeName(item.name) === normalizeName(typedCompanyName)
      );

      if (!company) {
        setCompanyForm((current) => ({
          ...current,
          name: typedCompanyName || current.name,
        }));
        setActiveTab('companies');
        throw new Error(text.createCompanyFirst || (lang === 'zh' ? '请先创建公司资料。' : 'Please create company information first.'));
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

  async function handleToggleSellerQuality(seller) {
    setSubmittingKey(`seller-quality-${seller.id}`);

    try {
      await apiFetch(`/api/sellers/${seller.id}/quality`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          bad_quality: !seller.bad_quality,
        }),
      });

      await refreshDashboard();
      toast.success(!seller.bad_quality ? text.markBadSeller : text.clearBadSeller);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleDeleteSeller(seller) {
    if (!window.confirm(`${text.deleteSellerConfirm}\n\n${seller.name}`)) return;

    setSubmittingKey(`seller-delete-${seller.id}`);

    try {
      await apiFetch(`/api/sellers/${seller.id}?uid=${user.uid}`, {
        method: 'DELETE',
      });

      await refreshDashboard();
      toast.success(text.deleteSeller);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleLotReturn(lot) {
    if (!lot.seller_id) {
      toast.error(text.noSellerLinked);
      return;
    }

    const form = lotReturnForms[lot.id] || createLotReturnForm();
    const returnWeight = Number(form.return_weight_tons);
    const remainingWeight = Number(lot.remaining_weight_tons || 0);

    if (!Number.isFinite(returnWeight) || returnWeight <= 0) {
      toast.error(lang === 'zh' ? '请填写有效的退货重量。' : 'Please enter a valid return weight.');
      return;
    }

    if (returnWeight > remainingWeight + 0.000001) {
      toast.error(lang === 'zh' ? '退货重量不能超过当前剩余重量。' : 'Return weight cannot exceed remaining lot weight.');
      return;
    }

    setSubmittingKey(`lot-return-${lot.id}`);

    try {
      await apiFetch(`/api/sellers/${lot.seller_id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          lot_id: lot.id,
          return_weight_tons: returnWeight,
          return_date: form.return_date || new Date().toISOString().split('T')[0],
          return_reason: form.return_reason || '',
        }),
      });

      setLotReturnForms((current) => ({
        ...current,
        [lot.id]: createLotReturnForm(),
      }));

      await refreshDashboard();
      toast.success(text.sellerReturnAdded);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleUpdateLotQuality(lot) {
    const selectedQuality = String(lotQualityDrafts[lot.id] ?? lot.quality ?? 'Good').trim() || 'Good';
    setSubmittingKey(`lot-quality-${lot.id}`);

    try {
      await apiFetch(`/api/lots/${lot.id}?uid=${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: lot.seller_id || null,
          product_name: lot.product_name || '',
          color: lot.color || '',
          quality: selectedQuality,
          image_url: lot.image_url || null,
          purchase_date: String(lot.purchase_date || '').slice(0, 10) || new Date().toISOString().split('T')[0],
          bought_weight_tons: Number(lot.bought_weight_tons || 0),
          cost_per_ton: Number(lot.cost_per_ton || 0),
          location: lot.location || '',
          notes: lot.notes || '',
        }),
      });

      setLotQualityDrafts((current) => {
        const next = { ...current };
        delete next[lot.id];
        return next;
      });

      await refreshDashboard();
      toast.success(text.qualityUpdated || 'Quality updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleCreateOperationalCost(event) {
    event.preventDefault();
    setSubmittingKey('operational-cost');

    try {
      const isQuantityMode = operationalCostForm.calc_mode === 'quantity';
      const quantity = isQuantityMode ? Number(operationalCostForm.quantity) : 1;
      const unitCost = isQuantityMode ? Number(operationalCostForm.unit_cost) : Number.NaN;
      const fallbackCostType = text.categoryOther || 'Other';
      const normalizedCostType = String(operationalCostForm.cost_type || '').trim() || fallbackCostType;
      const category = inferOperationalCostCategory(normalizedCostType);
      let amount = Number(operationalCostForm.amount);

      if (isQuantityMode) {
        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
          throw new Error(lang === 'zh' ? '请填写有效的数量和单价。' : 'Please enter valid quantity and unit cost.');
        }
        amount = quantity * unitCost;
      } else if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(lang === 'zh' ? '请输入有效金额。' : 'Please enter a valid amount.');
      }

      await apiFetch('/api/operational-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          category,
          cost_type: normalizedCostType,
          quantity,
          unit_cost: isQuantityMode ? unitCost : '',
          amount,
          cost_date: operationalCostForm.cost_date,
          note: operationalCostForm.note,
        }),
      });

      setOperationalCostForm(createOperationalCostForm());
      await refreshDashboard();
      toast.success(text.operationalCostSaved);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey('');
    }
  }

  async function handleDeleteOperationalCost(costId) {
    try {
      await apiFetch(`/api/operational-costs/${costId}?uid=${user.uid}`, {
        method: 'DELETE',
      });

      await refreshDashboard();
      toast.success(text.operationalCostDeleted);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleToggleLotExpand(lotId) {
    setExpandedLotIds((current) => ({
      ...current,
      [lotId]: !Boolean(current[lotId]),
    }));
  }

  function handleOpenLotModal() {
    if ((dashboard.sellers || []).length === 0) {
      toast.error(text.createSellerFirst || 'Please create a seller first before adding a product.');
      setActiveTab('sellers');
      return;
    }
    setShowLotModal(true);
  }

  const mobileNavItems = [
    { key: 'inventory', label: t?.inventory || text.inventoryLots || 'Inventory', icon: Package },
    { key: 'companies', label: t?.companies || 'Companies', icon: Building2 },
    { key: 'sellers', label: t?.sellers || 'Sellers', icon: Users },
    { key: 'sales', label: text.sales || 'Sales', icon: ArrowRightLeft },
    { key: 'costs', label: lang === 'zh' ? '成本' : 'Costs', icon: Banknote },
    { key: 'analytics', label: t?.analytics || 'Analytics', icon: Wallet },
  ];

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
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight">{text.appTitle}</h1>
              <p className="truncate text-[11px] uppercase tracking-[0.25em] text-zinc-400">{user.email}</p>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <Button variant="ghost" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="w-full sm:w-auto">
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </Button>
            <Button variant="secondary" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut className="w-4 h-4" />
              {text.logout}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl overflow-x-hidden px-4 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-28 lg:pb-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden h-fit max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm lg:block">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.main}</p>
            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-2 lg:overflow-visible lg:px-0 lg:pb-0">
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
              <NavButton active={activeTab === 'costs'} onClick={() => setActiveTab('costs')} icon={<Banknote className="w-5 h-5" />}>
                {text.operationalCosts}
              </NavButton>
              <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<Wallet className="w-5 h-5" />}>
                {t.analytics}
              </NavButton>
            </div>
          </aside>

          <main className="min-w-0 space-y-6">
            {activeTab !== 'costs' ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title={text.inventoryCost} value={formatCurrency(overview.totalInventoryCost)} />
                <StatCard title={text.remainingWeight} value={formatWeightDisplay(overview.totalRemainingWeight)} />
                <StatCard title={text.soldValue} value={formatCurrency(overview.totalSoldValue)} />
                <StatCard title={text.received} value={formatCurrency(overview.totalReceived)} />
              </div>
            ) : null}

            {activeTab === 'inventory' ? (
              <section className="space-y-6">
                <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-xl font-black tracking-tight">{text.inventoryLots}</h2>
                      <p className="text-sm text-zinc-400">{text.buyFromSellers}</p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder={text.searchLots}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black"
                        />
                      </div>
                      <Button className="shrink-0 self-start px-3 sm:w-auto" onClick={handleOpenLotModal}>
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
                      };
                      const lotReturnForm = lotReturnForms[lot.id] || createLotReturnForm();
                      const lotReturns = [...(lot.seller_returns || [])].sort(
                        (a, b) => new Date(b.return_date) - new Date(a.return_date)
                      );
                      const lotReturnEstimatedAmount = Number(lotReturnForm.return_weight_tons || 0) * Number(lot.cost_per_ton || 0);
                      const isLotExpanded = Boolean(expandedLotIds[lot.id]);
                      const lotQualityValue = lotQualityDrafts[lot.id] ?? lot.quality ?? 'Good';

                      return (
                        <div key={lot.id} className="max-w-full overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-sm">
                          <div className="border-b border-zinc-100 p-4 sm:hidden">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="break-words text-base font-black text-zinc-900">{lot.product_name}</h3>
                                <p className="mt-1 break-words text-xs text-zinc-400">{lot.seller_name || text.noSellerLinked} • {formatDateDisplay(lot.purchase_date)}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleToggleLotExpand(lot.id)}
                                  className="min-h-[38px] px-2 py-2"
                                  aria-label={isLotExpanded ? 'Collapse product' : 'Expand product'}
                                >
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isLotExpanded ? 'rotate-180' : ''}`} />
                                </Button>
                                <Button variant="ghost" onClick={() => handleDeleteLot(lot.id)} className="min-h-[38px] px-2 py-2">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <MiniMetric label={text.remaining} value={formatWeightDisplay(lot.remaining_weight_tons)} />
                              <MiniMetric label={t.totalCost} value={formatCurrency(lot.total_cost)} />
                            </div>
                          </div>

                          <div className="hidden flex-col gap-4 border-b border-zinc-100 p-5 sm:flex">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
                              <Package className="w-7 h-7 text-zinc-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <h3 className="break-words text-lg font-black text-zinc-900">{lot.product_name}</h3>
                                  <p className="break-words text-sm text-zinc-400">{lot.seller_name || text.noSellerLinked} • {formatDateDisplay(lot.purchase_date)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleToggleLotExpand(lot.id)}
                                    className="self-start"
                                    aria-label={isLotExpanded ? 'Collapse product' : 'Expand product'}
                                  >
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isLotExpanded ? 'rotate-180' : ''}`} />
                                  </Button>
                                  <Button variant="ghost" onClick={() => handleDeleteLot(lot.id)} className="self-start">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <MiniMetric label={text.bought} value={formatWeightDisplay(lot.bought_weight_tons)} />
                                <MiniMetric label={text.sold} value={formatWeightDisplay(lot.sold_weight_tons)} />
                                <MiniMetric label={text.remaining} value={formatWeightDisplay(lot.remaining_weight_tons)} />
                                <MiniMetric label={t.totalCost} value={formatCurrency(lot.total_cost)} />
                              </div>
                            </div>
                          </div>

                          <div className={`p-4 sm:p-5 ${isLotExpanded ? 'block' : 'hidden'}`}>
                            <div className="space-y-3 sm:hidden">
                              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
                                <Select
                                  size="compact"
                                  label={t.quality}
                                  value={lotQualityValue}
                                  onChange={(event) =>
                                    setLotQualityDrafts((current) => ({
                                      ...current,
                                      [lot.id]: event.target.value,
                                    }))
                                  }
                                  options={QUALITY_OPTIONS.map((quality) => ({ value: quality, label: t[quality.toLowerCase()] || quality }))}
                                />
                                <Button
                                  className="mt-2 w-full"
                                  variant="secondary"
                                  onClick={() => handleUpdateLotQuality(lot)}
                                  disabled={submittingKey === `lot-quality-${lot.id}`}
                                >
                                  {submittingKey === `lot-quality-${lot.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  {text.updateQuality || t.save}
                                </Button>
                              </div>

                              <MobileDisclosure
                                title={text.sellThisLot}
                                subtitle={`${text.oneLotManySales} • ${text.sold}: ${formatWeightDisplay(lot.sold_weight_tons)}`}
                              >
                                <div className="grid gap-2">
                                  <Input size="compact" label={t.company} list={`company-options-${lot.id}`} value={saleForm.companyName} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, companyName: event.target.value } }))} placeholder={t.company} />
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input size="compact" label={text.saleDate} type="date" value={saleForm.sale_date} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, sale_date: event.target.value } }))} />
                                    <Input size="compact" label={text.weightSoldShort} type="number" step="0.001" value={saleForm.sold_weight_tons} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, sold_weight_tons: event.target.value } }))} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input size="compact" label={t.pricePerTon} type="number" step="0.01" value={saleForm.price_per_ton} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, price_per_ton: event.target.value } }))} />
                                    <Input size="compact" label={t.location} value={saleForm.location} onChange={(event) => setSaleForms((current) => ({ ...current, [lot.id]: { ...saleForm, location: event.target.value } }))} />
                                  </div>
                                  <Button className="w-full" onClick={() => handleCreateSale(lot)} disabled={submittingKey === `sale-${lot.id}`}>
                                    {submittingKey === `sale-${lot.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {text.addSale}
                                  </Button>
                                  <datalist id={`company-options-${lot.id}`}>
                                    {dashboard.companies.map((company) => (
                                      <option key={company.id} value={company.name} />
                                    ))}
                                  </datalist>
                                </div>
                              </MobileDisclosure>

                              <MobileDisclosure
                                title={text.sales}
                                subtitle={lot.sales.length ? `${lot.sales.length} ${text.sales}` : text.noSalesForLot}
                              >
                                <div className="space-y-2">
                                  {lot.sales.length === 0 ? (
                                    <p className="text-sm text-zinc-400">{text.noSalesForLot}</p>
                                  ) : (
                                    lot.sales.map((sale) => (
                                      <div key={sale.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                                        <p className="break-words text-sm font-bold text-zinc-900">{sale.company_name}</p>
                                        <p className="mt-1 break-words text-xs text-zinc-400">{formatDateDisplay(sale.sale_date)} • {formatWeightDisplay(sale.sold_weight_tons)}</p>
                                        <div className="mt-2 flex items-center justify-between gap-3">
                                          <p className="text-sm font-black text-zinc-900">{formatCurrency(sale.sale_value)}</p>
                                          <p className={`text-xs font-bold ${sale.outstanding_amount > 0 ? 'text-orange-500' : 'text-emerald-600'}`}>
                                            {formatCurrency(sale.outstanding_amount)}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </MobileDisclosure>

                              <MobileDisclosure
                                title={text.recordSellerReturn}
                                subtitle={`${formatWeightDisplay(lot.remaining_weight_tons)} ${text.remaining}`}
                              >
                                {!lot.seller_id ? (
                                  <p className="text-sm text-zinc-400">{text.noSellerLinked}</p>
                                ) : Number(lot.remaining_weight_tons || 0) <= 0 ? (
                                  <p className="text-sm text-zinc-400">{text.noLotsForSeller}</p>
                                ) : (
                                  <div className="grid gap-2.5">
                                    <Input size="compact" label={text.returnWeight} type="number" step="0.001" value={lotReturnForm.return_weight_tons} onChange={(event) => setLotReturnForms((current) => ({ ...current, [lot.id]: { ...lotReturnForm, return_weight_tons: event.target.value } }))} />
                                    <Input size="compact" label={text.returnDate} type="date" value={lotReturnForm.return_date} onChange={(event) => setLotReturnForms((current) => ({ ...current, [lot.id]: { ...lotReturnForm, return_date: event.target.value } }))} />
                                    <Input size="compact" label={text.returnReason} value={lotReturnForm.return_reason} onChange={(event) => setLotReturnForms((current) => ({ ...current, [lot.id]: { ...lotReturnForm, return_reason: event.target.value } }))} />
                                    <p className="text-xs text-zinc-500">{text.returnAmountAutoHint} {formatCurrency(lotReturnEstimatedAmount)}</p>
                                    <Button className="w-full" variant="outline" onClick={() => handleLotReturn(lot)} disabled={submittingKey === `lot-return-${lot.id}`}>
                                      {submittingKey === `lot-return-${lot.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                                      {text.saveReturn}
                                    </Button>
                                    {lotReturns.length > 0 ? (
                                      <div className="space-y-2 pt-1">
                                        {lotReturns.slice(0, 3).map((returned) => (
                                          <div key={returned.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                                            <p className="break-words text-sm font-bold text-zinc-900">{formatDateDisplay(returned.return_date)}</p>
                                            <p className="mt-1 text-xs text-zinc-500">{formatWeightDisplay(returned.return_weight_tons)} • {formatCurrency(returned.return_amount)}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </MobileDisclosure>
                            </div>

                            <div className="hidden sm:block">
                            <div className="mb-4 rounded-3xl border border-sky-100 bg-sky-50/70 p-3 sm:p-4">
                              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                <Select
                                  label={t.quality}
                                  value={lotQualityValue}
                                  onChange={(event) =>
                                    setLotQualityDrafts((current) => ({
                                      ...current,
                                      [lot.id]: event.target.value,
                                    }))
                                  }
                                  options={QUALITY_OPTIONS.map((quality) => ({ value: quality, label: t[quality.toLowerCase()] || quality }))}
                                />
                                <div className="flex items-end">
                                  <Button
                                    className="h-[46px] w-full sm:w-auto sm:px-6"
                                    variant="secondary"
                                    onClick={() => handleUpdateLotQuality(lot)}
                                    disabled={submittingKey === `lot-quality-${lot.id}`}
                                  >
                                    {submittingKey === `lot-quality-${lot.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {text.updateQuality || t.save}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-3xl bg-zinc-50 p-3 sm:p-4">
                              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.sellThisLot}</h4>
                                <span className="text-xs font-semibold text-zinc-400">{text.oneLotManySales}</span>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

                            <div className="mt-4 rounded-3xl border border-orange-100 bg-orange-50/70 p-3 sm:p-4">
                              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <h4 className="text-sm font-black uppercase tracking-widest text-orange-700">{text.recordSellerReturn}</h4>
                                <span className="text-xs font-semibold text-orange-500">{formatWeightDisplay(lot.remaining_weight_tons)} {text.remaining}</span>
                              </div>
                              {!lot.seller_id ? (
                                <p className="text-sm text-zinc-500">{text.noSellerLinked}</p>
                              ) : Number(lot.remaining_weight_tons || 0) <= 0 ? (
                                <p className="text-sm text-zinc-500">{text.noLotsForSeller}</p>
                              ) : (
                                <div className="max-w-xl space-y-3">
                                  <Input label={text.returnWeight} type="number" step="0.001" value={lotReturnForm.return_weight_tons} onChange={(event) => setLotReturnForms((current) => ({ ...current, [lot.id]: { ...lotReturnForm, return_weight_tons: event.target.value } }))} />
                                  <Input label={text.returnDate} type="date" value={lotReturnForm.return_date} onChange={(event) => setLotReturnForms((current) => ({ ...current, [lot.id]: { ...lotReturnForm, return_date: event.target.value } }))} />
                                  <Input label={text.returnReason} value={lotReturnForm.return_reason} onChange={(event) => setLotReturnForms((current) => ({ ...current, [lot.id]: { ...lotReturnForm, return_reason: event.target.value } }))} />
                                  <p className="text-xs text-zinc-500">{text.returnAmountAutoHint} {formatCurrency(lotReturnEstimatedAmount)}</p>
                                  <div className="pt-1">
                                    <Button className="h-[50px] w-full" variant="outline" onClick={() => handleLotReturn(lot)} disabled={submittingKey === `lot-return-${lot.id}`}>
                                      {submittingKey === `lot-return-${lot.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                                      {text.saveReturn}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 space-y-3">
                              {lot.sales.length === 0 ? (
                                <p className="text-sm text-zinc-400">{text.noSalesForLot}</p>
                              ) : (
                                lot.sales.map((sale) => (
                                  <div key={sale.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 sm:p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0">
                                        <p className="break-words font-bold text-zinc-900">{sale.company_name}</p>
                                        <p className="break-words text-sm text-zinc-400">{formatDateDisplay(sale.sale_date)} • {formatWeightDisplay(sale.sold_weight_tons)} • {t.pricePerTon} {formatCurrency(sale.price_per_ton)}</p>
                                      </div>
                                      <div className="sm:text-right">
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

                            {lotReturns.length > 0 ? (
                              <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
                                {lotReturns.slice(0, 4).map((returned) => (
                                  <div key={returned.id} className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3 sm:p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-sm font-black text-zinc-900">{text.recordSellerReturn}</p>
                                        <p className="mt-1 text-xs text-zinc-500">{formatDateDisplay(returned.return_date)}</p>
                                      </div>
                                      <div className="sm:text-right">
                                        <p className="text-sm font-black text-zinc-900">{formatWeightDisplay(returned.return_weight_tons)}</p>
                                        <p className="mt-1 text-xs text-zinc-500">{formatCurrency(returned.return_amount)}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
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
                <div className="sm:hidden">
                  <MobileDisclosure title={text.saveCompany} subtitle={text.companyLogicText} defaultOpen={false}>
                    <form onSubmit={handleCreateCompany} className="grid gap-3">
                      <Input size="compact" label={t.company} value={companyForm.name} onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))} />
                      <Input size="compact" label={text.contactPerson} value={companyForm.contact_person} onChange={(event) => setCompanyForm((current) => ({ ...current, contact_person: event.target.value }))} />
                      <Input size="compact" label={t.phone} value={companyForm.phone} onChange={(event) => setCompanyForm((current) => ({ ...current, phone: event.target.value }))} />
                      <Button type="submit" className="w-full" disabled={submittingKey === 'company'}>
                        {submittingKey === 'company' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {text.saveCompany}
                      </Button>
                    </form>
                  </MobileDisclosure>
                </div>

                <div className="hidden max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:block sm:p-6">
                  <h2 className="text-xl font-black tracking-tight">{t.companies}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{text.companyLogicText}</p>
                  <form onSubmit={handleCreateCompany} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                    const companySales = company.sales || [];
                    const companyPayments = companySales
                      .flatMap((sale) =>
                        (sale.payments || []).map((payment) => ({
                          ...payment,
                          sale_label: sale.lot_product_name,
                        }))
                      )
                      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

                    return (
                      <div key={company.id} className={`max-w-full rounded-[2rem] border p-4 shadow-sm transition-all sm:p-6 ${
                        company.bad_credit
                          ? 'border-red-200 bg-gradient-to-br from-red-50 via-white to-white'
                          : 'border-zinc-100 bg-gradient-to-br from-white via-white to-sky-50/50'
                      }`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="break-words text-lg font-black">{company.name}</h3>
                            <p className="break-words text-sm text-zinc-400">{company.contact_person || text.noContactPerson} • {company.phone || text.noPhone}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {company.bad_credit ? (
                              <div className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-600">
                                {text.companyHasBadCredit}
                              </div>
                            ) : null}
                            <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-600">
                              {companySales.length} {text.sales}
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

                        <div className="mt-5 space-y-3 sm:hidden">
                          <MobileDisclosure
                            title={text.recordReceivedPayment}
                            subtitle={`${formatCurrency(company.total_received)} ${text.received}`}
                          >
                            <div className="grid gap-2">
                              <Input size="compact" label={t.amount} type="number" step="0.01" value={paymentForm.amount} onChange={(event) => setCompanyPaymentForms((current) => ({ ...current, [company.id]: { ...paymentForm, amount: event.target.value } }))} />
                              <div className="grid grid-cols-2 gap-2">
                                <Select size="compact" label={text.method} value={paymentForm.payment_method} onChange={(event) => setCompanyPaymentForms((current) => ({ ...current, [company.id]: { ...paymentForm, payment_method: event.target.value } }))} options={paymentMethodOptions} />
                                <Input size="compact" label={t.paymentDate} type="date" value={paymentForm.payment_date} onChange={(event) => setCompanyPaymentForms((current) => ({ ...current, [company.id]: { ...paymentForm, payment_date: event.target.value } }))} />
                              </div>
                              {paymentForm.payment_method === 'usd' ? (
                                <p className="text-xs text-zinc-500">{text.usdAutoConvertHint}</p>
                              ) : null}
                              <Button className="w-full" variant="success" onClick={() => handleCompanyPayment(company)} disabled={submittingKey === `company-payment-${company.id}`}>
                                {submittingKey === `company-payment-${company.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                                {text.savePayment}
                              </Button>
                            </div>
                          </MobileDisclosure>

                          <MobileDisclosure
                            title={text.sales}
                            subtitle={companySales.length ? `${companySales.length} ${text.sales}` : text.noSalesForCompany}
                          >
                            <div className="space-y-2">
                              {companySales.length === 0 ? (
                                <p className="text-sm text-zinc-400">{text.noSalesForCompany}</p>
                              ) : (
                                companySales.map((sale) => (
                                  <div key={sale.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                                    <p className="break-words text-sm font-bold text-zinc-900">{sale.lot_product_name}</p>
                                    <p className="mt-1 break-words text-xs text-zinc-400">{formatDateDisplay(sale.sale_date)} • {formatWeightDisplay(sale.sold_weight_tons)}</p>
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                      <p className="text-sm font-black text-zinc-900">{formatCurrency(sale.sale_value)}</p>
                                      <p className="text-xs text-zinc-400">{formatCurrency(sale.outstanding_amount)}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </MobileDisclosure>
                        </div>

                        <div className="mt-5 hidden rounded-[1.75rem] border border-zinc-200 bg-white/85 p-4 shadow-sm sm:block">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.recordReceivedPayment}</h4>
                              <p className="mt-1 text-sm text-zinc-400">{companyPayments.length} {text.recordsLabel}</p>
                            </div>
                            <p className="text-xs font-semibold text-zinc-400">{text.received} {formatCurrency(company.total_received)}</p>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_auto]">
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
                          {paymentForm.payment_method === 'usd' ? (
                            <p className="mt-3 text-xs text-zinc-500">{text.usdAutoConvertHint}</p>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            variant={company.bad_credit ? 'secondary' : 'outline'}
                            onClick={() => handleToggleCompanyCredit(company)}
                            disabled={submittingKey === `company-credit-${company.id}`}
                            className="w-full sm:w-auto"
                          >
                            {submittingKey === `company-credit-${company.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                            {company.bad_credit ? text.clearBadCredit : text.markBadCredit}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteCompany(company)}
                            disabled={submittingKey === `company-delete-${company.id}`}
                            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                          >
                            {submittingKey === `company-delete-${company.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            {text.deleteCompany}
                          </Button>
                        </div>

                        <div className="mt-5 hidden space-y-4 sm:block">
                          <DesktopDisclosure
                            title={text.recordReceivedPayment}
                            subtitle={`${companyPayments.length} ${text.recordsLabel}`}
                            defaultOpen={false}
                          >
                            {companyPayments.length === 0 ? (
                              <p className="text-sm text-zinc-400">{text.noPaymentRecords}</p>
                            ) : (
                              <div className="space-y-2">
                                {companyPayments.map((payment) => (
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
                            )}
                          </DesktopDisclosure>

                          <DesktopDisclosure
                            title={text.salesHistoryTitle}
                            subtitle={companySales.length ? `${companySales.length} ${text.sales}` : text.noSalesForCompany}
                            defaultOpen={false}
                          >
                            {companySales.length === 0 ? (
                              <p className="text-sm text-zinc-400">{text.noSalesForCompany}</p>
                            ) : (
                              <div className="space-y-3">
                                {companySales.map((sale) => {
                                  const salePayments = sale.payments || [];
                                  return (
                                    <div key={sale.id} className="rounded-[1.25rem] border border-zinc-100 bg-white p-4">
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                          <p className="break-words font-bold text-zinc-900">{sale.lot_product_name}</p>
                                          <p className="mt-1 break-words text-sm text-zinc-400">
                                            {formatDateDisplay(sale.sale_date)} • {formatWeightDisplay(sale.sold_weight_tons)}
                                          </p>
                                        </div>
                                        <div className="sm:text-right">
                                          <p className="font-black text-zinc-900">{formatCurrency(sale.sale_value)}</p>
                                          <p className="text-xs text-zinc-400">{t.totalCost} {formatCurrency(sale.lot_cost)}</p>
                                        </div>
                                      </div>
                                      {salePayments.length > 0 ? (
                                        <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
                                          {salePayments.map((payment) => (
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
                                  );
                                })}
                              </div>
                            )}
                          </DesktopDisclosure>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {activeTab === 'sellers' ? (
              <section className="space-y-6">
                <div className="sm:hidden">
                  <MobileDisclosure title={text.saveSeller} subtitle={text.sellerLogicText} defaultOpen={false}>
                    <form onSubmit={handleCreateSeller} className="grid gap-3">
                      <Input size="compact" label={t.seller} value={sellerForm.name} onChange={(event) => setSellerForm((current) => ({ ...current, name: event.target.value }))} />
                      <Input size="compact" label={t.phone} value={sellerForm.phone} onChange={(event) => setSellerForm((current) => ({ ...current, phone: event.target.value }))} />
                      <Input size="compact" label={text.address} value={sellerForm.address} onChange={(event) => setSellerForm((current) => ({ ...current, address: event.target.value }))} />
                      <Button type="submit" className="w-full" disabled={submittingKey === 'seller'}>
                        {submittingKey === 'seller' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {text.saveSeller}
                      </Button>
                    </form>
                  </MobileDisclosure>
                </div>

                <div className="hidden max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:block sm:p-6">
                  <h2 className="text-xl font-black tracking-tight">{t.sellers}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{text.sellerLogicText}</p>
                  <form onSubmit={handleCreateSeller} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                    const sellerReturnCount = Number(seller.return_count || 0);
                    return (
                      <div key={seller.id} className="max-w-full rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-white via-white to-emerald-50/40 p-4 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="break-words text-lg font-black">{seller.name}</h3>
                            <p className="break-words text-sm text-zinc-400">{seller.phone || text.noPhone} • {seller.address || text.noAddress}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {seller.bad_quality ? (
                              <div className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-red-600">
                                {text.qualityRisk}
                              </div>
                            ) : null}
                            <div className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-amber-700">
                              {sellerReturnCount} {text.returnCount}
                            </div>
                            <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-600">
                              {(seller.lots || []).length} {text.analyticsLots}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <MiniMetric label={text.bought} value={formatCurrency(seller.total_bought_cost)} />
                          <MiniMetric label={t.paid} value={formatCurrency(seller.total_paid)} tone="emerald" />
                          <MiniMetric label={text.returnAmount} value={formatCurrency(seller.total_returned_amount)} tone="blue" />
                          <MiniMetric label={text.oweSeller || text.balance} value={formatCurrency(seller.balance_owed)} tone={Number(seller.balance_owed) > 0 ? 'orange' : 'dark'} />
                        </div>

                        <div className="mt-5 space-y-3 sm:hidden">
                          <MobileDisclosure
                            title={text.recordSellerPayment}
                            subtitle={`${formatCurrency(seller.total_paid)} ${t.paid}`}
                          >
                            <div className="grid gap-2">
                              <Input size="compact" label={t.amount} type="number" step="0.01" value={paymentForm.amount} onChange={(event) => setSellerPaymentForms((current) => ({ ...current, [seller.id]: { ...paymentForm, amount: event.target.value } }))} />
                              <div className="grid grid-cols-2 gap-2">
                                <Select size="compact" label={text.method} value={paymentForm.payment_method} onChange={(event) => setSellerPaymentForms((current) => ({ ...current, [seller.id]: { ...paymentForm, payment_method: event.target.value } }))} options={paymentMethodOptions} />
                                <Input size="compact" label={t.paymentDate} type="date" value={paymentForm.payment_date} onChange={(event) => setSellerPaymentForms((current) => ({ ...current, [seller.id]: { ...paymentForm, payment_date: event.target.value } }))} />
                              </div>
                              {paymentForm.payment_method === 'usd' ? (
                                <p className="text-xs text-zinc-500">{text.usdAutoConvertHint}</p>
                              ) : null}
                              <Button className="w-full" variant="success" onClick={() => handleSellerPayment(seller)} disabled={submittingKey === `seller-payment-${seller.id}`}>
                                {submittingKey === `seller-payment-${seller.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                                {text.savePayment}
                              </Button>
                            </div>
                          </MobileDisclosure>
                        </div>

                        <div className="mt-5 hidden rounded-[1.75rem] border border-zinc-200 bg-white/85 p-4 shadow-sm sm:block">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">{text.recordSellerPayment}</h4>
                              <p className="mt-1 text-sm text-zinc-400">{t.paid} {formatCurrency(seller.total_paid)}</p>
                            </div>
                            <p className="text-xs font-semibold text-zinc-400">{t.paid} {formatCurrency(seller.total_paid)}</p>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_auto]">
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
                          {paymentForm.payment_method === 'usd' ? (
                            <p className="mt-3 text-xs text-zinc-500">{text.usdAutoConvertHint}</p>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            variant={seller.bad_quality ? 'secondary' : 'outline'}
                            onClick={() => handleToggleSellerQuality(seller)}
                            disabled={submittingKey === `seller-quality-${seller.id}`}
                            className="w-full sm:w-auto"
                          >
                            {submittingKey === `seller-quality-${seller.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                            {seller.bad_quality ? text.clearBadSeller : text.markBadSeller}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteSeller(seller)}
                            disabled={submittingKey === `seller-delete-${seller.id}`}
                            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                          >
                            {submittingKey === `seller-delete-${seller.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            {text.deleteSeller}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {activeTab === 'costs' ? (
              <section className="space-y-6">
                <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{text.operationalCosts}</h2>
                    <p className="mt-1 text-sm text-zinc-400">{text.operationalCostSubtitle}</p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniMetric label={`${text.today} ${text.totalCost}`} value={formatCurrency(operationalCostSummary.thisDayTotal)} tone="orange" />
                    <MiniMetric label={`${text.thisMonth} ${text.totalCost}`} value={formatCurrency(operationalCostSummary.thisMonthTotal)} />
                    <MiniMetric label={`${text.thisYear} ${text.totalCost}`} value={formatCurrency(operationalCostSummary.thisYearTotal)} tone="emerald" />
                  </div>

                  <form onSubmit={handleCreateOperationalCost} className="mt-6 space-y-4">
                    <div className="space-y-3">
                      <Input
                        label={text.costType}
                        list="cost-type-options"
                        value={operationalCostForm.cost_type}
                        placeholder={text.costTypePlaceholder}
                        onChange={(event) => setOperationalCostForm((current) => ({ ...current, cost_type: event.target.value }))}
                      />
                      <Select
                        label={text.calcMode}
                        value={operationalCostForm.calc_mode}
                        onChange={(event) => setOperationalCostForm((current) => ({ ...current, calc_mode: event.target.value }))}
                        options={operationalCostCalcModeOptions}
                      />
                      <Input
                        label={text.costDate}
                        type="date"
                        value={operationalCostForm.cost_date}
                        onChange={(event) => setOperationalCostForm((current) => ({ ...current, cost_date: event.target.value }))}
                      />
                    </div>

                    {isOperationalCostQuantityMode ? (
                      <div className="space-y-3">
                        <Input
                          label={text.quantityLabel}
                          type="number"
                          inputMode="decimal"
                          step="0.001"
                          min="0"
                          value={operationalCostForm.quantity}
                          onChange={(event) => setOperationalCostForm((current) => ({ ...current, quantity: event.target.value }))}
                        />
                        <Input
                          label={text.unitCostLabel}
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={operationalCostForm.unit_cost}
                          onChange={(event) => setOperationalCostForm((current) => ({ ...current, unit_cost: event.target.value }))}
                        />
                        <div className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{text.calculatedAmount}</p>
                          <p className="mt-1 text-sm font-black text-emerald-800">{formatCurrency(operationalCostComputedAmount)}</p>
                        </div>
                      </div>
                    ) : (
                      <Input
                        label={t.amount}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={operationalCostForm.amount}
                        onChange={(event) => setOperationalCostForm((current) => ({ ...current, amount: event.target.value }))}
                      />
                    )}

                    <Input
                      label={text.costNote}
                      value={operationalCostForm.note}
                      onChange={(event) => setOperationalCostForm((current) => ({ ...current, note: event.target.value }))}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" className="w-full sm:w-auto sm:px-6" disabled={submittingKey === 'operational-cost'}>
                        {submittingKey === 'operational-cost' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {text.saveOperationalCost}
                      </Button>
                    </div>

                    <datalist id="cost-type-options">
                      {operationalCostTypeSuggestions.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </form>
                </div>

                <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black tracking-tight">{text.operationalCostRecordsTitle || text.recordsLabel}</h3>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                      {lang === 'zh'
                        ? `${(dashboard.operationalCosts || []).length} ${text.recordCountUnit || '笔'}`
                        : `${(dashboard.operationalCosts || []).length} ${text.recordCountUnit || 'records'}`}
                    </span>
                  </div>

                  {(dashboard.operationalCosts || []).length === 0 ? (
                    <p className="text-sm text-zinc-400">{text.noOperationalCostsYet}</p>
                  ) : (
                    <div className="space-y-3">
                      {(dashboard.operationalCosts || []).map((cost) => (
                        <div key={cost.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
                                {cost.cost_type || text.categoryOther}
                              </p>
                              <p className="mt-2 break-words text-sm text-zinc-500">{formatDateDisplay(cost.cost_date)}</p>
                              {Number(cost.quantity || 0) > 0 && Number(cost.unit_cost || 0) > 0 ? (
                                <p className="mt-1 break-words text-xs text-zinc-500">
                                  {Number(cost.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} × {formatCurrency(cost.unit_cost)}
                                </p>
                              ) : null}
                              {cost.note ? <p className="mt-1 break-words text-sm text-zinc-500">{cost.note}</p> : null}
                            </div>
                            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                              <p className="text-lg font-black text-zinc-900">{formatCurrency(cost.amount)}</p>
                              <Button
                                variant="ghost"
                                onClick={() => handleDeleteOperationalCost(cost.id)}
                                className="min-h-[38px] px-2 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === 'sales' ? (
              <section className="space-y-4">
                <div className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="text-xl font-black tracking-tight">{text.salesHistoryTitle}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{text.salesHistorySubtitle}</p>
                </div>
                {dashboard.sales.length === 0 ? (
                  <EmptyState title={text.noSalesYet} message={text.noSalesYetMessage} />
                ) : (
                  <div className="space-y-3">
                    {dashboard.sales.map((sale) => {
                      const salePayments = sale.payments || [];
                      return (
                        <div key={sale.id} className="max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="break-words text-lg font-black">{sale.lot_product_name}</h3>
                              <p className="break-words text-sm text-zinc-400">{sale.company_name} • {formatDateDisplay(sale.sale_date)}</p>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-lg font-black">{formatCurrency(sale.sale_value)}</p>
                              <p className="text-xs text-zinc-400">{formatWeightDisplay(sale.sold_weight_tons)} • {t.summary} {formatCurrency(sale.profit)}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {salePayments.map((payment) => (
                              <span key={payment.id} className="max-w-full break-words rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                                {formatDateDisplay(payment.payment_date)} • {PAYMENT_METHOD_LABELS[payment.payment_method]?.[lang]} • {formatPaymentAmountDisplay(payment.amount, payment.payment_method)}
                              </span>
                            ))}
                            {salePayments.length === 0 ? (
                              <span className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-xs font-semibold text-orange-500">
                                {text.paymentWaiting}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
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

      {!showLotModal ? (
        <MobileTabBar activeTab={activeTab} onChange={setActiveTab} items={mobileNavItems} />
      ) : null}

      {showLotModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLotModal(false)} />
          <div className="relative z-10 flex h-[100dvh] w-screen max-w-screen flex-col overflow-x-hidden overflow-y-hidden bg-white shadow-2xl shadow-black/20 sm:h-auto sm:max-h-[calc(100vh-3rem)] sm:max-w-5xl sm:rounded-[2rem] sm:border sm:border-zinc-100">
            <div
              className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white px-4 py-3 sm:px-6 sm:py-5"
              style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
              <div className="mx-auto flex w-full max-w-[430px] items-start justify-between gap-4 sm:max-w-none">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">{t.addProduct}</p>
                  <h3 className="mt-1 text-lg font-black tracking-tight sm:text-xl">{text.lotWorkflowTitle}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{text.lotWorkflowSubtitle}</p>
                </div>
                <button
                  onClick={() => setShowLotModal(false)}
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateLot} className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden">
              <div className="min-h-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto px-3 py-2 sm:p-6" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                <div className="mx-auto w-full max-w-[430px] space-y-2 sm:max-w-none sm:space-y-6">
                  <div className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-zinc-900">{lotForm.product_name || t.addProduct}</p>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{lotForm.sellerName || t.seller}</p>
                      </div>
                      <div className="shrink-0 rounded-xl bg-white px-2.5 py-2 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.boughtWeight}</p>
                        <p className="mt-0.5 text-xs font-black text-zinc-900">{formatWeightDisplay(lotForm.bought_weight_tons || 0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid max-w-full gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="min-w-0 space-y-3 sm:space-y-4">
                      <div className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:rounded-[1.35rem] sm:p-5 sm:shadow-sm">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.lotBasics}</p>
                        <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                          <Input
                            label={t.productName}
                            size="compact"
                            value={lotForm.product_name}
                            onChange={(event) => setLotForm((current) => ({ ...current, product_name: event.target.value }))}
                          />
                          <Input
                            label={t.seller}
                            size="compact"
                            list="seller-name-options"
                            value={lotForm.sellerName}
                            onChange={(event) => setLotForm((current) => ({ ...current, sellerName: event.target.value }))}
                            placeholder={t.seller}
                          />
                          <Input
                            label={t.phone}
                            size="compact"
                            value={lotForm.sellerPhone}
                            onChange={(event) => setLotForm((current) => ({ ...current, sellerPhone: event.target.value }))}
                            inputMode="tel"
                          />
                          <Input
                            label={t.date}
                            size="compact"
                            type="date"
                            value={lotForm.purchase_date}
                            onChange={(event) => setLotForm((current) => ({ ...current, purchase_date: event.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 sm:rounded-[1.35rem] sm:border-amber-100 sm:p-5 sm:shadow-sm">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">{text.purchaseDetails}</p>
                        <div className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                          <Input
                            label={text.boughtWeight}
                            size="compact"
                            type="number"
                            inputMode="decimal"
                            step="0.001"
                            value={lotForm.bought_weight_tons}
                            onChange={(event) => setLotForm((current) => ({ ...current, bought_weight_tons: event.target.value }))}
                          />
                          <Input
                            label={text.costPerTon}
                            size="compact"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={lotForm.cost_per_ton}
                            onChange={(event) => setLotForm((current) => ({ ...current, cost_per_ton: event.target.value }))}
                          />
                          <Input
                            label={t.color}
                            size="compact"
                            value={lotForm.color}
                            onChange={(event) => setLotForm((current) => ({ ...current, color: event.target.value }))}
                          />
                          <Select
                            label={t.quality}
                            size="compact"
                            value={lotForm.quality}
                            onChange={(event) => setLotForm((current) => ({ ...current, quality: event.target.value }))}
                            options={QUALITY_OPTIONS.map((quality) => ({ value: quality, label: t[quality.toLowerCase()] || quality }))}
                          />
                          <Input
                            label={t.location}
                            size="compact"
                            value={lotForm.location}
                            onChange={(event) => setLotForm((current) => ({ ...current, location: event.target.value }))}
                            className="sm:col-span-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hidden rounded-[1.75rem] border border-zinc-100 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 text-white lg:block">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.visualRecord}</p>
                      <div className="flex min-h-[260px] flex-col justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                        <div>
                          <p className="text-2xl font-black tracking-tight">{lotForm.product_name || t.addProduct}</p>
                          <p className="mt-2 text-sm text-zinc-300">{lotForm.sellerName || t.seller}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-white/10 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{text.boughtWeight}</p>
                            <p className="mt-1 text-sm font-black text-white">{formatWeightDisplay(lotForm.bought_weight_tons || 0)}</p>
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
                </div>
              </div>

              <div
                className="sticky bottom-0 z-10 border-t border-zinc-100 bg-white px-3 py-3 sm:px-6"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
              >
                <div className="mx-auto flex w-full max-w-[430px] flex-col-reverse gap-2 sm:max-w-none sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                  <Button type="button" variant="secondary" onClick={() => setShowLotModal(false)} className="w-full sm:w-auto">
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={submittingKey === 'lot'} className="w-full sm:w-auto">
                    {submittingKey === 'lot' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {text.saveLot}
                  </Button>
                </div>
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
      className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all lg:w-full ${
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
    blue: 'border-sky-100 bg-sky-50 text-sky-800 label:text-sky-600',
    dark: 'border-zinc-900 bg-zinc-900 text-white label:text-zinc-400',
  };

  const toneClass = tones[tone] || tones.default;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${tone === 'default' ? 'text-zinc-400' : tone === 'emerald' ? 'text-emerald-600' : tone === 'orange' ? 'text-orange-600' : tone === 'blue' ? 'text-sky-600' : 'text-zinc-400'}`}>{label}</p>
      <p className={`mt-1 text-sm font-black ${tone === 'dark' ? 'text-white' : tone === 'emerald' ? 'text-emerald-800' : tone === 'orange' ? 'text-orange-800' : tone === 'blue' ? 'text-sky-800' : 'text-zinc-900'}`}>{value}</p>
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
        <p className="mt-2 text-sm font-semibold text-zinc-900">{formatPaymentAmount(amount, method, lang)}</p>
        {detail ? <p className="mt-1 break-words text-xs text-zinc-400">{detail}</p> : null}
      </div>
      <div className="text-sm font-medium text-zinc-500 sm:text-right">{formatDateTimeInSingapore(date, lang)}</div>
    </div>
  );
}
