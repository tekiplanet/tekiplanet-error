<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CourseCertificate extends Model
{
    use HasFactory, SoftDeletes, HasUuids;

    protected $fillable = [
        'user_id',
        'course_id',
        'enrollment_id',
        'title',
        'grade',
        'credential_id',
        'skills',
        'featured',
        'issue_date',
    ];

    protected $casts = [
        'skills' => 'array',
        'featured' => 'boolean',
        'issue_date' => 'datetime',
    ];

    /**
     * Get the user that owns the certificate.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the course associated with the certificate.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the enrollment associated with the certificate.
     */
    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * Generate a unique credential ID.
     */
    public static function generateCredentialId(string $courseCode): string
    {
        $prefix = strtoupper(substr($courseCode, 0, 2));
        $year = date('Y');
        $random = strtoupper(substr(uniqid(), -4));
        return "{$prefix}-{$year}-{$random}";
    }
} 