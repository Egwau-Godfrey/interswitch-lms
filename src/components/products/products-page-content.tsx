"use client";

import * as React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/shared/search-input";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { ErrorState, EmptyState } from "@/components/shared/loading-states";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import { ExportButton } from "@/components/shared/export-button";
import {
  ProductTable,
  ProductFormDialog,
  ProductDeleteDialog,
} from "@/components/products";
import { useProducts, useProductMutations } from "@/hooks/use-products";
import { productsApi } from "@/lib/api";
import type { LoanProduct, LoanProductCreate, LoanProductUpdate } from "@/lib/types";

interface ProductsPageContentProps {
  canWrite: boolean;
  writeDisabled?: boolean;
  writeTooltip?: string;
  requireWrite: () => boolean;
  isReady: boolean;
}

export function ProductsPageContent({
  canWrite,
  writeDisabled = false,
  writeTooltip,
  requireWrite,
  isReady,
}: ProductsPageContentProps) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [loanTypeFilter, setLoanTypeFilter] = React.useState<
    "all" | "float" | "pay_day"
  >("all");
  const [activeFilter, setActiveFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all");

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] =
    React.useState<LoanProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<LoanProduct | null>(
    null
  );

  const { products, total, totalPages, isLoading, error, refetch } =
    useProducts({
      page,
      page_size: pageSize,
      is_active:
        activeFilter === "all" ? undefined : activeFilter === "active",
      loan_type: loanTypeFilter === "all" ? undefined : loanTypeFilter,
      search: search || undefined,
      enabled: isReady,
    });

  const { createProduct, updateProduct, deleteProduct, toggleActive, setDefault } =
    useProductMutations(refetch);

  // ---- Handlers ----------------------------------------------------------

  const handleCreate = (data: LoanProductCreate) => {
    if (!requireWrite()) return;
    createProduct.mutate(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = (data: LoanProductUpdate) => {
    if (!editingProduct || !requireWrite()) return;
    updateProduct.mutate({ id: editingProduct.id, data });
    setEditingProduct(null);
  };

  const handleDelete = () => {
    if (!deleteTarget || !requireWrite()) return;
    deleteProduct.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleToggleActive = (product: LoanProduct) => {
    if (!requireWrite()) return;
    toggleActive.mutate({ product, isActive: !product.is_active });
  };

  const handleSetDefault = (product: LoanProduct) => {
    if (!requireWrite()) return;
    setDefault.mutate(product.id);
  };

  // ---- Render ------------------------------------------------------------

  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
        <ErrorState message="Failed to load products" onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!canWrite && <WriteAccessAlert tabLabel="loan product" />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Products</h1>
          <p className="text-muted-foreground">
            Configure and manage available loan products.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <ExportButton
            onExportCsv={() => productsApi.exportCsv()}
            filename="products"
            disabled={writeDisabled}
          />
          <Button
            className="bg-[#004B91] hover:bg-[#003B71]"
            disabled={writeDisabled}
            title={writeTooltip}
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search products..."
          className="flex-1"
        />
        <Select
          value={loanTypeFilter}
          onValueChange={(v) => {
            setLoanTypeFilter(v as typeof loanTypeFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Loan Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="float">Float Loans</SelectItem>
            <SelectItem value="pay_day">Pay Day Loans</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={activeFilter}
          onValueChange={(v) => {
            setActiveFilter(v as typeof activeFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-100 w-full" />
      ) : products.length > 0 ? (
        <>
          <ProductTable
            products={products}
            onEdit={setEditingProduct}
            onDelete={setDeleteTarget}
            onToggleActive={handleToggleActive}
            onSetDefault={handleSetDefault}
            writeDisabled={writeDisabled}
            writeTooltip={writeTooltip}
          />
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <EmptyState
            title="No products found"
            description={
              canWrite
                ? "Create your first loan product to get started"
                : "No loan products have been configured yet."
            }
            action={
              canWrite ? (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 bg-[#004B91] hover:bg-[#003B71]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        isLoading={createProduct.isLoading}
        writeDisabled={writeDisabled}
      />
      <ProductFormDialog
        open={!!editingProduct}
        onOpenChange={(o) => !o && setEditingProduct(null)}
        product={editingProduct}
        onSubmit={handleUpdate}
        isLoading={updateProduct.isLoading}
        writeDisabled={writeDisabled}
      />
      <ProductDeleteDialog
        product={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteProduct.isLoading}
      />
    </div>
  );
}
