"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { toast } from "sonner";

export function NotificationSettings() {
  const { permission, subscription, requestPermission, subscribe, unsubscribe } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await requestPermission();
      if (result === "granted") {
        await subscribe();
        toast.success("Notifications enabled", {
          description: "You'll receive important loan updates and alerts.",
        });
      } else {
        toast.error("Notifications denied", {
          description: "You can enable them later in your browser settings.",
        });
      }
    } catch (error) {
      toast.error("Failed to enable notifications", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await unsubscribe();
      toast.success("Notifications disabled", {
        description: "You won't receive push notifications anymore.",
      });
    } catch (error) {
      toast.error("Failed to disable notifications", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (permission === "granted" && subscription) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleDisableNotifications}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
        Disable Notifications
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEnableNotifications}
      disabled={isLoading || permission === "denied"}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      Enable Notifications
    </Button>
  );
}
