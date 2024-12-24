import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';  
import { useAuthStore } from '@/store/useAuthStore';
import enrollmentService from '@/services/enrollmentService';
import { courseManagementService } from '@/services/courseManagementService';
import { apiClient } from '@/lib/axios';
import { isAxiosError } from 'axios';
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Bell, GraduationCap, FileText, BookOpen, Wallet, PlayCircle } from "lucide-react";
import PagePreloader from '@/components/ui/PagePreloader';

// Components for each tab
import PaymentInfo from '@/components/course-management/PaymentInfo';
import CourseContent from '@/components/course-management/CourseContent';
import CourseSchedule from '@/components/course-management/CourseSchedule';
import CourseNotices from '@/components/course-management/CourseNotices';
import ExamSchedule from '@/components/course-management/ExamSchedule';

const CourseManagement: React.FC = () => {
  const { courseId } = useParams();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Add settings query at the top with other queries
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.fetchSettings
  });

  const [courseIdState, setCourseId] = React.useState<string | null>(courseId || null);
  const [courseDetails, setCourseDetails] = React.useState<{
    course: any;
    modules: any[];
    lessons: any[];
    exams: any[];
    schedules: any[];
    notices: any[];
    features: any[];
    instructor: any;
    enrollment: {
      id: string;
      status: string;
      progress: number;
      enrolled_at: string;
    } | null;
    installments: any[];
  } | null>(null);

  const [errorMessage, setErrorMessage] = React.useState('');
  // const [enrollments, setEnrollments] = React.useState<any[]>([]);
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);

  const [upcomingExamsCount, setUpcomingExamsCount] = React.useState(0);

  const handleNoticeDelete = React.useCallback((noticeId: string) => {
    setNotices(prevNotices => 
      prevNotices.filter(notice => notice.id !== noticeId)
    );
  }, []);

  const handleUpcomingExamsCountChange = React.useCallback((count: number) => {
    setUpcomingExamsCount(count);
  }, []);


    // Function to calculate upcoming exams
    const calculateUpcomingExams = React.useCallback((exams: any[] = []) => {
      const now = new Date();
      const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const upcomingExams = exams.filter(exam => {
        const examDate = new Date(exam.date);
        
        // Log details for debugging
        console.log('Upcoming Exams Calculation:', {
          examTitle: exam.title,
          examDate: examDate.toISOString(),
          nowDate: nowDate.toISOString(),
          isUpcoming: examDate >= nowDate
        });
        
        return examDate >= nowDate;
      });
  
      return upcomingExams.length;
    }, []);

  // Move the state update to useEffect
  React.useEffect(() => {
    if (courseDetails?.exams) {
      const count = calculateUpcomingExams(courseDetails.exams);
      setUpcomingExamsCount(count);
    }
  }, [courseDetails?.exams, calculateUpcomingExams]);

  // Add this method near other React.useCallback methods
  const refreshExams = React.useCallback(async () => {
    try {
      if (!courseIdState) return;
  
      const examsResponse = await apiClient.get(`/courses/${courseIdState}/exams`);
      const exams = examsResponse.data;
  
      // Recalculate upcoming exams
      const upcomingCount = calculateUpcomingExams(exams);
  
      // Update course details to reflect new exam state
      if (courseDetails) {
        setCourseDetails(prevDetails => ({
          ...prevDetails!,
          exams: exams
        }));
      }
  
      // Call the callback to update upcoming exams count if provided
      if (handleUpcomingExamsCountChange) {
        handleUpcomingExamsCountChange(upcomingCount);
      }
  
      // Optional: Add a toast to confirm refresh
      toast.success('Exams Refreshed', {
        description: 'Exam schedule has been updated'
      });
  
      return exams;
    } catch (error) {
      console.error('Error refreshing exams:', error);
      toast.error('Failed to Refresh Exams', {
        description: 'Could not update exam schedule'
      });
      
      return [];
    }
  }, [courseIdState, calculateUpcomingExams, courseDetails, handleUpcomingExamsCountChange]);


  // Separate effect to fetch exams
  React.useEffect(() => {
    const fetchCourseExams = async () => {
      try {
        if (!courseIdState) return;

        const examsResponse = await apiClient.get(`/courses/${courseIdState}/exams`);
        const exams = examsResponse.data;

        // Update course details with exams
        setCourseDetails(prevDetails => ({
          ...prevDetails!,
          exams: exams
        }));
        
        // Calculate and set upcoming exams count
        const count = calculateUpcomingExams(exams);
        setUpcomingExamsCount(count);
      } catch (error) {
        console.error('Error fetching exams:', error);
      }
    };

    fetchCourseExams();
  }, [courseIdState]);

  // React.useEffect(() => {
  //   const fetchCourseDetails = async () => {
  //     setIsLoading(true);
  //     try {
  //       if (!courseIdState) return;

  //       const courseDetails = await courseManagementService.getCourseDetails(courseIdState);
  //       setCourseDetails(courseDetails);
  //       setEnrollment(courseDetails.enrollment);

  //       setIsLoading(false);
  //     } catch (error) {
  //       console.error('Error fetching course details:', error);
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchCourseDetails();
  // }, [courseIdState]);





  // const [enrollment, setEnrollment] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchCourseDetails = async () => {
      setIsLoading(true);
      try {
        if (!courseIdState) return;
  
        const courseDetails = await courseManagementService.getCourseDetails(courseIdState);
        setCourseDetails(courseDetails);
  
        // If enrollment is not in course details, fetch it separately
        if (!courseDetails.enrollment) {
          const enrollmentDetails = await enrollmentService.getUserCourseEnrollment(courseIdState);
          setCourseDetails(prev => ({
            ...prev,
            enrollment: enrollmentDetails
          }));
        }
  
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching course details:', error);
        setIsLoading(false);
        toast.error('Failed to fetch course details');
      }
    };
  
    fetchCourseDetails();
  }, [courseIdState]);



  React.useEffect(() => {
    const fetchCourseNotices = async () => {
      if (!courseId) return;

      try {
        setNoticesLoading(true);
        console.log(`Fetching notices for courseId: ${courseId}`);
        
        const noticesResponse = await courseManagementService.getCourseNotices(courseId);
        
        console.log('Notices Response:', {
          success: noticesResponse.success,
          message: noticesResponse.message,
          noticesCount: noticesResponse.notices?.length,
          noticesDetails: JSON.stringify(noticesResponse.notices, null, 2)
        });
        
        // Sort notices by date, most recent first
        const sortedNotices = (noticesResponse.notices || [])
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        
        setNotices(sortedNotices);
        
        // Log any error message if notices fetch was unsuccessful
        if (!noticesResponse.success) {
          toast.warning(noticesResponse.message || 'Could not fetch all notices', {
            description: 'Falling back to default notifications'
          });
        }
      } catch (error) {
        console.error('Comprehensive Error in fetchCourseNotices:', error);
        toast.error('Failed to load course notices', {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      } finally {
        setNoticesLoading(false);
      }
    };

    fetchCourseNotices();
  }, [courseId]);

  // Update the existing course and enrollment logic
  const course = React.useMemo(() => {
    return courseDetails?.course || null;
  }, [courseDetails]);

  const enrollment = React.useMemo(() => {
    // Use the enrollment from courseDetails instead of enrollments
    return courseDetails?.enrollment || null;
  }, [courseDetails]);

  // Debug curriculum
  React.useEffect(() => {
    console.log('Course Object:', course);
  }, [course]);

  // Render Curriculum Section
  const renderCurriculum = () => {
    console.log('Rendering Curriculum - Course:', course);
    
    const curriculumData = 
      course?.curriculum || 
      course?.modules || 
      course?.content || 
      course?.courseContent;

    console.log('Curriculum Data:', curriculumData);

    if (!curriculumData || curriculumData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">No curriculum available yet</p>
          <p className="text-sm text-muted-foreground/70">Check back soon for updates</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {curriculumData.map((module, moduleIndex) => (
          <div key={module.id || moduleIndex} className="group">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{moduleIndex + 1}</span>
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="text-base font-semibold group-hover:text-primary transition-colors truncate">
                  {module.title || module.name || `Module ${moduleIndex + 1}`}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {module.topics?.length || module.lessons?.length || 0} Topics • {module.topics?.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0)} Lessons
                </p>
              </div>
            </div>
            
            {/* Topics and Lessons */}
            {(module.topics || module.lessons || module.content) && (
              <div className="ml-4 pl-8 border-l border-border/50 space-y-3">
                {(module.topics || module.lessons || module.content)?.map((item, itemIndex) => (
                  <div key={item.id || itemIndex} className="relative">
                    <div className="absolute -left-[2.45rem] top-3 h-0.5 w-4 bg-border/50" />
                    
                    <Card className="bg-muted/50 hover:bg-muted/80 transition-colors border-none shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background flex items-center justify-center">
                            <span className="text-xs font-medium">{moduleIndex + 1}.{itemIndex + 1}</span>
                          </div>
                          <h5 className="text-sm font-medium truncate">
                            {item.title || item.name || `Topic ${itemIndex + 1}`}
                          </h5>
                        </div>
                        
                        {item.lessons && item.lessons.length > 0 && (
                          <div className="space-y-1.5 ml-8">
                            {item.lessons.map((lesson, lessonIndex) => (
                              <div 
                                key={lesson.id || lessonIndex}
                                className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <PlayCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-xs truncate">{lesson.title}</span>
                                </div>
                                {lesson.duration && (
                                  <Badge variant="secondary" className="text-[10px] h-5">
                                    {lesson.duration} mins
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // If loading, show preloader
  if (isLoading) {
    return <PagePreloader />;
  }

  // If no course found after loading, show not found
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The course you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/dashboard/academy/my-courses')}>
            Back to My Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main container with mobile-first padding */}
      <div className="flex-1 w-full">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-primary/10 to-background px-4 md:px-6 pt-4 pb-6 md:pt-6 md:pb-8">
          <div className="max-w-[1200px] mx-auto">
            {/* Course Details */}
            <div className="flex flex-col space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
                  {course.category || 'General'}
                </Badge>
                <Badge 
                  variant={enrollment?.status === 'completed' ? "default" : "secondary"}
                  className="px-2.5 py-0.5 text-xs"
                >
                  {enrollment?.status || 'Enrolled'}
                </Badge>
              </div>
              
              <div>
                <h1 className="text-xl md:text-2xl font-bold mb-2">{course.title}</h1>
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
              </div>
              
              {/* Course Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{course.duration_hours} Months</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {enrollment?.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>{course.level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-4 md:px-6 -mt-4">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid gap-3 md:gap-4">
              <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Progress</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{enrollment?.progress || 0}%</p>
                        <Progress value={enrollment?.progress || 0} className="w-24 h-1.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tuition Fee</p>
                      <p className="text-sm font-medium">
                        {formatCurrency(Number(course.price), settings?.default_currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="px-4 md:px-6 mt-6">
          <div className="max-w-[1200px] mx-auto">
            <Tabs defaultValue="content" className="w-full">
              <div className="relative">
                <div className="overflow-x-auto scrollbar-none">
                  <TabsList className="w-full h-10 p-1 bg-muted rounded-lg grid grid-cols-5">
                    <TabsTrigger value="content" className="rounded-md data-[state=active]:bg-background">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden md:inline text-sm">Content</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="rounded-md data-[state=active]:bg-background">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden md:inline text-sm">Schedule</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="notices" className="rounded-md data-[state=active]:bg-background relative">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden md:inline text-sm">Notices</span>
                        {notices.length > 0 && (
                          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-primary rounded-full" />
                        )}
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="exams" className="rounded-md data-[state=active]:bg-background relative">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden md:inline text-sm">Exams</span>
                        {upcomingExamsCount > 0 && (
                          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-primary rounded-full" />
                        )}
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="rounded-md data-[state=active]:bg-background">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="hidden md:inline text-sm">Payment</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-6 space-y-4">
                <TabsContent value="content">
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      {renderCurriculum()}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="schedule">
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <CourseSchedule courseId={courseIdState} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="notices">
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <CourseNotices 
                        courseId={courseIdState} 
                        notices={notices} 
                        loading={noticesLoading} 
                        onNoticeDelete={handleNoticeDelete} 
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="exams">
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <ExamSchedule 
                        courseId={courseIdState} 
                        refreshExams={refreshExams}
                        onUpcomingExamsCountChange={handleUpcomingExamsCountChange}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="payment">
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      {courseIdState && (
                        <PaymentInfo courseId={courseIdState} settings={settings} />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;