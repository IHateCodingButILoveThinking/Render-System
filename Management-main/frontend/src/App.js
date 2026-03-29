import React, { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  Globe,
  Loader2,
  Package,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster, toast } from "sonner";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CompanyModal from "./components/CompanyModal";
import LotModal from "./components/LotModal";
import {
  Button,
  DesktopDisclosure,
  EmptyState,
  Input,
  MiniMetric,
  MobileDisclosure,
  MobileTabBar,
  NavButton,
  PaymentRecordRow,
  QuickChoicePills,
  Select,
  SetupActionCard,
  StatCard,
} from "./components/AppUi";
import SellerModal from "./components/SellerModal";
import CompaniesPage from "./pages/CompaniesPage";
import CostsPage from "./pages/CostsPage";
import InventoryPage from "./pages/InventoryPage";
import SalesPage from "./pages/SalesPage";
import SellersPage from "./pages/SellersPage";
import SettingsDrawer from "./pages/SettingsDrawer";
import { getTranslations } from "./services/translationService";

const PAYMENT_METHOD_LABELS = {
  wechat_pay: { en: "WeChat Pay", zh: "微信支付" },
  alipay: { en: "Alipay", zh: "支付宝" },
  cheque: { en: "Cheque", zh: "支票" },
  cash: { en: "Cash", zh: "现金" },
  bank_transfer: { en: "Bank Transfer", zh: "银行转账" },
  usd: { en: "US Dollars", zh: "美元" },
};

const QUALITY_OPTIONS = ["Best", "Good", "Normal", "Bad", "Worst"];
const USD_EXCHANGE_RATE = 7;
const SINGAPORE_TIMEZONE = "Asia/Singapore";

function getCurrentDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const createLotForm = () => ({
  product_name: "",
  sellerName: "",
  sellerPhone: "",
  purchase_date: getCurrentDateInputValue(),
  bought_weight_tons: "",
  cost_per_ton: "",
  color: "",
  quality: "Good",
  location: "",
});

const createCompanyForm = () => ({
  name: "",
  contact_person: "",
  phone: "",
  address: "",
});

const createSellerForm = () => ({
  name: "",
  phone: "",
  address: "",
});

const createOperationalCostForm = () => ({
  cost_type: "",
  calc_mode: "amount",
  quantity: "1",
  unit_cost: "",
  amount: "",
  cost_date: getCurrentDateInputValue(),
  note: "",
});

function inferOperationalCostCategory(costType) {
  const value = String(costType || "")
    .trim()
    .toLowerCase();
  if (!value) return "other";

  if (
    value.includes("driver") ||
    value.includes("delivery") ||
    value.includes("public transport") ||
    value.includes("shopping") ||
    value.includes("outing") ||
    value.includes("travel") ||
    value.includes("tourism") ||
    value.includes("transport") ||
    value.includes("truck") ||
    value.includes("fuel") ||
    value.includes("petrol") ||
    value.includes("toll") ||
    value.includes("司机") ||
    value.includes("运费") ||
    value.includes("公共交通") ||
    value.includes("购物") ||
    value.includes("旅游") ||
    value.includes("运费") ||
    value.includes("油") ||
    value.includes("路费")
  ) {
    return "driver";
  }

  if (
    value.includes("labour") ||
    value.includes("labor") ||
    value.includes("loading") ||
    value.includes("unload") ||
    value.includes("搬运") ||
    value.includes("装货") ||
    value.includes("卸货")
  ) {
    return "labour";
  }

  return "other";
}

const createLotReturnForm = () => ({
  return_weight_tons: "",
  return_date: getCurrentDateInputValue(),
  return_reason: "",
});

const normalizeName = (value) => value?.trim().toLowerCase() || "";

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

function formatPaymentAmount(amount, method, lang = "en") {
  const cnyAmount = Number(amount || 0);
  if (method === "usd") {
    const usdAmount = cnyAmount / USD_EXCHANGE_RATE;
    if (lang === "zh") {
      return `${formatUsd(usdAmount)}（${formatCurrency(cnyAmount)} 人民币，汇率 x${USD_EXCHANGE_RATE}）`;
    }
    return `${formatUsd(usdAmount)} (${formatCurrency(cnyAmount)} CNY, x${USD_EXCHANGE_RATE})`;
  }
  return formatCurrency(cnyAmount);
}

const formatWeight = (value, lang = "en") =>
  `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} ${lang === "zh" ? "吨" : "tons"}`;

