<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\AuditLogRepositoryInterface;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepo
    ) {}

    /**
     * Display audit logs
     */
    public function index(Request $request)
    {
        $auditLogs = $this->auditLogRepo->getAllPaginated(
            $request->search,
            $request->action,
            $request->model_type,
            $request->user_id,
            $request->date_from,
            $request->date_to,
            $request->exclude_settings,
            $request->per_page ?? 20
        );

        $modelTypes = $this->auditLogRepo->getModelTypes();
        $users = User::orderBy('name')->get(['id', 'name']);

        $stats = $this->auditLogRepo->getStatistics(
            $request->search,
            $request->action,
            $request->model_type,
            $request->user_id,
            $request->date_from,
            $request->date_to,
            $request->exclude_settings
        );

        return Inertia::render('AuditLogs/Index', [
            'auditLogs' => $auditLogs,
            'modelTypes' => $modelTypes,
            'users' => $users,
            'stats' => $stats,
            'filters' => $request->only(['search', 'action', 'model_type', 'user_id', 'date_from', 'date_to', 'per_page', 'exclude_settings']),
        ]);
    }

    public function performance(Request $request)
    {
        $performanceMetrics = $this->auditLogRepo->getPerformanceMetrics(
            $request->search,
            $request->action,
            $request->model_type,
            $request->user_id,
            $request->date_from,
            $request->date_to,
            $request->exclude_settings
        );

        return Inertia::render('AuditLogs/Performance', [
            'performanceMetrics' => $performanceMetrics,
        ]);
    }

    public function performanceUser(int $userId, Request $request)
    {
        $user = User::findOrFail($userId);

        $auditLogs = $this->auditLogRepo->getUserPerformance(
            $userId,
            $request->search,
            $request->action,
            $request->model_type,
            $request->date_from,
            $request->date_to,
            $request->exclude_settings,
            $request->per_page ?? 20
        );

        return Inertia::render('AuditLogs/PerformanceUser', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
            'auditLogs' => $auditLogs,
        ]);
    }

    /**
     * Display specific audit log details
     */
    public function show(AuditLog $auditLog)
    {
        $auditLog = $this->auditLogRepo->findById($auditLog->id);

        return Inertia::render('AuditLogs/Show', [
            'auditLog' => $auditLog,
        ]);
    }

    /**
     * Export audit logs to CSV
     */
    public function export(Request $request)
    {
        $auditLogs = $this->auditLogRepo->export(
            $request->action,
            $request->model_type,
            $request->user_id,
            $request->date_from,
            $request->date_to,
            $request->exclude_settings
        );

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
