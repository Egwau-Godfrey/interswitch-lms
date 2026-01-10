"use client";

import * as React from "react";
import {
  Plus,
  Package,
  Clock,
  Percent,
  ShieldCheck,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const initialProducts = [
  { 
    id: "1", 
    name: "Quick Loan 30", 
    description: "Short-term personal loan for agents.", 
    max_amount: 50000, 
    interest_rate: 10, 
    tenure_days: 30, 
    penalty_rate: 0.5, 
    grace_period: 2,
    is_active: true,
    is_default: true,
    requires_payroll: false
  },
  { 
    id: "2", 
    name: "SME Boost", 
    description: "Working capital for small business growth.", 
    max_amount: 500000, 
    interest_rate: 15, 
    tenure_days: 90, 
    penalty_rate: 1, 
    grace_period: 5,
    is_active: true,
    is_default: false,
    requires_payroll: true
  },
  { 
    id: "3", 
    name: "Payroll Advance", 
    description: "Advance on upcoming salary payments.", 
    max_amount: 150000, 
    interest_rate: 8, 
    tenure_days: 30, 
    penalty_rate: 0.2, 
    grace_period: 0,
    is_active: false,
    is_default: false,
    requires_payroll: true
  },
];

export default function ProductsPage() {
  const [products, setProducts] = React.useState(initialProducts);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Loan product created successfully!");
    setIsCreateOpen(false);
  };

  const toggleStatus = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
    toast.info("Product status updated.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Products</h1>
          <p className="text-muted-foreground">Configure loan terms, interest rates, and eligibility criteria.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#004B91] hover:bg-[#003B71]">
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Loan Product</DialogTitle>
              <DialogDescription>
                Define the parameters for a new loan offering.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" placeholder="e.g. Quick Cash" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe the product use case..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_amount">Max Amount (₦)</Label>
                  <Input id="max_amount" type="number" placeholder="100000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest">Interest Rate (%)</Label>
                  <Input id="interest" type="number" step="0.1" placeholder="10" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenure">Tenure (Days)</Label>
                  <Input id="tenure" type="number" placeholder="30" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penalty">Daily Penalty (%)</Label>
                  <Input id="penalty" type="number" step="0.01" placeholder="0.5" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="payroll" />
                  <Label htmlFor="payroll">Requires Payroll</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="default" />
                  <Label htmlFor="default">Set as Default</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#E31C2D] hover:bg-[#C21827]">Save Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className={cn(
            "relative overflow-hidden transition-all hover:shadow-md border-t-4",
            product.is_active ? "border-t-[#004B91]" : "border-t-slate-300 opacity-80"
          )}>
            {product.is_default && (
              <div className="absolute top-2 right-12">
                <Badge className="bg-[#E31C2D] text-white border-none">Default</Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                    {product.description}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Max Amount</p>
                  <p className="font-semibold">₦{product.max_amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Interest Rate</p>
                  <div className="flex items-center font-semibold text-emerald-600">
                    <Percent className="w-3 h-3 mr-1" /> {product.interest_rate}%
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Tenure</p>
                  <div className="flex items-center font-semibold">
                    <Clock className="w-3 h-3 mr-1" /> {product.tenure_days} Days
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Daily Penalty</p>
                  <p className="font-semibold text-rose-500">{product.penalty_rate}%</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {product.requires_payroll && (
                  <Badge variant="secondary" className="text-[10px]">Payroll Required</Badge>
                )}
                <Badge variant="secondary" className="text-[10px]">{product.grace_period}d Grace Period</Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/30 pt-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={product.is_active} 
                  onCheckedChange={() => toggleStatus(product.id)}
                />
                <span className="text-xs font-medium">
                  {product.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className={cn(
                "flex items-center text-[10px] font-bold uppercase tracking-wider",
                product.is_active ? "text-emerald-600" : "text-slate-400"
              )}>
                {product.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {product.is_active ? "Available" : "Hidden"}
              </div>
            </CardFooter>
          </Card>
        ))}
        
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex flex-col items-center justify-center gap-4 h-full min-h-[300px] border-2 border-dashed rounded-xl border-muted hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <p className="font-medium text-muted-foreground group-hover:text-primary">Create New Product</p>
        </button>
      </div>
    </div>
  );
}
