import React from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";

export const Button = ({
  children,
  className = "",
  variant = "primary",
  ...props
}) => {
  const variants = {
    primary: "bg-black text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    outline: "border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    ghost: "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
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

export const Input = ({ label, className = "", size = "default", ...props }) => (
  <label className={`min-w-0 flex flex-col gap-1.5 ${className}`}>
    {label ? (
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        {label}
      </span>
    ) : null}
    <input
      {...props}
      className={`w-full min-w-0 border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black ${
        size === "compact"
          ? "rounded-xl px-3 py-2.5 text-base sm:rounded-lg sm:px-3 sm:py-2 sm:text-[13px]"
          : "rounded-xl px-3 py-3 text-base sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
      } ${props.className || ""}`}
    />
  </label>
);

export const Select = ({
  label,
  options,
  className = "",
  size = "default",
  ...props
}) => (
  <label className={`min-w-0 flex flex-col gap-1.5 ${className}`}>
    {label ? (
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        {label}
      </span>
    ) : null}
    <select
      {...props}
      className={`w-full min-w-0 appearance-none border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black ${
        size === "compact"
          ? "rounded-xl px-3 py-2.5 text-base sm:rounded-lg sm:px-3 sm:py-2 sm:text-[13px]"
          : "rounded-xl px-3 py-3 text-base sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
      } ${props.className || ""}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export const StatCard = ({ title, value, hint }) => (
  <div className="max-w-full rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
      {title}
    </p>
    <p className="mt-2 break-words text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">
      {value}
    </p>
    {hint ? <p className="mt-2 text-xs text-zinc-400">{hint}</p> : null}
  </div>
);

export const EmptyState = ({ title, message }) => (
  <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-10 text-center">
    <p className="text-lg font-bold text-zinc-700">{title}</p>
    <p className="mt-2 text-sm text-zinc-400">{message}</p>
  </div>
);

export const MobileDisclosure = ({
  title,
  subtitle,
  defaultOpen = false,
  children,
}) => (
  <details
    open={defaultOpen}
    className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 group"
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-black text-zinc-900">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="mt-3">{children}</div>
  </details>
);

export const QuickChoicePills = ({ title, items, activeValue, onSelect }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
      {title}
    </p>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const normalizedItem =
          typeof item === "string"
            ? { value: item, label: item }
            : item;
        const active =
          String(activeValue || "").trim() ===
          String(normalizedItem.value || "").trim();
        return (
          <button
            key={normalizedItem.value}
            type="button"
            onClick={() => onSelect(normalizedItem.value)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
              active
                ? normalizedItem.activeClassName || "border-black bg-black text-white"
                : normalizedItem.className || "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {normalizedItem.icon ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70">
                {normalizedItem.icon}
              </span>
            ) : null}
            {normalizedItem.label}
          </button>
        );
      })}
    </div>
  </div>
);

export const DesktopDisclosure = ({
  title,
  subtitle,
  defaultOpen = false,
  children,
}) => (
  <details
    open={defaultOpen}
    className="rounded-[1.75rem] border border-zinc-100 bg-zinc-50/80 p-4 group"
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
      <div className="min-w-0">
        <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">
          {title}
        </h4>
        {subtitle ? (
          <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="mt-4">{children}</div>
  </details>
);

export const SetupActionCard = ({
  icon,
  title,
  subtitle,
  buttonLabel,
  buttonIcon,
  badgeLabel,
  onClick,
  tone = "blue",
  compact = false,
}) => {
  const tones = {
    blue: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50/70",
    emerald:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50/70",
  };
  const iconTones = {
    blue: "border-sky-200 bg-sky-100/85 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-100/85 text-emerald-700",
  };
  const orbTones = {
    blue: "bg-sky-200/90",
    emerald: "bg-emerald-200/90",
  };
  const buttonTones = {
    blue: "border-sky-200/80 bg-white/92 text-sky-900 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-[0_14px_28px_rgba(56,189,248,0.16)]",
    emerald:
      "border-emerald-200/80 bg-white/92 text-emerald-900 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-[0_14px_28px_rgba(52,211,153,0.16)]",
  };
  const actionIconTones = {
    blue: "bg-gradient-to-br from-sky-500 to-cyan-400 text-white",
    emerald: "bg-gradient-to-br from-emerald-500 to-lime-400 text-white",
  };
  const badgeTones = {
    blue: "border-sky-200 bg-sky-100/80 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-100/80 text-emerald-700",
  };

  return (
    <div
      className={`relative max-w-full overflow-hidden rounded-2xl border shadow-sm sm:rounded-[2rem] ${tones[tone] || tones.blue}`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${orbTones[tone] || orbTones.blue}`}
      />
      <div className={`relative ${compact ? "p-3 sm:p-4" : "p-3 sm:p-6"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2.5 sm:gap-3">
            <div
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:h-10 sm:w-10 sm:rounded-2xl ${iconTones[tone] || iconTones.blue}`}
            >
              <div className="scale-90 sm:scale-100">{icon}</div>
            </div>
            {!compact ? (
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeTones[tone] || badgeTones.blue}`}
                >
                  {badgeLabel || "Quick Setup"}
                </span>
                <h2 className="mt-2 truncate text-sm font-black tracking-tight text-zinc-900 sm:text-xl">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-0.5 hidden text-sm font-semibold text-zinc-700 sm:block">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            ) : (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeTones[tone] || badgeTones.blue}`}
              >
                {badgeLabel || "Quick Setup"}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onClick}
            className={`min-h-[42px] shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold sm:min-h-[48px] sm:px-4 sm:py-2.5 sm:text-sm ${buttonTones[tone] || buttonTones.blue}`}
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${actionIconTones[tone] || actionIconTones.blue}`}
            >
              {buttonIcon || <ArrowUpRight className="h-3.5 w-3.5" />}
            </span>
            {buttonLabel}
          </Button>
        </div>
        {!compact && subtitle ? (
          <p className="mt-2 text-xs font-semibold text-zinc-700 sm:hidden">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export function MobileTabBar({ activeTab, onChange, items }) {
  return (
    <div className="lg:hidden">
      <div className="rounded-[1.45rem] border border-zinc-200/80 bg-white/95 p-2 shadow-lg shadow-black/5 backdrop-blur-md">
        <div
          className={`grid gap-1 ${items.length <= 5 ? "grid-cols-5" : "grid-cols-6"}`}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl px-1 py-1 text-center transition-all ${
                  active
                    ? "bg-black text-white shadow-md shadow-black/20"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="mt-1 text-[10px] font-semibold leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function NavButton({ children, active, icon, ...props }) {
  return (
    <button
      {...props}
      className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all lg:w-full ${
        active
          ? "bg-black text-white shadow-lg shadow-black/10"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {icon}
      <span className="truncate leading-tight">{children}</span>
    </button>
  );
}

export function MiniMetric({ label, value, tone = "default" }) {
  const tones = {
    default: "border-zinc-100 bg-white text-zinc-900 label:text-zinc-400",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-800 label:text-emerald-600",
    orange:
      "border-orange-100 bg-orange-50 text-orange-800 label:text-orange-600",
    blue: "border-sky-100 bg-sky-50 text-sky-800 label:text-sky-600",
    dark: "border-zinc-900 bg-zinc-900 text-white label:text-zinc-400",
  };

  const toneClass = tones[tone] || tones.default;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p
        className={`text-[10px] font-bold uppercase tracking-widest ${tone === "default" ? "text-zinc-400" : tone === "emerald" ? "text-emerald-600" : tone === "orange" ? "text-orange-600" : tone === "blue" ? "text-sky-600" : "text-zinc-400"}`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-black ${tone === "dark" ? "text-white" : tone === "emerald" ? "text-emerald-800" : tone === "orange" ? "text-orange-800" : tone === "blue" ? "text-sky-800" : "text-zinc-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

export function PaymentRecordRow({
  amount,
  method,
  date,
  detail,
  lang,
  tone = "emerald",
  paymentMethodLabels,
  formatPaymentAmount,
  formatDateTime,
}) {
  const accent =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-zinc-100 text-zinc-700 border-zinc-200";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${accent}`}
        >
          {paymentMethodLabels[method]?.[lang] || method}
        </div>
        <p className="mt-2 text-sm font-semibold text-zinc-900">
          {formatPaymentAmount(amount, method, lang)}
        </p>
        {detail ? (
          <p className="mt-1 break-words text-xs text-zinc-400">{detail}</p>
        ) : null}
      </div>
      <div className="text-sm font-medium text-zinc-500 sm:text-right">
        {formatDateTime(date, lang)}
      </div>
    </div>
  );
}
