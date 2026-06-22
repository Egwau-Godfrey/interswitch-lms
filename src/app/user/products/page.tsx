"use client";

import { useApiAuth } from "@/hooks/use-api-auth";
import { useWritePermission } from "@/hooks/use-write-permission";
import { ProductsPageContent } from "@/components/products";

export default function ProductsPage() {
  const { isReady } = useApiAuth();
  const { canWrite, writeDisabled, writeTooltip, requireWrite } =
    useWritePermission("loan-products");

  return (
    <ProductsPageContent
      canWrite={canWrite}
      writeDisabled={writeDisabled}
      writeTooltip={writeTooltip}
      requireWrite={requireWrite}
      isReady={isReady}
    />
  );
}
