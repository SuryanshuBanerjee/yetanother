
export interface TrendSignal {
    source: "Reddit" | "Google" | "News";
    strength: number;
    sentiment: number;
    velocity: number;
    timestamp: string;
}

export interface TrendPost {
    id: string;
    author: string;
    handle: string;
    avatar: string;
    content: string;
    image?: string;
    date: string;
    likes: string;
    retweets: string;
    platform: "X" | "Reddit" | "TikTok";
    sentiment: "Positive" | "Negative" | "Neural";
}

export interface Creator {
    id: string;
    handle: string;
    followers: string;
    influence: number;
    status: "Active" | "Declining" | "Left";
    x: number;
    y: number;
}

export interface TrendDriver {
    name: string;
    impact: number;
    description: string;
    category: "Fatigue" | "Network" | "Influencer" | "Sludge" | "External";
}

// Phase 4: Ghost Market
export interface GhostMarketData {
    trappedCapital: string;
    retailers: { name: string; product: string; lagDays: number }[];
    lagWarning: boolean;
    riskLevel: "Low" | "Medium" | "High" | "Critical";
}

// Phase 4: Integrity Score
export interface IntegrityData {
    score: number; // 0-100
    burstPatterns: boolean;
    suspectedOrigin: string | null;
    warning: string | null;
}

// Phase 4: Horizon Alerts (Auto-Scout)
export interface HorizonAlert {
    id: string;
    trend: string;
    spike: string;
    mainstreamProbability: number;
    estimatedPeak: string;
    detectedAt: string;
}

// Phase 4: Necromancy Pivot
export interface NecromancyPivot {
    targetNiche: string;
    rebrandName: string;
    strategy: string;
    platform: string;
}

export interface DecayAnalysis {
    keyword: string;
    queryType: string;
    summary: string;

    // Core Metrics
    decayScore: number;
    entropy: number;
    sludgeScore: number;
    healthScore: number;
    phase: "Growth" | "Peak" | "Saturation" | "Decay" | "Revival" | "Zombie";
    velocity: "Accelerating" | "Stable" | "Decelerating" | "Freefall";

    // Prediction
    collapseProbability: number;
    timeToCollapse: string;

    // Narrative Data
    origin: {
        year: string;
        context: string;
        ancestry: string[];
        timeline: { date: string; event: string }[];
    };

    // Visual Data
    posts: TrendPost[];
    creators: Creator[];
    drivers: TrendDriver[];

    // Charts
    metricsHistory: {
        date: string;
        entropy: number;
        modularity: number;
        clustering: number;
        volume: number;
    }[];
    signals: TrendSignal[];
    chartData: { time: string; value: number; open: number; high: number; low: number; close: number }[];

    // Phase 4: Advanced Features
    ghostMarket: GhostMarketData;
    integrity: IntegrityData;
}

export class DecayEngine {
    static analyze(keyword: string): DecayAnalysis {
        const seed = keyword.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const phase = this.determinePhase(seed);
        const entropy = (seed % 40) + 30 + (Math.random() * 20);
        const decayScore = phase === "Decay" ? 85 : phase === "Saturation" ? 65 : 20;
        const sludgeScore = Math.floor((seed % 60) + 20);
        const healthScore = 100 - decayScore;

        return {
            keyword,
            queryType: "Deep Analysis",
            summary: this.generateSummary(keyword, phase),
            decayScore,
            entropy,
            sludgeScore,
            healthScore,
            phase,
            velocity: "Decelerating",
            collapseProbability: Math.min(99, decayScore + 10),
            timeToCollapse: phase === "Decay" ? "48-72 Hours" : "2-3 Weeks",
            origin: {
                year: "2024",
                context: `Born from the intersection of post-ironic embrace of ${keyword} and algorithmic amplification on TikTok.`,
                ancestry: ["Old Money Aesthetic", "Normcore", "Recession Core"],
                timeline: [
                    { date: "Oct 2024", event: "First viral appearance on TikTok niche communities." },
                    { date: "Dec 2024", event: "Mainstream media pickup (NYT, Vogue)." },
                    { date: "Jan 2025", event: "Market saturation; first wave of backlash." }
                ]
            },
            posts: [
                { id: "1", author: "TrendSpotter", handle: "@trend_spot", avatar: "", content: `The end of ${keyword} is near. Interaction rates are down 40%.`, date: "2h ago", likes: "1.2K", retweets: "450", platform: "X", sentiment: "Negative" },
                { id: "2", author: "Meme_Lord", handle: "@memes", avatar: "", content: `Me trying to explain ${keyword} to my mom.`, image: "placeholder", date: "5h ago", likes: "15.5K", retweets: "3K", platform: "X", sentiment: "Neural" },
                { id: "3", author: "CryptoBro", handle: "@alpha_male", avatar: "", content: `${keyword} is officially dead. Sell your bags.`, date: "1d ago", likes: "890", retweets: "120", platform: "X", sentiment: "Negative" },
            ],
            creators: [
                { id: "c1", handle: "@InfluencerA", followers: "2.5M", influence: 90, status: "Active", x: 1, y: 1 },
                { id: "c2", handle: "@CreatorB", followers: "800K", influence: 65, status: "Declining", x: 2, y: 3 },
                { id: "c3", handle: "@TechGuru", followers: "1.2M", influence: 75, status: "Active", x: 3, y: 1 },
                { id: "c4", handle: "@Fashionista", followers: "3M", influence: 85, status: "Left", x: 5, y: 5 },
            ],
            drivers: [
                { name: "Semantic Fatigue", impact: 45, description: "Vocabulary repetition exceeds 80%.", category: "Fatigue" },
                { name: "Network Fragmentation", impact: 25, description: "Community splitting into isolated clusters.", category: "Network" },
                { name: "Bot Sludge", impact: 20, description: "Significant rise in synthetic amplification.", category: "Sludge" },
            ],
            metricsHistory: Array.from({ length: 30 }, (_, i) => ({
                date: `Day ${i + 1}`,
                entropy: 30 + Math.random() * 50 + (i * 0.5),
                modularity: 0.2 + (i * 0.02),
                clustering: 0.8 - (i * 0.01),
                volume: 1000 - (i * 20),
            })),
            signals: this.generateSignals(phase),
            chartData: this.generateCandlestickData(phase),

            // Phase 4: Ghost Market
            ghostMarket: this.generateGhostMarket(phase, decayScore),

            // Phase 4: Integrity Score
            integrity: this.generateIntegrity(sludgeScore),
        };
    }

