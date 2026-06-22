"use client";

import { useApiAuth } from "@/hooks/use-api-auth";
import { ProductsPageContent } from "@/components/products";

export default function SuperAdminProductsPage() {
  const { isReady } = useApiAuth();

  // Super-admin always has full write access
  return (
    <ProductsPageContent
      canWrite={true}
      writeDisabled={false}
      writeTooltip={undefined}
      requireWrite={() => true}
      isReady={isReady}
    />
  );
}
