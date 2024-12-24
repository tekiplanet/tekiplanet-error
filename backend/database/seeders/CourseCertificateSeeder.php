<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Models\CourseCertificate;
use Illuminate\Database\Seeder;

class CourseCertificateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all completed enrollments
        $completedEnrollments = Enrollment::where('progress', 100)->get();

        foreach ($completedEnrollments as $enrollment) {
            CourseCertificate::factory()->create([
                'user_id' => $enrollment->user_id,
                'course_id' => $enrollment->course_id,
                'enrollment_id' => $enrollment->id,
                'title' => $enrollment->course->title,
                'issue_date' => $enrollment->updated_at,
            ]);
        }
    }
} 