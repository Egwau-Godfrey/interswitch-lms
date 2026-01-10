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
  Plus
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
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

// Mock data
const initialPayments = [
  { id: "P001", loan_id: "L001", agent_name: "John Doe", amount: 15000, channel: "PaywithTransfer", status: "posted", date: "2024-06-01T10:30:00" },
  { id: "P002", loan_id: "L003", agent_name: "Michael Obi", amount: 100000, channel: "Auto-Strike", status: "posted", date: "2024-05-28T14:45:00" },
  { id: "P003", loan_id: "L002", agent_name: "Sarah Smith", amount: 25000, channel: "WebPay", status: "posted", date: "2024-06-02T09:15:00" },
  { id: "P004", loan_id: "L005", agent_name: "David Chen", amount: 50000, channel: "Manual", status: "posted", date: "2024-06-03T16:20:00" },
  { id: "P005", loan_id: "L001", agent_name: "John Doe", amount: 10000, channel: "PaywithTransfer", status: "pending", date: "2024-06-04T11:00:00" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState(initialPayments);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isPostOpen, setIsPostOpen] = React.useState(false);

  const filteredPayments = payments.filter(p => 
    p.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.loan_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Manual payment posted successfully!");
    setIsPostOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Collections</h1>
          <p className="text-muted-foreground">Track all repayments and collection activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Export Payments
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
                  <Label htmlFor="loan">Search Loan (ID or Agent)</Label>
                  <Input id="loan" placeholder="e.g. L001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (UGX)</Label>
                  <Input id="amount" type="number" placeholder="10000" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="channel">Channel</Label>
                    <Select defaultValue="manual">
                      <SelectTrigger id="channel">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref">Reference</Label>
                    <Input id="ref" placeholder="TXN-123456" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPostOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#10B981] hover:bg-[#059669]">Post Payment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase">Today's Collections</p>
            <p className="text-2xl font-bold mt-1 text-emerald-700">UGX 450,200</p>
            <p className="text-[10px] text-emerald-600/80 mt-1 flex items-center">
              <ArrowDownLeft className="w-3 h-3 mr-1" /> 24 Transactions
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-blue-600 uppercase">Auto-Strike Recovery</p>
            <p className="text-2xl font-bold mt-1 text-blue-700">UGX 1.2M</p>
            <p className="text-[10px] text-blue-600/80 mt-1 flex items-center">
              <Clock className="w-3 h-3 mr-1" /> 158 Successful strikes
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-amber-600 uppercase">Pending Verification</p>
            <p className="text-2xl font-bold mt-1 text-amber-700">UGX 85,000</p>
            <p className="text-[10px] text-amber-600/80 mt-1 flex items-center">
              <Clock className="w-3 h-3 mr-1" /> 5 Transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by reference, agent, or loan ID..." 
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shrink-0">
            <Filter className="w-4 h-4 mr-2" />
            Channel
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
              <TableHead className="w-[100px]">Ref ID</TableHead>
              <TableHead>Agent / Loan</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-semibold">{p.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.agent_name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{p.loan_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    UGX {p.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal uppercase text-[10px]">
                      {p.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.status === "posted" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Posted
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.date).toLocaleString("en-US")}
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
                        <DropdownMenuItem className="text-destructive">Reverse Transaction</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
