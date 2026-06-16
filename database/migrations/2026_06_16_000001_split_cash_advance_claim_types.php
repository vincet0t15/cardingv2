<?php

use App\Models\Claim;
use App\Models\ClaimType;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $oldCashAdvance = ClaimType::where('code', 'CASH_ADVANCE')->first();

        if (!$oldCashAdvance) {
            return;
        }

        // Create the two new claim types
        $travelType = ClaimType::create([
            'name' => 'Cash Advance - Travel',
            'code' => 'CASH_ADVANCE_TRAVEL',
            'description' => 'Cash advance for travel-related expenses (trainings, seminars, meetings, official trips)',
            'is_active' => true,
        ]);

        $otherType = ClaimType::create([
            'name' => 'Cash Advance - Other Claims',
            'code' => 'CASH_ADVANCE_OTHER',
            'description' => 'Cash advance for non-travel purposes (educational assistance, enterprise, events, etc.)',
            'is_active' => true,
        ]);

        // Define travel-related keywords to categorize existing claims
        $travelKeywords = [
            'TRAVEL', 'TRAINING', 'SEMINAR', 'MEETING', 'CONFERENCE',
            'CONVENTION', 'TRIP', 'ATTEND', 'PARTICIPATE', 'ESCORT',
        ];

        // Migrate existing cash advance claims
        $claims = Claim::where('claim_type_id', $oldCashAdvance->id)->get();
        $travelCount = 0;
        $otherCount = 0;

        foreach ($claims as $claim) {
            $purpose = strtoupper(trim($claim->purpose ?? ''));
            $isTravel = false;

            foreach ($travelKeywords as $keyword) {
                if (str_contains($purpose, $keyword)) {
                    $isTravel = true;
                    break;
                }
            }

            if ($isTravel) {
                $claim->update(['claim_type_id' => $travelType->id]);
                $travelCount++;
            } else {
                $claim->update(['claim_type_id' => $otherType->id]);
                $otherCount++;
            }
        }

        // Mark old Cash Advance type as inactive
        $oldCashAdvance->update(['is_active' => false]);

        echo "Split Cash Advance claim type:\n";
        echo "  - {$travelCount} claims moved to 'Cash Advance - Travel'\n";
        echo "  - {$otherCount} claims moved to 'Cash Advance - Other Claims'\n";
        echo "  - Old 'Cash Advance' type deactivated\n";
    }

    public function down(): void
    {
        // Find the new types
        $travelType = ClaimType::where('code', 'CASH_ADVANCE_TRAVEL')->first();
        $otherType = ClaimType::where('code', 'CASH_ADVANCE_OTHER')->first();
        $oldCashAdvance = ClaimType::where('code', 'CASH_ADVANCE')->first();

        if (!$oldCashAdvance) {
            return;
        }

        // Move all claims back to the old type
        if ($travelType) {
            Claim::where('claim_type_id', $travelType->id)
                ->update(['claim_type_id' => $oldCashAdvance->id]);
        }

        if ($otherType) {
            Claim::where('claim_type_id', $otherType->id)
                ->update(['claim_type_id' => $oldCashAdvance->id]);
        }

        // Reactivate the old type
        $oldCashAdvance->update(['is_active' => true]);

        // Delete the new types
        if ($travelType) {
            $travelType->delete();
        }
        if ($otherType) {
            $otherType->delete();
        }
    }
};
