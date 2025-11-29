import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ExportButton from "@/components/export-button";

export default async function FinanceDashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || !["manager", "finance"].includes(profile.role)) {
        return <div>Access Denied</div>;
    }

    const { data: repairs } = await supabase
        .from("repairs")
        .select("*")
        .order("created_at", { ascending: false });

    if (!repairs) return <div>No data</div>;

    // Calculate Totals
    const totalRevenue = repairs.reduce(
        (sum, r) => sum + (r.total_price || 0),
        0
    );
    const totalCost = repairs.reduce(
        (sum, r) => sum + (r.cost_internal || 0),
        0
    );
    const totalProfit = totalRevenue - totalCost;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Finance Dashboard</h1>
                <ExportButton data={repairs} filename={`finance_export_${new Date().toISOString().split('T')[0]}.csv`} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ฿{totalRevenue.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost (Int)</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ฿{totalCost.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ฿{totalProfit.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{repairs.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Cost (Int)</TableHead>
                            <TableHead className="text-right">Price (Ext)</TableHead>
                            <TableHead className="text-right">Profit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {repairs.map((repair) => {
                            const profit = (repair.total_price || 0) - (repair.cost_internal || 0);
                            return (
                                <TableRow key={repair.id}>
                                    <TableCell className="font-medium">
                                        {repair.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(repair.created_at).toLocaleDateString("th-TH")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{repair.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-red-600">
                                        {repair.cost_internal
                                            ? `฿${repair.cost_internal.toLocaleString()}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {repair.total_price
                                            ? `฿${repair.total_price.toLocaleString()}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ฿{profit.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
