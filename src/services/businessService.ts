import { api } from '@/lib/api';

export interface BusinessProfile {
  id: string;
  business_name: string;
  business_email: string;
  phone_number: string;
  registration_number: string;
  tax_number: string;
  website: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: string;
  logo_url: string | null;
}

interface TransactionParams {
  page?: number;
  search?: string;
  from?: Date;
  to?: Date;
}

export interface Activity {
  type: 'customer_added' | 'invoice_created' | 'payment_received';
  title: string;
  time: string;
  amount?: number;
  currency?: string;
}

interface ActivityParams {
  page?: number;
  search?: string;
  type?: string;
  from?: Date;
  to?: Date;
}

export const businessService = {
  async getProfile() {
    const response = await api.get<BusinessProfile>('/business/profile');
    return response.data;
  },
  async checkProfile() {
    try {
      const response = await api.get('/business/profile/check');
      return response.data;
    } catch (error) {
      console.error('Error checking business profile:', error);
      throw error;
    }
  },
  async getMetrics() {
    try {
      const response = await api.get('/business/metrics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch business metrics:', error);
      throw error;
    }
  },
  async getTransactions(params: TransactionParams = {}) {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.from) searchParams.set('from', params.from.toISOString());
      if (params.to) searchParams.set('to', params.to.toISOString());

      const response = await api.get(`/business/transactions?${searchParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
  async getActivities(params: ActivityParams = {}) {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.type && params.type !== 'all') searchParams.set('type', params.type);
      if (params.from) searchParams.set('from', params.from.toISOString());
      if (params.to) searchParams.set('to', params.to.toISOString());

      const response = await api.get(`/business/activities?${searchParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }
}; 