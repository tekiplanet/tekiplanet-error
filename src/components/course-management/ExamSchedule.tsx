import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, FileText, Timer, Calendar, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { format } from 'date-fns';
import { enrollmentService } from "@/services/enrollmentService";
import { toast } from 'sonner';

// Define interface for exam data
interface Exam {
    id: string;
    title: string;
    type: 'quiz' | 'midterm' | 'final' | 'assignment';
    date: Date | string;
    duration: string;
    userExamStatus: string;
    score?: number;
    totalScore?: number;
    total_score?: number;
    pass_percentage?: number;
    passing_score?: number;
    instructions?: string;
    topics?: string[] | string | null;
    attempts?: number;
}

interface ExamScheduleProps {
    courseId?: string;
    refreshExams?: () => void;
    onUpcomingExamsCountChange?: (count: number) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'green';
        case 'in_progress': return 'blue';
        case 'missed': return 'red';
        case 'not_started': return 'gray';
        default: return 'gray';
    }
};

const ExamSchedule: React.FC<ExamScheduleProps> = ({ 
    courseId, 
    refreshExams, 
    onUpcomingExamsCountChange 
}) => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [participatingExamId, setParticipatingExamId] = useState<string | null>(null);

    // Helper function to parse topics
    const parseTopics = (topics: string[] | string | null): string[] => {
        if (Array.isArray(topics)) return topics;
        if (typeof topics === 'string') {
            try {
                // Try parsing as JSON
                const parsedTopics = JSON.parse(topics);
                return Array.isArray(parsedTopics) ? parsedTopics : [];
            } catch {
                // If not JSON, split by comma or return as single-item array
                return topics.includes(',') ? topics.split(',').map(t => t.trim()) : [topics];
            }
        }
        return [];
    };

    // Helper function to determine if an exam is missed
    const isExamMissed = (exam: Exam): boolean => {
        // If exam date is not set, it can't be missed
        if (!exam.date) return false;

        const now = new Date();
        const examDate = new Date(exam.date);

        // Check if the exam date has passed
        return examDate < now && 
               // And the user has no existing exam attempt
               (!exam.attempts || exam.attempts === 0) && 
               // And the current status is not already completed or in progress
               exam.userExamStatus !== 'completed' && 
               exam.userExamStatus !== 'in_progress';
    };

    // Helper function to determine if an exam is upcoming
    const isExamUpcoming = (exam: Exam): boolean => {
        // If exam date is not set, it can't be upcoming
        if (!exam.date) return false;

        const now = new Date();
        const examDate = new Date(exam.date);

        // Check if the exam date is in the future
        return examDate > now && 
               // And the user has an existing exam attempt or record
               (exam.attempts && exam.attempts > 0);
    };

    // Helper function to determine if an exam is in progress
    const isExamInProgress = (exam: Exam): boolean => {
        // If exam date is not set, it can't be in progress
        if (!exam.date) return false;

        const now = new Date();
        const examDate = new Date(exam.date);

        // Normalize dates to compare just the date part
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());

        // Check if the exam date is today
        return nowDate.getTime() === examDateOnly.getTime() && 
               // And the user has an existing exam attempt or record
               (exam.attempts && exam.attempts > 0);
    };

    // Helper function to determine if an exam is completed
    const isExamCompleted = (exam: Exam): boolean => {
        // If exam date is not set, it can't be completed
        if (!exam.date) return false;

        const now = new Date();
        const examDate = new Date(exam.date);

        // Normalize dates to compare just the date part
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());

        // Check if the exam date is today or in the past
        return (nowDate.getTime() >= examDateOnly.getTime()) && 
               // And the user has an existing exam attempt
               (exam.attempts && exam.attempts > 0) &&
               // And the current status is already marked as completed
               exam.userExamStatus === 'completed';
    };

    // Helper function to determine the exam score display and color
    const getExamScoreDisplay = (exam: Exam): { 
        score: string, 
        color: string 
    } => {
        // Log the entire exam object for debugging
        console.log('Full Exam Object:', JSON.stringify(exam, null, 2));

        // Normalize dates to compare just the date part
        const now = new Date();
        const examDate = new Date(exam.date);
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());

        // Check if the exam date is today or in the past
        const isExamDatePassed = nowDate.getTime() >= examDateOnly.getTime();




        // Check if the exam is completed or in progress and has attempts
        const isCompletedOrInProgress = 
            (exam.userExamStatus === 'completed' || exam.userExamStatus === 'in_progress') && 
            exam.attempts && 
            exam.attempts > 0;

            const isExamToday = nowDate.getTime() === examDateOnly.getTime();


            // Detailed logging to understand exam state
            console.log('Exam Score Display Debug:', {
                examTitle: exam.title,
                examDate: exam.date,
                isExamDatePassed: isExamDatePassed,
                userExamStatus: exam.userExamStatus,
                score: exam.score,
                scoreType: typeof exam.score
            });           


            if (
                (isExamDatePassed || isExamToday) && 
                exam.userExamStatus === 'completed' && 
                (exam.score === null || 
                 exam.score === undefined || 
                 exam.score === "Awaiting result")
            ) {
                return {
                    score: "Awaiting Result", 
                    color: "text-yellow-600"
                };
            }   

        // If exam is past or today, completed or in progress, and has attempts
        if (isExamDatePassed && isCompletedOrInProgress) {


            if (exam.userExamStatus === 'in_progress' && isExamDatePassed) {
                return { 
                    score: "", 
                    color: "text-gray-500" 
                };
            }

            // Parse score if it's a string like "50 / 100"
            let userScore = 0;
            let totalScore = 0;
      

            if (typeof exam.score === 'string' && exam.score.includes('/')) {
                const [scoreStr, totalStr] = exam.score.split('/').map(s => s.trim());
                userScore = parseFloat(scoreStr);
                totalScore = parseFloat(totalStr);
            } else if (typeof exam.score === 'number') {
                userScore = exam.score;
                totalScore = exam.totalScore ?? exam.total_score ?? 100; // default to 100 if not provided
            }

            // Detailed console log for debugging
            console.log('Exam Score Parsing Details:', {
                originalScore: exam.score,
                userScore,
                totalScore,
                passPercentage: exam.pass_percentage,
                passPercentageType: typeof exam.pass_percentage,
                passPercentageExists: exam.pass_percentage !== undefined,
                userExamStatus: exam.userExamStatus
            });
            
            // Determine score color and status based on pass percentage
            let color = "text-green-600"; // default to green
            let status = "Passed"; // default status
            
            if (exam.pass_percentage != null) {
                // Calculate score percentage
                const scorePercentage = totalScore ? (userScore / totalScore) * 100 : 0;
                
                // Convert pass_percentage to a number if it's a string
                const passingThreshold = typeof exam.pass_percentage === 'string' 
                    ? parseFloat(exam.pass_percentage) 
                    : exam.pass_percentage;
                
                // Additional console log for percentage calculation
                console.log('Score Percentage Calculation:', {
                    scorePercentage,
                    passPercentage: passingThreshold,
                    comparisonResult: scorePercentage < passingThreshold
                });

                if (scorePercentage < passingThreshold) {
                    color = "text-red-600"; // red if below passing percentage
                    status = "Failed"; // update status
                }
            }

            // Return the score display with status
            return { 
                score: `${userScore} / ${totalScore} (${status})`, 
                color 
            };
        }

        // Default case: no score to display
        return { 
            score: "—", 
            color: "text-gray-500" 
        };
    };

    // Helper function to format status text
    const formatStatusText = (status: string) => {
        return status.replace(/_/g, ' ');
    };

    useEffect(() => {
        const fetchExams = async () => {
            if (!courseId) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await enrollmentService.getCourseExams(courseId);
                
                // Defensive checks to ensure we have an array
                const fetchedExams = Array.isArray(response) 
                    ? response 
                    : response.data 
                    ? (Array.isArray(response.data) ? response.data : [])
                    : [];

                // Transform exams to ensure topics is always an array
                // And update status for missed, upcoming, in_progress, and completed exams
                const transformedExams = fetchedExams.map(exam => {
                    const transformedExam = {
                        ...exam,
                        // Ensure date is a valid Date object
                        date: exam.date ? new Date(exam.date) : new Date(),
                        // Parse topics safely
                        topics: parseTopics(exam.topics)
                    };

                    // Normalize dates to compare just the date part
                    const now = new Date();
                    const examDate = new Date(transformedExam.date);
                    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());

                    // Check if the exam date is today
                    const isExamToday = nowDate.getTime() === examDateOnly.getTime();

                    // Prioritize completed status if exam is today and has completed status
                    if (isExamToday && transformedExam.userExamStatus === 'completed') {
                        transformedExam.userExamStatus = 'completed';
                    }
                    // Update status to missed if applicable
                    else if (isExamMissed(transformedExam)) {
                        transformedExam.userExamStatus = 'missed';
                    } 
                    // Update status to upcoming if applicable
                    else if (isExamUpcoming(transformedExam)) {
                        transformedExam.userExamStatus = 'upcoming';
                    }
                    // Update status to in_progress if applicable
                    else if (isExamInProgress(transformedExam)) {
                        transformedExam.userExamStatus = 'in_progress';
                    }

                    return transformedExam;
                }).filter(exam => exam.id); // Remove any invalid exams

                setExams(transformedExams);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch exams:', error);
                setIsLoading(false);
                toast.error('Error Loading Exams', {
                    description: 'Failed to load exams for this course'
                });
                // Set exams to empty array to prevent further errors
                setExams([]);
            }
        };

        fetchExams();
    }, [courseId]);

    // Log exams when they are set
    React.useEffect(() => {
        console.log('Raw Exams Data:', {
            exams: exams.map(exam => ({
                title: exam.title,
                date: exam.date,
                userExamStatus: exam.userExamStatus,
                fullExamObject: exam
            }))
        });
    }, [exams]);

    const handleParticipate = async (examId: string) => {
        if (!courseId) return;

        try {
            setParticipatingExamId(examId);
            
            // Start exam participation
            await enrollmentService.startExamParticipation(courseId, examId);
            
            // Show success toast
            toast.success('Exam Started', {
                description: 'You have successfully started the exam.'
            });

            // Refresh exams to update status
            if (refreshExams) {
                refreshExams();
            }
        } catch (err: any) {
            // Show error toast
            toast.error('Error Starting Exam', {
                description: err.response?.data?.message || 'Failed to start exam'
            });
        } finally {
            setParticipatingExamId(null);
        }
    };

    // Count upcoming exams
    const upcomingExamsCount = useMemo(() => {
        const now = new Date();
        const count = exams.filter(exam => {
            // Ensure date is parsed correctly
            const examDate = new Date(exam.date);
            const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Detailed logging for debugging
            console.log('Exam Details for Upcoming Count:', {
                examTitle: exam.title,
                examDate: examDate.toISOString(),
                nowDate: nowDate.toISOString(),
                isDateFuture: examDate >= nowDate,
                rawDate: exam.date,
                parsedExamDate: examDate,
                parsedNowDate: nowDate
            });

            // Check if exam date is today or in the future
            return examDate >= nowDate && 
            exam.userExamStatus !== 'completed' && 
            exam.userExamStatus !== 'in_progress';
        });

        // Detailed logging of filtered exams
        console.log('Upcoming Exams Details:', {
            totalExams: exams.length,
            upcomingExamsCount: count.length,
            upcomingExams: count.map(exam => ({
                title: exam.title,
                date: exam.date
            }))
        });

        // Call the callback to pass the count to parent
        if (onUpcomingExamsCountChange) {
            onUpcomingExamsCountChange(count.length);
        }

        return count.length;
    }, [exams, onUpcomingExamsCountChange]);

    // Prepare notification badge
    const hasUpcomingExams = upcomingExamsCount > 0;

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-l-primary animate-spin" />
                <p className="text-sm text-muted-foreground mt-4">Loading exams...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold">Failed to Load Exams</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    // Empty state
    if (exams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Exams Scheduled</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Check back later for upcoming exams
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Course Exams</h2>
                    <p className="text-sm text-muted-foreground">
                        {upcomingExamsCount > 0 
                            ? `You have ${upcomingExamsCount} upcoming exam${upcomingExamsCount > 1 ? 's' : ''}`
                            : 'No upcoming exams at the moment'}
                    </p>
                </div>
                {hasUpcomingExams && (
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        {upcomingExamsCount} Upcoming
                    </Badge>
                )}
            </div>

            {/* Exams Grid */}
            <div className="grid gap-4">
                {exams.map((exam) => (
                    <Card 
                        key={exam.id}
                        className={`group overflow-hidden transition-all duration-200 hover:shadow-md ${
                            exam.userExamStatus === 'not_started' ? 'bg-primary/5' : ''
                        } border-none shadow-sm`}
                    >
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col gap-4">
                                {/* Title and Participate Button */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <h3 className="font-medium text-base md:text-lg truncate group-hover:text-primary transition-colors">
                                            {exam.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{exam.date ? format(exam.date, 'MMM dd, yyyy') : 'Not scheduled'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{exam.duration}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {exam.userExamStatus === 'not_started' && (
                                        <Button 
                                            variant="secondary"
                                            size="sm" 
                                            className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                                            onClick={() => handleParticipate(exam.id)}
                                            disabled={participatingExamId === exam.id}
                                        >
                                            {participatingExamId === exam.id ? (
                                                <>
                                                    <Timer className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                                    Starting...
                                                </>
                                            ) : (
                                                'Participate'
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {/* Topics */}
                                {exam.topics && exam.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {exam.topics.map((topic, index) => (
                                            <Badge 
                                                key={index} 
                                                variant="outline" 
                                                className="text-[10px] md:text-xs border-primary/20 text-primary"
                                            >
                                                {topic}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Status and Score */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge 
                                        className={`capitalize text-[10px] md:text-xs ${
                                            exam.userExamStatus === 'missed' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                            exam.userExamStatus === 'upcoming' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
                                            exam.userExamStatus === 'not_started' ? 'bg-primary/10 text-primary border-primary/20' :
                                            exam.userExamStatus === 'completed' ? 'bg-green-500/10 text-green-700 border-green-200' :
                                            exam.userExamStatus === 'in_progress' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-200' :
                                            'bg-muted/50 text-muted-foreground border-muted'
                                        }`}
                                    >
                                        {formatStatusText(exam.userExamStatus)}
                                    </Badge>

                                    {((new Date().getTime() >= new Date(exam.date).getTime()) && 
                                    (exam.userExamStatus === 'completed' || exam.userExamStatus === 'in_progress') && 
                                    exam.attempts && 
                                    exam.attempts > 0) && (
                                        <div className="text-xs md:text-sm">
                                            {getExamScoreDisplay(exam).score !== "" && (
                                                <Badge 
                                                    variant="outline" 
                                                    className={`${getExamScoreDisplay(exam).color} border-current/20 bg-current/5`}
                                                >
                                                    Score: {getExamScoreDisplay(exam).score}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ExamSchedule;