import { EnrollmentRequest, EnrollmentResponse } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';
import { apiClient } from '@/lib/api-client';

class CourseService {
  async enrollInCourse(data: EnrollmentRequest): Promise<EnrollmentResponse> {
    try {
      const response = await this.mockEnrollmentAPI(data);
      return response;
    } catch (error) {
      throw new Error('Failed to process enrollment');
    }
  }

  async getCourseDetails(courseId: string) {
    try {
      // First, get the basic course details
      const courseResponse = await apiClient.get(`/courses/${courseId}`);
      
      // Get curriculum
      const curriculumResponse = await apiClient.get(`/courses/${courseId}/curriculum`);
      
      // Try to get features, but don't fail if unavailable
      let features = [];
      try {
        const featuresResponse = await apiClient.get(`/courses/${courseId}/features`);
        features = featuresResponse.data;
      } catch (error) {
        console.warn('Could not fetch course features:', error);
      }
      
      // Combine all data
      const courseData = {
        ...courseResponse.data,
        features: features,
        curriculum: curriculumResponse.data
      };
      
      console.log('Course API Response:', courseData);
      return courseData;
    } catch (error) {
      console.error('Course API Error:', error);
      throw error;
    }
  }

  async mockEnrollmentAPI(data: EnrollmentRequest): Promise<EnrollmentResponse> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!data.courseId || !data.userId || !data.amount) {
      throw new Error('Invalid enrollment data');
    }

    return {
      success: true,
      message: 'Enrollment successful',
      data: {
        transactionId: `TRX-${Date.now()}`,
        courseId: data.courseId,
        amount: data.amount
      }
    };
  }
}

export const courseService = new CourseService();