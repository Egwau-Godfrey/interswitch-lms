"use client";

import * as React from "react";
import { Banknote, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to logout");
    }
  };

  const agentName =
    (session?.user as any)?.firstName && (session?.user as any)?.lastName
      ? `${(session?.user as any).firstName} ${(session?.user as any).lastName}`
      : session?.user?.name || session?.user?.username || "Agent";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="h-16 bg-card border-b flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#E31C2D] flex items-center justify-center">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">
            Interswitch <span className="text-[#E31C2D]">Loans</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden md:block">{agentName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
