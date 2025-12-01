"use client";

import { useEffect, useState } from "react";
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
import ExportButton from "@/components/export-button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function FinanceDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [repairs, setRepairs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            if (!session?.user) return;

            // @ts-ignore
            const role = session.user.role;

            if (["manager", "finance"].includes(role)) {
                setIsAuthorized(true);

                try {
                    // Fetch repairs
                    const repairsRes = await fetch("/api/repairs");
                    if (repairsRes.ok) {
                        const data = await repairsRes.json();
                        setRepairs(data);
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setIsAuthorized(false);
                setLoading(false);
            }
        };

        if (session?.user) {
            checkAuthAndFetch();
        }
    }, [session]);

    if (status === "loading" || loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!isAuthorized) {
        return <div className="p-8">Access Denied</div>;
    }

    // Calculate Totals
    const totalRevenue = repairs.reduce(
        (sum, r) => sum + (parseFloat(r.totalPrice) || 0),
        0
    );
    const totalCost = repairs.reduce(
        (sum, r) => sum + (parseFloat(r.costInternal) || 0),
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
                            const profit = (parseFloat(repair.totalPrice) || 0) - (parseFloat(repair.costInternal) || 0);
                            return (
                                <TableRow key={repair.id}>
                                    <TableCell className="font-medium">
                                        {repair.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(repair.createdAt).toLocaleDateString("th-TH")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{repair.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-red-600">
                                        {repair.costInternal
                                            ? `฿${parseFloat(repair.costInternal).toLocaleString()}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {repair.totalPrice
                                            ? `฿${parseFloat(repair.totalPrice).toLocaleString()}`
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
