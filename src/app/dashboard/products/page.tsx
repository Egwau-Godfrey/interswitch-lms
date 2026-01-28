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
  AlertCircle,
  RefreshCw
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApi, useMutation } from "@/hooks/use-api";
import { productsApi, apiClient } from "@/lib/api";
import type { LoanProduct } from "@/lib/types";
import { formatCurrency } from "@/components/shared/stat-card";
import { useSession } from "next-auth/react";

// Mock data for fallback
const mockProducts: LoanProduct[] = [
  { id: "prod-001", name: "Quick Loan 30", description: "Short-term personal loan for agents", min_amount: 50000, max_amount: 500000, interest_rate: 10, penalty_rate: 1, tenure_days: 30, grace_period_days: 2, requires_payroll: false, is_default: true, is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "prod-002", name: "SME Boost 60", description: "Medium-term loan for business growth", min_amount: 100000, max_amount: 2000000, interest_rate: 8, penalty_rate: 1, tenure_days: 60, grace_period_days: 5, requires_payroll: true, is_default: false, is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "prod-003", name: "Payroll Advance", description: "Advance on upcoming salary payments", min_amount: 20000, max_amount: 150000, interest_rate: 5, penalty_rate: 0.5, tenure_days: 14, grace_period_days: 0, requires_payroll: true, is_default: false, is_active: false, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
];

export default function ProductsPage() {
  const { data: session } = useSession();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<LoanProduct | null>(null);
  const [page] = React.useState(1);
  const [pageSize] = React.useState(10);

  // Set access token when session is available
  React.useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    } else {
      apiClient.clearAccessToken();
    }
  }, [session]);

  // Fetch products from API with authentication
  const { data: productsData, isLoading, error, refetch } = useApi(
    () => {
      if (!session?.user?.accessToken) {
        throw new Error("No access token available");
      }
      return productsApi.list({ page, page_size: pageSize });
    },
    [page, pageSize, session?.user?.accessToken],
    { cacheKey: `products-${page}` }
  );

  // Show error toast if API fails (but not for session loading)
  React.useEffect(() => {
    if (error && session?.user?.accessToken) {
      if (error.message !== "No access token available") {
        toast.error("Failed to load products", {
          description: error.message || "Please try refreshing the page",
        });
      }
    }
  }, [error, session]);

  const products = productsData?.data || [];

  // Create product mutation
  const createProduct = useMutation(
    (data: Partial<LoanProduct>) => productsApi.create(data as any),
    {
      onSuccess: () => {
        toast.success("Product created successfully!");
        setIsCreateOpen(false);
        refetch();
      },
      onError: (err) => {
        console.error("Create product error:", err);
        toast.error("Failed to create product");
      },
    }
  );

  // Update product mutation  
  const updateProduct = useMutation(
    ({ id, data }: { id: string; data: Partial<LoanProduct> }) => productsApi.update(id, data as any),
    {
      onSuccess: () => {
        toast.success("Product updated successfully!");
        setEditingProduct(null);
        refetch();
      },
      onError: (err) => {
        console.error("Update product error:", err);
        toast.error("Failed to update product");
      },
    }
  );

  // Delete product mutation
  const deleteProduct = useMutation(
    (id: string) => productsApi.delete(id),
    {
      onSuccess: () => {
        toast.success("Product deleted successfully!");
        refetch();
      },
      onError: (err) => {
        console.error("Delete product error:", err);
        toast.error("Failed to delete product");
      },
    }
  );

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createProduct.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      min_amount: Number(formData.get("min_amount")),
      max_amount: Number(formData.get("max_amount")),
      interest_rate: Number(formData.get("interest_rate")),
      penalty_rate: Number(formData.get("penalty_rate")),
      tenure_days: Number(formData.get("tenure_days")),
      grace_period_days: Number(formData.get("grace_period_days")),
      is_active: true,
    });
  };

  const handleUpdateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    const formData = new FormData(e.currentTarget);
    updateProduct.mutate({
      id: editingProduct.id,
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        min_amount: Number(formData.get("min_amount")),
        max_amount: Number(formData.get("max_amount")),
        interest_rate: Number(formData.get("interest_rate")),
        penalty_rate: Number(formData.get("penalty_rate")),
        tenure_days: Number(formData.get("tenure_days")),
        grace_period_days: Number(formData.get("grace_period_days")),
      },
    });
  };

  const toggleProductStatus = (product: LoanProduct) => {
    updateProduct.mutate({
      id: product.id,
      data: { is_active: !product.is_active },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Products</h1>
          <p className="text-muted-foreground">Configure and manage available loan products.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#004B91] hover:bg-[#003B71]">
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Loan Product</DialogTitle>
                <DialogDescription>Define a new loan product with interest and tenure settings.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduct} className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" placeholder="e.g. Quick Loan 30" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Brief description of the loan product" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_amount">Min Amount (UGX)</Label>
                    <Input id="min_amount" name="min_amount" type="number" placeholder="50000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_amount">Max Amount (UGX)</Label>
                    <Input id="max_amount" name="max_amount" type="number" placeholder="500000" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                    <Input id="interest_rate" name="interest_rate" type="number" step="0.1" placeholder="10" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="penalty_rate">Penalty Rate (%/day)</Label>
                    <Input id="penalty_rate" name="penalty_rate" type="number" step="0.1" placeholder="1" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenure_days">Tenure (Days)</Label>
                    <Input id="tenure_days" name="tenure_days" type="number" placeholder="30" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grace_period_days">Grace Period (Days)</Label>
                    <Input id="grace_period_days" name="grace_period_days" type="number" placeholder="2" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createProduct.isLoading}>
                    {createProduct.isLoading ? "Creating..." : "Create Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className={cn("relative", !product.is_active && "opacity-60")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#004B91]" />
                      {product.name}
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleProductStatus(product)}>
                        {product.is_active ? (
                          <><XCircle className="w-4 h-4 mr-2" /> Deactivate</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 mr-2" /> Activate</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteProduct.mutate(product.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex gap-2 mt-2">
                  {product.is_active ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {product.is_default && <Badge variant="outline">Default</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Interest</p>
                      <p className="font-semibold">{product.interest_rate}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Tenure</p>
                      <p className="font-semibold">{product.tenure_days} days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Penalty</p>
                      <p className="font-semibold">{product.penalty_rate}%/day</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Grace</p>
                      <p className="font-semibold">{product.grace_period_days} days</p>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Loan Range</p>
                  <p className="font-semibold">
                    {formatCurrency(product.min_amount, "UGX")} - {formatCurrency(product.max_amount, "UGX")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Loan Product</DialogTitle>
            <DialogDescription>Update the loan product settings.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingProduct.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" name="description" defaultValue={editingProduct.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-min_amount">Min Amount (UGX)</Label>
                  <Input id="edit-min_amount" name="min_amount" type="number" defaultValue={editingProduct.min_amount} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max_amount">Max Amount (UGX)</Label>
                  <Input id="edit-max_amount" name="max_amount" type="number" defaultValue={editingProduct.max_amount} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-interest_rate">Interest Rate (%)</Label>
                  <Input id="edit-interest_rate" name="interest_rate" type="number" step="0.1" defaultValue={editingProduct.interest_rate} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-penalty_rate">Penalty Rate (%/day)</Label>
                  <Input id="edit-penalty_rate" name="penalty_rate" type="number" step="0.1" defaultValue={editingProduct.penalty_rate} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tenure_days">Tenure (Days)</Label>
                  <Input id="edit-tenure_days" name="tenure_days" type="number" defaultValue={editingProduct.tenure_days} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-grace_period_days">Grace Period (Days)</Label>
                  <Input id="edit-grace_period_days" name="grace_period_days" type="number" defaultValue={editingProduct.grace_period_days} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                <Button type="submit" disabled={updateProduct.isLoading}>
                  {updateProduct.isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
