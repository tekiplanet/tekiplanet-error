import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  Bell,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { professionalService } from "@/services/professionalService";
import { settingsService } from "@/services/settingsService";
import { useInView } from "react-intersection-observer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

interface FiltersState {
  search: string;
  type: string;
  status: string;
  dateRange: DateRange | undefined;
}

const ActivitiesPage = () => {
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    type: 'all',
    status: 'all',
    dateRange: undefined,
  });

  // Fetch settings for currency
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.fetchSettings(),
  });

  const { ref: infiniteRef, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['activities', filters],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await professionalService.getActivities({
          page: pageParam,
          ...filters,
        });
        return response;
      } catch (err) {
        console.error('Error fetching activities:', err);
        throw err;
      }
    },
    getNextPageParam: (lastPage) => 
      lastPage.has_more ? lastPage.current_page + 1 : undefined,
    enabled: true,
    initialPageParam: 1,
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings?.default_currency || 'USD',
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key: keyof FiltersState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-3 space-y-4">
        {/* Header */}
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Activity History</h1>
          <p className="text-muted-foreground">
            View and track all your activities.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hustle">Hustles</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="workstation">Workstation</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="sm:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <CalendarComponent
                      mode="range"
                      selected={filters.dateRange}
                      onSelect={(range) => handleFilterChange('dateRange', range)}
                      numberOfMonths={1}
                      className="rounded-md border"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Filters */}
            <div className="hidden sm:flex gap-2">
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Range
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Select Date Range</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <CalendarComponent
                      mode="range"
                      selected={filters.dateRange}
                      onSelect={(range) => handleFilterChange('dateRange', range)}
                      numberOfMonths={2}
                      className="rounded-md border"
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <Card>
          <CardContent className="p-0">
            <div className="space-y-1">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-4 border-b last:border-0">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                data?.pages.map((page) =>
                  page.data.map((activity: any, index: number) => (
                    <motion.div
                      key={activity.id || index}
                      className="flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className={cn(
                        "rounded-full p-2 shrink-0",
                        getActivityColor(activity.type)
                      )}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {activity.title}
                          </p>
                          <Badge variant="outline" className="w-fit text-[10px] sm:text-xs shrink-0">
                            {format(new Date(activity.date), 'MMM dd, yyyy')}
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
                  ))
                )
              )}

              {/* Infinite Scroll Trigger */}
              {!isLoading && (
                <div
                  ref={infiniteRef}
                  className="py-4 flex justify-center"
                >
                  {isFetchingNextPage && (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default ActivitiesPage; 