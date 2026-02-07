import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
    try {
        const { keyword, phase } = await request.json();

        if (!keyword) {
            return NextResponse.json({ error: "Keyword required" }, { status: 400 });
        }

        // Fallback Simulation if no API Key
        if (!API_KEY) {
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const mockPivots = [
                {
                    title: "Irony-Maxxing Pivot",
                    strategy: `If ${keyword} is dying, lean into the absurdity. Launch a meta-commentary campaign that mocks the trend itself.`,
                },
                {
                    title: "Nostalgia Loop",
                    strategy: `Reframe ${keyword} as a 'vintage' aesthetic. Target early adopters who miss the 'authentic' version of the trend.`,
                },
                {
                    title: "Counter-Signal Approach",
                    strategy: `Completely invert the values of ${keyword}. If it was about excess, pivot to minimalism (e.g., #LoudBudgeting).`,
                },
            ];
            return NextResponse.json({ pivots: mockPivots, source: "Simulation" });
        }

        // Real Gemini Integration
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are a high-end trend consultant. The trend "${keyword}" is currently in the "${phase}" phase.
      Generate 3 specific, actionable "Pivot Strategies" to revive or monetize this dying trend.
      Format the response as JSON with an array of objects, each having a "title" and "strategy" field.
      Keep strategies short, punchy, and modern (2026 internet culture).
      Return ONLY valid JSON.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Attempt to parse JSON from the response (handling potential markdown code blocks)
        const jsonStr = text.replace(/```json|```/g, "").trim();
        const pivots = JSON.parse(jsonStr);

        return NextResponse.json({ pivots, source: "Gemini 1.5 Flash" });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: "Failed to generate strategies" }, { status: 500 });
    }
}
