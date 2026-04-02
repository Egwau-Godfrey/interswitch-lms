"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Download, 
  CreditCard,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  Plus,
  RefreshCw,
  XCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Printer,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { useApi, useMutation } from "@/hooks/use-api";
import { paymentsApi, apiClient } from "@/lib/api";
import { useSession } from "next-auth/react";
import type { LoanPayment, PaymentChannel, PaymentStatus, PaymentCreate } from "@/lib/types";
import { formatCurrency } from "@/components/shared/stat-card";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { RecordPaymentDialog } from "@/components/shared/record-payment-dialog";

// Channel labels map
const channelLabels: Record<string, string> = {
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
  card: "Card",
  wallet: "Wallet",
  cash: "Cash",
  auto_debit: "Auto-Debit",
};

// Helper function to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Payment status badge
function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "posted":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Posted
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
      );
    case "reversed":
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">
          <AlertCircle className="w-3 h-3 mr-1" /> Reversed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// Payment channel badge
function PaymentChannelBadge({ channel }: { channel: PaymentChannel }) {
  return (
    <Badge variant="outline" className="font-normal uppercase text-[10px]">
      {channelLabels[channel] || channel}
    </Badge>
  );
}

// Skeleton rows
function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// Error state in table
function PaymentsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-40">
        <div className="flex flex-col items-center justify-center gap-3 text-center py-6">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="font-medium text-sm">Failed to load payments</p>
            <p className="text-xs text-muted-foreground mt-1">{message || "An unexpected error occurred. Please try again."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Retry
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Receipt Dialog
function ReceiptDialog({ payment, open, onClose }: { payment: LoanPayment | null; open: boolean; onClose: () => void }) {
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment?.payment_reference || payment?.id}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: 0 auto; }
            .header { background: #004B91; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0; }
            .header .logo { font-size: 20px; font-weight: bold; }
            .header .sub { font-size: 11px; color: #93c5fd; margin-top: 2px; }
            .header .ref { text-align: right; }
            .header .ref-label { font-size: 10px; color: #93c5fd; }
            .header .ref-num { font-family: monospace; font-size: 13px; font-weight: 600; }
            .body { border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 24px; }
            .amount-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .amount-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
            .amount-value { font-size: 32px; font-weight: bold; color: #059669; margin-top: 4px; }
            .status-stamp { border: 2px solid #10b981; color: #059669; padding: 4px 14px; border-radius: 4px; font-size: 13px; font-weight: bold; letter-spacing: 2px; transform: rotate(-8deg); display: inline-block; }
            .divider { border-top: 1px dashed #d1d5db; margin: 18px 0; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
            .row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: 600; font-family: monospace; }
            .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 20px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><div class="logo">Interswitch LMS</div><div class="sub">Loan Management System</div></div>
            <div class="ref"><div class="ref-label">Payment Receipt</div><div class="ref-num">${payment?.payment_reference || payment?.id}</div></div>
          </div>
          <div class="body">
            <div class="amount-row">
              <div><div class="amount-label">Transaction Amount</div><div class="amount-value">UGX ${payment?.amount?.toLocaleString("en-US")}</div></div>
              <div class="status-stamp">${(payment?.status || "").toUpperCase()}</div>
            </div>
            <div class="divider"></div>
            <div class="row"><span class="label">Payment ID</span><span class="value">${payment?.id}</span></div>
            <div class="row"><span class="label">Reference No.</span><span class="value">${payment?.payment_reference || "—"}</span></div>
            <div class="row"><span class="label">Loan ID</span><span class="value">${payment?.loan_id}</span></div>
            <div class="row"><span class="label">Payment Channel</span><span class="value">${channelLabels[payment?.channel || ""] || payment?.channel}</span></div>
            <div class="row"><span class="label">Payment Date</span><span class="value">${new Date(payment?.payment_date || "").toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <div class="row"><span class="label">Recorded At</span><span class="value">${new Date(payment?.created_at || "").toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>
            <div class="divider"></div>
            <div class="footer">This is an official payment receipt generated by Interswitch Loan Management System.<br/>Please retain for your records. For queries, contact your loan administrator.</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!payment) return null;

  const isPosted = payment.status === "posted";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Payment Receipt — {payment.payment_reference || payment.id}</DialogTitle>
        </DialogHeader>

        {/* Printable receipt content */}
        <div ref={receiptRef}>
          {/* Header bar */}
          <div className="bg-primary text-primary-foreground px-6 py-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 opacity-80" />
                <span className="font-bold text-base tracking-tight">Interswitch LMS</span>
              </div>
              <p className="text-primary-foreground/60 text-[11px] mt-0.5">Loan Management System</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-primary-foreground/60 uppercase tracking-wider">Payment Receipt</p>
              <p className="font-mono text-xs font-semibold mt-0.5">{payment.payment_reference || payment.id}</p>
            </div>
          </div>

          {/* Amount + status stamp */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Transaction Amount</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">
                UGX {payment.amount.toLocaleString("en-US")}
              </p>
            </div>
            <div className={`border-2 rounded px-3 py-1 text-[11px] font-bold tracking-widest rotate-[-8deg] ${
              isPosted
                ? "border-emerald-500 text-emerald-500"
                : payment.status === "pending"
                  ? "border-amber-500 text-amber-500"
                  : "border-muted-foreground text-muted-foreground"
            }`}>
              {payment.status.toUpperCase()}
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5">
            <div className="space-y-3 text-sm">
              {[
                { label: "Payment ID", value: <span className="font-mono text-xs">{payment.id}</span> },
                { label: "Reference No.", value: <span className="font-mono">{payment.payment_reference || "—"}</span> },
                { label: "Loan ID", value: <span className="font-mono text-xs">{payment.loan_id}</span> },
                { label: "Payment Channel", value: channelLabels[payment.channel] || payment.channel },
                {
                  label: "Payment Date",
                  value: new Date(payment.payment_date).toLocaleString("en-US", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })
                },
                {
                  label: "Recorded At",
                  value: <span className="text-muted-foreground text-xs">{new Date(payment.created_at).toLocaleString("en-US", {
                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}</span>
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-dashed border-border/50 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed mt-5 pt-4 border-t border-dashed">
              This is an official payment receipt generated by Interswitch Loan Management System.<br />
              Please retain for your records. For queries, contact your loan administrator.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 pt-2 flex gap-2 justify-end border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [channelFilter, setChannelFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isPostOpen, setIsPostOpen] = React.useState(false);
  const [receiptPayment, setReceiptPayment] = React.useState<LoanPayment | null>(null);
  const { data: session, status } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Set access token when session is available
  React.useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    } else {
      apiClient.clearAccessToken();
    }
  }, [session]);

  // Build list params — PaymentListParams has no status field, filter client-side
  const { data: paymentsData, isLoading, error, refetch, isRefetching } = useApi(
    () => paymentsApi.list({ page, page_size: pageSize }),
    [page, pageSize, mounted, status === 'authenticated'],
    { 
      cacheKey: `payments-${page}-${pageSize}`,
      enabled: mounted && status === 'authenticated'
    }
  );

  const allPayments: LoanPayment[] = paymentsData?.data || [];
  const totalPages = paymentsData?.total_pages || 1;
  const totalItems = paymentsData?.total || 0;


  // Client-side filtering by status + channel + search
  const filteredPayments = React.useMemo(() => {
    let result = allPayments;

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (channelFilter !== "all") {
      result = result.filter((p) => p.channel === channelFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.id.toLowerCase().includes(q) ||
        p.loan_id.toLowerCase().includes(q) ||
        p.payment_reference?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allPayments, statusFilter, channelFilter, searchQuery]);

  // Calculate pagination for filtered results
  const isFiltering = statusFilter !== "all" || channelFilter !== "all" || !!searchQuery;
  const filteredTotalItems = filteredPayments.length;
  const filteredTotalPages = isFiltering ? Math.ceil(filteredTotalItems / pageSize) || 1 : totalPages;

  // Reset page to 1 when filtering changes
  React.useEffect(() => {
    if (isFiltering) {
      setPage(1);
    }
  }, [searchQuery, statusFilter, channelFilter]);

  // Paginate the filtered results
  const paginatedPayments = React.useMemo(() => {
    if (isFiltering) {
      const startIndex = (page - 1) * pageSize;
      return filteredPayments.slice(startIndex, startIndex + pageSize);
    }
    return filteredPayments;
  }, [filteredPayments, page, pageSize, isFiltering]);

  // Summary stats from actual data
  const summaryStats = React.useMemo(() => {
    const today = new Date().toDateString();
    const todayPayments = allPayments.filter(
      (p) => new Date(p.payment_date).toDateString() === today && p.status === "posted"
    );
    const autoDebitPayments = allPayments.filter(
      (p) => p.channel === "auto_debit" && p.status === "posted"
    );
    const pendingPayments = allPayments.filter((p) => p.status === "pending");
    return {
      todayTotal: todayPayments.reduce((s, p) => s + Number(p.amount), 0),
      todayCount: todayPayments.length,
      autoDebitTotal: autoDebitPayments.reduce((s, p) => s + Number(p.amount), 0),
      autoDebitCount: autoDebitPayments.length,
      pendingTotal: pendingPayments.reduce((s, p) => s + Number(p.amount), 0),
      pendingCount: pendingPayments.length,
    };
  }, [allPayments]);


  const handleExport = async () => {
    try {
      toast.loading("Preparing export...", { id: "export-loading" });
      const blob = await paymentsApi.exportCsv({
        status: statusFilter !== "all" ? statusFilter as any : undefined,
        channel: channelFilter !== "all" ? channelFilter as any : undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss("export-loading");
      toast.success("Payments exported successfully");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.dismiss("export-loading");
      toast.error(err.message || "Failed to export payments");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Collections</h1>
          <p className="text-muted-foreground">Track all repayments and collection activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? "Refreshing..." : "Refresh"}
          </Button>
          <Button 
            variant="outline" 
            className="hidden sm:flex"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            className="bg-[#10B981] hover:bg-[#059669]"
            onClick={() => setIsPostOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Post Manual Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !error ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-emerald-50/50 border-emerald-100">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase">Today's Collections</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700">{formatCurrency(summaryStats.todayTotal, "UGX")}</p>
              <p className="text-[10px] text-emerald-600/80 mt-1 flex items-center">
                <ArrowDownLeft className="w-3 h-3 mr-1" /> {summaryStats.todayCount} Transactions
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-blue-600 uppercase">Auto-Debit Recovery</p>
              <p className="text-2xl font-bold mt-1 text-blue-700">{formatCurrency(summaryStats.autoDebitTotal, "UGX")}</p>
              <p className="text-[10px] text-blue-600/80 mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {summaryStats.autoDebitCount} Successful debits
              </p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 border-amber-100">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-amber-600 uppercase">Pending Verification</p>
              <p className="text-2xl font-bold mt-1 text-amber-700">{formatCurrency(summaryStats.pendingTotal, "UGX")}</p>
              <p className="text-[10px] text-amber-600/80 mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {summaryStats.pendingCount} Transactions
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference, payment ID, or loan ID..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" suppressHydrationWarning>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[150px]" suppressHydrationWarning>
              <CreditCard className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="auto_debit">Auto-Debit</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="wallet">Wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px]">Payment ID</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Loan ID</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows />
            ) : error ? (
              <PaymentsErrorState
                message={(error as Error)?.message || "Failed to load payments"}
                onRetry={refetch}
              />
) : paginatedPayments.length > 0 ? (
                      paginatedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs font-semibold">{payment.id}</TableCell>
                  <TableCell className="font-mono text-xs">{payment.payment_reference || "-"}</TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">{payment.loan_id}</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {formatCurrency(payment.amount, "UGX")}
                  </TableCell>
                  <TableCell><PaymentChannelBadge channel={payment.channel} /></TableCell>
                  <TableCell><PaymentStatusBadge status={payment.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(payment.payment_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setReceiptPayment(payment)}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/super-admin/loans/${payment.loan_id}`)}>
                          View Loan Details
                        </DropdownMenuItem>
                        {payment.status === "posted" && (
                          <DropdownMenuItem className="text-destructive">
                            Reverse Transaction
                          </DropdownMenuItem>
                        )}
                        {payment.status === "pending" && (
                          <>
                            <DropdownMenuItem className="text-emerald-600">
                              Approve Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Reject Payment
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

              {/* Pagination */}
            {!isLoading && !error && (isFiltering ? filteredTotalPages : totalPages) > 1 && (
              <DataTablePagination
                page={page}
                pageSize={pageSize}
                totalItems={isFiltering ? filteredTotalItems : totalItems}
                totalPages={isFiltering ? filteredTotalPages : totalPages}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      )}

      {/* Receipt Dialog */}
      <ReceiptDialog
        payment={receiptPayment}
        open={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
      />

      {/* Manual Payment Dialog */}
      <RecordPaymentDialog
        open={isPostOpen}
        onOpenChange={setIsPostOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
