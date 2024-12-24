import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useWalletStore } from "@/store/useWalletStore";
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Wallet,
  HelpCircle,
  Download,
  Upload,
  Settings,
  CreditCard,
  DollarSign,
  Loader2,
  CalendarIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { differenceInDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addDays, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import WithdrawalModal from './WithdrawalModal';

// Create a transaction service for API calls
const transactionService = {
  async getUserTransactions() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch transactions');
    }

    const data = await response.json();
    console.log('Raw transaction data:', data);
    
    // Extract transactions from the nested structure
    return data.transactions?.data || [];
  }
};

// Type definition for transactions
type Transaction = {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: string;
  status: string;
  description: string;
  created_at: string;
};

// Add this type for statement export
type StatementExportParams = {
  startDate: string;
  endDate: string;
};

// Explicit DateRange type
type DateRange = {
  from?: Date;
  to?: Date;
};

// Custom Date Range Picker Component
const DateRangePicker = ({ 
  value, 
  onChange 
}: { 
  value: { from?: Date; to?: Date }, 
  onChange: (range: { from?: Date; to?: Date }) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: { from?: Date; to?: Date }) => {
    // If a full range is selected, close the picker
    if (range.from && range.to) {
      setIsOpen(false);
    }
    onChange(range);
  };

  return (
    <div className="relative w-full">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !value?.from && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value?.from ? (
          value.to ? (
            <>
              {format(value.from, "LLL dd, y")} -{" "}
              {format(value.to, "LLL dd, y")}
            </>
          ) : (
            format(value.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-black border dark:border-gray-700 rounded-md shadow-lg 
          max-w-full 
          md:max-w-4xl 
          overflow-x-auto 
          transform 
          -translate-x-1/2 
          left-1/2
          md:left-0 
          md:translate-x-0 
          md:w-auto">
          <Calendar
            mode="range"
            selected={value}
            onSelect={(range) => handleSelect(range)}
            numberOfMonths={window.innerWidth < 768 ? 1 : 2}
            className="p-2 md:p-4 scale-90 md:scale-100 origin-top-left"
            classNames={{
              months: "flex flex-col md:flex-row",
              month: "space-y-4 w-full md:w-auto",
              caption: "flex justify-center items-center relative",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent hover:bg-accent hover:text-accent-foreground rounded-md",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
              day_range_start: "aria-selected:bg-primary aria-selected:text-primary-foreground",
              day_range_end: "aria-selected:bg-primary aria-selected:text-primary-foreground",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default function WalletDashboard() {
  const user = useAuthStore(state => state.user);
  const { addBalance, addTransaction } = useWalletStore();
  const [step, setStep] = useState<'amount' | 'account' | 'confirm'>('amount');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [showExportStatementModal, setShowExportStatementModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  
  // New state for pagination
  const [visibleTransactions, setVisibleTransactions] = useState(10);

  // New state for statement export with explicit typing
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [statementExportError, setStatementExportError] = useState<string | null>(null);
  const [isStatementExporting, setIsStatementExporting] = useState(false);

  const navigate = useNavigate();

  // Add settings query
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.fetchSettings
  });

  // Fetch transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        console.log('No user found, skipping transaction fetch');
        return;
      }

      try {
        setIsLoading(true);
        const fetchedTransactions = await transactionService.getUserTransactions();
        
        const transactionArray = Array.isArray(fetchedTransactions) 
          ? fetchedTransactions 
          : fetchedTransactions.data || [];

        console.log('Processed transactions:', transactionArray);
        
        setTransactions(transactionArray);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        toast.error('Failed to load transactions', {
          description: errorMessage
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  // Prepare chart data - last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayTransactions = transactions.filter(t => 
      new Date(t.created_at).toDateString() === date.toDateString()
    );
    
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      spent: dayTransactions
        .filter(t => t.type === 'debit' && t.status === 'completed')
        .reduce((acc, t) => acc + parseFloat(t.amount), 0),
      funded: dayTransactions
        .filter(t => t.type === 'credit' && t.status === 'completed')
        .reduce((acc, t) => acc + parseFloat(t.amount), 0)
    };
  }).reverse();

  // Filter transactions
  const filteredTransactions = transactions
    .map(t => ({
      ...t,
      amount: parseFloat(t.amount),
      date: t.created_at || new Date().toISOString(),
      type: t.type === 'credit' || t.type === 'debit' ? t.type : 'debit'
    }))
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination logic
  const displayedTransactions = filteredTransactions.slice(0, visibleTransactions);

  // Toggle transactions visibility
  const toggleTransactionsVisibility = () => {
    setVisibleTransactions(prev => 
      prev === 10 ? filteredTransactions.length : 10
    );
  };

  // Function to handle statement export
  const handleStatementExport = async () => {
    // Validate date range
    if (!dateRange?.from || !dateRange?.to) {
      setStatementExportError("Please select both start and end dates");
      return;
    }

    // Check if range is at least one week
    const daysDifference = differenceInDays(dateRange.to, dateRange.from);
    if (daysDifference < 7) {
      setStatementExportError("Date range must be at least one week");
      return;
    }

    try {
      // Set loading state
      setIsStatementExporting(true);
      setStatementExportError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/transactions/export-statement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate: dateRange.from.toISOString().split('T')[0],
          endDate: dateRange.to.toISOString().split('T')[0]
        })
      });

      // Parse response
      const result = await response.json();

      // Check for error response
      if (!response.ok) {
        // Special handling for no transactions
        if (response.status === 404) {
          const message = result.details 
            ? `No transactions found between ${result.details.start_date} and ${result.details.end_date}` 
            : 'No transactions found in the selected date range';
          
          toast.info(message, {
            description: 'Please select a different date range.'
          });
          setStatementExportError(message);
          return;
        }

        // Other errors
        throw new Error(result.message || 'Failed to export statement');
      }

      // Show success toast
      toast.success('Statement Request Submitted', {
        description: 'A PDF of your transactions will be sent to your email shortly.'
      });

      // Reset state
      setDateRange(undefined);
    } catch (error: any) {
      // Always reset loading state
      setIsStatementExporting(false);

      console.error('Export Statement Error:', error);

      // Handle other errors
      const errorMessage = error.message || 'An unexpected error occurred';
      
      toast.error(errorMessage);
      setStatementExportError(errorMessage);
    } finally {
      setIsStatementExporting(false);
    }
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    setDateRange({
      from: subDays(today, days),
      to: today
    });
  };

  // Status label component
  const StatusLabel = ({ status }: { status: string }) => {
    const statusStyles = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <span 
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Render loading or error states
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        <p>Error loading transactions: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 md:py-6">
      {/* Header Section - Stack on mobile */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Wallet Overview</h1>
          <p className="text-sm text-muted-foreground">Manage your funds and transactions</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none"
            onClick={() => setShowFundWalletModal(true)}
          >
            <Upload className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Fund Wallet</span>
          </Button>
          <Button 
            className="text-white flex-1 md:flex-none" 
            onClick={() => setShowWithdrawalModal(true)}
          >
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Withdraw</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid - 2x2 on mobile, 3 columns on desktop */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current Balance - Full width on mobile */}
        <Card className="bg-primary text-primary-foreground col-span-2 lg:col-span-1">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium opacity-80 truncate">Current Balance</p>
                <h2 className="text-lg md:text-2xl font-bold truncate">
                  {formatCurrency(user?.wallet_balance || 0, settings?.default_currency)}
                </h2>
              </div>
              <div className="p-2 md:p-3 bg-white/10 rounded-full shrink-0">
                <Wallet className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
                    Monthly Spending
                  </p>
                  <div className="p-1 bg-destructive/10 rounded-full shrink-0">
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  </div>
                </div>
                <h2 className="text-sm md:text-2xl font-bold truncate mt-1">
                  {formatCurrency(transactions
                    .filter(t => {
                      const date = new Date(t.created_at);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && 
                             date.getFullYear() === now.getFullYear() &&
                             t.type === 'debit' &&
                             t.status === 'completed';
                    })
                    .reduce((acc, t) => acc + parseFloat(t.amount), 0), settings?.default_currency)}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Funded */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
                    Total Funded
                  </p>
                  <div className="p-1 bg-green-500/10 rounded-full shrink-0">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  </div>
                </div>
                <h2 className="text-sm md:text-2xl font-bold truncate mt-1">
                  {formatCurrency(transactions
                    .filter(t => t.type === 'credit' && t.status === 'completed')
                    .reduce((acc, t) => acc + parseFloat(t.amount), 0), settings?.default_currency)}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions and Sidebar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        {/* Left Column - Transactions and Chart */}
        <div className="space-y-6">
          {/* On mobile, chart comes first */}
          <Card className="border-none shadow-lg rounded-2xl lg:hidden bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-foreground flex items-center">
                Financial Trends
                <div className="ml-2 flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs py-0.5">
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    +2.5%
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      opacity={0.1} 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px"
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spent" 
                      name="Spent"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="funded" 
                      name="Funded"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-destructive rounded-full mr-1.5"></div>
                  Spent
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-1.5"></div>
                  Funded
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Section */}
          <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                <CardTitle className="text-lg md:text-2xl font-bold text-foreground">
                  Transaction History
                </CardTitle>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input 
                      placeholder="Search transactions" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full bg-secondary/50 border-none rounded-full"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[120px] bg-secondary/50 border-none rounded-full">
                      <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="credit">Credits</SelectItem>
                      <SelectItem value="debit">Debits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTransactions.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {displayedTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors group cursor-pointer relative overflow-hidden"
                      onClick={() => navigate(`/dashboard/wallet/transactions/${transaction.id}`)}
                    >
                      {/* Background decoration for transaction type */}
                      <div className={`
                        absolute inset-y-0 left-0 w-1
                        ${transaction.type === 'credit' 
                          ? 'bg-green-500/20' 
                          : 'bg-red-500/20'}
                      `} />
                      
                      <div className="flex items-center space-x-4">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${transaction.type === 'credit' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-500/20' 
                            : 'bg-red-100 text-red-600 dark:bg-red-500/20'}
                        `}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm text-foreground line-clamp-1">
                            {transaction.description}
                          </p>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <StatusLabel status={transaction.status} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`
                          text-sm font-semibold
                          ${transaction.type === 'credit' 
                            ? 'text-green-600 dark:text-green-500' 
                            : 'text-red-600 dark:text-red-500'}
                        `}>
                          {transaction.type === 'credit' ? '+' : '-'}
                          {formatCurrency(transaction.amount, settings?.default_currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-secondary/50 p-4 rounded-full">
                      <Filter className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-base font-medium text-muted-foreground">
                    No transactions found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your recent transactions will appear here
                  </p>
                </div>
              )}
              
              {/* Load More/View Less Button */}
              {filteredTransactions.length > 10 && (
                <div className="p-4">
                  <Button 
                    variant="outline" 
                    onClick={toggleTransactionsVisibility}
                    className="w-full rounded-full text-sm"
                  >
                    {visibleTransactions === 10 
                      ? `View All (${filteredTransactions.length})` 
                      : 'View Less'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Fund Wallet and Quick Actions */}
        <div className="space-y-6">
          {/* Financial Trends Chart - Hidden on mobile, shown on desktop */}
          <Card className="border-none shadow-lg rounded-2xl hidden lg:block">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground flex items-center">
                Financial Trends
                <div className="ml-2 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-1" />
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      opacity={0.2} 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem"
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spent" 
                      name="Spent"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="funded" 
                      name="Funded"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-destructive rounded-full mr-2"></div>
                  Spent
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                  Funded
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fund Wallet Card */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle>Fund Wallet</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 space-y-4">
              <Button 
                className="w-full text-white" 
                onClick={() => setShowFundWalletModal(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Fund Wallet
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm md:text-base"
                onClick={() => setShowExportStatementModal(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Statement
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm md:text-base">
                <Settings className="mr-2 h-4 w-4" />
                Wallet Settings
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm md:text-base">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Payment Methods
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <FundWalletModal 
        open={showFundWalletModal} 
        onOpenChange={setShowFundWalletModal}
      />
      <Dialog open={showExportStatementModal} onOpenChange={setShowExportStatementModal}>
        <DialogContent 
          aria-describedby="export-statement-description"
        >
          <DialogHeader>
            <DialogTitle>Export Transaction Statement</DialogTitle>
          </DialogHeader>
          <div id="export-statement-description" className="space-y-4">
            <div className="space-y-4">
              <DateRangePicker 
                value={dateRange}
                onChange={setDateRange}
              />

              <div className="flex space-x-2 justify-center">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    const today = new Date();
                    setDateRange({
                      from: subDays(today, 7),
                      to: today
                    });
                  }}
                >
                  Last 7 Days
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    const today = new Date();
                    setDateRange({
                      from: subDays(today, 30),
                      to: today
                    });
                  }}
                >
                  Last 30 Days
                </Button>
              </div>

              <div className="w-full md:w-auto">
                <Button 
                  onClick={handleStatementExport} 
                  disabled={!dateRange?.from || !dateRange?.to || isStatementExporting}
                  className="w-full"
                >
                  {isStatementExporting ? 'Exporting...' : 'Export Statement'}
                </Button>
              </div>

              {statementExportError && (
                <div className="text-red-500 text-sm mt-2 text-center">
                  {statementExportError}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <WithdrawalModal 
        open={showWithdrawalModal} 
        onOpenChange={setShowWithdrawalModal}
      />
    </div>
  );
}

export const FundWalletModal = ({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Add settings query
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.fetchSettings
  });

  const handlePaystackPayment = async () => {
    try {
      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      // Navigate to PaymentConfirmation with amount and payment method
      navigate('/dashboard/payment-confirmation', {
        state: {
          amount: parseFloat(amount),
          paymentMethod: 'paystack'
        }
      });

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error('Payment Preparation Error:', error);
      toast.error('Failed to prepare payment. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // Navigate to payment confirmation page with amount and payment method
    navigate('/dashboard/payment-confirmation', {
      state: { 
        amount: parsedAmount, 
        paymentMethod: paymentMethod 
      }
    });
    
    // Close the modal
    onOpenChange(false);
  };

  const quickAmounts = [1000, 2000, 5000, 10000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Fund Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Quick amount selection */}
          <div className="grid grid-cols-2 gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                className={cn(
                  "h-12 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors",
                  amount === quickAmount.toString() && "bg-primary text-primary-foreground"
                )}
              >
                {formatCurrency(quickAmount, settings?.default_currency)}
              </Button>
            ))}
          </div>

          {/* Custom amount input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Or enter custom amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {settings?.currency_symbol || '₦'}
              </span>   
              <Input
                type="number"
                placeholder="Enter amount"
                className="pl-8 h-12 text-lg font-medium"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Payment method selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setPaymentMethod("bank")}
                className={cn(
                  "h-12 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors",
                  paymentMethod === "bank" && "bg-primary text-primary-foreground"
                )}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Bank Transfer
              </Button>
              <Button
                variant="outline"
                onClick={() => setPaymentMethod("paystack")}
                className={cn(
                  "h-12 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors",
                  paymentMethod === "paystack" && "bg-primary text-primary-foreground"
                )}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Paystack
              </Button>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-white rounded-xl text-lg font-medium" 
            onClick={paymentMethod === 'paystack' ? handlePaystackPayment : handleSubmit}
            disabled={loading || !amount}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Fund Wallet
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};