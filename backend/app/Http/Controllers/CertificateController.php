<?php

namespace App\Http\Controllers;

use App\Models\CourseCertificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Log;

class CertificateController extends Controller
{
    /**
     * Get user's certificates with course and instructor details
     */
    public function getUserCertificates(Request $request)
    {
        try {
            $certificates = CourseCertificate::with(['course', 'course.instructor'])
                ->where('user_id', Auth::id())
                ->latest('issue_date')
                ->get()
                ->map(function ($certificate) {
                    return [
                        'id' => $certificate->id,
                        'title' => $certificate->title,
                        'issue_date' => $certificate->issue_date->toISOString(),
                        'image' => $certificate->course->image_url ?? null,
                        'grade' => $certificate->grade,
                        'instructor' => $certificate->course->instructor->full_name ?? 'Unknown Instructor',
                        'credential_id' => $certificate->credential_id,
                        'skills' => $certificate->skills,
                        'featured' => $certificate->featured
                    ];
                });

            $stats = [
                'total' => $certificates->count(),
                'featured' => $certificates->where('featured', true)->count(),
                'top_grades' => $certificates->whereIn('grade', ['A+', 'A'])->count(),
                'total_skills' => $certificates->pluck('skills')->flatten()->unique()->count()
            ];

            return response()->json([
                'certificates' => $certificates,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch certificates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle featured status of a certificate
     */
    public function toggleFeatured(Request $request, string $id)
    {
        try {
            $certificate = CourseCertificate::where('user_id', Auth::id())
                ->findOrFail($id);

            $certificate->featured = !$certificate->featured;
            $certificate->save();

            return response()->json([
                'message' => 'Certificate featured status updated',
                'featured' => $certificate->featured
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update certificate',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download certificate
     */
    public function download(Request $request, string $id)
    {
        try {
            // Fetch certificate with relationships
            $certificate = CourseCertificate::where('user_id', Auth::id())
                ->with(['course', 'user', 'course.instructor'])
                ->findOrFail($id);

            // Generate verification URL
            $verificationUrl = url("/verify/certificate/{$certificate->credential_id}");

            // Generate QR code as SVG
            $qrCode = QrCode::size(100)
                ->style('square')
                ->eye('square')
                ->format('svg')
                ->generate($verificationUrl);

            // Generate PDF
            $pdf = PDF::loadView('pdfs.certificate', [
                'certificate' => $certificate,
                'user' => $certificate->user,
                'course' => $certificate->course,
                'instructor' => $certificate->course->instructor,
                'qrCode' => $qrCode,
                'qrData' => $verificationUrl
            ]);

            // Set paper size and orientation
            $pdf->setPaper('A4', 'landscape');

            // Return the PDF for download
            return $pdf->download("certificate-{$certificate->credential_id}.pdf");

        } catch (\Exception $e) {
            Log::error('Certificate download failed', [
                'error' => $e->getMessage(),
                'certificate_id' => $id,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'message' => 'Failed to generate certificate',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 