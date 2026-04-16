import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ConfirmDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: React.ReactNode;
    onConfirm: () => void;
    destructive?: boolean;
}

export default function ConfirmDeleteDialog({ isOpen, onClose, title, description, onConfirm, destructive = true }: ConfirmDeleteDialogProps) {
    const [processing, setProcessing] = useState(false);

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            await onConfirm();
        } finally {
            setProcessing(false);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" variant={destructive ? 'destructive' : 'secondary'} onClick={handleConfirm} disabled={processing}>
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
