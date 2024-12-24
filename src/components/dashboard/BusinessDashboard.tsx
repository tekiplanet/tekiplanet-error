import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DollarSign, 
  Users, 
  Package, 
  FileText,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  Plus,
  ArrowRight,
  Bell,
  BarChart3,
  Calendar,
  CircleDollarSign,
  Wallet,
  UserPlus,
  LucideIcon
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { businessService } from '@/services/businessService';
import NoBusinessProfile from '../business/NoBusinessProfile';
import InactiveBusinessProfile from '../business/InactiveBusinessProfile';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import TransactionList from './TransactionList';
import { Input } from "@/components/ui/input";
import { ChevronRight, Search } from "lucide-react";
import CustomerFormDialog from '../business/CustomerFormDialog';

// Define the BusinessMetrics interface
interface BusinessMetrics {
  revenue: number;
  revenue_trend: {
    direction: 'up' | 'down';
    percentage: number;
  };
  total_customers: number;
  customers_this_month: number;
  customer_trend: {
    direction: 'up' | 'down';
    percentage: number;
  };
  revenueData: Array<{
    name: string;
    value: number;
  }>;
  recent_activities: Activity[];
}

// Helper function for formatting currency
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function for formatting currency with specific currency code
const formatAmountWithCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Quick Action Component
const QuickAction = ({ 
  icon: Icon, 
  title, 
  onClick, 
  variant = "default" 
}: { 
  icon: LucideIcon; 
  title: string; 
  onClick: () => void; 
  variant?: "default" | "primary";
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all",
        variant === "primary" && "bg-primary text-primary-foreground"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            variant === "primary" ? "bg-primary-foreground/10" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              variant === "primary" ? "text-primary-foreground" : "text-primary"
            )} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">{title}</h3>
          </div>
          <ArrowRight className={cn(
            "h-4 w-4 opacity-50",
            variant === "primary" ? "text-primary-foreground" : "text-foreground"
          )} />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Metric Card Component with Animation
const MetricCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  trendValue, 
  isLoading, 
  color = "primary",
  className 
}: {
  title: string;
  value: string | number;
  trend?: 'up' | 'down';
  icon: LucideIcon;
  trendValue?: string;
  isLoading?: boolean;
  color?: string;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className={cn(
      "relative overflow-hidden rounded-2xl",
      className
    )}>
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 transform translate-x-8 -translate-y-8",
        `bg-${color}-500`
      )} />
      <CardContent className={cn(
        "p-6",
        className?.includes("h-[80px]") && "p-3",  // Smaller padding for mobile
        className?.includes("h-[100px]") && "p-4",  // Medium padding for desktop
        className?.includes("h-[120px]") && "p-5"   // Larger padding for revenue card
      )}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl shrink-0",
              className?.includes("h-[80px]") && "p-2", // Smaller icon padding on mobile
              `bg-${color}-500/10`
            )}>
              <Icon className={cn(
                "h-6 w-6",
                className?.includes("h-[80px]") && "h-4 w-4", // Smaller icon size on mobile
                `text-${color}-500`
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse bg-muted rounded" />
              ) : (
                <h3 className={cn(
                  "font-bold",
                  className?.includes("h-[80px]") && "text-lg",  // Smaller text on mobile
                  className?.includes("h-[100px]") && "text-xl",  // Medium text on desktop
                  className?.includes("h-[120px]") && "text-2xl"  // Large text for revenue
                )}>{value}</h3>
              )}
            </div>
          </div>
          {trend && (
            <div className="flex justify-end">
              <Badge variant={trend === 'up' ? 'success' : 'destructive'} className={cn(
                "h-6 whitespace-nowrap",
                className?.includes("h-[80px]") && "h-5 text-xs" // Smaller badge on mobile
              )}>
                <TrendingUp className={cn(
                  "h-4 w-4 mr-1",
                  className?.includes("h-[80px]") && "h-3 w-3", // Smaller trend icon on mobile
                  trend === 'down' && "rotate-180"
                )} />
                {trendValue}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Add this interface for activities
interface Activity {
  type: 'customer_added' | 'invoice_created' | 'payment_received';
  title: string;
  time: string;
  amount: number | null;
  currency: string | null;
}

// Update the ActivityItem component
const ActivityItem = ({ 
  icon: Icon, 
  title, 
  time, 
  amount, 
  currency, 
  status 
}: { 
  icon: LucideIcon; 
  title: string; 
  time: string; 
  amount?: number;
  currency?: string;
  status?: string; 
}) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="group"
  >
    <div className="flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className={cn(
        "p-2 rounded-xl shrink-0 mt-0.5",
        status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="space-y-1">
          <p className="text-sm font-medium break-words leading-relaxed">{title}</p>
          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(time))} ago</p>
        </div>
        {amount && currency && (
          <p className="text-sm font-semibold text-primary">{formatAmountWithCurrency(amount, currency)}</p>
        )}
      </div>
    </div>
  </motion.div>
);

