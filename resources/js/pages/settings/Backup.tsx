import { DatePicker } from '@/components/custom-date-picker';
import Heading from '@/components/heading';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Database, Download, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
    },
    {
        title: 'Database Backup',
        href: '/settings/backup',
    },
];

interface Backup {
    name: string;
    size: string;
    date: string;
    path: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface BackupProps {
    backups: Backup[];
    pagination: Pagination;
    databaseName: string;
}

export default function Backup({ backups, pagination, databaseName }: BackupProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
    });

    const createForm = useForm({});
    const restoreForm = useForm({ file_name: '' });
    const uploadForm = useForm({ backup_file: null as File | null });

    const handleCreateBackup = () => {
        createForm.post(route('settings.backup.create'), {
            preserveScroll: true,
            onSuccess: (response: { props: FlashProps }) => {
                if (response.props.flash?.success) {
                    toast.success(response.props.flash.success);
                    setShowCreateConfirm(false);
                    setTimeout(() => window.location.reload(), 1000);
                } else if (response.props.flash?.error) {
                    toast.error(response.props.flash.error);
                }
            },
            onError: (errors) => {
                console.error('Backup errors:', errors);
                toast.error('Failed to create backup. Check console for details.');
            },
        });
    };

    const handleDownload = (fileName: string) => {
        window.location.href = route('settings.backup.download', fileName);
    };

    const handleDeleteClick = (fileName: string) => {
        setFileToDelete(fileName);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = () => {
        if (fileToDelete) {
            router.delete(route('settings.backup.destroy', fileToDelete), {
                preserveScroll: true,
                onSuccess: (response: { props: FlashProps }) => {
                    toast.success(response.props.flash?.success);
                    setShowDeleteConfirm(false);
                    setFileToDelete(null);
                },
            });
        }
    };

    const handleRestoreClick = (fileName: string) => {
        setSelectedBackup(fileName);
        restoreForm.setData('file_name', fileName);
        setShowRestoreDialog(true);
    };

    const handleRestoreConfirm = () => {
        restoreForm.post(route('settings.backup.restore'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Database restored successfully!');
                setShowRestoreDialog(false);
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            },
            onError: () => {
                toast.error('Failed to restore database');
            },
        });
    };

    const handleUploadRestore = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadForm.data.backup_file) {
            toast.error('Please select a file to upload');
            return;
        }

        uploadForm.post(route('settings.backup.upload-restore'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Database restored successfully!');
                setShowUploadDialog(false);
                uploadForm.reset();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            },
            onError: () => {
                toast.error('Failed to restore from uploaded file');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Database Backup" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Heading title="Database Backup & Restore" description="Manage your database backups" />

                {/* Create Backup Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Create New Backup
                        </CardTitle>
                        <CardDescription>Create a backup of your current database</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Database: <span className="font-medium">{databaseName}</span>
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Backups are stored in storage/app/backups directory</p>
                            </div>
                            <Button onClick={() => setShowCreateConfirm(true)} disabled={createForm.processing}>
                                {createForm.processing ? 'Creating...' : 'Create Backup'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Upload & Restore Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload & Restore
                        </CardTitle>
                        <CardDescription>Upload a backup file and restore from it</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => setShowUploadDialog(true)} className="gap-2">
                            <Upload className="h-4 w-4" />
                            Upload Backup File
                        </Button>
                    </CardContent>
                </Card>

                {/* Existing Backups */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Available Backups
                        </CardTitle>
                        <CardDescription>
                            {pagination.total} backup{pagination.total !== 1 ? 's' : ''} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-4 flex flex-wrap items-end gap-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="start_date">Start Date</Label>
                                <DatePicker
                                    id="start_date"
                                    value={filters.start_date}
                                    onChange={(value) => setFilters({ ...filters, start_date: value })}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="end_date">End Date</Label>
                                <DatePicker
                                    id="end_date"
                                    value={filters.end_date}
                                    onChange={(value) => setFilters({ ...filters, end_date: value })}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFilters({ start_date: '', end_date: '' });
                                        router.get(route('settings.backup.index'), {}, { preserveState: true, preserveScroll: true });
                                    }}
                                >
                                    Clear
                                </Button>
                                <Button
                                    onClick={() => {
                                        router.get(route('settings.backup.index'), { ...filters }, { preserveState: true, preserveScroll: true });
                                    }}
                                >
                                    Filter
                                </Button>
                            </div>
                        </div>

                        {backups.length === 0 ? (
                            <div className="py-8 text-center">
                                <Database className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                                <p className="text-slate-500">No backups available</p>
                                <p className="mt-1 text-xs text-slate-400">Create your first backup using the button above</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {backups.map((backup) => (
                                        <div
                                            key={backup.name}
                                            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">{backup.name}</p>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                                    <span>{backup.size}</span>
                                                    <span>•</span>
                                                    <span>{backup.date}</span>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleDownload(backup.name)} title="Download">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRestoreClick(backup.name)}
                                                    title="Restore"
                                                    className="text-amber-600 hover:text-amber-700"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(backup.name)}
                                                    title="Delete"
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-sm text-slate-500">
                                            Page {pagination.current_page} of {pagination.last_page}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.current_page === 1}
                                                onClick={() => {
                                                    router.get(
                                                        route('settings.backup.index'),
                                                        { ...filters, page: pagination.current_page - 1 },
                                                        { preserveState: true, preserveScroll: true },
                                                    );
                                                }}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.current_page === pagination.last_page}
                                                onClick={() => {
                                                    router.get(
                                                        route('settings.backup.index'),
                                                        { ...filters, page: pagination.current_page + 1 },
                                                        { preserveState: true, preserveScroll: true },
                                                    );
                                                }}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Create Backup Confirmation Dialog */}
                <AlertDialog open={showCreateConfirm} onOpenChange={setShowCreateConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Create Database Backup?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will create a new backup of your database "{databaseName}". The backup will be saved to the storage directory.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCreateBackup} disabled={createForm.processing}>
                                {createForm.processing ? 'Creating...' : 'Create Backup'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div>
                                    Are you sure you want to delete this backup? This action cannot be undone.
                                    {fileToDelete && (
                                        <div className="mt-2 rounded bg-slate-100 p-2 dark:bg-slate-800">
                                            <code className="text-xs break-all">{fileToDelete}</code>
                                        </div>
                                    )}
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Restore Confirmation Dialog */}
                <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                Warning: Database Restore
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div>
                                    <p className="mb-2">You are about to restore the database from backup:</p>
                                    <div className="mb-3 rounded bg-slate-100 p-2 dark:bg-slate-800">
                                        <code className="text-xs break-all">{selectedBackup}</code>
                                    </div>
                                    <p className="font-medium text-red-600">⚠️ This action cannot be undone. All current data will be replaced!</p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRestoreConfirm}
                                disabled={restoreForm.processing}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {restoreForm.processing ? 'Restoring...' : 'Yes, Restore Database'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Upload Restore Dialog */}
                <AlertDialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Upload Backup File</AlertDialogTitle>
                            <AlertDialogDescription>Select a backup file to upload and restore from.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <form onSubmit={handleUploadRestore}>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium">Select SQL File</label>
                                <Input
                                    type="file"
                                    accept=".sql,.zip,.gz"
                                    onChange={(e) => uploadForm.setData('backup_file', e.target.files?.[0] || null)}
                                    required
                                />
                                <p className="mt-1 text-xs text-slate-500">Max file size: 100MB</p>
                            </div>
                            <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                <p className="text-xs text-amber-800 dark:text-amber-200">⚠️ Warning: This will replace your entire database!</p>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    type="button"
                                    onClick={() => {
                                        setShowUploadDialog(false);
                                        uploadForm.reset();
                                    }}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction type="submit" disabled={uploadForm.processing}>
                                    {uploadForm.processing ? 'Uploading...' : 'Upload & Restore'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
