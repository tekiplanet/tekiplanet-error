import React from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { 
  Clock, Users, Star, BookOpen, ChevronLeft,
  GraduationCap, Calendar, CheckCircle2, PlayCircle,
  Shield, Award, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';
import { courseService } from '@/services/courseService';
import { settingsService } from '@/services/settingsService';
import { enrollmentService } from '@/services/enrollmentService';
import { InsufficientFundsModal } from "@/components/wallet/InsufficientFundsModal";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Course } from "@/data/mockCourses";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PagePreloader from "@/components/ui/PagePreloader";

interface EnrollmentResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    courseId: string;
    amount: number;
  };
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const user = useAuthStore((state) => state.user);
  const walletBalance = user?.wallet_balance || 0;
  
  // Add settings query at the top with other queries
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.fetchSettings
  });

  // Get enrollment fee from settings
  const ENROLLMENT_FEE = settings?.enrollment_fee || 1000;

  // Fetch course details
  const { 
    data: courseData, 
    isLoading: isCourseLoading, 
    error: courseError 
  } = useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: () => courseService.getCourseDetails(courseId!),
    enabled: !!courseId
  });

  // Extract course and related data
  const course = courseData?.course;
  const instructor = courseData?.instructor;
  const features = courseData?.features;
  const curriculum = courseData?.curriculum;

  // Add debugging logs
  console.log('Course Loading:', isCourseLoading);
  console.log('Course Error:', courseError);
  console.log('Course Data:', courseData);
  console.log('Extracted Course:', course);
  console.log('Extracted Instructor:', instructor);
  console.log('Extracted Features:', features);
  console.log('Extracted Curriculum:', curriculum);
  console.log('Course ID:', courseId);

  const [showInsufficientFundsModal, setShowInsufficientFundsModal] = React.useState(false);
  const [showConfirmEnrollmentModal, setShowConfirmEnrollmentModal] = React.useState(false);

  // Render Curriculum Section
  const renderCurriculum = () => {
    if (!curriculum || curriculum.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">No curriculum available yet</p>
          <p className="text-sm text-muted-foreground/70">Check back soon for updates</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {curriculum.map((module, moduleIndex) => (
          <div key={module.id} className="group">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{moduleIndex + 1}</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {module.topics?.length || 0} Topics • {module.topics?.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0)} Lessons
                </p>
              </div>
            </div>
            
            {module.topics && module.topics.length > 0 && (
              <div className="ml-4 pl-8 border-l border-border/50 space-y-6">
                {module.topics.map((topic, topicIndex) => (
                  <div key={topic.id} className="relative">
                    <div className="absolute -left-[2.45rem] top-3 h-0.5 w-4 bg-border/50" />
                    
                    <Card className="bg-muted/50 hover:bg-muted/80 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background flex items-center justify-center">
                            <span className="text-xs font-medium">{moduleIndex + 1}.{topicIndex + 1}</span>
                          </div>
                          <h4 className="font-medium">{topic.title}</h4>
                        </div>
                        
                        {topic.lessons && topic.lessons.length > 0 && (
                          <div className="space-y-2 ml-9">
                            {topic.lessons.map((lesson, lessonIndex) => (
                              <div 
                                key={lesson.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {lesson.duration || '10'} mins
                                </Badge>
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

  const renderInstructor = () => {
    if (!course || !course.instructor) {
      return (
        <div className="text-center text-muted-foreground">
          No instructor information available.
        </div>
      );
    }

    const { first_name, last_name, bio, avatar } = course.instructor;
    const fullName = `${first_name} ${last_name}`;

    return (
      <div className="flex flex-col items-center space-y-4 p-6">
        <Avatar className="w-24 h-24">
          <AvatarImage 
            src={avatar || '/default-avatar.png'} 
            alt={fullName} 
          />
          <AvatarFallback>
            {first_name[0]}{last_name[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="text-center">
          <h3 className="text-xl font-bold">{fullName}</h3>
          <p className="text-muted-foreground text-sm mt-2">
            {bio || 'No bio available'}
          </p>
        </div>
      </div>
    );
  };

  if (isCourseLoading) {
    return <PagePreloader />;
  }

  if (courseError || !courseData?.course) {
    console.error('Course Error Details:', courseError);
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-2xl text-muted-foreground mb-4">Course Not Found</p>
        <p className="text-muted-foreground mb-6">
          The course you are looking for might have been removed or is temporarily unavailable.
        </p>
        <Button onClick={() => navigate('/dashboard/academy')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  const handleConfirmEnrollment = async () => {
    if (!user || !course) {
      toast.error('Please log in to enroll');
      return;
    }

    // Check wallet balance first
    if (walletBalance < ENROLLMENT_FEE) {
      setShowInsufficientFundsModal(true);
      return;
    }

    // Check if already enrolled
    try {
      const existingEnrollments = await enrollmentService.getUserEnrollments();
      const isAlreadyEnrolled = existingEnrollments.some(
        enrollment => enrollment.course_id === courseId
      );

      if (isAlreadyEnrolled) {
        toast.info('You are already enrolled in this course', {
          description: 'Continue learning in My Courses'
        });
        setShowConfirmEnrollmentModal(false);
        return;
      }
    } catch (error) {
      console.error('Error checking existing enrollments:', error);
    }

    // Proceed with enrollment
    setLoading(true);
    try {
      const response: EnrollmentResponse = await enrollmentService.enrollInCourse(courseId!);

      if (response.success) {
        // Deduct enrollment fee from wallet
        const { deductBalance } = useWalletStore.getState();
        deductBalance(user.id, ENROLLMENT_FEE);

        toast.success('Course Enrollment Successful!', {
          description: `You are now enrolled in ${course.title}`
        });

        // Navigate to My Courses
        navigate('/dashboard/academy/my-courses');
      } else {
        toast.error(response.message || 'Enrollment failed');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('An unexpected error occurred during enrollment');
    } finally {
      setLoading(false);
      setShowConfirmEnrollmentModal(false);
    }
  };

  const handleEnroll = () => {
    if (!user) {
      toast.error('Please log in to enroll');
      return;
    }

    if (walletBalance < ENROLLMENT_FEE) {
      setShowInsufficientFundsModal(true);
      return;
    }

    // Show confirmation modal instead of directly enrolling
    setShowConfirmEnrollmentModal(true);
  };

  const handleFundWallet = () => {
    setShowInsufficientFundsModal(false);
    navigate('/dashboard/wallet');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pt-4 md:pt-8">
        <div className="container mx-auto px-0 md:px-4">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8 pb-8 md:py-12">
            {/* Image Container */}
            <div className="relative aspect-video md:aspect-[16/9] w-full rounded-xl overflow-hidden group">
              <div className="relative h-full">
                <img 
                  src={course?.image_url || '/placeholder-course.jpg'} 
                  alt={course?.title}
                  className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                
                {/* Overlay Content for Mobile */}
                <div className="absolute inset-x-0 bottom-0 p-4 md:hidden">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                      {course.category}
                    </Badge>
                    <Badge 
                      variant={
                        course.level === "Beginner" ? "default" :
                        course.level === "Intermediate" ? "secondary" : 
                        "destructive"
                      }
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                    >
                      {course.level}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1 line-clamp-2">{course.title}</h1>
                  <div className="flex items-center gap-4 text-white/90">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{course.duration_hours} Months</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm">{course.average_rating || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  size="icon"
                  variant="ghost"
                  className="absolute top-4 right-4 text-white hover:text-primary hover:scale-110 transition-all duration-300 md:bottom-4 md:top-auto"
                >
                  <PlayCircle className="h-8 w-8 md:h-10 md:w-10" />
                </Button>
              </div>
            </div>

            {/* Course Info - Hidden on Mobile */}
            <div className="hidden md:block space-y-6 md:py-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary" className="px-3 py-1">
                    {course.category}
                  </Badge>
                  <Badge 
                    variant={
                      course.level === "Beginner" ? "default" :
                      course.level === "Intermediate" ? "secondary" : 
                      "destructive"
                    }
                    className="px-3 py-1"
                  >
                    {course.level}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{course.title}</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {course.description}
                </p>
              </div>
              {/* Rest of desktop course info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{course.duration_hours} Months</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="font-semibold">{course.students_count || 0}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-semibold">{course.average_rating || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="font-semibold">{course.level}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Course Description */}
            <div className="md:hidden px-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50">
                    <Users className="h-4 w-4 text-primary" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Students</p>
                      <p className="text-sm font-semibold">{course.students_count || 0}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-sm font-semibold">{course.level}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Enrollment Card */}
                <Card className="bg-card/50 backdrop-blur-sm border-none shadow-lg">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-primary">{formatCurrency(course.price, settings?.default_currency)}</h2>
                          <p className="text-xs text-muted-foreground">Tuition Fee</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Enrollment Fee</p>
                          <p className="text-sm font-medium">{formatCurrency(ENROLLMENT_FEE, settings?.default_currency)}</p>
                        </div>
                      </div>
                      <Button 
                        className="w-full text-white font-medium rounded-xl h-11"
                        onClick={handleEnroll}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          "Enroll Now"
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Wallet Balance: {formatCurrency(walletBalance, settings?.default_currency)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid gap-8 md:grid-cols-[1fr,320px]">
          <div className="space-y-8">
            {/* Course Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="w-full justify-start p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                <TabsTrigger value="curriculum" className="rounded-lg">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor" className="rounded-lg">Instructor</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Online Learning</h3>
                        <p className="text-sm text-muted-foreground">
                          Learn at your own pace
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Lifetime Access</h3>
                        <p className="text-sm text-muted-foreground">
                          Learn on your schedule
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Certificate</h3>
                        <p className="text-sm text-muted-foreground">
                          Upon completion
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">What you'll learn</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(course.features?.length ? course.features : [
                      "Comprehensive understanding of core concepts",
                      "Practical skills through hands-on projects",
                      "Industry-relevant techniques and best practices",
                      "Professional tools and technologies",
                      "Problem-solving and critical thinking skills",
                      "Preparation for real-world challenges"
                    ])?.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="curriculum">
                {renderCurriculum()}
              </TabsContent>

              <TabsContent value="instructor">
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    {renderInstructor()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Enrollment Card for Desktop */}
          <div className="hidden md:block">
            <Card className="sticky top-6 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-primary">{formatCurrency(course.price, settings?.default_currency)}</h2>
                  <p className="text-sm text-muted-foreground">Tuition Fee</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enrollment Fee:</span>
                    <span className="font-medium">{formatCurrency(ENROLLMENT_FEE, settings?.default_currency)}</span>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full h-12 rounded-xl font-medium"
                    onClick={() => setShowConfirmEnrollmentModal(true)}
                    disabled={loading}
                  >
                    {loading ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Wallet Balance: {formatCurrency(walletBalance, settings?.default_currency)}
                  </p>
                </div>
                <Separator className="bg-border/50" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-sm">Start Learning Today</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm">Self-paced Learning</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-sm">24/7 Course Access</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enrollment Confirmation Modal */}
      <Dialog open={showConfirmEnrollmentModal} onOpenChange={setShowConfirmEnrollmentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Enrollment</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                Are you sure you want to enroll in <span className="font-medium text-foreground">{course.title}</span>?
              </p>
              <div className="p-3 rounded-lg bg-muted/50 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Enrollment Fee:</span>
                <span className="font-medium">{formatCurrency(ENROLLMENT_FEE, settings?.default_currency)}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmEnrollmentModal(false)}
              disabled={loading}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmEnrollment} 
              disabled={loading}
              className="rounded-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling...</span>
                </div>
              ) : (
                'Confirm Enrollment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InsufficientFundsModal
        open={showInsufficientFundsModal}
        onClose={() => setShowInsufficientFundsModal(false)}
        onFundWallet={handleFundWallet}
        requiredAmount={ENROLLMENT_FEE}
        currentBalance={walletBalance}
        type="enrollment"
      />
    </div>
  );
}