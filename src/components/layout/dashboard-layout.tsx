"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Banknote,
  Package,
  CreditCard,
  BarChart3,
  UserCog,
  Key,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  TrendingUp,
  ShieldCheck,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { InstallPrompt } from "@/components/pwa";

// Dynamic sidebar links generated based on basePath

export function DashboardLayout({ children, basePath = "/dashboard" }: { children: React.ReactNode, basePath?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();

  const isSuperAdmin =
    (session?.user as any)?.role === "super_admin" || (session?.user as any)?.isAdmin;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile sidebar on route navigation
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

// Sync access token withApiClient when session changes
const [sessionTokenApplied, setSessionTokenApplied] = React.useState<string | null>(null);
React.useEffect(() => {
  const token = session?.user?.accessToken || null;
  if (token && token !== sessionTokenApplied) {
    apiClient.setAccessToken(token);
    setSessionTokenApplied(token);
  } else if (!token && sessionTokenApplied) {
    apiClient.clearAccessToken();
    setSessionTokenApplied(null);
  }
}, [session, sessionTokenApplied]);

  const sidebarLinks = React.useMemo(() => {
    const links = [
      { href: basePath, label: "Overview", icon: LayoutDashboard },
      { href: `${basePath}/agents`, label: "Agents", icon: Users },
      { href: `${basePath}/whitelist`, label: "Whitelist", icon: ListChecks },
      { href: `${basePath}/loans`, label: "Loans", icon: Banknote },
      { href: `${basePath}/products`, label: "Loan Products", icon: Package },
      { href: `${basePath}/payments`, label: "Payments", icon: CreditCard },
      { href: `${basePath}/reports`, label: "Reports", icon: BarChart3 },
      { href: `${basePath}/scoring`, label: "Credit Scoring", icon: TrendingUp },
      { href: `${basePath}/users`, label: "Users", icon: UserCog },
      { href: `${basePath}/api-management`, label: "API Management", icon: Key },
      { href: `${basePath}/permissions`, label: "Permissions", icon: ShieldCheck },
      { href: `${basePath}/settings`, label: "Settings", icon: Settings },
    ];

    return links;
  }, [basePath, isSuperAdmin]);


  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (session?.user?.firstName && session?.user?.lastName) {
      return `${session.user.firstName.charAt(0)}${session.user.lastName.charAt(0)}`.toUpperCase();
    }
    if (session?.user?.name) {
      const nameParts = session.user.name.split(" ");
      return nameParts.length > 1
        ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase()
        : nameParts[0].substring(0, 2).toUpperCase();
    }
    return "AD";
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (session?.user?.firstName && session?.user?.lastName) {
      return `${session.user.firstName} ${session.user.lastName}`;
    }
    return session?.user?.name || session?.user?.username || "Admin User";
  };

  // Get user role
  const getUserRole = () => {
    const role = session?.user?.role;
    if (role === "user") return "User";
    if (session?.user?.isAdmin || role === "super_admin") return "Super Admin";
    if (role === "agent") return "Agent";
    return "User";
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex bg-card border-r transition-all duration-300 ease-in-out flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b">
          <Link href={basePath} className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-[#E31C2D] flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg whitespace-nowrap tracking-tight">
                Interswitch <span className="text-[#E31C2D]">Loans</span>
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== basePath && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : "group-hover:text-[#E31C2D]")} />
                {isSidebarOpen && <span className="text-sm font-medium">{link.label}</span>}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {link.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn("w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10", !isSidebarOpen && "px-2")}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 ease-in-out flex flex-col",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b">
          <Link href={basePath} className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-[#E31C2D] flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg whitespace-nowrap tracking-tight">
              Interswitch <span className="text-[#E31C2D]">Loans</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== basePath && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : "")} />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                setIsSidebarOpen(!isSidebarOpen);
              } else {
                setIsMobileSidebarOpen(!isMobileSidebarOpen);
              }
            }}
            className="text-muted-foreground"
          >
            {/* Mobile: hamburger / X based on mobile drawer state */}
            <span className="lg:hidden">
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </span>
            {/* Desktop: hamburger / X based on desktop sidebar state */}
            <span className="hidden lg:inline">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </span>
          </Button>

          <div className="flex items-center gap-4">
            {mounted && (
              <>
                <InstallPrompt />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-medium">{getUserDisplayName()}</span>
                  <span className="text-xs text-muted-foreground">{getUserRole()}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      id="user-menu-trigger" 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full"
                      suppressHydrationWarning
                    >
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src="" alt={getUserDisplayName()} />
                        <AvatarFallback className="bg-[#004B91] text-white">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
