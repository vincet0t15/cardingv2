<?php

namespace Database\Seeders;

use App\Models\GeneralFund;
use App\Models\SourceOfFundCode;
use Illuminate\Database\Seeder;

class GeneralFundSeeder extends Seeder
{
    public function run(): void
    {
        // Create General Funds
        $gf = GeneralFund::create([
            'code' => 'GF',
            'description' => 'General Fund',
            'status' => true,
        ]);

        $sef = GeneralFund::create([
            'code' => 'SEF',
            'description' => 'Special Educational Fund',
            'status' => true,
        ]);

        $df = GeneralFund::create([
            'code' => 'DF',
            'description' => 'Development Fund',
            'status' => true,
        ]);

        $tf = GeneralFund::create([
            'code' => 'TF',
            'description' => 'Trust Fund',
            'status' => true,
        ]);

        // Create source of fund codes for General Fund (GF)
        $gfCodes = [
            ['code' => '1011-01', 'description' => 'General Fund 1011-01'],
            ['code' => '1012', 'description' => 'General Fund 1012'],
            ['code' => '1013', 'description' => 'General Fund 1013'],
            ['code' => '1014', 'description' => 'General Fund 1014'],
            ['code' => '9994', 'description' => 'General Fund 9994'],
        ];

        foreach ($gfCodes as $gfCode) {
            SourceOfFundCode::create([
                'code' => $gfCode['code'],
                'description' => $gfCode['description'],
                'status' => true,
                'is_category' => false,
                'parent_id' => null,
                'general_fund_id' => $gf->id,
            ]);
        }

        // Create source of fund codes for SEF
        SourceOfFundCode::create([
            'code' => '1010_SEF1%',
            'description' => 'Special Educational Fund 1%',
            'status' => true,
            'is_category' => false,
            'parent_id' => null,
            'general_fund_id' => $sef->id,
        ]);

        // Create source of fund codes for DF
        SourceOfFundCode::create([
            'code' => '1010_DF20%',
            'description' => 'Development Fund 20%',
            'status' => true,
            'is_category' => false,
            'parent_id' => null,
            'general_fund_id' => $df->id,
        ]);

        // Create source of fund codes for TF
        SourceOfFundCode::create([
            'code' => '1010_TF',
            'description' => 'Trust Fund',
            'status' => true,
            'is_category' => false,
            'parent_id' => null,
            'general_fund_id' => $tf->id,
        ]);
    }
}
