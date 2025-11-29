"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type ExportButtonProps = {
    data: any[];
    filename?: string;
};

export default function ExportButton({ data, filename = "export.csv" }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return;

        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Convert to CSV string
        const csvContent = [
            headers.join(","),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Handle strings with commas, nulls, etc.
                        if (value === null || value === undefined) return "";
                        if (typeof value === "string" && value.includes(","))
                            return `"${value}"`;
                        if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`; // Escape quotes
                        return value;
                    })
                    .join(",")
            ),
        ].join("\n");

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
    );
}
