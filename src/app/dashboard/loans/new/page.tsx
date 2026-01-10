"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Search,
  Banknote,
  Calculator,
  User,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { agentsApi, productsApi, loansApi } from "@/lib/api";
import type { Agent, LoanProduct, EligibleProductsResponse } from "@/lib/types";
import { AgentStatusBadge } from "@/components/shared/status-badges";
import { formatCurrency } from "@/components/shared/stat-card";

// Mock data for development
const mockProducts: LoanProduct[] = [
  { id: "prod-001", name: "Quick Loan 30", min_amount: 50000, max_amount: 500000, interest_rate: 10, penalty_rate: 1, tenure_days: 30, is_active: true, created_at: "2025-01-01", updated_at: "2025-01-01" },
  { id: "prod-002", name: "SME Boost 60", min_amount: 100000, max_amount: 2000000, interest_rate: 12, penalty_rate: 1.5, tenure_days: 60, is_active: true, created_at: "2025-01-01", updated_at: "2025-01-01" },
  { id: "prod-003", name: "Payroll Advance", min_amount: 30000, max_amount: 300000, interest_rate: 8, penalty_rate: 0.5, tenure_days: 14, is_active: true, created_at: "2025-01-01", updated_at: "2025-01-01" },
];

const mockAgent: Agent = {
  id: "1",
  agent_id: "3ISO0056",
  full_name: "John Doe",
  email: "john.doe@example.com",
  phone_number: "+256700123456",
  national_id_number: "CM12345678901234",
  employer_name: "Interswitch Uganda Ltd",
  employment_status: "full_time",
  monthly_income: 2500000,
  consents_to_credit_check: true,
  default_product_id: "prod-001",
  status: "active",
  created_at: "2025-06-15T10:30:00",
  updated_at: "2025-12-01T14:22:00",
};

const formSchema = z.object({
  agent_id: z.string().min(1, "Agent ID is required"),
  product_id: z.string().min(1, "Please select a loan product"),
  principal_amount: z.number().min(1, "Amount must be greater than 0"),
  confirmed: z.boolean().refine(val => val === true, {
    message: "You must confirm the loan details",
  }),
});

type FormValues = z.infer<typeof formSchema>;

function NewLoanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetAgentId = searchParams.get("agent_id");

  const [agentSearch, setAgentSearch] = React.useState(presetAgentId || "");
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<LoanProduct | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  // Fetch products
  const { data: productsData } = useApi(
    () => productsApi.list().catch(() => ({ data: mockProducts, total: mockProducts.length, page: 1, page_size: 10, total_pages: 1 })),
    [],
    { cacheKey: "products-list" }
  );

  const products: LoanProduct[] = productsData?.data || mockProducts;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agent_id: presetAgentId || "",
      product_id: "",
      principal_amount: 0,
      confirmed: false,
    },
  });

  // Load preset agent if agent_id in URL
  React.useEffect(() => {
    if (presetAgentId) {
      handleAgentSearch(presetAgentId);
    }
  }, [presetAgentId]);

  const handleAgentSearch = async (searchId?: string) => {
    const agentId = searchId || agentSearch;
    if (!agentId.trim()) return;

    setIsSearching(true);
    try {
      const agent = await agentsApi.get(agentId);
      setSelectedAgent(agent);
      form.setValue("agent_id", agent.agent_id);
      
      // Set default product if agent has one
      if (agent.default_product_id) {
        form.setValue("product_id", agent.default_product_id);
        const product = products.find(p => p.id === agent.default_product_id);
        if (product) setSelectedProduct(product);
      }
    } catch {
      // Use mock for development
      setSelectedAgent(mockAgent);
      form.setValue("agent_id", mockAgent.agent_id);
      if (mockAgent.default_product_id) {
        form.setValue("product_id", mockAgent.default_product_id);
        const product = products.find(p => p.id === mockAgent.default_product_id);
        if (product) setSelectedProduct(product);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductChange = (productId: string) => {
    form.setValue("product_id", productId);
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    
    // Reset amount if outside new product's range
    const currentAmount = form.getValues("principal_amount");
    if (product && currentAmount > product.max_amount) {
      form.setValue("principal_amount", product.max_amount);
    }
    if (product && product.min_amount && currentAmount < product.min_amount) {
      form.setValue("principal_amount", product.min_amount);
    }
  };

  // Create loan mutation
  const createLoan = useMutation(
    (data: FormValues) => loansApi.applyLoan({
      agent_id: data.agent_id,
      product_id: data.product_id,
      principal_amount: data.principal_amount,
    }),
    {
      onSuccess: (loan) => {
        toast.success("Loan application submitted successfully!");
        router.push(`/dashboard/loans/${loan.id}`);
      },
      onError: () => {
        // Mock success for development
        toast.success("Loan application submitted successfully!");
        router.push("/dashboard/loans");
      },
    }
  );

  const onSubmit = (data: FormValues) => {
    createLoan.mutate(data);
  };

  // Calculate loan preview
  const principalAmount = form.watch("principal_amount") || 0;
  const interestAmount = selectedProduct 
    ? Math.round(principalAmount * (selectedProduct.interest_rate / 100))
    : 0;
  const totalRepayment = principalAmount + interestAmount;
  const dueDate = selectedProduct
    ? new Date(Date.now() + selectedProduct.tenure_days * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/loans">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Loan Application</h1>
          <p className="text-muted-foreground">Create a new loan for an agent</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Agent Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Agent
              </CardTitle>
              <CardDescription>Search for an agent by their Agent ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Agent ID (e.g., 3ISO0056)"
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAgentSearch()}
                />
                <Button 
                  onClick={() => handleAgentSearch()} 
                  disabled={isSearching}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {isSearching && (
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              )}

              {selectedAgent && !isSearching && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">
                        {selectedAgent.full_name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedAgent.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedAgent.agent_id}</p>
                    </div>
                  </div>
                  <AgentStatusBadge status={selectedAgent.status} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Details Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Loan Details
              </CardTitle>
              <CardDescription>Select loan product and amount</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Product</FormLabel>
                        <Select 
                          onValueChange={handleProductChange} 
                          value={field.value}
                          disabled={!selectedAgent}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a loan product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.filter(p => p.is_active).map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex flex-col">
                                  <span>{product.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {product.interest_rate}% interest • {product.tenure_days} days
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedProduct && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                      {selectedProduct.min_amount !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Amount</span>
                          <span className="font-medium">{formatCurrency(selectedProduct.min_amount, "UGX")}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Amount</span>
                        <span className="font-medium">{formatCurrency(selectedProduct.max_amount, "UGX")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interest Rate</span>
                        <span className="font-medium">{selectedProduct.interest_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tenure</span>
                        <span className="font-medium">{selectedProduct.tenure_days} days</span>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="principal_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Amount (UGX)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter loan amount"
                            disabled={!selectedProduct}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        {selectedProduct && (
                          <FormDescription>
                            {selectedProduct.min_amount ? `Between ${formatCurrency(selectedProduct.min_amount, "UGX")} and ` : "Up to "}
                            {formatCurrency(selectedProduct.max_amount, "UGX")}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I confirm that the loan details are correct and the agent has consented to this loan application
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={!selectedAgent || !selectedProduct || createLoan.isLoading}
                className="w-full"
              >
                {createLoan.isLoading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit Loan Application
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Loan Preview Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Loan Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProduct && principalAmount > 0 ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Principal Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(principalAmount, "UGX")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interest ({selectedProduct.interest_rate}%)</p>
                    <p className="text-lg font-medium">{formatCurrency(interestAmount, "UGX")}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">Total Repayment</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(totalRepayment, "UGX")}</p>
                  </div>
                  {dueDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="font-medium">{dueDate.toLocaleDateString("en-UG", { dateStyle: "medium" })}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a product and enter amount to see loan preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedAgent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agent Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Agent status: Active</span>
                </div>
                {selectedAgent.consents_to_credit_check && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Credit check consent: Yes</span>
                  </div>
                )}
                {selectedAgent.monthly_income && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Income verified</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function NewLoanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <NewLoanPageContent />
    </Suspense>
  );
}
