import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawalService } from '@/services/withdrawalService';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Loader2, ChevronRight, Bank, CreditCard, ArrowRight, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { settingsService } from '@/services/settingsService';
import { cn } from '@/lib/utils';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { transactionService } from '@/services/transactionService';

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WithdrawalModal({ open, onOpenChange }: WithdrawalModalProps) {
  const [step, setStep] = useState<'amount' | 'account' | 'confirm'>('amount');
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [verifiedAccount, setVerifiedAccount] = useState<{
    account_name: string;
    bank_name: string;
    account_number: string;
  } | null>(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();

  // Fetch settings for withdrawal limits
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.fetchSettings
  });

  // Fetch banks
  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: withdrawalService.getBanks,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Fetch user's bank accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: withdrawalService.getBankAccounts
  });

  // Filter banks based on search query
  const filteredBanks = banks?.data?.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Quick amounts based on user's balance
  const quickAmounts = [
    Math.min(5000, user?.wallet_balance || 0),
    Math.min(10000, user?.wallet_balance || 0),
    Math.min(20000, user?.wallet_balance || 0),
    Math.min(50000, user?.wallet_balance || 0)
  ].filter(amount => amount > 0);

  // Verify account mutation
  const verifyAccountMutation = useMutation({
    mutationFn: ({ accountNumber, bankCode }: { accountNumber: string; bankCode: string }) =>
      withdrawalService.verifyAccount(accountNumber, bankCode),
    onSuccess: (data, variables) => {
      const bank = banks?.data.find(b => b.code === variables.bankCode);
      setVerifiedAccount({
        account_name: data.account_name,
        bank_name: bank?.name || '',
        account_number: variables.accountNumber
      });
      toast.success('Account verified successfully');
    },
    onError: (error: any) => {
      console.log('Verification Error:', error);
      console.log('Error Response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 'Failed to verify account';
      const accountName = error.response?.data?.account_name;
      const userName = error.response?.data?.user_name;

      if (accountName && userName) {
        toast.error(errorMessage, {
          description: `Account Name: ${accountName}\nYour Name: ${userName}`
        });
      } else {
        toast.error(errorMessage);
      }
      
      setVerifiedAccount(null);
    }
  });

  // Add bank account mutation
  const addBankAccountMutation = useMutation({
    mutationFn: withdrawalService.addBankAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      setSelectedBankAccount(data.id);
      toast.success('Bank account added successfully');
      setStep('confirm');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add bank account');
    }
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: withdrawalService.withdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Withdrawal request submitted successfully');
      onOpenChange(false);
      // Reset form
      setStep('amount');
      setAmount('');
      setSelectedBank('');
      setAccountNumber('');
      setVerifiedAccount(null);
      setSelectedBankAccount('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    }
  });

  const handleVerifyAccount = () => {
    if (!accountNumber || !selectedBank) {
      toast.error('Please enter account number and select bank');
      return;
    }
    verifyAccountMutation.mutate({ accountNumber, bankCode: selectedBank });
  };

  const handleAddBankAccount = () => {
    if (!verifiedAccount) return;

    addBankAccountMutation.mutate({
      bank_name: verifiedAccount.bank_name,
      bank_code: selectedBank,
      account_number: verifiedAccount.account_number,
      account_name: verifiedAccount.account_name
    });
  };

  const handleWithdraw = () => {
    if (!amount || !selectedBankAccount) return;

    withdrawMutation.mutate({
      amount: parseFloat(amount),
      bank_account_id: selectedBankAccount
    });
  };

  const handleAmountSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountNum > (user?.wallet_balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    if (settings) {
      // Check minimum withdrawal amount
      if (amountNum < settings.min_withdrawal_amount) {
        toast.error(`Minimum withdrawal amount is ${formatCurrency(settings.min_withdrawal_amount, settings.default_currency)}`);
        return;
      }

      // Check maximum withdrawal amount
      if (amountNum > settings.max_withdrawal_amount) {
        toast.error(`Maximum withdrawal amount is ${formatCurrency(settings.max_withdrawal_amount, settings.default_currency)}`);
        return;
      }

      console.log('Transactions data:', transactions);
      console.log('Type of transactions:', typeof transactions);

      // Check daily withdrawal limit
      const todayWithdrawals = Array.isArray(transactions) ? transactions.filter(t => 
        t.type === 'debit' && 
        t.category === 'withdrawal' &&
        new Date(t.created_at).toDateString() === new Date().toDateString()
      ).reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0 : 0;

      if ((todayWithdrawals + amountNum) > settings.daily_withdrawal_limit) {
        toast.error(`Daily withdrawal limit (${formatCurrency(settings.daily_withdrawal_limit, settings.default_currency)}) exceeded`);
        return;
      }
    }

    setStep('account');
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the select from closing
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery(e.target.value);
  };

  const renderAmountStep = () => (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 rounded-lg space-y-1">
        <p className="text-sm text-muted-foreground">Available Balance</p>
        <p className="text-2xl font-bold">
          {formatCurrency(user?.wallet_balance || 0, settings?.default_currency)}
        </p>
      </div>

      {/* Quick amount selection */}
      <div className="space-y-2">
        <Label>Quick Select Amount</Label>
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
      </div>

      {/* Custom amount input */}
      <div className="space-y-2">
        <Label>Or enter custom amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {settings?.currency_symbol || '₦'}
          </span>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 h-12 text-lg font-medium"
            placeholder="0.00"
          />
        </div>
      </div>

      <Button 
        className="w-full h-12 text-white rounded-xl text-lg font-medium" 
        onClick={handleAmountSubmit}
        disabled={!amount || parseFloat(amount) <= 0}
      >
        Continue
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const renderAccountStep = () => (
    <div className="space-y-6">
      {bankAccounts?.length === 2 ? (
        <div className="space-y-4">
          <Label>Select Bank Account</Label>
          {bankAccounts.map(account => (
            <div
              key={account.id}
              onClick={() => setSelectedBankAccount(account.id)}
              className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all",
                "hover:border-primary/50",
                selectedBankAccount === account.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{account.bank_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {account.account_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {account.account_name}
                  </p>
                </div>
                {account.is_default && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Bank</Label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full h-12 justify-between"
                >
                  {selectedBank
                    ? banks?.data.find((bank) => bank.code === selectedBank)?.name
                    : "Select bank..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[calc(100vw-3rem)] sm:w-[380px] p-0"
                side="bottom"
                align="center"
                sideOffset={5}
                style={{ zIndex: 9999 }}
              >
                <div className="p-2 sticky top-0 bg-background border-b">
                  <Input
                    placeholder="Search banks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredBanks.length === 0 ? (
                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-muted-foreground">
                      No banks found
                    </div>
                  ) : (
                    filteredBanks.map((bank) => (
                      <div
                        key={bank.code}
                        className={cn(
                          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer",
                          selectedBank === bank.code && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => {
                          setSelectedBank(bank.code);
                          setSearchQuery('');
                          setIsPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedBank === bank.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {bank.name}
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Input
            placeholder="Enter account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            maxLength={10}
            className="h-12"
          />

          <Button 
            className="w-full h-12" 
            onClick={handleVerifyAccount}
            disabled={verifyAccountMutation.isPending}
          >
            {verifyAccountMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : 'Verify Account'}
          </Button>

          {verifiedAccount && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/10 rounded-xl space-y-2">
                <p className="text-sm font-medium">Verified Account Details:</p>
                <div className="space-y-1 text-sm">
                  <p>Name: {verifiedAccount.account_name}</p>
                  <p>Bank: {verifiedAccount.bank_name}</p>
                  <p>Number: {verifiedAccount.account_number}</p>
                </div>
              </div>
              <Button 
                className="w-full h-12" 
                onClick={handleAddBankAccount}
                disabled={addBankAccountMutation.isPending}
              >
                {addBankAccountMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Account...
                  </>
                ) : 'Add Account & Continue'}
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedBankAccount && (
        <Button 
          className="w-full h-12" 
          onClick={() => setStep('confirm')}
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const renderConfirmStep = () => {
    const selectedAccount = bankAccounts?.find(acc => acc.id === selectedBankAccount);
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">
                {formatCurrency(parseFloat(amount), settings?.default_currency)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">To Account</span>
              <div className="bg-background p-3 rounded-lg space-y-1">
                <p className="font-medium">{selectedAccount?.bank_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAccount?.account_number}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedAccount?.account_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button 
          className="w-full h-12 text-white" 
          onClick={handleWithdraw}
          disabled={withdrawMutation.isPending}
        >
          {withdrawMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Confirm Withdrawal
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    );
  };

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionService.getUserTransactions
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {step === 'amount' && 'Withdraw Funds'}
            {step === 'account' && 'Bank Account'}
            {step === 'confirm' && 'Confirm Withdrawal'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {step === 'amount' && renderAmountStep()}
          {step === 'account' && renderAccountStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
