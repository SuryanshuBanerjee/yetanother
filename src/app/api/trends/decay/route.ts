import { NextRequest, NextResponse } from "next/server";
import { DecayEngine } from "@/lib/decayEngine";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { keyword, useLiveData = true } = body;

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        // Try live data first
        if (useLiveData) {
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
                console.log("Live data failed, falling back to mock:", error);
            }
        }

        // Fallback to mock data
        console.log("Using mock data for:", keyword);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const analysis = DecayEngine.analyze(keyword);

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Decay route error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
