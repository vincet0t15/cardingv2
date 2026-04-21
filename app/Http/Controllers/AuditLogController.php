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

        // Get statistics
        $stats = [
            'total_logs' => AuditLog::count(),
            'today_logs' => AuditLog::whereDate('created_at', today())->count(),
            'created_count' => AuditLog::where('action', 'created')->count(),
            'updated_count' => AuditLog::where('action', 'updated')->count(),
            'deleted_count' => AuditLog::where('action', 'deleted')->count(),
        ];

        return Inertia::render('AuditLogs/Index', [
            'auditLogs' => $auditLogs,
            'modelTypes' => $modelTypes,
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['search', 'action', 'model_type', 'user_id', 'date_from', 'date_to', 'per_page']),
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
}
