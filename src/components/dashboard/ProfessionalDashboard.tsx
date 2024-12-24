import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Clock,
  CreditCard,
  Calendar,
  Bell,
  TrendingUp,
  ChevronRight,
  LayoutDashboard,
  ArrowUpRight,
  Users,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { professionalService } from "@/services/professionalService";
import NoProfessionalProfile from "../professional/NoProfessionalProfile";
import InactiveProfessionalProfile from "../professional/InactiveProfessionalProfile";
import SuspendedProfessionalProfile from "../professional/SuspendedProfessionalProfile";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface DashboardProps {
  isLoading?: boolean;
}

const ProfessionalDashboard: React.FC<DashboardProps> = ({ isLoading = false }) => {
  const navigate = useNavigate();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['professional-profile'],
    queryFn: professionalService.checkProfile,
    retry: false
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['professional-dashboard'],
    queryFn: professionalService.getDashboardData,
    enabled: !!profileData?.has_profile && profileData?.profile?.status === 'active',
    retry: false
  });

  const quickActions = useMemo(() => [
    {
      title: "View Hustles",
      description: "Browse available hustles",
      icon: Briefcase,
      color: "from-blue-600 to-blue-400",
      link: "/dashboard/hustles",
      stat: "Explore opportunities"
    },
    {
      title: dashboardData?.workstation?.has_active_subscription ? "Manage Workstation" : "Book Workstation",
      description: dashboardData?.workstation?.has_active_subscription 
        ? "View your workstation details" 
        : "Reserve your space",
      icon: LayoutDashboard,
      color: "from-purple-600 to-purple-400",
      link: dashboardData?.workstation?.has_active_subscription 
        ? "/dashboard/workstation/subscription" 
        : "/dashboard/workstation/plans",
      stat: dashboardData?.workstation?.has_active_subscription
        ? `Plan: ${dashboardData.workstation.subscription?.plan_name}`
        : "View available plans"
    },
    {
      title: "Update Availability",
      description: "Manage your schedule",
      icon: Clock,
      color: "from-green-600 to-green-400",
      link: "/dashboard/settings",
      stat: "Manage status"
    },
    {
      title: "Manage Earnings",
      description: "Track your income",
      icon: CreditCard,
      color: "from-orange-600 to-orange-400",
      link: "/dashboard/wallet",
      stat: "View wallet"
    }
  ], [dashboardData?.workstation]);

  if (isLoading || profileLoading || dashboardLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px] hidden sm:block" />
          <Skeleton className="h-[200px] hidden lg:block" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!profileData?.has_profile) {
    return <NoProfessionalProfile />;
  }

  if (profileData?.profile?.status === 'inactive') {
    return <InactiveProfessionalProfile />;
  }

  if (profileData?.profile?.status === 'suspended') {
    return <SuspendedProfessionalProfile />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: dashboardData?.currency?.code || 'USD',
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'hustle':
        return <Calendar className="h-4 w-4 text-white" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-white" />;
      case 'workstation':
        return <LayoutDashboard className="h-4 w-4 text-white" />;
      default:
        return <Bell className="h-4 w-4 text-white" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'hustle':
        return 'bg-blue-500';
      case 'payment':
        return 'bg-green-500';
      case 'workstation':
        return 'bg-purple-500';
      default:
        return 'bg-orange-500';
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container mx-auto px-4 py-6 space-y-6"
      >
        {/* Welcome Section */}
        <motion.div variants={item} className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {profileData?.profile?.user?.first_name || 'Professional'}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your business today.
          </p>
        </motion.div>

        {/* Quick Stats Cards */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full transform translate-x-12 -translate-y-6 sm:translate-x-16 sm:-translate-y-8" />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Monthly Revenue</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-3xl font-bold">{formatCurrency(dashboardData?.statistics?.monthly_revenue || 0)}</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Total: {formatCurrency(dashboardData?.statistics?.total_revenue || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full transform translate-x-12 -translate-y-6 sm:translate-x-16 sm:-translate-y-8" />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Completed Hustles</span>
                <Users className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-3xl font-bold">{dashboardData?.statistics?.completed_hustles || 0}</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Successful completions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-full transform translate-x-12 -translate-y-6 sm:translate-x-16 sm:-translate-y-8" />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Success Rate</span>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-3xl font-bold">{dashboardData?.statistics?.success_rate || 0}%</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Overall completion rate
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div variants={item}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer relative overflow-hidden h-full group"
                  onClick={() => navigate(action.link)}
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-10 transition-opacity group-hover:opacity-20",
                    action.color
                  )} />
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={cn(
                        "p-2 rounded-lg bg-gradient-to-br transition-transform group-hover:scale-110",
                        action.color
                      )}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 truncate">{action.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2 truncate">
                          {action.description}
                        </p>
                        <Badge variant="secondary" className="group-hover:bg-primary/10">
                          {action.stat}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg font-medium">Recent Activity</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard/activities')}
                className="h-8 px-2 sm:px-4"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="space-y-1">
                {dashboardData?.recent_activities?.map((activity: any, index: number) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0 sm:border-none"
                    whileHover={{ x: 4 }}
                  >
                    <div className={cn(
                      "rounded-full p-2 shrink-0 transition-transform hover:scale-110",
                      getActivityColor(activity.type)
                    )}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="font-medium text-sm sm:text-base truncate">{activity.title}</p>
                        <Badge variant="outline" className="w-fit text-[10px] sm:text-xs shrink-0">
                          {new Date(activity.date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {activity.type === 'payment' && `Amount: ${formatCurrency(activity.amount)}`}
                        {activity.type === 'hustle' && `Category: ${activity.category}`}
                        {activity.type === 'workstation' && `Workstation Payment: ${formatCurrency(activity.amount)}`}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "h-6 sm:h-7 text-[10px] sm:text-xs px-2",
                          activity.status === 'completed' && "bg-green-500/10 text-green-500",
                          activity.status === 'pending' && "bg-yellow-500/10 text-yellow-500",
                          activity.status === 'failed' && "bg-red-500/10 text-red-500"
                        )}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </ScrollArea>
  );
};

export default ProfessionalDashboard;