    private static determinePhase(seed: number): DecayAnalysis["phase"] {
        const phases: DecayAnalysis["phase"][] = ["Growth", "Peak", "Saturation", "Decay", "Revival"];
        return phases[seed % phases.length];
    }

    private static generateSummary(keyword: string, phase: string): string {
        return `The narrative around **${keyword}** has entered the **${phase} phase**. While initial engagement was driven by organic community discovery, current signals indicate a rapid shift towards **saturation**. Semantic entropy is rising, suggesting that the core definition of the trend is fragmenting as it reaches mainstream audiences.`;
    }

    private static generateSignals(phase: string): TrendSignal[] {
        return [
            { source: "Reddit", strength: 80, sentiment: -0.4, velocity: -5, timestamp: new Date().toISOString() },
            { source: "Google", strength: 45, sentiment: 0, velocity: -12, timestamp: new Date().toISOString() },
            { source: "News", strength: 90, sentiment: -0.8, velocity: 10, timestamp: new Date().toISOString() },
        ];
    }

    private static generateCandlestickData(phase: string) {
        const data = [];
        let price = 50;
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const volatility = phase === "Decay" ? 15 : 5;
            const change = (Math.random() - 0.5) * volatility + (phase === "Growth" ? 2 : -2);
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) + Math.random() * 5;
            const low = Math.min(open, close) - Math.random() * 5;
            data.push({ time, value: close, open, high, low, close });
            price = close;
        }
        return data;
    }

    // Phase 4: Ghost Market Generator
    private static generateGhostMarket(phase: string, decayScore: number): GhostMarketData {
        const isLagCrisis = phase === "Decay" || phase === "Saturation";
        const trappedAmount = isLagCrisis ? (Math.random() * 5 + 1).toFixed(1) : "0";

        return {
            trappedCapital: isLagCrisis ? `$${trappedAmount}M` : "$0",
            retailers: isLagCrisis ? [
                { name: "Zara", product: "Capsule Collection", lagDays: 14 },
                { name: "H&M", product: "Limited Edition Line", lagDays: 21 },
                { name: "Shein", product: "Mass Production Run", lagDays: 7 },
            ] : [],
            lagWarning: isLagCrisis,
            riskLevel: decayScore > 80 ? "Critical" : decayScore > 60 ? "High" : decayScore > 40 ? "Medium" : "Low",
        };
    }

    // Phase 4: Integrity Score Generator
    private static generateIntegrity(sludgeScore: number): IntegrityData {
        const isSuspicious = sludgeScore > 60;
        const burstPatterns = sludgeScore > 70;

        return {
            score: Math.max(0, 100 - sludgeScore - Math.floor(Math.random() * 10)),
            burstPatterns,
            suspectedOrigin: burstPatterns ? "Eastern European Server Farm" : null,
            warning: isSuspicious
                ? `${sludgeScore}% of this trend's volume originates from coordinated amplification. This is a **Manufactured Vibe**, not an Organic Movement.`
                : null,
        };
    }
}

// Phase 4: Horizon Alerts (static demo data)
export const HORIZON_ALERTS: HorizonAlert[] = [
    {
        id: "h1",
        trend: "#LowStakesConspiracy",
        spike: "+420%",
        mainstreamProbability: 72,
        estimatedPeak: "Feb 14, 2026",
        detectedAt: "2 hours ago"
    },
    {
        id: "h2",
        trend: "Goblin Mode 2.0",
        spike: "+180%",
        mainstreamProbability: 45,
        estimatedPeak: "Feb 20, 2026",
        detectedAt: "5 hours ago"
    },
    {
        id: "h3",
        trend: "#SilentWalking",
        spike: "+95%",
        mainstreamProbability: 88,
        estimatedPeak: "Feb 10, 2026",
        detectedAt: "1 day ago"
    }
];
