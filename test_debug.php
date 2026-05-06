<?php
$sfc = App\Models\SourceOfFundCode::with('generalFund')->whereNotNull('general_fund_id')->first();
if ($sfc) {
    echo "Found SourceOfFundCode:\n";
    print_r($sfc->toArray());
} else {
    echo "No SourceOfFundCode found with general_fund_id set\n";
}

// Check if general_fund_id column exists
$columns = Schema::getColumnListing('source_of_fund_codes');
echo "\nColumns in source_of_fund_codes:\n";
print_r($columns);