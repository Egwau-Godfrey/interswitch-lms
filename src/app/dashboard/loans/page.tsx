"use client";

import * as React from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreVertical, 
  Banknote,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  FileText
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

// Mock data
const initialLoans = [
  { id: "L001", agent_id: "AGT001", agent_name: "John Doe", product: "Quick Loan 30", principal: 50000, balance: 55000, status: "disbursed", due_date: "2024-06-15", days_overdue: 0 },
  { id: "L002", agent_id: "AGT002", agent_name: "Sarah Smith", product: "SME Boost", principal: 250000, balance: 275000, status: "overdue", due_date: "2024-05-10", days_overdue: 25 },
  { id: "L003", agent_id: "AGT003", agent_name: "Michael Obi", product: "Quick Loan 30", principal: 100000, balance: 0, status: "cleared", due_date: "2024-04-01", days_overdue: 0 },
  { id: "L004", agent_id: "AGT004", agent_name: "Grace Ademola", product: "Payroll Advance", principal: 75000, balance: 82500, status: "pending", due_date: "2024-07-20", days_overdue: 0 },
  { id: "L005", agent_id: "AGT005", agent_name: "David Chen", product: "SME Boost", principal: 500000, balance: 550000, status: "defaulted", due_date: "2024-03-12", days_overdue: 85 },
];

export default function LoansPage() {
  const [loans, setLoans] = React.useState(initialLoans);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isApplyOpen, setIsApplyOpen] = React.useState(false);

  const filteredLoans = loans.filter(loan => 
    loan.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disbursed":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Disbursed</Badge>;
      case "overdue":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Overdue</Badge>;
      case "cleared":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Cleared</Badge>;
      case "pending":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Pending</Badge>;
      case "defaulted":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">Defaulted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApplyLoan = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Loan application submitted and auto-disbursed!");
    setIsApplyOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Management</h1>
          <p className="text-muted-foreground">Monitor disbursements, repayments, and overdue balances.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Export Portfolio
          </Button>
          <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#E31C2D] hover:bg-[#C21827]">
                <Plus className="w-4 h-4 mr-2" />
                New Loan Application
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Loan Application</DialogTitle>
                <DialogDescription>
                  Select an agent and loan product to begin. Loans are auto-disbursed upon approval.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleApplyLoan} className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent">Search Agent (ID or Name)</Label>
                  <Input id="agent" placeholder="e.g. AGT001" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product">Loan Product</Label>
                    <Select>
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="q30">Quick Loan 30</SelectItem>
                        <SelectItem value="sme">SME Boost</SelectItem>
                        <SelectItem value="payroll">Payroll Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Loan Amount (UGX)</Label>
                    <Input id="amount" type="number" placeholder="50000" required />
                  </div>
                </div>
                
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Interest (10%):</span>
                      <span className="font-medium">UGX 5,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tenure:</span>
                      <span className="font-medium">30 Days</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-semibold">Total Repayable:</span>
                      <span className="font-semibold text-[#004B91]">UGX 55,000</span>
                    </div>
                  </CardContent>
                </Card>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsApplyOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#004B91] hover:bg-[#003B71]">Submit & Disburse</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Disbursed</p>
              <ArrowUpRight className="w-4 h-4 text-[#E31C2D]" />
            </div>
            <p className="text-2xl font-bold mt-1">UGX 24.8M</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Outstanding</p>
              <Clock className="w-4 h-4 text-[#004B91]" />
            </div>
            <p className="text-2xl font-bold mt-1">UGX 8.4M</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overdue</p>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold mt-1">UGX 1.2M</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recovery Rate</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1">94.2%</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search loans by ID or agent name..." 
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shrink-0">
            <Filter className="w-4 h-4 mr-2" />
            Status
          </Button>
          <Button variant="outline" className="shrink-0">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Loan ID</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-mono text-xs font-semibold">{loan.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{loan.agent_name}</span>
                      <span className="text-[10px] text-muted-foreground">{loan.agent_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{loan.product}</Badge>
                  </TableCell>
                  <TableCell className="text-right">UGX {loan.principal.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={loan.balance > 0 ? "text-[#E31C2D]" : "text-emerald-600"}>
                      UGX {loan.balance.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(loan.status)}
                      {loan.days_overdue > 0 && (
                        <span className="text-[10px] text-rose-500 font-medium">
                          {loan.days_overdue} days late
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(loan.due_date).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" /> Statement
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Banknote className="w-4 h-4 mr-2" /> Repayment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-[#004B91]">
                          <ArrowUpRight className="w-4 h-4 mr-2" /> Trigger Auto-Strike
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No loans found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
