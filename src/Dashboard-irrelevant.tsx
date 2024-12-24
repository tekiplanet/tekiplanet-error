import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PullToRefresh from 'react-simple-pull-to-refresh';
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries();
      toast.success("Content refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <PullToRefresh
            onRefresh={handleRefresh}
            pullingContent={
              <div className="flex items-center justify-center py-3 text-sm text-muted-foreground bg-background/80 backdrop-blur-sm border-b">
                Pull down to refresh...
              </div>
            }
            refreshingContent={
              <div className="flex items-center justify-center gap-2 py-3 text-sm bg-background/80 backdrop-blur-sm border-b">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Refreshing...</span>
              </div>
            }
            resistance={2}
            maxPullDownDistance={200}
            pullDownThreshold={67}
            className="h-full"
          >
            <main className="h-full">
              <Outlet />
            </main>
          </PullToRefresh>
        </div>
      </div>
    </div>
  );
}