export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_REVIEW: "Payment Under Review",
  PAYMENT_APPROVED: "Payment Approved",
  REGISTERED: "Team Registered",
  PAYMENT_REJECTED: "Payment Rejected",
  CANCELLED: "Registration Cancelled",
};

export const STATUS_TONE: Record<string, "neutral" | "warn" | "ok" | "danger"> = {
  DRAFT: "neutral",
  PAYMENT_PENDING: "warn",
  PAYMENT_REVIEW: "warn",
  PAYMENT_APPROVED: "ok",
  REGISTERED: "ok",
  PAYMENT_REJECTED: "danger",
  CANCELLED: "danger",
};

export const REJECTION_REASONS = [
  "UTR does not match transaction.",
  "Incorrect amount.",
  "Duplicate transaction.",
  "Invalid payment proof.",
];

export function formatMoney(amount: number, currency = "INR") {
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}

export function buildUpiUri(opts: {
  upiId: string;
  payeeName: string;
  amount: number;
  note: string;
}) {
  const params = new URLSearchParams({
    pa: opts.upiId,
    pn: opts.payeeName,
    am: String(opts.amount),
    cu: "INR",
    tn: opts.note,
  });
  return `upi://pay?${params.toString()}`;
}
