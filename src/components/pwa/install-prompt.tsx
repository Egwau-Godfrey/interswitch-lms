"use client";

import * as React from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InstallPrompt() {
  const { canShowInstallButton, isInstalled, isInstallable, platform, promptInstall } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = React.useState(false);

  const isDev = process.env.NODE_ENV === "development";

  // Debug info
  console.log("[PWA InstallPrompt]", {
    canShowInstallButton,
    isInstallable,
    isInstalled,
    platform,
    isDev,
  });

  // Hide if already installed
  if (isInstalled) {
    return null;
  }

  // Show in development for testing
  if (isDev) {
    const handleDevInstall = () => {
      toast.info("Development Mode", {
        description: "PWA install requires production build. Run: npm run build && npm start",
        duration: 5000,
      });
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDevInstall}
              className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Download className="h-4 w-4" />
              Install (Dev)
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>PWA install only works in production (HTTPS)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Don't show if not installable and not iOS
  if (!canShowInstallButton) {
    return null;
  }

  // iOS: beforeinstallprompt doesn't fire — show a guide dialog
  if (platform === "ios") {
    return (
      <Dialog open={showIosGuide} onOpenChange={setShowIosGuide}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Install App
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install on iPhone/iPad</DialogTitle>
            <DialogDescription>
              Follow these steps to add the app to your home screen:
            </DialogDescription>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    );
  }

  // Android / Desktop: use beforeinstallprompt
  const handleInstall = async () => {
    try {
      const accepted = await promptInstall();
      if (accepted) {
        toast.success("App installed!", {
          description: "You can now access it from your home screen.",
        });
      }
    } catch {
      toast.error("Installation failed", {
        description: "Please try again or use your browser's install option.",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}
