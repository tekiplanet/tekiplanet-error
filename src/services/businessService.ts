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

export const businessService = {
  async getProfile() {
    const response = await api.get<BusinessProfile>('/business/profile');
    return response.data;
  }
}; 