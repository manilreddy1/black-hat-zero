import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardStats } from "@/lib/staff.functions";
import { formatMoney } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/c/$k/")({
  component: Overview,
});

const CHART_COLORS = ["#e11d2e", "#f97362", "#8a8f98", "#4b5057"];

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="panel clip-notch p-5">
      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">{label}</p>
      <p
        className={`mt-2 font-display text-3xl font-bold ${accent ? "text-primary text-glow" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Overview() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: () => fn() });

  if (isLoading || !data)
    return (
      <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground">LOADING METRICS...</p>
    );

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// OVERVIEW</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
          Command centre
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="TOTAL TEAMS" value={String(data.total)} accent />
        <Stat label="CONFIRMED" value={String(data.registered)} />
        <Stat label="AWAITING REVIEW" value={String(data.review)} />
        <Stat label="PARTICIPANTS" value={String(data.participants)} />
        <Stat label="REVENUE" value={formatMoney(data.revenue)} accent />
        <Stat label="PAYMENT PENDING" value={String(data.pending)} />
        <Stat label="REJECTED" value={String(data.rejected)} />
        <Stat label="TODAY" value={String(data.todays)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel p-5">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary">REGISTRATIONS / DAY</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.overTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22262b" />
                <XAxis dataKey="date" stroke="#8a8f98" fontSize={11} />
                <YAxis stroke="#8a8f98" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111316", border: "1px solid #22262b", fontSize: 12, color: "#e6e8ea" }}
                  labelStyle={{ color: "#e6e8ea" }}
                  itemStyle={{ color: "#e6e8ea" }}
                  cursor={{ fill: "rgba(225,29,46,0.08)" }}
                />
                <Line type="monotone" dataKey="count" stroke="#e11d2e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary">STATUS SPLIT</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusDist} dataKey="value" nameKey="name" outerRadius={90} label={{ fill: "#e6e8ea", fontSize: 11 }}>
                  {data.statusDist.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111316", border: "1px solid #22262b", fontSize: 12, color: "#e6e8ea" }}
                  labelStyle={{ color: "#e6e8ea" }}
                  itemStyle={{ color: "#e6e8ea" }}
                  cursor={{ fill: "rgba(225,29,46,0.08)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary">FOOD PREFERENCE</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.foodDist}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={{ fill: "#e6e8ea", fontSize: 11 }}
                >
                  {data.foodDist.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111316", border: "1px solid #22262b", fontSize: 12, color: "#e6e8ea" }}
                  labelStyle={{ color: "#e6e8ea" }}
                  itemStyle={{ color: "#e6e8ea" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            VEG {data.veg} · NON-VEG {data.nonVeg}
          </p>
        </div>

        <div className="panel p-5">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary">TEAM SIZES</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sizeDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22262b" />
                <XAxis dataKey="name" stroke="#8a8f98" fontSize={11} />
                <YAxis stroke="#8a8f98" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111316", border: "1px solid #22262b", fontSize: 12, color: "#e6e8ea" }}
                  labelStyle={{ color: "#e6e8ea" }}
                  itemStyle={{ color: "#e6e8ea" }}
                  cursor={{ fill: "rgba(225,29,46,0.08)" }}
                />
                <Bar dataKey="count" fill="#e11d2e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary">TOP COLLEGES</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.collegeDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#22262b" />
                <XAxis type="number" stroke="#8a8f98" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#8a8f98" fontSize={10} width={110} />
                <Tooltip
                  contentStyle={{ background: "#111316", border: "1px solid #22262b", fontSize: 12, color: "#e6e8ea" }}
                  labelStyle={{ color: "#e6e8ea" }}
                  itemStyle={{ color: "#e6e8ea" }}
                  cursor={{ fill: "rgba(225,29,46,0.08)" }}
                />
                <Bar dataKey="count" fill="#f97362" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
