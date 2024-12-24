import { api } from '@/lib/api';

export interface Bank {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_verified: boolean;
  is_default: boolean;
  created_at: string;
}

export interface WithdrawalRequest {
  amount: number;
  bank_account_id: string;
}

export const withdrawalService = {
  async getBanks() {
    const response = await api.get<{ data: Bank[] }>('/banks');
    return response.data;
  },

  async verifyAccount(accountNumber: string, bankCode: string) {
    const response = await api.post<{ account_name: string }>('/bank-accounts/verify', {
      account_number: accountNumber,
      bank_code: bankCode
    });
    return response.data;
  },

  async addBankAccount(data: {
    bank_name: string;
    bank_code: string;
    account_number: string;
    account_name: string;
  }) {
    const response = await api.post<BankAccount>('/bank-accounts', data);
    return response.data;
  },

  async getBankAccounts() {
    const response = await api.get<BankAccount[]>('/bank-accounts');
    return response.data;
  },

  async setDefaultAccount(bankAccountId: string) {
    const response = await api.post('/bank-accounts/default', {
      bank_account_id: bankAccountId
    });
    return response.data;
  },

  async withdraw(data: WithdrawalRequest) {
    const response = await api.post('/withdraw', data);
    return response.data;
  }
};
