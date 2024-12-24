export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  tags?: string[];
  notes?: string;
  status: string;
  total_spent: number;
  last_order_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone: string;
  currency: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  tags?: string[];
  notes?: string;
}

export interface CustomerDto extends CreateCustomerDto {
  id: string;
  business_id: string;
  status: string;
  created_at: string;
  updated_at: string;
} 