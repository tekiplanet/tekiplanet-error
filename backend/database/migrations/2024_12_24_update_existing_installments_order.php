<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Installment;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all enrollments with installments
        $enrollments = DB::table('installments')
            ->select('enrollment_id')
            ->distinct()
            ->get();

        foreach ($enrollments as $enrollment) {
            // Get installments for this enrollment ordered by due date
            $installments = Installment::where('enrollment_id', $enrollment->enrollment_id)
                ->orderBy('due_date', 'asc')
                ->get();

            // Update order for each installment
            foreach ($installments as $index => $installment) {
                $installment->order = $index + 1;
                $installment->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset all order values to 0
        DB::table('installments')->update(['order' => 0]);
    }
};
