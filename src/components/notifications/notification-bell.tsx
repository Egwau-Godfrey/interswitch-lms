"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Banknote, CreditCard, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { getSecureApiBaseUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type Notice = {
  id: number; kind: "loan_disbursed" | "payment_received"; borrower_name: string;
  amount: string; currency: string; reference: string | null; loan_ids: string[];
  payment_statuses: string[]; created_at: string; read_at: string | null;
};
type Inbox = { data: Notice[]; next_cursor: number | null; latest_id: number; unread_count: number };

export function NotificationBell({ basePath }: { basePath?: string }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  // Remount on account/token changes so another account's inbox never remains visible.
  return token ? <NotificationInbox key={token} token={token} basePath={basePath} /> : null;
}

function NotificationInbox({ token, basePath }: { token: string; basePath?: string }) {
  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(false);
  const [kind, setKind] = React.useState("");
  const [count, setCount] = React.useState(0);
  const [inbox, setInbox] = React.useState<Inbox | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const generation = React.useRef(0);

  const request = React.useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${getSecureApiBaseUrl()}/notifications${path}`, {
      ...init, cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Unable to update notifications. Please try again.");
    return response.json();
  }, [token]);

  const refresh = React.useCallback(async (cursor?: number) => {
    const current = ++generation.current;
    setLoading(true);
    try {
      if (!open) {
        const result = await request<{ count: number }>("/unread-count");
        if (current === generation.current) { setCount(result.count); setError(""); }
      } else {
        const params = new URLSearchParams({ unread: String(unread), limit: "20" });
        if (kind) params.set("kind", kind);
        if (cursor) params.set("before", String(cursor));
        const result = await request<Inbox>(`?${params}`);
        if (current === generation.current) {
          setInbox(previous => {
            if (!previous) return result;
            if (cursor) return { ...result, data: [...previous.data, ...result.data] };
            // Refresh the newest page but keep older pages already loaded via "Load more".
            const boundary = result.data.length ? result.data[result.data.length - 1].id : Infinity;
            return { ...result, data: [...result.data, ...previous.data.filter(item => item.id < boundary)] };
          });
          setCount(result.unread_count);
          setError("");
        }
      }
      return true;
    } catch (err) {
      if (current === generation.current) setError((err as Error).message);
      return false;
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [request, open, unread, kind]);

  React.useEffect(() => {
    setInbox(null);
    let cancelled = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    const poll = async () => {
      if (cancelled || running) return;
      clearTimeout(timer);
      running = true;
      if (document.visibilityState !== "hidden") {
        const succeeded = await refresh();
        failures = succeeded ? 0 : failures + 1;
      }
      running = false;
      if (!cancelled) timer = setTimeout(poll, Math.min(30000 * 2 ** failures, 120000));
    };
    const resume = () => {
      if (document.visibilityState === "visible") void poll();
    };
    void poll();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    return () => {
      cancelled = true; clearTimeout(timer); ++generation.current;
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
    };
  }, [refresh]);

  const markRead = async (id?: number) => {
    setBusy(true);
    ++generation.current;
    try {
      await request(id ? `/${id}/read` : "/read-all", {
        method: id ? "PATCH" : "POST",
        body: id ? undefined : JSON.stringify({ through_id: inbox?.latest_id ?? 0 }),
      });
      // Reload from the first page so filter membership (e.g. Unread) is exact.
      setInbox(null);
      await refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0" aria-label={`Notifications, ${count} unread${error ? ", update unavailable" : ""}`}>
          <Bell className="h-5 w-5" />
          {count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{count > 99 ? "99+" : count}</span>}
          {error && !count && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[440px] gap-0 p-0">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Loan disbursements and payments across the platform.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 border-b p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1" aria-label="Notification read filter">
              <Button size="sm" variant={!unread ? "secondary" : "ghost"} aria-pressed={!unread} onClick={() => setUnread(false)}>All</Button>
              <Button size="sm" variant={unread ? "secondary" : "ghost"} aria-pressed={unread} onClick={() => setUnread(true)}>Unread ({count})</Button>
            </div>
            <Button size="sm" variant="ghost" disabled={busy || !count || !inbox} onClick={() => void markRead()}><CheckCheck className="mr-1 h-4 w-4" />Mark all read</Button>
          </div>
          <select aria-label="Notification type" value={kind} onChange={e => setKind(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">All activity</option><option value="loan_disbursed">Loans</option><option value="payment_received">Payments</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto" aria-busy={loading}>
          {error && <div role="alert" className="m-4 rounded-md border border-destructive/30 p-3 text-sm">{error}<Button variant="link" onClick={() => void refresh()}>Retry</Button></div>}
          {!error && !loading && inbox?.data.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-3 h-8 w-8 opacity-40" />{unread ? "You're all caught up." : "No notifications yet."}</div>}
          {inbox?.data.map(item => {
            const isLoan = item.kind === "loan_disbursed";
            const Icon = isLoan ? Banknote : CreditCard;
            const adjusted = item.payment_statuses.some(status => !["posted", "success", "successful"].includes(status));
            return <article key={item.id} className={cn("border-b p-4", !item.read_at && "bg-primary/5")}>
              <div className="flex gap-3">
                <div className={cn("mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", isLoan ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600")}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2"><h3 className="text-sm font-semibold">{isLoan ? "Loan disbursed" : "Payment received"}</h3>{!item.read_at && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}</div>
                  <p className="text-sm break-words">{item.borrower_name} {isLoan ? "received" : "paid"} <span className="font-medium">{item.currency} {Number(item.amount).toLocaleString("en-UG")}</span>.</p>
                  {item.reference && <p className="break-all text-xs text-muted-foreground">Ref: {item.reference}</p>}
                  {adjusted && <p className="text-xs text-amber-700 dark:text-amber-400">Payment status: {Array.from(new Set(item.payment_statuses)).join(", ")}</p>}
                  <time className="block text-xs text-muted-foreground" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                    {basePath && item.loan_ids.map((id, index) => <Link key={id} className="text-xs font-medium text-primary hover:underline" href={`${basePath}/loans/${encodeURIComponent(id)}`} onClick={() => { void markRead(item.id); setOpen(false); }}>View {item.loan_ids.length > 1 ? `loan ${index + 1}` : "loan"}</Link>)}
                    {!item.read_at && <button disabled={busy} className="text-xs text-muted-foreground hover:underline disabled:opacity-50" onClick={() => void markRead(item.id)}>Mark as read</button>}
                  </div>
                </div>
              </div>
            </article>;
          })}
          {loading && <div role="status" className="flex justify-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading notifications…</div>}
          {inbox?.next_cursor && <div className="p-4"><Button className="w-full" variant="outline" disabled={loading} onClick={() => void refresh(inbox.next_cursor!)}>Load more</Button></div>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
