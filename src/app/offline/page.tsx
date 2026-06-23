import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          You're Offline
        </h1>
        <p className="mt-2 text-muted-foreground">
          Please check your internet connection and try again.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Some features may be unavailable until you reconnect.
        </p>
      </div>
    </div>
  );
}
