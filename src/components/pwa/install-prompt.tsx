"use client";

import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const isDev = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";
  
  // Debug info
  console.log("[PWA InstallPrompt]", {
    isInstallable,
    isInstalled,
    isDev,
    isProduction,
    shouldShow: isInstalled === false && (isInstallable || isDev),
  });

  // Hide if already installed
  if (isInstalled) {
    console.log("[PWA] Hidden: Already installed");
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

  // Show in production when installable
  if (isInstallable) {
    const handleInstall = async () => {
      try {
        await promptInstall();
        toast.success("App installed!", {
          description: "You can now access it from your home screen.",
        });
      } catch (error) {
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

  // Don't show if not installable and not dev
  return null;
}
