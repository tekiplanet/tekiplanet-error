import { apiClient } from '@/lib/axios';
import { isAxiosError } from 'axios';

export interface CourseDetails {
  course: any;
  modules: any[];
  lessons: any[];
  exams: any[];
  schedules: any[];
  notices: any[];
  features: any[];
  instructor: any;
  enrollment: any;
  installments: any[];
}

const courseNotices = {
  // Add local course notices data here
};

export const courseManagementService = {
  getCourseDetails: async (courseId: string) => {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }

      const response = await apiClient.get(`/courses/${courseId}/details`);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      if (!response.data.course) {
        throw new Error('Course details not found');
      }

      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Course not found');
        }
        if (error.response?.status === 401) {
          throw new Error('Unauthorized access');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch course details');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getCourseNotices: async (courseId: string) => {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }

      const response = await apiClient.get(`/courses/${courseId}/notices`);
      
      if (!response.data || !response.data.notices) {
        throw new Error('Invalid response structure');
      }

      const transformedNotices = response.data.notices.map((notice: any) => ({
        id: notice.id.toString(),
        type: notice.is_important ? 'announcement' : 'resource',
        title: notice.title,
        content: notice.content,
        date: new Date(notice.published_at),
        read: false,
        priority: notice.is_important ? 'high' : 'normal'
      }));

      return {
        success: true,
        notices: transformedNotices
      };
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch notices';
        console.error('Notice fetch error:', {
          status: error.response?.status,
          message: errorMessage
        });
        return {
          success: false,
          message: errorMessage,
          notices: []
        };
      }
      return {
        success: false,
        message: 'An unexpected error occurred',
        notices: []
      };
    }
  },

  deleteUserCourseNotice: async (courseNoticeId: string) => {
    try {
      if (!courseNoticeId) {
        throw new Error('Notice ID is required');
      }

      const response = await apiClient.delete(`/courses/notices/${courseNoticeId}`);

      return {
        success: true,
        message: response.data.message || 'Notice deleted successfully',
        courseNoticeId
      };
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to delete notice';
        console.error('Notice deletion error:', {
          status: error.response?.status,
          message: errorMessage
        });
        return {
          success: false,
          message: errorMessage,
          courseNoticeId
        };
      }
      return {
        success: false,
        message: 'An unexpected error occurred',
        courseNoticeId
      };
    }
  }
};

export default courseManagementService;
