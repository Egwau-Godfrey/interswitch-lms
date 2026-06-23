"use client";

import * as React from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * InstallPrompt — renders an "Install App" button that works on all platforms.
 *
 * Behaviour:
 *  - If already installed (standalone mode) → renders nothing.
 *  - If `beforeinstallprompt` fired (Chrome/Edge/Android) → clicking triggers
 *    the native install dialog.
 *  - If on iOS (no `beforeinstallprompt` support) → clicking opens a modal with
 *    step-by-step "Add to Home Screen" instructions.
 *  - If on desktop without `beforeinstallprompt` (SW not ready / Firefox) →
 *    clicking opens a modal with per-browser manual instructions.
 *
 * Additionally, a toast notification is shown ~3 s after mount (once per 7 days
 * unless dismissed) to draw attention to the install option.
 *
 * Place <InstallPrompt /> anywhere — login page, dashboard header, etc.
 * Use the `variant` prop to control button styling per context.
 */

type InstallPromptVariant = "header" | "standalone";

interface InstallPromptProps {
  variant?: InstallPromptVariant;
  /** Show the auto-toast on mount (default: true). Set false on pages where it would be annoying. */
  autoToast?: boolean;
}

export function InstallPrompt({ variant = "header", autoToast = true }: InstallPromptProps) {
  const { isInstalled, isInstallable, platform, promptInstall, dismissed, dismiss } = usePWAInstall();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const toastShownRef = React.useRef(false);

  // ── Auto-toast ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!autoToast || isInstalled || dismissed || toastShownRef.current) return;
    toastShownRef.current = true;

    const timer = setTimeout(() => {
      toast("Install Interswitch Loans", {
        description: "Add the app to your device for quick access.",
        duration: 8000,
        icon: <Smartphone className="h-4 w-4" />,
        action: {
          label: "Install",
          onClick: () => handleInstallClick(),
        },
        dismissible: true,
        onDismiss: () => dismiss(),
      });
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoToast, isInstalled, dismissed]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleInstallClick = React.useCallback(() => {
    if (isInstallable) {
      promptInstall().then((accepted) => {
        if (accepted) {
          toast.success("App installed!", {
            description: "You can now access it from your home screen.",
          });
        }
      }).catch(() => {
        toast.error("Installation failed", {
          description: "Please try again or use your browser's install option.",
        });
      });
    } else {
      // iOS or desktop fallback — open the instructions dialog
      setDialogOpen(true);
    }
  }, [isInstallable, promptInstall]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (isInstalled) return null;

  const buttonClass =
    variant === "standalone"
      ? "gap-2 w-full h-11"
      : "gap-2";

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleInstallClick} className={buttonClass}>
          <Download className="h-4 w-4" />
          Install App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {platform === "ios" ? "Install on iPhone/iPad" : "Install App"}
          </DialogTitle>
          <DialogDescription>
            {platform === "ios"
              ? "Follow these steps to add the app to your home screen:"
              : "Install this app on your device for quick access:"}
          </DialogDescription>
        </DialogHeader>

        {platform === "ios" ? (
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              <span>Tap the <Share className="inline h-4 w-4 mx-1" /> <strong>Share</strong> button in Safari&apos;s bottom toolbar.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              <span>Tap <strong>&quot;Add&quot;</strong> to confirm. The app will appear on your home screen.</span>
            </li>
          </ol>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-1">Chrome / Edge</p>
              <p className="text-muted-foreground">Click the install icon (⊕) in the address bar, or go to Menu → Install app.</p>
            </div>
            <div>
              <p className="font-medium mb-1">Firefox</p>
              <p className="text-muted-foreground">PWA install is not supported. Use a Chromium browser for the best experience.</p>
            </div>
            <div>
              <p className="font-medium mb-1">Android (Chrome)</p>
              <p className="text-muted-foreground">Tap the menu (⋮) → Install app.</p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={() => { setDialogOpen(false); dismiss(); }}>
            <X className="h-4 w-4 mr-1" />
            Don&apos;t show again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
