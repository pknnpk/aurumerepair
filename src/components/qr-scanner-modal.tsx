"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type QRScannerModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (result: string) => void;
};

export function QRScannerModal({
    open,
    onOpenChange,
    onScan,
}: QRScannerModalProps) {
    const [error, setError] = useState<string | null>(null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan Repair Ticket QR</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4">
                    {open && (
                        <div className="w-full h-[300px] overflow-hidden rounded-lg relative bg-black">
                            <Scanner
                                onScan={(result) => {
                                    if (result && result.length > 0) {
                                        onScan(result[0].rawValue);
                                        onOpenChange(false);
                                    }
                                }}
                                onError={(error) => {
                                    console.error(error);
                                    setError("Camera error. Please check permissions.");
                                }}
                                components={{

                                    onOff: true,
                                    torch: true,
                                    zoom: true,
                                    finder: true,
                                }}
                                styles={{
                                    container: { width: '100%', height: '100%' }
                                }}
                            />
                        </div>
                    )}
                    {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                    <p className="text-sm text-slate-500 mt-4 text-center">
                        Point camera at the QR code on the repair ticket.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
