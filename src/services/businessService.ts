import { apiClient } from '@/lib/api-client';

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  notes?: string;
  tags?: string[];
}

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

interface CreateInvoiceDto {
  invoice_number?: string;
  due_date: Date;
  notes?: string;
  theme_color: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
  amount: number;
  currency: string;
  customer_id: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  due_date: string;
  status: string;
  status_details?: {
    label: string;
    is_overdue?: boolean;
    days_overdue?: number;
    paid_amount?: number;
    remaining_amount?: number;
  };
  created_at: string;
}

export const businessService = {
  async getProfile() {
    const response = await apiClient.get<BusinessProfile>('/business/profile');
    return response.data;
  },
  async checkProfile() {
    try {
      const response = await apiClient.get('/business/profile/check');
      return response.data;
    } catch (error) {
      console.error('Error checking business profile:', error);
      throw error;
    }
  },
  async getMetrics() {
    try {
      const response = await apiClient.get('/business/metrics');
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

      const response = await apiClient.get(`/business/transactions?${searchParams.toString()}`);
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

      const response = await apiClient.get(`/business/activities?${searchParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },
  async checkProfessional() {
    try {
      const response = await apiClient.get('/professional/profile/check');
      return response.data;
    } catch (error) {
      console.error('Error checking professional profile:', error);
      throw error;
    }
  },
  async createProfile(formData: FormData) {
    try {
      const response = await apiClient.post('/business/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating business profile:', error);
      throw error;
    }
  },
  async createCustomer(data: CreateCustomerDto) {
    try {
      const response = await apiClient.post('/business/customers', data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },
  async updateCustomer(id: string, data: CreateCustomerDto) {
    try {
      const response = await apiClient.put(`/business/customers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },
  async getCustomer(id: string) {
    try {
      const response = await apiClient.get(`/business/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },
  getCustomers: async ({ search }: { search?: string } = {}) => {
    try {
      const response = await apiClient.get(search 
        ? '/business/customers/search'  // Use search endpoint if search param exists
        : '/business/customers'         // Use list endpoint if no search param
      , {
        params: search ? { search } : undefined
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },
  async createInvoice(data: CreateInvoiceDto) {
    try {
      const response = await apiClient.post('/business/invoices', data);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },
  async getCustomerInvoices(customerId: string) {
    try {
      const response = await apiClient.get<Invoice[]>(`/business/customers/${customerId}/invoices`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }
  },
}; 