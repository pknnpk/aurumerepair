"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintButton() {
    return (
        <Button
            onClick={() => window.print()}
            className="print:hidden mb-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
            <Printer className="mr-2 h-4 w-4" /> Print Now
        </Button>
    );
}
