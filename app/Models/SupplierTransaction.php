<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierTransaction extends Model
{
    protected $fillable = [
        'supplier_id',
        'pr_date',
        'pr_no',
        'po_date',
        'po_no',
        'sale_invoice_date',
        'sale_invoice_no',
        'or_date',
        'or_no',
        'dr_date',
        'dr_no',
        'qty_period_covered',
        'particulars',
        'gross',
        'ewt',
        'vat',
        'net_amount',
        'date_processed',
        'remarks',
    ];

    protected $casts = [
        'pr_date' => 'date',
        'po_date' => 'date',
        'sale_invoice_date' => 'date',
        'or_date' => 'date',
        'dr_date' => 'date',
        'date_processed' => 'date',
        'gross' => 'decimal:2',
        'ewt' => 'decimal:2',
        'vat' => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
