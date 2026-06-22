"use client";

import { useCallback, useMemo } from "react";
import { useApi, useMutation } from "@/hooks/use-api";
import { productsApi, type ProductListParams } from "@/lib/api/products";
import type {
  LoanProduct,
  LoanProductCreate,
  LoanProductUpdate,
  LoanType,
} from "@/lib/types";
import { toast } from "sonner";

export interface UseProductsParams {
  page?: number;
  page_size?: number;
  is_active?: boolean;
  loan_type?: LoanType;
  search?: string;
  enabled?: boolean;
}

/**
 * Fetches a paginated list of loan products with optional filters.
 */
export function useProducts(params: UseProductsParams = {}) {
  const {
    page = 1,
    page_size = 10,
    is_active,
    loan_type,
    search,
    enabled = true,
  } = params;

  const queryParams = useMemo<ProductListParams>(
    () => ({
      page,
      page_size,
      is_active,
      loan_type,
      search: search || undefined,
    }),
    [page, page_size, is_active, loan_type, search]
  );

  const cacheKey = `products-${JSON.stringify(queryParams)}`;

  const { data, isLoading, error, refetch, isRefetching } = useApi(
    () => productsApi.list(queryParams),
    [page, page_size, is_active, loan_type, search],
    { cacheKey, enabled }
  );

  return {
    products: data?.data ?? [],
    total: data?.total ?? 0,
    totalPages: data?.total_pages ?? 1,
    page: data?.page ?? 1,
    pageSize: data?.page_size ?? page_size,
    isLoading,
    isRefetching,
    error,
    refetch,
  };
}

/**
 * Provides create / update / delete / toggle / setDefault mutations
 * for loan products. Each mutation shows a toast and calls `onSuccess`
 * so the caller can refetch the list.
 */
export function useProductMutations(onSuccess?: () => void) {
  const handleSuccess = useCallback(
    (message: string) => {
      toast.success(message);
      onSuccess?.();
    },
    [onSuccess]
  );

  const createProduct = useMutation(
    (data: LoanProductCreate) => productsApi.create(data),
    {
      onSuccess: () => handleSuccess("Product created successfully!"),
      onError: (err: Error) => {
        toast.error(err.message || "Failed to create product");
      },
    }
  );

  const updateProduct = useMutation(
    ({ id, data }: { id: string; data: LoanProductUpdate }) =>
      productsApi.update(id, data),
    {
      onSuccess: () => handleSuccess("Product updated successfully!"),
      onError: (err: Error) => {
        toast.error(err.message || "Failed to update product");
      },
    }
  );

  const deleteProduct = useMutation(
    (id: string) => productsApi.delete(id),
    {
      onSuccess: () => handleSuccess("Product deleted successfully!"),
      onError: (err: Error) => {
        toast.error(err.message || "Failed to delete product");
      },
    }
  );

  const toggleActive = useMutation(
    ({ product, isActive }: { product: LoanProduct; isActive: boolean }) =>
      productsApi.toggleActive(product.id, isActive),
    {
      onSuccess: () =>
        handleSuccess(
          `Product ${isActive ? "activated" : "deactivated"} successfully!`
        ),
      onError: (err: Error) => {
        toast.error(err.message || "Failed to update product status");
      },
    }
  );

  const setDefault = useMutation(
    (id: string) => productsApi.setDefault(id),
    {
      onSuccess: () => handleSuccess("Default product updated successfully!"),
      onError: (err: Error) => {
        toast.error(err.message || "Failed to set default product");
      },
    }
  );

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    toggleActive,
    setDefault,
  };
}
