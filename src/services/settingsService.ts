import { apiClient } from '@/lib/axios';

interface Settings {
  site_name?: string;
  site_description?: string;
  default_currency?: string;
  currency_symbol?: string;
  enrollment_fee?: number;
  primary_color?: string;
  secondary_color?: string;
  [key: string]: any;
}

class SettingsService {
  private settings: Settings = {};

  async fetchSettings(): Promise<Settings> {
    try {
      const response = await apiClient.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch settings', error);
      return {};
    }
  }

  async getAllSettings(): Promise<Settings> {
    // If settings are not fetched yet, fetch them first
    if (Object.keys(this.settings).length === 0) {
      const settings = await this.fetchSettings();
      this.settings = settings;
    }
    return this.settings;
  }

  async getSetting(key: string): Promise<any> {
    // If settings are not fetched yet, fetch them first
    if (Object.keys(this.settings).length === 0) {
      const settings = await this.fetchSettings();
      this.settings = settings;
    }
    return this.settings[key];
  }

  getDefaultCurrency(): string {
    return this.settings.currency_symbol || '$';
  }

  getEnrollmentFee(): number {
    return this.settings.enrollment_fee || 1000;
  }

  getCurrencyCode(): string {
    return this.settings.default_currency || 'USD';
  }
}

export const settingsService = new SettingsService();
