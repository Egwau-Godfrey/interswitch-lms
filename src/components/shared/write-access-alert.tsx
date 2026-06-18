import { ShieldX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WriteAccessAlertProps {
  tabLabel?: string;
}

export function WriteAccessAlert({ tabLabel }: WriteAccessAlertProps) {
  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <ShieldX className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        View-only access
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        {tabLabel
          ? `You can view ${tabLabel} data, but changes require write access granted by a super admin.`
          : "You can view this page, but making changes requires write access granted by a super admin."}
      </AlertDescription>
    </Alert>
  );
}
