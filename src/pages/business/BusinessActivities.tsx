import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { 
  Users, FileText, CircleDollarSign, Search, Filter, 
  ArrowLeft, Calendar, ChevronDown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { businessService } from '@/services/businessService';
import { cn } from '@/lib/utils';
import { Activity } from '@/services/businessService';

// Helper function for formatting currency with specific currency code
const formatAmountWithCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function BusinessActivities() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activityType, setActivityType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery<{ data: Activity[]; next_page: number | null }>({
    queryKey: ['business-activities', searchQuery, activityType, dateRange],
    queryFn: ({ pageParam = 1 }) => 
      businessService.getActivities({
        page: pageParam,
        search: searchQuery,
        type: activityType,
        from: dateRange?.from,
        to: dateRange?.to
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next_page ?? undefined,
  });

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  const activities = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-0 sm:p-4 max-w-7xl"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-background to-background/80 backdrop-blur-lg border-b">
        <div className="p-4 flex flex-col space-y-2">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-2xl font-bold tracking-tight">Business Activities</h1>
              <p className="text-muted-foreground">Track all your business activities</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Filters */}
        <div className="space-y-4">
          {/* Search - Full width */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search activities..." 
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filter and Date - Same row with better spacing */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex-shrink-0">
              <Select
                value={activityType}
                onValueChange={setActivityType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="customer_added">New Customers</SelectItem>
                  <SelectItem value="invoice_created">Invoices</SelectItem>
                  <SelectItem value="payment_received">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-[180px] justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} -{" "}
                          {format(dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0" 
                  align="start"
                  side="bottom"
                >
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={window.innerWidth >= 768 ? 2 : 1}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-lg border p-4 hover:bg-muted/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className={cn(
                  "p-2 rounded-full shrink-0 w-fit",
                  activity.type === 'payment_received' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                )}>
                  {activity.type === 'customer_added' && <Users className="h-4 w-4" />}
                  {activity.type === 'invoice_created' && <FileText className="h-4 w-4" />}
                  {activity.type === 'payment_received' && <CircleDollarSign className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium break-words">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(activity.time), 'MMM d, yyyy h:mm a')}
                  </p>
                  {activity.amount && activity.currency && (
                    <Badge variant="secondary" className="font-medium mt-2">
                      {formatAmountWithCurrency(activity.amount, activity.currency)}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          <div ref={ref}>
            {isFetchingNextPage && (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Empty state */}
          {!isLoading && activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No activities found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 