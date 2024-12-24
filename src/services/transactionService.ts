import { api } from '@/lib/api';

export interface Transaction {
  id: string;
  user_id: string;
  amount: string;
  type: 'credit' | 'debit';
  category: 'withdrawal' | 'deposit' | 'refund' | 'payment';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  payment_method: string;
  reference_number: string;
  created_at: string;
  updated_at: string;
}

export const transactionService = {
  async getUserTransactions() {
    const response = await api.get<Transaction[]>('/transactions');
    return response.data;
  },

  async getTransaction(id: string) {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  }
}; 