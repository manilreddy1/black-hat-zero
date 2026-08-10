import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { createStaffUser, listStaffUsers, setUserActive, setUserRole } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/c/$k/users")({
  component: UsersPage,
});

const ROLES = ["admin", "coordinator", "payment_verifier"] as const;

function UsersPage() {
  const listFn = useServerFn(listStaffUsers);
  const createFn = useServerFn(createStaffUser);
  const roleFn = useServerFn(setUserRole);
  const activeFn = useServerFn(setUserActive);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["staff-users"], queryFn: () => listFn() });
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "coordinator" as (typeof ROLES)[number],
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["staff-users"] });

  const create = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("Staff account created.");
      setForm({ email: "", password: "", full_name: "", role: "coordinator" });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full border border-input bg-surface px-3 py-2.5 font-mono text-xs";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// ACCESS CONTROL</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">Staff</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Super admin only. Only this account can create administrators or change roles.
        </p>
      </div>

      <form
        className="panel grid gap-4 p-6 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <input
          required
          placeholder="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className={input}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={input}
        />
        <input
          required
          type="password"
          minLength={10}
          placeholder="Temporary password (min 10 chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={input}
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as (typeof ROLES)[number] })}
          className={input}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="sm:col-span-2">
          <button
            disabled={create.isPending}
            className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
          >
            {create.isPending ? "CREATING..." : "[ Create staff account ]"}
          </button>
        </div>
      </form>

      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
            <tr>
              {["NAME", "EMAIL", "ROLE", "ACTIVE"].map((h) => (
                <th key={h} className="px-3 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-b border-border/60">
                <td className="px-3 py-3">{u.full_name}</td>
                <td className="px-3 py-3 font-mono text-xs">{u.email}</td>
                <td className="px-3 py-3">
                  {u.roles.includes("super_admin") ? (
                    <span className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
                      Super admin
                    </span>
                  ) : (
                  <select
                    value={u.roles[0] ?? "coordinator"}
                    onChange={async (e) => {
                      await roleFn({
                        data: { user_id: u.id, role: e.target.value as (typeof ROLES)[number] },
                      });
                      toast.success("Role updated.");
                      refresh();
                    }}
                    className="border border-input bg-surface px-2 py-1 font-mono text-[11px]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  )}
                </td>
                <td className="px-3 py-3">
                  <button
                    disabled={u.roles.includes("super_admin")}
                    onClick={async () => {
                      await activeFn({ data: { user_id: u.id, is_active: !u.is_active } });
                      toast.success(u.is_active ? "Account disabled." : "Account enabled.");
                      refresh();
                    }}
                    className={`font-mono text-[11px] tracking-[0.2em] uppercase disabled:opacity-50 ${
                      u.is_active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {u.is_active ? "Enabled" : "Disabled"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
