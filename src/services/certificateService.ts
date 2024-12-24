import { apiClient } from '@/lib/axios';

export interface Certificate {
  id: string;
  title: string;
  issue_date: string;
  image: string | null;
  grade: string;
  instructor: string;
  credential_id: string;
  skills: string[];
  featured: boolean;
}

export interface CertificateStats {
  total: number;
  featured: number;
  top_grades: number;
  total_skills: number;
}

export interface CertificatesResponse {
  certificates: Certificate[];
  stats: CertificateStats;
}

export const certificateService = {
  /**
   * Get user's certificates
   */
  async getUserCertificates(): Promise<CertificatesResponse> {
    const response = await apiClient.get('/certificates');
    return response.data;
  },

  /**
   * Toggle featured status of a certificate
   */
  async toggleFeatured(id: string): Promise<{ featured: boolean }> {
    const response = await apiClient.post(`/certificates/${id}/toggle-featured`);
    return response.data;
  },

  /**
   * Download a certificate
   */
  async downloadCertificate(id: string): Promise<Blob> {
    const response = await apiClient.get(`/certificates/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
}; 