const SheepBadgeIcon = ({ className = "" }) => (
  <svg viewBox="0 0 120 78" className={className} aria-hidden="true">
    <g strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="60" cy="66" rx="42" ry="4" fill="#000" opacity="0.07" />

      <g transform="translate(29 38)">
        <g fill="#fffdf8" stroke="#dbc8ad" strokeWidth="2">
          <circle cx="0" cy="-8" r="8.5" />
          <circle cx="-7" cy="-3" r="7.5" />
          <circle cx="7" cy="-3" r="7.5" />
          <circle cx="-2" cy="4" r="7.5" />
          <circle cx="6" cy="4" r="7.5" />
        </g>
        <ellipse
          cx="1.5"
          cy="4.8"
          rx="6.8"
          ry="8"
          fill="#f3ddc9"
          stroke="#c8a88d"
          strokeWidth="2"
        />
        <ellipse cx="-4.4" cy="0.9" rx="1.7" ry="2.4" fill="#c8a88d" />
        <ellipse cx="7.6" cy="0.9" rx="1.7" ry="2.4" fill="#c8a88d" />
        <circle cx="-0.8" cy="4.4" r="1.1" fill="#2f3137" />
        <circle cx="3.8" cy="4.4" r="1.1" fill="#2f3137" />
        <path
          d="M0.2 8.5c1 .95 2.5.95 3.5 0"
          stroke="#8a6150"
          strokeWidth="1.4"
        />
        <rect
          x="-2.3"
          y="11.3"
          width="2.6"
          height="7.2"
          rx="1.3"
          fill="#d1af94"
        />
        <rect
          x="3.1"
          y="11.3"
          width="2.6"
          height="7.2"
          rx="1.3"
          fill="#d1af94"
        />
      </g>

      <g transform="translate(60 35)">
        <g fill="#fffdf8" stroke="#dbc8ad" strokeWidth="2.2">
          <circle cx="0" cy="-10.5" r="10.5" />
          <circle cx="-9" cy="-5" r="9" />
          <circle cx="9" cy="-5" r="9" />
          <circle cx="-3" cy="3.5" r="9" />
          <circle cx="7" cy="3.5" r="9" />
        </g>
        <ellipse
          cx="1.8"
          cy="4.3"
          rx="8.5"
          ry="9.8"
          fill="#f3ddc9"
          stroke="#c8a88d"
          strokeWidth="2.2"
        />
        <ellipse cx="-5.4" cy="-0.2" rx="2" ry="2.8" fill="#c8a88d" />
        <ellipse cx="8.9" cy="-0.2" rx="2" ry="2.8" fill="#c8a88d" />
        <circle cx="-0.8" cy="3.8" r="1.3" fill="#2f3137" />
        <circle cx="4.7" cy="3.8" r="1.3" fill="#2f3137" />
        <path
          d="M0.4 8.7c1.2 1.1 3 1.1 4.2 0"
          stroke="#8a6150"
          strokeWidth="1.6"
        />
        <ellipse cx="-3.8" cy="7.3" rx="1.4" ry="1" fill="#f6b0c3" />
        <ellipse cx="7.2" cy="7.3" rx="1.4" ry="1" fill="#f6b0c3" />
        <rect
          x="-2.1"
          y="13.1"
          width="3"
          height="8.4"
          rx="1.5"
          fill="#d1af94"
        />
        <rect x="3.9" y="13.1" width="3" height="8.4" rx="1.5" fill="#d1af94" />
      </g>

      <g transform="translate(91 38)">
        <g fill="#fffdf8" stroke="#dbc8ad" strokeWidth="2">
          <circle cx="0" cy="-8" r="8.5" />
          <circle cx="-7" cy="-3" r="7.5" />
          <circle cx="7" cy="-3" r="7.5" />
          <circle cx="-2" cy="4" r="7.5" />
          <circle cx="6" cy="4" r="7.5" />
        </g>
        <ellipse
          cx="1.5"
          cy="4.8"
          rx="6.8"
          ry="8"
          fill="#f3ddc9"
          stroke="#c8a88d"
          strokeWidth="2"
        />
        <ellipse cx="-4.4" cy="0.9" rx="1.7" ry="2.4" fill="#c8a88d" />
        <ellipse cx="7.6" cy="0.9" rx="1.7" ry="2.4" fill="#c8a88d" />
        <circle cx="-0.8" cy="4.4" r="1.1" fill="#2f3137" />
        <circle cx="3.8" cy="4.4" r="1.1" fill="#2f3137" />
        <path
          d="M0.2 8.5c1 .95 2.5.95 3.5 0"
          stroke="#8a6150"
          strokeWidth="1.4"
        />
        <rect
          x="-2.3"
          y="11.3"
          width="2.6"
          height="7.2"
          rx="1.3"
          fill="#d1af94"
        />
        <rect
          x="3.1"
          y="11.3"
          width="2.6"
          height="7.2"
          rx="1.3"
          fill="#d1af94"
        />
      </g>
    </g>
  </svg>
);

