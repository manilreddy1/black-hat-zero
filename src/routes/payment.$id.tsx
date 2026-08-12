import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { getPaymentContext, submitPayment } from "@/lib/public.functions";
import { buildUpiUri, formatMoney } from "@/lib/constants";
import { CyberBackground } from "@/components/site/CyberBackground";
import { WhatsAppLink } from "@/components/site/WhatsAppLink";
import { supabase } from "@/integrations/supabase/client";
import upiLogo from "@/assets/upi-logo.png.asset.json";

export const Route = createFileRoute("/payment/$id")({
  head: () => ({
    meta: [
      { title: "Complete Payment — BLACK HAT#0 '26" },
      {
        name: "description",
        content:
          "Scan the UPI QR, pay the registration fee and submit your UTR reference to confirm your BLACK HAT ZERO '26 slot.",
      },
      { property: "og:title", content: "Complete Payment — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Pay by UPI and submit your UTR to confirm your BLACK HAT ZERO '26 registration.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentPage,
});

const field =
  "w-full border border-input bg-surface px-3 py-3 font-mono text-sm outline-none transition-shadow focus:border-primary focus:shadow-[var(--glow-red)]";
const labelCls = "font-mono text-[11px] tracking-[0.25em] text-muted-foreground";

function PaymentPage() {
  const { id } = Route.useParams();
  const ctxFn = useServerFn(getPaymentContext);
  const payFn = useServerFn(submitPayment);
  const qc = useQueryClient();


  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-context", id],
    queryFn: () => ctxFn({ data: { registration_id: id } }),
    retry: false,
    // Keep the QR/amount/UPI details in sync if an admin changes them mid-session
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Instant refresh when an admin edits UPI/fee settings or this registration
  useEffect(() => {
    const channel = supabase
      .channel(`payment-ctx-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_settings" }, () =>
        qc.invalidateQueries({ queryKey: ["payment-context", id] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations", filter: `id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["payment-context", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);


  const [utr, setUtr] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [paidTime, setPaidTime] = useState("");
  const [shot, setShot] = useState<{ name: string; type: string; base64: string } | null>(null);
  const [done, setDone] = useState(false);

  // Set the fixed payment timestamp on the client only (avoids SSR/client mismatch)
  useEffect(() => {
    const now = new Date();
    setPaidOn(now.toISOString().slice(0, 10));
    setPaidTime(now.toTimeString().slice(0, 5));
  }, []);


  const mutation = useMutation({
    mutationFn: () =>
      payFn({
        data: {
          registration_id: id,
          utr_number: utr.trim(),
          paid_on: paidOn,
          paid_time: paidTime,
          screenshot: shot,
        },
      }),
    onSuccess: () => {
      setDone(true);
      toast.success("Payment submitted. Verification usually takes a few hours.");
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit payment."),
  });

  const upiUri = useMemo(() => {
    if (!data?.settings?.upi_id || !data.registration) return "";
    return buildUpiUri({
      upiId: data.settings.upi_id,
      payeeName: data.settings.upi_payee_name ?? "BLACK HAT ZERO",
      amount: data.registration.expected_amount,
      note: data.registration.registration_code,
    });
  }, [data]);

  const onFile = (file: File | undefined) => {
    if (!file) return setShot(null);
    if (file.size > 5 * 1024 * 1024) return toast.error("Screenshot must be under 5 MB.");
    const reader = new FileReader();
    reader.onload = () =>
      setShot({ name: file.name, type: file.type, base64: String(reader.result) });
    reader.readAsDataURL(file);
  };

  if (isLoading)
    return (
      <div className="flex min-h-[70svh] items-center justify-center font-mono text-xs tracking-[0.3em] text-muted-foreground">
        LOADING PAYMENT SESSION...
      </div>
    );

  if (error || !data?.registration)
    return (
      <div className="flex min-h-[70svh] items-center justify-center px-6">
        <div className="panel clip-notch max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-bold tracking-widest uppercase">
            Session not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This payment link is invalid or expired.
          </p>
          <Link
            to="/register"
            className="clip-notch mt-6 inline-block bg-primary px-5 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase"
          >
            [ Start over ]
          </Link>
        </div>
      </div>
    );

  const reg = data.registration;
  const currency = data.settings?.currency ?? "INR";
  const alreadySubmitted = done || reg.status === "PAYMENT_REVIEW";
  const approved = reg.status === "PAYMENT_APPROVED" || reg.status === "REGISTERED";

  return (
    <div className="scanlines relative min-h-screen px-6 pt-28 pb-20">
      <CyberBackground />
      <div className="relative mx-auto max-w-5xl">
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// PAYMENT GATEWAY</p>
        <h1 className="mt-3 font-display text-[clamp(1.9rem,5vw,3rem)] leading-none font-bold tracking-tight uppercase">
          Complete payment
        </h1>
        <p className="mt-3 font-mono text-xs tracking-[0.2em] text-muted-foreground">
          {reg.registration_code} · {data.team?.team_code} · {data.team?.team_name} ·{" "}
          {reg.team_size} members
        </p>

        {approved ? (
          <div className="panel clip-notch mt-8 p-8 text-center">
            <p className="font-display text-2xl font-bold tracking-widest text-primary uppercase">
              Payment verified
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Your slot is locked. See you at the event.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="panel clip-notch p-6">
              <p className={labelCls}>SCAN TO PAY</p>
              <p className="mt-2 font-display text-4xl font-bold text-primary text-glow">
                {formatMoney(reg.expected_amount, currency)}
              </p>
              <p className="mt-1 font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
                {formatMoney(reg.fee_at_registration, currency)} × {reg.team_size} PARTICIPANTS
              </p>

              {upiUri ? (
                <>
                  <div className="relative mt-6 inline-block w-[min(70vw,232px)] bg-white p-4">
                    <QRCode value={upiUri} size={200} level="H" className="block h-auto w-full" />
                    <span className="pointer-events-none absolute inset-4 flex items-center justify-center">
                      <span className="flex aspect-[1.9] w-[38%] min-w-14 max-w-[76px] items-center justify-center bg-white px-[3%] py-[2%]">
                        <img src={upiLogo.url} alt="UPI" className="block h-auto w-full object-contain" />
                      </span>
                    </span>
                  </div>
                  <a
                    href={upiUri}
                    className="clip-notch mt-4 block bg-primary py-3 text-center font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase sm:hidden"
                  >
                    [ Open UPI app ]
                  </a>

                  <div className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
                    <p>
                      UPI ID: <span className="text-foreground">{data.settings?.upi_id}</span>
                    </p>
                    <p>
                      PAYEE: <span className="text-foreground">{data.settings?.upi_payee_name}</span>
                    </p>
                    <p>
                      NOTE: <span className="text-foreground">{reg.registration_code}</span>
                    </p>
                  </div>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">
                  UPI details are not configured yet. Contact the organisers.
                </p>
              )}

              {data.settings?.payment_instructions && (
                <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                  {data.settings.payment_instructions}
                </p>
              )}
            </div>

            <div className="panel clip-notch p-6">
              {alreadySubmitted ? (
                <div className="flex h-full flex-col justify-center text-center">
                  <p className="font-display text-xl font-bold tracking-widest text-primary uppercase">
                    Under verification
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    We received your transaction reference. Track your status any time with your
                    registration code.
                  </p>
                  <Link
                    to="/status"
                    className="clip-notch mt-6 inline-block border border-border px-5 py-3 font-mono text-xs font-bold tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
                  >
                    [ Track status ]
                  </Link>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    mutation.mutate();
                  }}
                >
                  <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
                    SUBMIT TRANSACTION PROOF
                  </p>
                  <label className="block">
                    <span className={labelCls}>UTR / TRANSACTION REFERENCE</span>
                    <input
                      required
                      minLength={6}
                      maxLength={40}
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.toUpperCase())}
                      placeholder="E.G. 412345678901"
                      className={`mt-2 ${field}`}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelCls}>PAID ON</span>
                      <input
                        required
                        disabled
                        type="date"
                        value={paidOn}
                        aria-label="Payment date"
                        className={`mt-2 ${field} cursor-not-allowed opacity-70`}
                      />
                    </label>
                    <label className="block">
                      <span className={labelCls}>PAID AT</span>
                      <input
                        required
                        disabled
                        type="time"
                        value={paidTime}
                        aria-label="Payment time"
                        className={`mt-2 ${field} cursor-not-allowed opacity-70`}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className={labelCls}>PAYMENT SCREENSHOT *</span>
                    <input
                      required
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => onFile(e.target.files?.[0])}
                      className={`mt-2 ${field} file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-1 file:font-mono file:text-[11px] file:text-primary-foreground`}
                    />
                    <span className="mt-1 block font-mono text-[10px] tracking-[0.15em] text-muted-foreground">
                      PNG, JPG or WEBP under 5 MB. Submission without a screenshot is rejected.
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={mutation.isPending || !shot}
                    className="clip-notch w-full bg-primary py-3.5 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase transition-shadow hover:shadow-[var(--glow-red)] disabled:opacity-60"
                  >
                    {mutation.isPending ? "SUBMITTING..." : "[ Submit for verification ]"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Each UTR can only be used once. Fake references are logged and reported.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
