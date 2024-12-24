import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, Users } from "lucide-react";
import { courseManagementService } from "@/services/courseManagementService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ClassSession {
  id: string;
  title: string;
  type: 'lecture' | 'practical' | 'workshop' | 'tutorial';
  date: Date;
  duration: string;
  instructor: string;
  location: 'online' | 'physical';
  meetingLink?: string;
}

export default function CourseSchedule({ courseId }: { courseId?: string }) {
  const [schedules, setSchedules] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [nextClass, setNextClass] = useState<ClassSession | null>(null);
  const [classDates, setClassDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>();

  useEffect(() => {
    const fetchCourseSchedule = async () => {
      if (!courseId) {
        toast.error("No course ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const courseDetails = await courseManagementService.getCourseDetails(courseId);
        
        // Log the raw course details
        console.log('Raw Course Details:', courseDetails);
        console.log('Schedules:', courseDetails.schedules);
        
        // Flexible schedule transformation
        const transformedSchedules: ClassSession[] = [];
        const allClassDates: Date[] = []; // To store all class dates for calendar

        // Check different possible schedule sources
        const scheduleSources = [
          courseDetails.schedules,
          courseDetails.course?.schedules
        ];

        // Day mapping for string days to numbers
        const dayMap: {[key: string]: number} = {
          'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 
          'Thu': 4, 'Fri': 5, 'Sat': 6
        };

        // Counter to ensure unique keys
        let sessionCounter = 0;

        scheduleSources.forEach(scheduleSource => {
          if (Array.isArray(scheduleSource)) {
            scheduleSource.forEach(schedule => {
              // Log each schedule for debugging
              console.log('Processing Schedule:', schedule);

              // Parse days of week
              const daysOfWeek = schedule.days_of_week 
                ? schedule.days_of_week.split(',').map(day => dayMap[day.trim()] || -1)
                : [];

              // Generate sessions for each day in the date range
              const startDate = new Date(schedule.start_date);
              const endDate = new Date(schedule.end_date);
              const currentDate = new Date(startDate);

              while (currentDate <= endDate) {
                // Check if current day is in the days of week
                if (daysOfWeek.includes(currentDate.getDay())) {
                  // Parse start and end times
                  const [startHour, startMinute] = (schedule.start_time || '00:00').split(':').map(Number);
                  const [endHour, endMinute] = (schedule.end_time || '01:00').split(':').map(Number);

                  // Create session date
                  const sessionDate = new Date(currentDate);
                  sessionDate.setHours(startHour, startMinute, 0, 0);

                  const session: ClassSession = {
                    // Ensure unique key by adding an incremental counter
                    id: `${schedule.id}-${sessionDate.toISOString()}-${sessionCounter++}`,
                    title: `${schedule.course?.title || 'Course Session'} - ${schedule.location || 'Location TBA'}`,
                    type: 'lecture',
                    date: sessionDate,
                    duration: `${endHour - startHour} hours`,
                    instructor: schedule.course?.instructor?.name || 'TBA',
                    location: schedule.location || 'online',
                    meetingLink: schedule.meeting_link
                  };

                  transformedSchedules.push(session);
                  
                  // Store the date for calendar highlighting
                  allClassDates.push(new Date(sessionDate));
                }

                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
              }
            });
          }
        });

        // Log the transformed schedules
        console.log('Transformed Schedules:', transformedSchedules);

        // Sort schedules by date
        const sortedSchedules = transformedSchedules.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Find the next upcoming class
        const upcomingClass = sortedSchedules.find(session => session.date > new Date());
        console.log('Next Upcoming Class:', upcomingClass);
        setNextClass(upcomingClass || null);

        // Only set the next upcoming class as the schedule
        setSchedules(upcomingClass ? [upcomingClass] : []);
        
        // Set all class dates for calendar highlighting
        setClassDates(allClassDates);
        
        // Set selected date to the next class date if available
        if (upcomingClass) {
          setSelectedDate(upcomingClass.date);
          // Set the calendar month to the month of the next class
          setCalendarMonth(upcomingClass.date);
        }
      } catch (error) {
        console.error("Error fetching course schedule:", error);
        toast.error("Failed to load course schedule");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseSchedule();
  }, [courseId]);

  // Function to check if a date has classes
  const isDayWithClass = (day: Date) => {
    return classDates.some(classDate => 
      classDate.toDateString() === day.toDateString()
    );
  };

  // Function to check if a date is the next class date
  const isNextClassDate = (day: Date) => {
    return nextClass && day.toDateString() === nextClass.date.toDateString();
  };

  // Function to check if a date is a past class date
  const isPastClassDate = (day: Date) => {
    return classDates.some(classDate => 
      classDate.toDateString() === day.toDateString() && classDate < new Date()
    );
  };

  // Prepare calendar modifiers
  const calendarModifiers = {
    hasClass: isDayWithClass,
    nextClass: isNextClassDate,
    pastClass: isPastClassDate
  };

  const calendarModifiersStyles = {
    hasClass: {
      backgroundColor: "rgba(var(--primary-rgb), 0.1)",
      color: "hsl(var(--primary))"
    },
    nextClass: {
      backgroundColor: "hsl(var(--primary))",
      color: "white",
      borderRadius: "50%",
      fontWeight: "bold"
    },
    pastClass: {
      color: "hsl(var(--muted-foreground))",
      opacity: 0.5
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground animate-pulse">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Loading Schedule...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Class Highlight */}
      {nextClass && (
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-none shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-primary/10 text-primary">Next Class</Badge>
                <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/20">
                  {nextClass.type}
                </Badge>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{nextClass.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 rounded-md p-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span>
                      {nextClass.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 rounded-md p-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      {nextClass.date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 rounded-md p-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{nextClass.instructor}</span>
                  </div>
                </div>
              </div>

              {nextClass.location === 'online' && nextClass.meetingLink && (
                <Button 
                  variant="secondary" 
                  className="w-full sm:w-auto bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={() => window.open(nextClass.meetingLink, '_blank')}
                >
                  Join Meeting
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar and Schedule Grid */}
      <div className="grid md:grid-cols-[300px] gap-6 md:ml-auto">
        {/* Calendar - now sticky on desktop */}
        <Card className="order-1 md:order-2 border-none shadow-sm w-full max-w-full overflow-hidden">
          <CardContent className="p-3">
            <div className="overflow-x-auto">
              <div className="w-full max-w-[280px] mx-auto">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  onSelect={setSelectedDate}
                  modifiers={calendarModifiers}
                  modifiersStyles={calendarModifiersStyles}
                  className="rounded-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}