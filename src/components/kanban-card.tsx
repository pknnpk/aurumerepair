import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KanbanCardProps = {
    id: string;
    repair: any;
};

export function KanbanCard({ id, repair }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card
                className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                onClick={() => (window as any).openTicketModal(id)}
            >
                <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm font-medium flex justify-between">
                        <span>#{repair.id.slice(0, 6)}</span>
                        <span className="text-xs text-slate-400">
                            {new Date(repair.created_at).toLocaleDateString("th-TH")}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                    <div className="text-xs text-slate-600 line-clamp-2">
                        {repair.items[0]?.description}
                        {repair.items.length > 1 && ` (+${repair.items.length - 1})`}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {repair.return_method === "pickup" ? (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                รับเอง
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                ส่งปณ.
                            </Badge>
                        )}
                        {repair.total_price && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 text-green-700 bg-green-50">
                                ฿{repair.total_price.toLocaleString()}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
