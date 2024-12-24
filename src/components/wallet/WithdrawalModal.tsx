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
      toast.error(error.response?.data?.error || 'Failed to verify account');
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

  // Filter banks based on search query
  const filteredBanks = banks?.data.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
      if (amountNum < settings.min_withdrawal_amount) {
        toast.error(`Minimum withdrawal amount is ${formatCurrency(settings.min_withdrawal_amount, settings.default_currency)}`);
        return;
      }

      if (amountNum > settings.max_withdrawal_amount) {
        toast.error(`Maximum withdrawal amount is ${formatCurrency(settings.max_withdrawal_amount, settings.default_currency)}`);
        return;
      }
    }

    setStep('account');
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search banks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              {filteredBanks.map(bank => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
