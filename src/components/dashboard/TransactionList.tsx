import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { 
  Search, Calendar, ArrowUpRight, ArrowDownRight,
  X, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { businessService } from '@/services/businessService';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  currency: string;
  payment_date: string;
  notes?: string;
}

export default function TransactionList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['business-transactions', searchQuery, dateRange],
    queryFn: ({ pageParam = 1 }) => 
      businessService.getTransactions({
        page: pageParam,
        search: searchQuery,
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

  const transactions = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-nowrap items-center gap-4 overflow-x-auto pb-2">
        {/* Search - Flex grow to take available space */}
        <div className="relative w-full max-w-[50%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full max-w-[50%]">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="justify-start text-left font-normal w-full"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0" 
              align="end"
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

          {dateRange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDateRange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            onClick={() => setSelectedTransaction(transaction)}
            className="bg-card rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-full",
                'bg-green-100 text-green-600'
              )}>
                <ArrowDownRight className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Payment from {transaction.customer_name}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Invoice #{transaction.invoice_number}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: transaction.currency
                  }).format(transaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.payment_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
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
        {!isLoading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ArrowUpRight className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No transactions found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or date filter
            </p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: selectedTransaction.currency
                  }).format(selectedTransaction.amount)}
                </p>
              </div>
              
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedTransaction.customer_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">#{selectedTransaction.invoice_number}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedTransaction.payment_date), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>

                {selectedTransaction.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 