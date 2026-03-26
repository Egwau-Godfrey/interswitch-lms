"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation } from "@/hooks/use-api";
import { paymentsApi } from "@/lib/api";
import type { PaymentChannel, PaymentCreate } from "@/lib/types";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId?: string;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({ 
  open, 
  onOpenChange, 
  loanId, 
  onSuccess 
}: RecordPaymentDialogProps) {
  const [channel, setChannel] = React.useState<PaymentChannel>("cash");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Mutation for posting payment
  const postPayment = useMutation(
    (data: PaymentCreate) => paymentsApi.create(data),
    {
      onSuccess: () => {
        toast.success("Payment recorded successfully!");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        } else {
          // Fallback to page reload if no specific success handler provided
          window.location.reload();
        }
      },
      onError: (err) => {
        console.error("Post payment error:", err);
        toast.error("Failed to record payment. Please check the Loan ID and amount.");
      },
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const targetLoanId = (formData.get("loanId") as string) || loanId;
    if (!targetLoanId) {
      toast.error("Please provide a Loan ID");
      return;
    }

    postPayment.mutate({
      loan_id: targetLoanId,
      amount: Number(formData.get("amount")),
      payment_reference: formData.get("reference") as string,
      channel: channel,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Record Manual Payment</DialogTitle>
          <DialogDescription>
            Record a payment received outside automated channels for this loan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          {!loanId && (
            <div className="space-y-2">
              <Label htmlFor="loanId">Loan ID</Label>
              <Input 
                id="loanId" 
                name="loanId" 
                placeholder="e.g. loan-001" 
                required 
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (UGX)</Label>
            <Input 
              id="amount" 
              name="amount" 
              type="number" 
              placeholder="e.g. 50000" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select name="channel" value={channel} onValueChange={(v) => setChannel(v as PaymentChannel)}>
                <SelectTrigger id="channel" suppressHydrationWarning>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference No.</Label>
              <Input 
                id="reference" 
                name="reference" 
                placeholder="e.g. TXN123456789" 
                required 
              />
              <p className="text-[10px] text-muted-foreground">
                Enter the external transaction ID (e.g. Mobile Money Ref, Bank Ref) or a unique receipt number.
              </p>
            </div>
          </div>
          
          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700" 
              disabled={postPayment.isLoading}
            >
              {postPayment.isLoading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