export default function BusinessDashboard() {
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const navigate = useNavigate();

  // Query for searching customers
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customer-search', customerSearch],
    queryFn: () => businessService.searchCustomers(customerSearch),
    enabled: customerSearch.length >= 3,
    initialData: [],
    select: (data) => data || [],
  });

  const { data: profileData, isLoading: profileLoading, error } = useQuery({
    queryKey: ['business-profile'],
    queryFn: businessService.checkProfile,
    retry: false,
    onError: (error) => {
      console.error('Profile check error:', error);
    }
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<BusinessMetrics>({
    queryKey: ['business-metrics'],
    queryFn: () => businessService.getMetrics(),
    enabled: !!profileData?.profile?.id,
    select: (data: BusinessMetrics) => data,
    onError: (error) => {
      console.error('Metrics error:', error);
    }
  });

  console.log('Metrics Data:', {
    metrics,
    isLoading: metricsLoading,
    enabled: !!profileData?.profile?.id
  });

  console.log('Profile Data:', {
    profileData,
    hasProfile: profileData?.has_profile,
    profile: profileData?.profile,
    status: profileData?.profile?.status
  });

  if (profileLoading) {
    return <LoadingSkeleton />;
  }

  if (!profileData?.has_profile) {
    return <NoBusinessProfile />;
  }

  if (profileData?.profile?.status === 'inactive') {
    return <InactiveBusinessProfile />;
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary rounded-2xl">
            <AvatarImage src={profileData?.profile?.logo_url} />
            <AvatarFallback>BP</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">
              {profileData?.profile?.business_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM do yyyy')}
            </p>
          </div>
        </div>
        <Button 
          className="flex items-center gap-2 rounded-xl w-full md:w-auto"
          onClick={() => setIsQuickActionOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Quick Action
        </Button>
      </div>

      {/* Quick Actions Dialog */}
      <Dialog open={isQuickActionOpen} onOpenChange={setIsQuickActionOpen}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-lg font-semibold">Quick Actions</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 p-2">
            <QuickAction
              icon={CircleDollarSign}
              title="Create Invoice"
              onClick={() => {
                setIsQuickActionOpen(false);
                setIsCustomerSearchOpen(true);
              }}
              variant="primary"
            />
            <QuickAction
              icon={Users}
              title="Add Customer"
              onClick={() => {
                setIsQuickActionOpen(false);
                setShowCustomerForm(true);
              }}
            />
            <QuickAction
              icon={Package}
              title="Start New Project"
              onClick={() => {
                setIsQuickActionOpen(false);
                navigate('/dashboard/services');
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Search Dialog */}
      <Dialog open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search customers..." 
                className="pl-9 h-10 rounded-xl"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            <div className="relative">
              {customerSearch.length < 3 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Type at least 3 characters to search...
                </p>
              ) : customersLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No customers found.
                </p>
              ) : (
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <div className="p-4 space-y-2">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center space-x-4 rounded-lg p-2 hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setIsCustomerSearchOpen(false);
                          navigate(`/dashboard/business/customers/${customer.id}`);
                        }}
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={showCustomerForm}
        onOpenChange={setShowCustomerForm}
        mode="create"
      />

      {/* Metrics Section - Horizontal scroll on mobile */}
      <div className="space-y-4">
        {/* Monthly Revenue - Full Width */}
        <div className="w-full">
          <MetricCard
            title="Monthly Revenue"
            value={metrics?.revenue ? formatAmount(metrics.revenue) : formatAmount(0)}
            trend={metrics?.revenue_trend?.direction}
            trendValue={`${metrics?.revenue_trend?.percentage || 0}%`}
            icon={DollarSign}
            isLoading={metricsLoading}
            color="green"
            className="h-[120px] md:h-auto"
          />
        </div>
        
        {/* Customer Metrics - Horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="flex md:grid md:grid-cols-2 gap-4 px-4 md:px-0 min-w-[600px] md:min-w-0">
            <MetricCard
              title="Total Customers"
              value={metrics?.total_customers || "0"}
              trend={undefined}
              trendValue={undefined}
              icon={Users}
              isLoading={metricsLoading}
              color="blue"
              className="h-[80px] md:h-[100px]"
            />
            <MetricCard
              title="This Month"
              value={metrics?.customers_this_month?.toString() || "0"}
              trend={metrics?.customer_trend?.direction}
              trendValue={`${metrics?.customer_trend?.percentage}%`}
              icon={UserPlus}
              isLoading={metricsLoading}
              color="green"
              className="h-[80px] md:h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="relative -mx-4 md:mx-0">
          <div className="border-b overflow-x-auto scrollbar-none">
            <div className="min-w-full inline-block px-4 md:px-0">
              <TabsList className="flex w-auto bg-transparent p-0">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-1 px-3 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap text-sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="transactions" 
                  className="flex items-center gap-1 px-3 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap text-sm"
                >
                  <CircleDollarSign className="h-4 w-4" />
                  Transactions
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Overview */}
            <Card className="w-full rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.revenueData || []}>
                      <defs>
                        <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#revenue)"
                        name="Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="w-full rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Recent Activity
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs hover:bg-primary/10"
                  onClick={() => navigate('/dashboard/business/activities')}
                >
                  View All
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] md:h-[300px] -mx-2">
                  <div className="space-y-1 px-2">
                    {metrics?.recent_activities?.map((activity: Activity, index) => {
                      let icon = CircleDollarSign;
                      switch (activity.type) {
                        case 'customer_added':
                          icon = Users;
                          break;
                        case 'invoice_created':
                          icon = FileText;
                          break;
                        case 'payment_received':
                          icon = CircleDollarSign;
                          break;
                      }

                      return (
                        <ActivityItem
                          key={index}
                          icon={icon}
                          title={activity.title}
                          time={activity.time}
                          amount={activity.amount || undefined}
                          currency={activity.currency || undefined}
                          status={activity.type === 'payment_received' ? 'completed' : undefined}
                        />
                      );
                    })}

                    {(!metrics?.recent_activities || metrics.recent_activities.length === 0) && (
                      <div className="flex flex-col items-center justify-center h-[200px] space-y-2 text-muted-foreground">
                        <Bell className="h-8 w-8 opacity-50" />
                        <p>No recent activities</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-8 p-8">
    <div className="h-20 bg-muted rounded-lg animate-pulse" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-[400px] bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
);