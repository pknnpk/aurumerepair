"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { useSession } from "next-auth/react";

const COLUMNS = [
    { id: "pending_check", title: "รอเช็ค", color: "bg-yellow-500" },
    { id: "pending_send", title: "รอส่ง", color: "bg-orange-500" },
    { id: "repairing", title: "กำลังซ่อม", color: "bg-blue-500" },
    { id: "repair_done", title: "ซ่อมเสร็จ", color: "bg-indigo-500" },
    { id: "pending_payment", title: "รอชำระ", color: "bg-pink-500" },
    { id: "ready_to_ship", title: "พร้อมส่ง", color: "bg-purple-500" },
    { id: "completed", title: "เสร็จสิ้น", color: "bg-green-500" },
];

import { TicketDetailModal } from "./ticket-detail-modal";
import { NewTicketModal } from "./new-ticket-modal";
import { QRScannerModal } from "./qr-scanner-modal";
import { Button } from "@/components/ui/button";
import { Plus, QrCode } from "lucide-react";

export default function KanbanBoard() {
    const { data: session } = useSession();
    const [repairs, setRepairs] = useState<any[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Expose open modal function globally
    useEffect(() => {
        (window as any).openTicketModal = (id: string) => setSelectedTicketId(id);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchRepairs = async () => {
        try {
            const res = await fetch("/api/repairs");
            if (res.ok) {
                const data = await res.json();
                setRepairs(data);
            }
        } catch (error) {
            console.error("Error fetching repairs:", error);
        }
    };

    useEffect(() => {
        fetchRepairs();
        // Polling every 10 seconds
        const interval = setInterval(fetchRepairs, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        let newStatus = COLUMNS.find(c => c.id === overId)?.id;

        if (!newStatus) {
            const overCard = repairs.find(r => r.id === overId);
            if (overCard) {
                newStatus = overCard.status;
            }
        }

        if (newStatus && session?.user) {
            // Optimistic update
            setRepairs((prev) =>
                prev.map((r) => (r.id === activeId ? { ...r, status: newStatus } : r))
            );

            // API Update
            try {
                await fetch(`/api/repairs/${activeId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: newStatus }),
                });
            } catch (error) {
                console.error("Error updating status:", error);
                // Revert optimistic update if needed
            }
        }

        setActiveId(null);
    };

    return (
        <>
            <div className="flex justify-end mb-4 px-4 gap-2">
                <Button onClick={() => setIsScannerOpen(true)} variant="outline">
                    <QrCode className="mr-2 h-4 w-4" /> Scan QR
                </Button>
                <Button onClick={() => setIsNewTicketOpen(true)} className="bg-[#00B900] hover:bg-[#009900]">
                    <Plus className="mr-2 h-4 w-4" /> New Ticket
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-[calc(100vh-160px)] gap-4 overflow-x-auto pb-4 px-4">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            repairs={repairs.filter((r) => r.status === col.id)}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <KanbanCard
                            id={activeId}
                            repair={repairs.find((r) => r.id === activeId)}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <TicketDetailModal
                open={!!selectedTicketId}
                onOpenChange={(open) => !open && setSelectedTicketId(null)}
                repair={repairs.find((r) => r.id === selectedTicketId)}
                onUpdate={() => {
                    fetchRepairs();
                }}
            />

            <NewTicketModal
                open={isNewTicketOpen}
                onOpenChange={setIsNewTicketOpen}
                onSuccess={() => {
                    fetchRepairs();
                }}
            />

            <QRScannerModal
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                onScan={(result) => {
                    if (result.length > 20) {
                        setSelectedTicketId(result);
                    } else {
                        alert("Invalid QR Code");
                    }
                }}
            />
        </>
    );
}
