<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    /**
     * Display audit logs
     */
    public function index(Request $request)
    {
        // Permission is checked via route middleware
        $query = AuditLog::with('user')
            ->when($request->search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('action', 'like', "%{$search}%")
                        ->orWhere('model_type', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->exclude_settings, function ($q) {
                $q->whereNotIn('model_type', $this->getSettingsModelTypes());
            })
            ->when($request->action, function ($q, $action) {
                $q->where('action', $action);
            })
            ->when($request->model_type, function ($q, $modelType) {
                $q->where('model_type', $modelType);
            })
            ->when($request->user_id, function ($q, $userId) {
                $q->where('user_id', $userId);
            })
            ->when($request->date_from, function ($q, $dateFrom) {
                $q->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($q, $dateTo) {
                $q->whereDate('created_at', '<=', $dateTo);
            })
            ->orderBy('created_at', 'desc');

        $perPage = $request->per_page ?? 20;
        $auditLogs = $query->paginate($perPage)->appends($request->except('page'));

        // Get unique model types for filter
        $modelTypes = AuditLog::distinct()->pluck('model_type')
            ->map(function ($modelType) {
                return [
                    'value' => $modelType,
                    'label' => class_basename($modelType),
                ];
            })
            ->values();

        // Get all users for filter
        $users = User::orderBy('name')->get(['id', 'name']);

        // Get statistics for the current filtered query
        $statsQuery = clone $query;
        $stats = [
            'total_logs' => $statsQuery->count(),
            'today_logs' => (clone $query)->whereDate('created_at', today())->count(),
            'created_count' => (clone $query)->where('action', 'created')->count(),
            'updated_count' => (clone $query)->where('action', 'updated')->count(),
            'deleted_count' => (clone $query)->where('action', 'deleted')->count(),
        ];

        $performanceMetrics = (clone $query)
            ->whereNotNull('user_id')
            ->selectRaw('user_id, count(*) as total_actions')
            ->selectRaw('sum(case when action = "created" then 1 else 0 end) as created_count')
            ->selectRaw('sum(case when action = "updated" then 1 else 0 end) as updated_count')
            ->selectRaw('sum(case when action = "deleted" then 1 else 0 end) as deleted_count')
            ->groupBy('user_id')
            ->orderByDesc('total_actions')
            ->with('user')
            ->get()
            ->map(function ($row) {
                return [
                    'user_id' => $row->user_id,
                    'user_name' => $row->user?->name ?? 'Unknown',
                    'created_count' => (int) $row->created_count,
                    'updated_count' => (int) $row->updated_count,
                    'deleted_count' => (int) $row->deleted_count,
                    'total_actions' => (int) $row->total_actions,
                ];
            });

        return Inertia::render('AuditLogs/Index', [
            'auditLogs' => $auditLogs,
            'modelTypes' => $modelTypes,
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['search', 'action', 'model_type', 'user_id', 'date_from', 'date_to', 'per_page', 'exclude_settings']),
            'performanceMetrics' => $performanceMetrics,
        ]);
    }

    /**
     * Display specific audit log details
     */
    public function show(AuditLog $auditLog)
    {
        // Permission is checked via route middleware
        $auditLog->load('user');

        return Inertia::render('AuditLogs/Show', [
            'auditLog' => $auditLog,
        ]);
    }

    /**
     * Export audit logs to CSV
     */
    public function export(Request $request)
    {
        // Permission is checked via route middleware
        $query = AuditLog::with('user')
            ->when($request->action, function ($q, $action) {
                $q->where('action', $action);
            })
            ->when($request->exclude_settings, function ($q) {
                $q->whereNotIn('model_type', $this->getSettingsModelTypes());
            })
            ->when($request->model_type, function ($q, $modelType) {
                $q->where('model_type', $modelType);
            })
            ->when($request->user_id, function ($q, $userId) {
                $q->where('user_id', $userId);
            })
            ->when($request->date_from, function ($q, $dateFrom) {
                $q->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($request->date_to, function ($q, $dateTo) {
                $q->whereDate('created_at', '<=', $dateTo);
            })
            ->orderBy('created_at', 'desc');

        $auditLogs = $query->get();

        $csvData = "Date,Time,User,Action,Model,Description,IP Address\n";

        foreach ($auditLogs as $log) {
            $csvData .= sprintf(
                "%s,%s,%s,%s,%s,%s,%s\n",
                $log->created_at->format('Y-m-d'),
                $log->created_at->format('H:i:s'),
                $log->user?->name ?? 'System',
                ucfirst($log->action),
                class_basename($log->model_type),
                $log->description ?? '',
                $log->ip_address ?? ''
            );
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="audit_logs_' . now()->format('Y-m-d') . '.csv"');
    }

    protected function getSettingsModelTypes(): array
    {
        return [
            \App\Models\Office::class,
            \App\Models\EmploymentStatus::class,
            \App\Models\ReferenceType::class,
            \App\Models\DocumentType::class,
            \App\Models\DeductionType::class,
            \App\Models\AdjustmentType::class,
            \App\Models\SourceOfFundCode::class,
            \App\Models\GeneralFund::class,
        ];
    }
}
