"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";

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
    const supabase = createClient();
    const [repairs, setRepairs] = useState<any[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Expose open modal function globally for the card to call (hacky but works for dnd context)
    useEffect(() => {
        (window as any).openTicketModal = (id: string) => setSelectedTicketId(id);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchRepairs = async () => {
            const { data } = await supabase.from("repairs").select("*");
            if (data) setRepairs(data);
        };
        fetchRepairs();

        // Realtime subscription
        const channel = supabase
            .channel("repairs_board")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "repairs" },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setRepairs((prev) => [...prev, payload.new]);
                    } else if (payload.eventType === "UPDATE") {
                        setRepairs((prev) =>
                            prev.map((r) => (r.id === payload.new.id ? payload.new : r))
                        );
                    } else if (payload.eventType === "DELETE") {
                        setRepairs((prev) => prev.filter((r) => r.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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

        // Find the container (column) that we dropped over
        // If overId is a column id, use it. If it's a card id, find its column.
        let newStatus = COLUMNS.find(c => c.id === overId)?.id;

        if (!newStatus) {
            // Dropped over a card, find that card's status
            const overCard = repairs.find(r => r.id === overId);
            if (overCard) {
                newStatus = overCard.status;
            }
        }

        if (newStatus) {
            // Optimistic update
            setRepairs((prev) =>
                prev.map((r) => (r.id === activeId ? { ...r, status: newStatus } : r))
            );

            // DB Update
            const { error } = await supabase.from("repairs").update({ status: newStatus }).eq("id", activeId);

            if (!error) {
                // Trigger notification
                await supabase.functions.invoke('notify-repair-update', {
                    body: { repairId: activeId, newStatus }
                });
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
                    // Refresh data locally if needed, or rely on realtime
                }}
            />

            <NewTicketModal
                open={isNewTicketOpen}
                onOpenChange={setIsNewTicketOpen}
                onSuccess={() => {
                    // Realtime will handle the update
                }}
            />

            <QRScannerModal
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                onScan={(result) => {
                    // Check if result is a valid UUID (simple check)
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
