import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";

type KanbanColumnProps = {
    id: string;
    title: string;
    repairs: any[];
    color: string;
};

export function KanbanColumn({ id, title, repairs, color }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-slate-100 rounded-xl p-2">
            <div className={`flex items-center justify-between p-2 mb-2 rounded-lg ${color} text-white`}>
                <h3 className="font-semibold text-sm">{title}</h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {repairs.length}
                </span>
            </div>

            <div ref={setNodeRef} className="flex-1 overflow-y-auto space-y-2 p-1">
                <SortableContext items={repairs.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                    {repairs.map((repair) => (
                        <KanbanCard key={repair.id} id={repair.id} repair={repair} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
