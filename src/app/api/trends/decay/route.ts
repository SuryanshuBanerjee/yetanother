import { NextRequest, NextResponse } from "next/server";
import { DecayEngine } from "@/lib/decayEngine";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { keyword, userRole = "general-user", platforms } = body;

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        // Try the new full AI pipeline first
        try {
            const protocol = request.headers.get("x-forwarded-proto") || "http";
            const host = request.headers.get("host") || "localhost:3000";
            const baseUrl = `${protocol}://${host}`;

            const res = await fetch(`${baseUrl}/api/pipeline/full`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword, userRole, platforms }),
            });

            if (res.ok) {
                const pipelineResult = await res.json();

                // Check if validation rejected the trend
                if (pipelineResult.error === "Invalid trend") {
                    return NextResponse.json(pipelineResult, { status: 422 });
                }

                return NextResponse.json(pipelineResult);
            }

            console.log("Pipeline failed, trying old analyze route...");
        } catch (error) {
            console.log("Pipeline failed:", error);
        }

        // Try old analyze route as second fallback
        try {
            const protocol = request.headers.get("x-forwarded-proto") || "http";
            const host = request.headers.get("host") || "localhost:3000";
            const baseUrl = `${protocol}://${host}`;

            const res = await fetch(`${baseUrl}/api/trends/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword }),
            });

            if (res.ok) {
                const liveAnalysis = await res.json();
                return NextResponse.json(liveAnalysis);
            }
        } catch (error) {
            console.log("Old analyze route failed:", error);
        }

        // Final fallback to mock data
        console.log("All live data failed, using mock for:", keyword);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const analysis = DecayEngine.analyze(keyword);

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Decay route error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
