import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import QRCode from "react-qr-code";

import PrintButton from "@/components/print-button";

export default async function PrintRepairOrderPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: repair } = await supabase
        .from("repairs")
        .select("*, profiles:customer_id(*)")
        .eq("id", params.id)
        .single();

    if (!repair) {
        return <div>Repair not found</div>;
    }

    const customer = repair.profiles;

    return (
        <div className="bg-white min-h-screen p-8 print:p-0 text-black">
            {/* Print Button (Hidden when printing) */}
            <div className="mb-8 print:hidden flex justify-end">
                <PrintButton />
            </div>

            {/* Header */}
            <div className="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">AURUME REPAIR</h1>
                    <p className="text-sm text-gray-600">
                        123 Jewelry Lane, Bangkok 10500<br />
                        Tel: 02-123-4567 | Line: @aurume
                    </p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-semibold">ใบแจ้งซ่อม (Repair Order)</h2>
                    <p className="text-sm text-gray-500">#{repair.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                        วันที่: {new Date(repair.created_at).toLocaleDateString("th-TH")}
                    </p>
                </div>
            </div>

            {/* Customer & QR */}
            <div className="flex justify-between mb-8">
                <div className="w-2/3">
                    <h3 className="font-bold mb-2 border-b w-fit">ข้อมูลลูกค้า</h3>
                    {customer ? (
                        <div className="text-sm space-y-1">
                            <p><span className="font-semibold">ชื่อ:</span> {customer.first_name} {customer.last_name}</p>
                            <p><span className="font-semibold">เบอร์โทร:</span> {customer.mobile}</p>
                            <p><span className="font-semibold">อีเมล:</span> {customer.email}</p>
                        </div>
                    ) : (
                        <p className="text-sm">ลูกค้าหน้าร้าน (Walk-in)</p>
                    )}
                </div>
                <div className="w-1/3 flex justify-end">
                    <div className="border p-2 rounded">
                        <QRCode value={repair.id} size={100} />
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="mb-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-2">รายการสินค้า</th>
                            <th className="py-2 text-center">ชุบ</th>
                            <th className="py-2 text-right">ราคา</th>
                        </tr>
                    </thead>
                    <tbody>
                        {repair.items.map((item: any, index: number) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="py-3">
                                    <div className="font-medium">{item.description}</div>
                                    {item.images && item.images.length > 0 && (
                                        <div className="flex gap-2 mt-1">
                                            {/* Only show first image for print to save ink/space */}
                                            <img src={item.images[0]} className="h-16 w-16 object-cover border rounded" />
                                        </div>
                                    )}
                                </td>
                                <td className="py-3 text-center">{item.plating ? "Yes" : "-"}</td>
                                <td className="py-3 text-right">-</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 space-y-2 text-right">
                    <div className="flex justify-between">
                        <span>รวมเป็นเงิน:</span>
                        <span>฿{repair.cost_external?.toLocaleString() || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ส่วนลด:</span>
                        <span>-฿{repair.discount?.toLocaleString() || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>ค่าจัดส่ง:</span>
                        <span>฿{repair.shipping_cost?.toLocaleString() || "0.00"}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>ยอดสุทธิ:</span>
                        <span>฿{repair.total_price?.toLocaleString() || "0.00"}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Terms */}
            <div className="text-xs text-gray-500 border-t pt-4">
                <p className="font-bold mb-1">เงื่อนไขการให้บริการ:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>โปรดนำใบแจ้งซ่อมนี้มาแสดงเมื่อมารับสินค้า</li>
                    <li>ทางร้านไม่รับผิดชอบหากสินค้าถูกทิ้งไว้เกิน 30 วันหลังจากแจ้งให้มารับ</li>
                    <li>รับประกันงานซ่อม 30 วันนับจากวันที่รับสินค้า</li>
                </ul>
            </div>

            {/* Signature Area */}
            <div className="flex justify-between mt-16 pt-8">
                <div className="text-center border-t border-black w-1/3 pt-2">
                    <p>ลายเซ็นลูกค้า</p>
                </div>
                <div className="text-center border-t border-black w-1/3 pt-2">
                    <p>ลายเซ็นพนักงาน</p>
                </div>
            </div>
        </div>
    );
}
