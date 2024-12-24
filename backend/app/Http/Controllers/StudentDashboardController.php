<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\CourseSchedule;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StudentDashboardController extends Controller
{
    public function getDashboardData()
    {
        try {
            $user = Auth::user();
            
            // Get enrollments with course and schedule data
            $enrollments = Enrollment::with(['course.schedules', 'course.instructor'])
                ->where('user_id', $user->id)
                ->get();

            // Calculate achievements (completed courses)
            $achievements = $enrollments->where('progress', 100)->count();

            // Calculate overall progress
            $totalProgress = $enrollments->count() > 0
                ? round($enrollments->avg('progress'))
                : 0;

            // Get courses for the slider
            $coursesForDisplay = $enrollments->count() > 0
                ? $enrollments->take(2)->map(function ($enrollment) {
                    $nextClass = $this->getNextClassSchedule($enrollment->course);
                    $totalLessons = $enrollment->course->modules->sum(function($module) {
                        return $module->lessons->count();
                    });
                    return [
                        'id' => $enrollment->course->id,
                        'title' => $enrollment->course->title,
                        'progress' => $enrollment->progress,
                        'nextClass' => $nextClass ? $this->formatNextClass($nextClass) : null,
                        'image' => $enrollment->course->image_url,
                        'instructor' => $enrollment->course->instructor?->full_name ?? 'Unknown Instructor',
                        'lessons_count' => $totalLessons,
                        'level' => $enrollment->course->level
                    ];
                })
                : Course::with(['instructor', 'modules.lessons'])->inRandomOrder()->take(5)->get()->map(function ($course) {
                    $nextClass = $this->getNextClassSchedule($course);
                    $totalLessons = $course->modules->sum(function($module) {
                        return $module->lessons->count();
                    });
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'rating' => $course->rating ?? 0,
                        'total_students' => $course->total_students ?? 0,
                        'nextClass' => $nextClass ? $this->formatNextClass($nextClass) : null,
                        'image' => $course->image_url,
                        'instructor' => $course->instructor?->full_name ?? 'Unknown Instructor',
                        'lessons_count' => $totalLessons,
                        'level' => $course->level
                    ];
                });

            // Get currency settings
            $settings = Setting::first();
            $currency = [
                'code' => $settings ? $settings->default_currency : 'USD',
                'symbol' => $settings ? $settings->currency_symbol : '$'
            ];

            return response()->json([
                'user' => [
                    'first_name' => $user->first_name,
                    'wallet_balance' => $user->wallet_balance
                ],
                'currency' => $currency,
                'statistics' => [
                    'achievements' => $achievements,
                    'enrolled_courses' => $enrollments->count(),
                    'overall_progress' => $totalProgress
                ],
                'courses' => $coursesForDisplay,
                'has_enrollments' => $enrollments->count() > 0
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching student dashboard data:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch dashboard data'
            ], 500);
        }
    }

    private function getNextClassSchedule($course)
    {
        return $course->schedules()
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->where(function ($query) {
                $today = now();
                $dayOfWeek = $today->dayOfWeek;
                $currentTime = $today->format('H:i:s');
                
                $query->whereRaw("FIND_IN_SET(?, days_of_week)", [$dayOfWeek])
                    ->where('start_time', '>', $currentTime)
                    ->orWhereRaw("FIND_IN_SET(?, days_of_week)", [($dayOfWeek + 1) % 7]);
            })
            ->orderBy('start_date')
            ->orderBy('start_time')
            ->first();
    }

    private function formatNextClass($schedule)
    {
        $today = now();
        $tomorrow = now()->addDay();
        
        if ($schedule->start_date->isSameDay($today)) {
            return "Today at " . Carbon::parse($schedule->start_time)->format('g:i A');
        } elseif ($schedule->start_date->isSameDay($tomorrow)) {
            return "Tomorrow at " . Carbon::parse($schedule->start_time)->format('g:i A');
        } else {
            return $schedule->start_date->format('M d') . " at " . Carbon::parse($schedule->start_time)->format('g:i A');
        }
    }
} 