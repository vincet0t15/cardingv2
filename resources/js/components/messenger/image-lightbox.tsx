import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ImageLightboxProps {
    src: string;
    alt: string;
    open: boolean;
    onClose: () => void;
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (!open) setScale(1);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-black/60 px-4 py-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setScale((s) => Math.max(0.5, s - 0.25));
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10"
                >
                    <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm text-white">{Math.round(scale * 100)}%</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setScale((s) => Math.min(3, s + 0.25));
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10"
                >
                    <ZoomIn className="h-4 w-4" />
                </button>
            </div>

            <img
                src={src}
                alt={alt}
                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain transition-transform duration-200"
                style={{ transform: `scale(${scale})` }}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
