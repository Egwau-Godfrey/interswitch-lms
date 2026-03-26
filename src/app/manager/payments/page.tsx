"use client";

import * as React from "react";
import { 
  Search, 
  Filter, 
  Download, 
  CreditCard,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  Plus,
  RefreshCw,
  XCircle,
  AlertCircle
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
import { paymentsApi } from "@/lib/api";
import type { LoanPayment, PaymentChannel, PaymentStatus } from "@/lib/types";
import { formatCurrency } from "@/components/shared/stat-card";
import { DataTablePagination } from "@/components/shared/data-table-pagination";

// Mock data for fallback
const mockPayments: LoanPayment[] = [
  { id: "pay-001", loan_id: "loan-001", amount: 100000, payment_reference: "PAY-001-2026", channel: "mobile_money", status: "posted", payment_date: "2026-01-15T10:30:00Z", created_at: "2026-01-15T10:30:00Z" },
  { id: "pay-002", loan_id: "loan-002", amount: 250000, payment_reference: "PAY-002-2026", channel: "bank_transfer", status: "posted", payment_date: "2026-01-14T14:45:00Z", created_at: "2026-01-14T14:45:00Z" },
  { id: "pay-003", loan_id: "loan-003", amount: 75000, payment_reference: "PAY-003-2026", channel: "auto_debit", status: "pending", payment_date: "2026-01-13T09:15:00Z", created_at: "2026-01-13T09:15:00Z" },
  { id: "pay-004", loan_id: "loan-004", amount: 180000, payment_reference: "PAY-004-2026", channel: "card", status: "posted", payment_date: "2026-01-12T16:20:00Z", created_at: "2026-01-12T16:20:00Z" },
  { id: "pay-005", loan_id: "loan-005", amount: 50000, payment_reference: "PAY-005-2026", channel: "manual", status: "failed", payment_date: "2026-01-11T11:00:00Z", created_at: "2026-01-11T11:00:00Z" },
  { id: "pay-006", loan_id: "loan-001", amount: 120000, payment_reference: "PAY-006-2026", channel: "mobile_money", status: "posted", payment_date: "2026-01-10T08:30:00Z", created_at: "2026-01-10T08:30:00Z" },
  { id: "pay-007", loan_id: "loan-006", amount: 95000, payment_reference: "PAY-007-2026", channel: "auto_debit", status: "reversed", payment_date: "2026-01-09T13:45:00Z", created_at: "2026-01-09T13:45:00Z" },
];

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

// Payment status badge component
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

// Payment channel badge component
function PaymentChannelBadge({ channel }: { channel: PaymentChannel }) {
  const channelLabels: Record<PaymentChannel, string> = {
    mobile_money: "Mobile Money",
    bank_transfer: "Bank Transfer",
    card: "Card",
    auto_debit: "Auto-Debit",
    manual: "Manual",
  };
  return (
    <Badge variant="outline" className="font-normal uppercase text-[10px]">
      {channelLabels[channel] || channel}
    </Badge>
  );
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [channelFilter, setChannelFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isPostOpen, setIsPostOpen] = React.useState(false);

  // Fetch payments from API
  const { data: paymentsData, isLoading, error, refetch, isRefetching } = useApi(
    () => paymentsApi.list({
      page,
      page_size: pageSize,
      status: statusFilter !== "all" ? statusFilter as PaymentStatus : undefined,
    }).catch((err) => {
      console.error("Payments API error:", err);
      return { data: mockPayments, total: mockPayments.length, page: 1, page_size: 10, total_pages: 1 };
    }),
    [page, pageSize, statusFilter],
    { cacheKey: `payments-${page}-${statusFilter}` }
  );

  const payments = paymentsData?.data || mockPayments;
  const totalPages = paymentsData?.total_pages || 1;
  const totalItems = paymentsData?.total || payments.length;

  // Post manual payment mutation
  const postPayment = useMutation(
    (data: { loan_id: string; amount: number; channel: PaymentChannel; payment_reference?: string }) => 
      paymentsApi.postManual(data),
    {
      onSuccess: () => {
        toast.success("Manual payment posted successfully!");
        setIsPostOpen(false);
        refetch();
      },
      onError: (err) => {
        console.error("Post payment error:", err);
        toast.error("Failed to post payment");
      },
    }
  );

  // Filter payments by search query (client-side for now)
  const filteredPayments = React.useMemo(() => {
    let result = payments;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.id.toLowerCase().includes(query) ||
        p.loan_id.toLowerCase().includes(query) ||
        p.payment_reference?.toLowerCase().includes(query)
      );
    }
    
    if (channelFilter !== "all") {
      result = result.filter((p) => p.channel === channelFilter);
    }
    
    return result;
  }, [payments, searchQuery, channelFilter]);

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const today = new Date().toDateString();
    const todayPayments = payments.filter(
      (p) => new Date(p.payment_date).toDateString() === today && p.status === "posted"
    );
    const autoDebitPayments = payments.filter(
      (p) => p.channel === "auto_debit" && p.status === "posted"
    );
    const pendingPayments = payments.filter((p) => p.status === "pending");

    return {
      todayTotal: todayPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      todayCount: todayPayments.length,
      autoDebitTotal: autoDebitPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      autoDebitCount: autoDebitPayments.length,
      pendingTotal: pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      pendingCount: pendingPayments.length,
    };
  }, [payments]);

  const handlePostPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    postPayment.mutate({
      loan_id: formData.get("loan") as string,
      amount: Number(formData.get("amount")),
      channel: formData.get("channel") as PaymentChannel,
      payment_reference: formData.get("ref") as string || undefined,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

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
          <Dialog open={isPostOpen} onOpenChange={setIsPostOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#10B981] hover:bg-[#059669]">
                <Plus className="w-4 h-4 mr-2" />
                Post Manual Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Post Manual Payment</DialogTitle>
                <DialogDescription>
                  Record a payment that was received outside the automated channels.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePostPayment} className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="loan">Loan ID</Label>
                  <Input id="loan" name="loan" placeholder="e.g. loan-001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (UGX)</Label>
                  <Input id="amount" name="amount" type="number" placeholder="10000" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="channel">Channel</Label>
                    <Select name="channel" defaultValue="manual">
                      <SelectTrigger id="channel">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref">Reference</Label>
                    <Input id="ref" name="ref" placeholder="TXN-123456" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPostOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#10B981] hover:bg-[#059669]" disabled={postPayment.isLoading}>
                    {postPayment.isLoading ? "Posting..." : "Post Payment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-emerald-50/50 border-emerald-100">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase">Today's Collections</p>
              <p className="text-2xl font-bold mt-1 text-emerald-700">
                {formatCurrency(summaryStats.todayTotal, "UGX")}
              </p>
              <p className="text-[10px] text-emerald-600/80 mt-1 flex items-center">
                <ArrowDownLeft className="w-3 h-3 mr-1" /> {summaryStats.todayCount} Transactions
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-blue-600 uppercase">Auto-Debit Recovery</p>
              <p className="text-2xl font-bold mt-1 text-blue-700">
                {formatCurrency(summaryStats.autoDebitTotal, "UGX")}
              </p>
              <p className="text-[10px] text-blue-600/80 mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {summaryStats.autoDebitCount} Successful debits
              </p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 border-amber-100">
            <CardContent className="pt-4">
              <p className="text-xs font-semibold text-amber-600 uppercase">Pending Verification</p>
              <p className="text-2xl font-bold mt-1 text-amber-700">
                {formatCurrency(summaryStats.pendingTotal, "UGX")}
              </p>
              <p className="text-[10px] text-amber-600/80 mt-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {summaryStats.pendingCount} Transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[150px]">
              <CreditCard className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="auto_debit">Auto-Debit</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
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
              Array.from({ length: 5 }).map((_, i) => (
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
              ))
            ) : filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs font-semibold">{payment.id}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.payment_reference || "-"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">{payment.loan_id}</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {formatCurrency(payment.amount, "UGX")}
                  </TableCell>
                  <TableCell>
                    <PaymentChannelBadge channel={payment.channel} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(payment.payment_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Receipt</DropdownMenuItem>
                        <DropdownMenuItem>View Loan Details</DropdownMenuItem>
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
      {!isLoading && filteredPayments.length > 0 && (
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
