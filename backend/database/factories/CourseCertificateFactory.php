<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Models\CourseCertificate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseCertificate>
 */
class CourseCertificateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-'];
        $skills = [
            ['HTML', 'CSS', 'JavaScript', 'React'],
            ['Python', 'Data Analysis', 'Machine Learning'],
            ['UI Design', 'User Research', 'Figma'],
            ['SEO', 'Social Media', 'Content Marketing']
        ];

        return [
            'title' => fake()->sentence(3),
            'grade' => fake()->randomElement($grades),
            'credential_id' => CourseCertificate::generateCredentialId('CS'),
            'skills' => fake()->randomElement($skills),
            'featured' => fake()->boolean(20), // 20% chance of being featured
            'issue_date' => fake()->dateTimeBetween('-1 year', 'now'),
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure()
    {
        return $this->afterMaking(function (CourseCertificate $certificate) {
            //
        })->afterCreating(function (CourseCertificate $certificate) {
            //
        });
    }
} 