function formatDateTimeInSingapore(value, lang = "en") {
  if (!value) return "-";

  const raw = String(value).trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const parsed = isDateOnly ? new Date(`${raw}T00:00:00+08:00`) : new Date(raw);

  if (Number.isNaN(parsed.getTime())) return raw;

  const locale = lang === "zh" ? "zh-CN" : "en-SG";
  const options = isDateOnly
    ? {
        timeZone: SINGAPORE_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    : {
        timeZone: SINGAPORE_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };

  const formatted = new Intl.DateTimeFormat(locale, options).format(parsed);
  return formatted;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        richColors
        expand={false}
        visibleToasts={1}
        duration={1900}
        gap={8}
        offset={{ top: 14 }}
        mobileOffset={{ top: 12, left: 12, right: 12 }}
        toastOptions={{
          duration: 1900,
          style: {
            maxWidth: "min(92vw, 320px)",
            borderRadius: "18px",
          },
          classNames: {
            toast: "!border !border-zinc-200/80 !bg-white/96 !px-3.5 !py-3 !shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-md",
            title: "!text-sm !font-bold !text-zinc-900",
            description: "!text-xs !text-zinc-500",
            content: "!gap-2.5",
            icon: "!mr-1",
            success: "!border-emerald-200/90",
            error: "!border-red-200/90",
            warning: "!border-amber-200/90",
            info: "!border-sky-200/90",
          },
        }}
      />
      <AppContent />
    </>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("zh");
  const [t, setT] = useState(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
  const [operationalCostForm, setOperationalCostForm] = useState(
    createOperationalCostForm(),
  );
  const [saleForms, setSaleForms] = useState({});
  const [companyPaymentForms, setCompanyPaymentForms] = useState({});
  const [sellerPaymentForms, setSellerPaymentForms] = useState({});
  const [lotReturnForms, setLotReturnForms] = useState({});
  const [lotQualityDrafts, setLotQualityDrafts] = useState({});
  const [expandedCompanyIds, setExpandedCompanyIds] = useState({});
  const [expandedSellerIds, setExpandedSellerIds] = useState({});
  const [submittingKey, setSubmittingKey] = useState("");
  const [showLotModal, setShowLotModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  useEffect(() => {
    getTranslations(lang).then(setT);
  }, [lang]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    refreshDashboard(user.uid);
  }, [user]);

  useEffect(() => {
    if (activeTab === "sales") {
      setActiveTab("companies");
    }
  }, [activeTab]);

  useEffect(() => {
    if (!showSettingsMenu) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowSettingsMenu(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showSettingsMenu]);

  const paymentMethodOptions = dashboard.paymentMethods.map((method) => ({
    value: method,
    label: PAYMENT_METHOD_LABELS[method]?.[lang] || method,
  }));
  const operationalCostTypeSuggestions = [
    lang === "zh" ? "运费" : "Delivery fee",
    t?.categoryLabour || "Labour",
    lang === "zh" ? "装卸费" : "Loading fee",
    lang === "zh" ? "水费" : "Water bill",
    lang === "zh" ? "电费" : "Electricity bill",
    lang === "zh" ? "公共交通" : "Public transport",
    lang === "zh" ? "旅游" : "Leisure outing",
    lang === "zh" ? "购物" : "Shopping",
    t?.categoryOther || "Other",
  ];
  const text = {
    appTitle: t?.appTitle,
    originTag: t?.originTag,
    appSubtitle: t?.appSubtitle,
    welcomeBack: t?.welcomeBack,
    usernameLabel: t?.usernameLabel,
    inventoryLots: t?.inventoryLots,
    costsMenu: t?.costsMenu,
    sales: t?.sales,
    inventoryCost: t?.inventoryCost,
    remainingWeight: t?.remainingWeight,
    soldValue: t?.soldValue,
    received: t?.received,
    totalCost: t?.totalCost,
    today: t?.today,
    thisMonth: t?.thisMonth,
    thisYear: t?.thisYear,
    allTime: t?.allTime,
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
    companyPaymentExceedsOwed: t?.companyPaymentExceedsOwed,
    sellerPaymentExceedsOwed: t?.sellerPaymentExceedsOwed,
    loggedIn: t?.loggedIn,
    registered: t?.registered,
    saveCompany: t?.saveCompany,
    saveSeller: t?.saveSeller,
    addCompanyInfo: t?.addCompanyInfo,
    addSellerInfo: t?.addSellerInfo,
    setupCompanyHint: t?.setupCompanyHint,
    setupSellerHint: t?.setupSellerHint,
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
    companyProcessingCost: t?.companyProcessingCost,
    processCost: t?.processCost,
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
    analysisOverview: t?.analysisOverview,
    analysisCompanies: t?.analysisCompanies,
    analysisSellers: t?.analysisSellers,
    analysisInventory: t?.analysisInventory,
    analysisCosts: t?.analysisCosts,
    viewAllCompanyData: t?.viewAllCompanyData,
    viewAllInventoryData: t?.viewAllInventoryData,
    detailBack: t?.detailBack,
    companyDataCenterTitle: t?.companyDataCenterTitle,
    companyDataCenterSubtitle: t?.companyDataCenterSubtitle,
    inventoryDataCenterTitle: t?.inventoryDataCenterTitle,
    inventoryDataCenterSubtitle: t?.inventoryDataCenterSubtitle,
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
    expandDetails: t?.expandDetails,
    collapseDetails: t?.collapseDetails,
    settings: t?.settings,
    switchLanguage: t?.switchLanguage,
    main: t?.main,
    logout: t?.logout,
  };

  const formatWeightDisplay = (value) => formatWeight(value, lang);
  const formatPaymentAmountDisplay = (amount, method) =>
    formatPaymentAmount(amount, method, lang);
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
    const totalInventoryCost = dashboard.lots.reduce(
      (sum, lot) => sum + Number(lot.total_cost || 0),
      0,
    );
    const totalRemainingWeight = dashboard.lots.reduce(
      (sum, lot) => sum + Number(lot.remaining_weight_tons || 0),
      0,
    );
    const totalSoldValue = dashboard.sales.reduce(
      (sum, sale) => sum + Number(sale.sale_value || 0),
      0,
    );
    const totalReceived = dashboard.sales.reduce(
      (sum, sale) => sum + Number(sale.received_amount || 0),
      0,
    );

    return {
      totalInventoryCost,
      totalRemainingWeight,
      totalSoldValue,
      totalReceived,
    };
  }, [dashboard]);
  const operationalCostComputedAmount =
    Number(operationalCostForm.quantity || 0) *
    Number(operationalCostForm.unit_cost || 0);
  const isOperationalCostQuantityMode =
    operationalCostForm.calc_mode === "quantity";
  const localizedApiErrorMap = {
    "Request failed": "请求失败",
    "uid is required": "缺少用户信息，请重新登录。",
    "Seller name is required": "必须填写卖家名称。",
    "Failed to fetch sellers": "获取卖家列表失败。",
    "Failed to save seller": "保存卖家失败。",
    "Failed to fetch companies": "获取公司列表失败。",
    "Company name is required": "必须填写公司名称。",
    "Failed to save company": "保存公司失败。",
    "Valid payment amount is required": "请输入有效付款金额。",
    "payment_method is required": "请选择付款方式。",
    "Company has no sales yet": "该公司还没有销售记录。",
    "No unpaid company balance found": "该公司目前没有可收款的欠款记录。",
    "Failed to add company payment": "添加公司收款失败。",
    "Seller has no purchase lots yet": "该卖家还没有进货批次。",
    "No unpaid seller balance found": "没有可付款的欠款记录。",
    "Payment amount cannot exceed seller balance owed":
      "付款金额不能大于当前应付给该卖家的金额。",
    "Failed to add seller payment": "添加卖家付款失败。",
    "Company not found": "公司不存在。",
    "Missing bad_credit column. Please run: ALTER TABLE companies ADD COLUMN bad_credit boolean not null default false;":
      "缺少公司信用字段，请先执行数据库字段迁移。",
    "Failed to update company credit status": "更新公司信用状态失败。",
    "This company already has sales records, so it cannot be deleted.":
      "该公司已有销售记录，不能删除。",
    "Failed to delete company": "删除公司失败。",
    "Valid seller id is required": "卖家信息无效。",
    "lot_id is required": "缺少产品批次信息。",
    "Valid return_weight_tons is required": "请输入有效退货重量。",
    "Lot not found for this seller": "未找到该卖家的对应批次。",
    "This lot has no remaining returnable weight": "该批次没有可退货重量。",
    "Return weight exceeds remaining unsold lot weight":
      "退货重量超过当前可退重量。",
    "Failed to record seller return": "保存退货失败。",
    "Seller not found": "卖家不存在。",
    "Failed to update seller quality status": "更新卖家品质状态失败。",
    "Failed to delete seller": "删除卖家失败。",
    "Product name is required": "必须填写产品名称。",
    "Purchase date is required": "必须填写进货日期。",
    "Weight and cost must be valid numbers": "重量和成本必须是有效数字。",
    "Failed to save lot": "保存产品失败。",
    "Bought weight cannot be less than sold weight plus returned weight":
      "进货重量不能小于已售重量与已退货重量之和。",
    "Failed to update lot": "更新产品失败。",
    "Failed to delete lot": "删除产品失败。",
    "Lot not found": "未找到该批次。",
    "Failed to update lot photo": "更新产品图片失败。",
    "lot_id, company_id, and sale_date are required":
      "缺少销售必填信息（批次、公司、日期）。",
    "Sale weight and price must be valid numbers":
      "销售重量和单价必须是有效数字。",
    "Sold weight exceeds remaining lot weight after returns":
      "销售重量超过剩余可售重量（已扣除退货）。",
    "Lot or company reference is invalid for this database.":
      "产品批次或公司数据无效，请检查后重试。",
    "Failed to save sale": "保存销售失败。",
    "quantity must be a positive number": "数量必须大于 0。",
    "Valid amount is required, or provide unit_cost and quantity for auto-calculation":
      "请填写有效金额，或填写数量和单价进行自动计算。",
    "Missing operational_costs table. Please run the SQL migration for operational costs first.":
      "缺少日常花销数据表，请先执行数据库迁移。",
    "Database schema does not match operational costs columns. Please run the SQL migration.":
      "日常花销表结构不匹配，请先执行数据库迁移。",
    "Failed to save operational cost": "保存日常花销失败。",
    "Operational cost record not found": "未找到该日常花销记录。",
    "Failed to delete operational cost": "删除日常花销失败。",
    "Database schema does not match the app yet. Please double-check the SQL tables and columns.":
      "数据库结构与系统不匹配，请检查 SQL 表和字段。",
    "User or seller reference is invalid for this database. Please sign in again and check the selected seller.":
      "用户或卖家数据无效，请重新登录后再试。",
    "Lot or company reference is invalid for this database.":
      "产品批次或公司数据无效。",
    "Missing seller_returns table. Please run the SQL migration for seller returns first.":
      "缺少退货数据表，请先执行数据库迁移。",
    "Missing sellers.bad_quality column. Please run the SQL migration for seller quality flags.":
      "缺少卖家品质字段，请先执行数据库迁移。",
    "User session is not linked to the current database. Please log out and register or log in again.":
      "当前登录会话与数据库不匹配，请退出后重新登录。",
    "Invalid uid format. Please log out and sign in again.":
      "用户信息格式无效，请退出后重新登录。",
  };

  function localizeErrorMessage(message) {
    const normalized = String(message || "").trim();
    if (!normalized) return lang === "zh" ? "请求失败" : "Request failed";
    if (lang !== "zh") return normalized;
    return localizedApiErrorMap[normalized] || normalized;
  }

  async function apiFetch(path, options = {}) {
    const response = await fetch(path, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(localizeErrorMessage(data.error || "Request failed"));
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

  async function ensureSeller(name, phone = "", address = "") {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const existingSeller = dashboard.sellers.find(
      (seller) => normalizeName(seller.name) === normalizeName(trimmedName),
    );

    if (existingSeller) {
      return existingSeller;
    }

    return apiFetch("/api/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        name: trimmedName,
        phone,
        address,
      }),
    });
  }

  async function ensureCompany(
    name,
    contactPerson = "",
    phone = "",
    address = "",
  ) {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const existingCompany = dashboard.companies.find(
      (company) => normalizeName(company.name) === normalizeName(trimmedName),
    );

    if (existingCompany) {
      return existingCompany;
    }

    return apiFetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      const data = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
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
      const data = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, password }),
      });

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      toast.success(text.registered);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setShowSettingsMenu(false);
    setShowCompanyModal(false);
    setShowSellerModal(false);
    setShowLotModal(false);
    setUser(null);
    localStorage.removeItem("user");
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
    setSubmittingKey("lot");

    try {
      const seller = lotForm.sellerName
        ? await ensureSeller(lotForm.sellerName, lotForm.sellerPhone)
        : null;

      await apiFetch("/api/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setSubmittingKey("");
    }
  }

  async function handleDeleteLot(lotId) {
    if (!window.confirm(text.deleteLotConfirm)) return;

    try {
      await apiFetch(`/api/lots/${lotId}?uid=${user.uid}`, {
        method: "DELETE",
      });

      await refreshDashboard();
      toast.success(text.lotDeleted);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCreateCompany(event) {
    event.preventDefault();
    setSubmittingKey("company");

    try {
      await ensureCompany(
        companyForm.name,
        companyForm.contact_person,
        companyForm.phone,
        companyForm.address,
      );

      setCompanyForm(createCompanyForm());
      setShowCompanyModal(false);
      await refreshDashboard();
      toast.success(text.companySaved);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleCreateSeller(event) {
    event.preventDefault();
    setSubmittingKey("seller");

    try {
      await ensureSeller(sellerForm.name, sellerForm.phone, sellerForm.address);
      setSellerForm(createSellerForm());
      setShowSellerModal(false);
      await refreshDashboard();
      toast.success(text.sellerSaved);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleCreateSale(lot) {
    const form = saleForms[lot.id] || {};
    setSubmittingKey(`sale-${lot.id}`);

    try {
      const typedCompanyName = String(form.companyName || "").trim();
      if (!typedCompanyName) {
        throw new Error(
          text.companyRequired ||
            (lang === "zh" ? "必须填写公司" : "Company is required"),
        );
      }

      const company = dashboard.companies.find(
        (item) => normalizeName(item.name) === normalizeName(typedCompanyName),
      );

      if (!company) {
        setCompanyForm((current) => ({
          ...current,
          name: typedCompanyName || current.name,
        }));
        setActiveTab("companies");
        setShowCompanyModal(true);
        throw new Error(
          text.createCompanyFirst ||
            (lang === "zh"
              ? "请先创建公司资料。"
              : "Please create company information first."),
        );
      }

      await apiFetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          lot_id: lot.id,
          company_id: company.id,
          sale_date: form.sale_date || getCurrentDateInputValue(),
          sold_weight_tons: form.sold_weight_tons,
          price_per_ton: form.price_per_ton,
          location: form.location || "",
        }),
      });

      setSaleForms((current) => ({
        ...current,
        [lot.id]: {
          companyName: "",
          sale_date: getCurrentDateInputValue(),
          sold_weight_tons: "",
          price_per_ton: "",
          location: "",
        },
      }));

      await refreshDashboard();
      toast.success(text.saleRecorded);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleCompanyPayment(company) {
    const form = companyPaymentForms[company.id] || {};
    setSubmittingKey(`company-payment-${company.id}`);

    try {
      const paymentAmount = Number(form.amount || 0);
      const balanceOwed = Number(company.balance_owed || 0);
      if (paymentAmount > balanceOwed + 0.000001) {
        throw new Error(
          text.companyPaymentExceedsOwed ||
            (lang === "zh"
              ? "收款金额不能大于该公司当前应付金额。"
              : "Payment cannot be higher than amount owed by this company."),
        );
      }

      await apiFetch(`/api/companies/${company.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          amount: form.amount,
          payment_method: form.payment_method,
          payment_date:
            form.payment_date || getCurrentDateInputValue(),
          note: form.note || "",
        }),
      });

      setCompanyPaymentForms((current) => ({
        ...current,
        [company.id]: {
          amount: "",
          payment_method: "wechat_pay",
          payment_date: getCurrentDateInputValue(),
          note: "",
        },
      }));

      await refreshDashboard();
      toast.success(text.companyPaymentAdded);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleToggleCompanyCredit(company) {
    setSubmittingKey(`company-credit-${company.id}`);

    try {
      await apiFetch(`/api/companies/${company.id}/credit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          bad_credit: !company.bad_credit,
        }),
      });

      await refreshDashboard();
      toast.success(
        !company.bad_credit ? text.markBadCredit : text.clearBadCredit,
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleDeleteCompany(company) {
    if (!window.confirm(`${text.deleteCompany}: ${company.name}?`)) return;

    setSubmittingKey(`company-delete-${company.id}`);

    try {
      await apiFetch(`/api/companies/${company.id}?uid=${user.uid}`, {
        method: "DELETE",
      });

      await refreshDashboard();
      toast.success(text.deleteCompany);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleSellerPayment(seller) {
    const form = sellerPaymentForms[seller.id] || {};
    setSubmittingKey(`seller-payment-${seller.id}`);

    try {
      const paymentAmount = Number(form.amount || 0);
      const balanceOwed = Number(seller.balance_owed || 0);
      if (paymentAmount > balanceOwed + 0.000001) {
        throw new Error(
          text.sellerPaymentExceedsOwed ||
            (lang === "zh"
              ? "付款金额不能大于当前应付给该卖家的金额。"
              : "Payment cannot be higher than amount owed to this seller."),
        );
      }

      await apiFetch(`/api/sellers/${seller.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          amount: form.amount,
          payment_method: form.payment_method,
          payment_date:
            form.payment_date || getCurrentDateInputValue(),
          note: form.note || "",
        }),
      });

      setSellerPaymentForms((current) => ({
        ...current,
        [seller.id]: {
          amount: "",
          payment_method: "cash",
          payment_date: getCurrentDateInputValue(),
          note: "",
        },
      }));

      await refreshDashboard();
      toast.success(text.sellerPaymentAdded);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleToggleSellerQuality(seller) {
    setSubmittingKey(`seller-quality-${seller.id}`);

    try {
      await apiFetch(`/api/sellers/${seller.id}/quality`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          bad_quality: !seller.bad_quality,
        }),
      });

      await refreshDashboard();
      toast.success(
        !seller.bad_quality ? text.markBadSeller : text.clearBadSeller,
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleDeleteSeller(seller) {
    if (!window.confirm(`${text.deleteSellerConfirm}\n\n${seller.name}`))
      return;

    setSubmittingKey(`seller-delete-${seller.id}`);

    try {
      await apiFetch(`/api/sellers/${seller.id}?uid=${user.uid}`, {
        method: "DELETE",
      });

      await refreshDashboard();
      toast.success(text.deleteSeller);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
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
      toast.error(
        lang === "zh"
          ? "请填写有效的退货重量。"
          : "Please enter a valid return weight.",
      );
      return;
    }

    if (returnWeight > remainingWeight + 0.000001) {
      toast.error(
        lang === "zh"
          ? "退货重量不能超过当前剩余重量。"
          : "Return weight cannot exceed remaining lot weight.",
      );
      return;
    }

    setSubmittingKey(`lot-return-${lot.id}`);

    try {
      await apiFetch(`/api/sellers/${lot.seller_id}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          lot_id: lot.id,
          return_weight_tons: returnWeight,
          return_date:
            form.return_date || getCurrentDateInputValue(),
          return_reason: form.return_reason || "",
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
      setSubmittingKey("");
    }
  }

  async function handleUpdateLotQuality(lot) {
    const selectedQuality =
      String(lotQualityDrafts[lot.id] ?? lot.quality ?? "Good").trim() ||
      "Good";
    setSubmittingKey(`lot-quality-${lot.id}`);

    try {
      await apiFetch(`/api/lots/${lot.id}?uid=${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: lot.seller_id || null,
          product_name: lot.product_name || "",
          color: lot.color || "",
          quality: selectedQuality,
          image_url: lot.image_url || null,
          purchase_date:
            String(lot.purchase_date || "").slice(0, 10) ||
            getCurrentDateInputValue(),
          bought_weight_tons: Number(lot.bought_weight_tons || 0),
          cost_per_ton: Number(lot.cost_per_ton || 0),
          location: lot.location || "",
          notes: lot.notes || "",
        }),
      });

      setLotQualityDrafts((current) => {
        const next = { ...current };
        delete next[lot.id];
        return next;
      });

      await refreshDashboard();
      toast.success(text.qualityUpdated || "Quality updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingKey("");
    }
  }

  async function handleCreateOperationalCost(event) {
    event.preventDefault();
    setSubmittingKey("operational-cost");

    try {
      const isQuantityMode = operationalCostForm.calc_mode === "quantity";
      const quantity = isQuantityMode
        ? Number(operationalCostForm.quantity)
        : 1;
      const unitCost = isQuantityMode
        ? Number(operationalCostForm.unit_cost)
        : Number.NaN;
      const fallbackCostType = text.categoryOther || "Other";
      const normalizedCostType =
        String(operationalCostForm.cost_type || "").trim() || fallbackCostType;
      const category = inferOperationalCostCategory(normalizedCostType);
      let amount = Number(operationalCostForm.amount);

      if (isQuantityMode) {
        if (
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(unitCost) ||
          unitCost < 0
        ) {
          throw new Error(
            lang === "zh"
              ? "请填写有效的数量和单价。"
              : "Please enter valid quantity and unit cost.",
          );
        }
        amount = quantity * unitCost;
      } else if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(
          lang === "zh" ? "请输入有效金额。" : "Please enter a valid amount.",
        );
      }

      await apiFetch("/api/operational-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          category,
          cost_type: normalizedCostType,
          quantity,
          unit_cost: isQuantityMode ? unitCost : "",
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
      setSubmittingKey("");
    }
  }

  async function handleDeleteOperationalCost(costId, options = {}) {
    const { silent = false, skipRefresh = false } = options;

    try {
      await apiFetch(`/api/operational-costs/${costId}?uid=${user.uid}`, {
        method: "DELETE",
      });

      if (!skipRefresh) {
        await refreshDashboard();
      }
      if (!silent) {
        toast.success(text.operationalCostDeleted, {
          id: "operational-cost-delete",
        });
      }
    } catch (error) {
      if (!silent) {
        toast.error(error.message);
      }
      throw error;
    }
  }

  function handleToggleCompanyExpand(companyId) {
    setExpandedCompanyIds((current) => ({
      ...current,
      [companyId]: !Boolean(current[companyId]),
    }));
  }

  function handleToggleSellerExpand(sellerId) {
    setExpandedSellerIds((current) => ({
      ...current,
      [sellerId]: !Boolean(current[sellerId]),
    }));
  }

  function handleOpenLotModal() {
    if ((dashboard.sellers || []).length === 0) {
      toast.error(
        text.createSellerFirst ||
          "Please create a seller first before adding a product.",
      );
      setActiveTab("sellers");
      setShowSellerModal(true);
      return;
    }
    setShowLotModal(true);
  }

  function toggleLanguage() {
    setLang((current) => (current === "en" ? "zh" : "en"));
  }

  const mobileNavItems = [
    {
      key: "inventory",
      label: t?.inventory || text.inventoryLots || "Inventory",
      icon: Package,
    },
    { key: "companies", label: t?.companies || "Companies", icon: Building2 },
    { key: "sellers", label: t?.sellers || "Sellers", icon: Users },
    {
      key: "costs",
      label:
        text.costsMenu ||
        text.operationalCosts ||
        (lang === "zh" ? "日常开销" : "Daily Costs"),
      icon: Banknote,
    },
    { key: "analytics", label: t?.analytics || "Analytics", icon: Wallet },
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
            <Button
              variant="ghost"
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
            >
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </Button>
          </div>

          <form
            onSubmit={isRegistering ? handleRegister : handleLogin}
            className="space-y-4"
          >
            {isRegistering ? (
              <Input
                label={t.name}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            ) : null}
            <Input
              label={t.email}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              label={t.password}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button
              type="submit"
              className="w-full py-3"
              disabled={authLoading}
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
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

  const displayName =
    user?.name ||
    user?.full_name ||
    user?.email?.split("@")?.[0] ||
    (lang === "zh" ? "朋友" : "friend");
  const hasSellerProfiles = (dashboard.sellers || []).length > 0;
  const hasCompanyProfiles = (dashboard.companies || []).length > 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-amber-100 via-orange-100 to-lime-100 shadow-sm">
                <SheepBadgeIcon className="h-10 w-10" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex max-w-full items-start gap-1">
                  <h1 className="truncate text-lg font-black tracking-tight">
                    {text.appTitle}
                  </h1>
                  <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-200/95 via-emerald-100 to-sky-200/95 px-1.5 py-0.5 text-[8px] font-semibold tracking-wide text-emerald-900 shadow-sm">
                    <span className="inline-flex h-3.5 w-6 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/55">
                      <svg
                        viewBox="0 0 24 16"
                        className="h-3.5 w-6"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id="lakeGradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#67e8f9" />
                            <stop offset="100%" stopColor="#0ea5e9" />
                          </linearGradient>
                        </defs>
                        <path d="M0 12h24v4H0z" fill="url(#lakeGradient)" />
                        <path d="M2 10l4-6 4 6z" fill="#16a34a" />
                        <path d="M8 10l3.5-5 3.5 5z" fill="#15803d" />
                        <path d="M14 10l3.5-4.5L21 10z" fill="#166534" />
                        <path
                          d="M8.7 11.2h4.6V8.9l-2.3-1.55-2.3 1.55z"
                          fill="#f8fafc"
                        />
                        <path
                          d="M8.3 8.95L11 7.05l2.7 1.9-.45.72H8.75z"
                          fill="#111827"
                        />
                        <path
                          d="M9.5 11.2h1.1V9.95H9.5zM11.4 11.2h1.1V9.95h-1.1z"
                          fill="#d1d5db"
                        />
                        <path
                          d="M8.1 8.55h5.8"
                          stroke="#1f2937"
                          strokeWidth="0.45"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8.35 8.15h5.3"
                          stroke="#111827"
                          strokeWidth="0.35"
                          strokeLinecap="round"
                        />
                        <path
                          d="M1.5 13.2c1.6-.6 3.2-.6 4.8 0"
                          stroke="#e0f2fe"
                          strokeWidth="0.8"
                          fill="none"
                        />
                        <path
                          d="M6.5 13.2c1.6-.6 3.2-.6 4.8 0"
                          stroke="#e0f2fe"
                          strokeWidth="0.8"
                          fill="none"
                        />
                      </svg>
                    </span>
                    {text.originTag ||
                      (lang === "zh" ? "来自苏州" : "from SUZHOU")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsMenu(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-900"
                aria-label={text.settings || "Settings"}
                aria-expanded={showSettingsMenu}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!showLotModal ? (
            <div className="mt-3">
              <MobileTabBar
                activeTab={activeTab}
                onChange={setActiveTab}
                items={mobileNavItems}
                text={text}
              />
            </div>
          ) : null}
        </div>
      </header>

      <SettingsDrawer
        ctx={{
          showSettingsMenu,
          setShowSettingsMenu,
          text,
          lang,
          displayName,
          toggleLanguage,
          handleLogout,
        }}
      />

      <div className="mx-auto max-w-7xl overflow-x-hidden px-4 py-4 pb-6 sm:px-6 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden h-fit max-w-full rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-sm lg:block">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-2 lg:overflow-visible lg:px-0 lg:pb-0">
              <NavButton
                active={activeTab === "inventory"}
                onClick={() => setActiveTab("inventory")}
                icon={<Package className="w-5 h-5" />}
              >
                {text.inventoryLots}
              </NavButton>
              <NavButton
                active={activeTab === "companies"}
                onClick={() => setActiveTab("companies")}
                icon={<Building2 className="w-5 h-5" />}
              >
                {t.companies}
              </NavButton>
              <NavButton
                active={activeTab === "sellers"}
                onClick={() => setActiveTab("sellers")}
                icon={<Users className="w-5 h-5" />}
              >
                {t.sellers}
              </NavButton>
              <NavButton
                active={activeTab === "costs"}
                onClick={() => setActiveTab("costs")}
                icon={<Banknote className="w-5 h-5" />}
              >
                {text.costsMenu || text.operationalCosts}
              </NavButton>
              <NavButton
                active={activeTab === "analytics"}
                onClick={() => setActiveTab("analytics")}
                icon={<Wallet className="w-5 h-5" />}
              >
                {t.analytics}
              </NavButton>
            </div>
          </aside>

          <main className="min-w-0 space-y-6">
            {activeTab === "inventory" ? (
              <InventoryPage
                ctx={{
                  t,
                  text,
                  lang,
                  overview,
                  formatCurrency,
                  formatWeightDisplay,
                  MobileDisclosure,
                  MiniMetric,
                  StatCard,
                  searchQuery,
                  setSearchQuery,
                  hasSellerProfiles,
                  handleOpenLotModal,
                  Button,
                  filteredLots,
                  saleForms,
                  setSaleForms,
                  lotReturnForms,
                  setLotReturnForms,
                  lotQualityDrafts,
                  setLotQualityDrafts,
                  handleDeleteLot,
                  formatDateDisplay,
                  Select,
                  QUALITY_OPTIONS,
                  handleUpdateLotQuality,
                  submittingKey,
                  hasCompanyProfiles,
                  setActiveTab,
                  setShowCompanyModal,
                  Input,
                  handleCreateSale,
                  dashboard,
                  handleLotReturn,
                  EmptyState,
                }}
              />
            ) : null}

            {activeTab === "companies" ? (
              <CompaniesPage
                ctx={{
                  text,
                  lang,
                  t,
                  dashboard,
                  companyPaymentForms,
                  setCompanyPaymentForms,
                  expandedCompanyIds,
                  handleToggleCompanyExpand,
                  formatCurrency,
                  setShowCompanyModal,
                  SetupActionCard,
                  Input,
                  Select,
                  Button,
                  MiniMetric,
                  MobileDisclosure,
                  DesktopDisclosure,
                  PaymentRecordRow: (props) => (
                    <PaymentRecordRow
                      {...props}
                      paymentMethodLabels={PAYMENT_METHOD_LABELS}
                      formatPaymentAmount={formatPaymentAmount}
                      formatDateTime={formatDateTimeInSingapore}
                    />
                  ),
                  paymentMethodOptions,
                  submittingKey,
                  handleCompanyPayment,
                  handleToggleCompanyCredit,
                  handleDeleteCompany,
                  formatWeightDisplay,
                  formatDateDisplay,
                }}
              />
            ) : null}

            {activeTab === "sellers" ? (
              <SellersPage
                ctx={{
                  text,
                  lang,
                  t,
                  dashboard,
                  sellerPaymentForms,
                  setSellerPaymentForms,
                  expandedSellerIds,
                  handleToggleSellerExpand,
                  formatCurrency,
                  setShowSellerModal,
                  SetupActionCard,
                  Input,
                  Select,
                  Button,
                  MiniMetric,
                  MobileDisclosure,
                  paymentMethodOptions,
                  submittingKey,
                  handleSellerPayment,
                  handleToggleSellerQuality,
                  handleDeleteSeller,
                  formatWeightDisplay,
                  formatDateDisplay,
                }}
              />
            ) : null}

            {activeTab === "costs" ? (
              <CostsPage
                ctx={{
                  text,
                  t,
                  lang,
                  operationalCostForm,
                  setOperationalCostForm,
                  handleCreateOperationalCost,
                  operationalCostTypeSuggestions,
                  isOperationalCostQuantityMode,
                  operationalCostComputedAmount,
                  formatCurrency,
                  submittingKey,
                  handleDeleteOperationalCost,
                  refreshDashboard,
                  dashboard,
                  Input,
                  Button,
                  QuickChoicePills,
                  formatDateDisplay,
                }}
              />
            ) : null}

            {activeTab === "sales" ? (
              <SalesPage
                ctx={{
                  dashboard,
                  text,
                  t,
                  formatCurrency,
                  formatWeightDisplay,
                  formatDateDisplay,
                  formatPaymentAmountDisplay,
                  PAYMENT_METHOD_LABELS,
                  lang,
                  EmptyState,
                }}
              />
            ) : null}

            {activeTab === "analytics" ? (
              <AnalyticsDashboard
                dashboard={dashboard}
                text={text}
                lang={lang}
              />
            ) : null}
          </main>
        </div>
      </div>

      <CompanyModal
        ctx={{
          showCompanyModal,
          setShowCompanyModal,
          lang,
          t,
          text,
          handleCreateCompany,
          companyForm,
          setCompanyForm,
          Input,
          Button,
          submittingKey,
        }}
      />

      <SellerModal
        ctx={{
          showSellerModal,
          setShowSellerModal,
          lang,
          t,
          text,
          handleCreateSeller,
          sellerForm,
          setSellerForm,
          Input,
          Button,
          submittingKey,
        }}
      />

      <LotModal
        ctx={{
          showLotModal,
          setShowLotModal,
          t,
          text,
          handleCreateLot,
          lotForm,
          setLotForm,
          Input,
          Select,
          Button,
          QUALITY_OPTIONS,
          formatWeightDisplay,
          formatCurrency,
          dashboard,
          submittingKey,
        }}
      />
    </div>
  );
}
