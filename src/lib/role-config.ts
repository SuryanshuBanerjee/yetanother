// Centralized role configuration — single source of truth for all role-aware behavior

export type SectionId =
  | "Chart"
  | "KeyMetrics"
  | "ActionItems"
  | "ProsCons"
  | "Triade"
  | "Velocity"
  | "MetricsHistory"
  | "About"
  | "SimilarTrends";

export const SECTION_ORDER: Record<string, SectionId[]> = {
  "content-creator": [
    "Chart", "KeyMetrics", "ActionItems", "ProsCons", "Triade",
    "Velocity", "MetricsHistory", "About", "SimilarTrends",
  ],
  "marketing-team": [
    "ActionItems", "ProsCons", "Triade", "KeyMetrics", "Velocity",
    "Chart", "MetricsHistory", "About", "SimilarTrends",
  ],
  "general-user": [
    "Chart", "KeyMetrics", "About", "ProsCons", "SimilarTrends",
    "Triade", "Velocity", "MetricsHistory",
  ],
  "platform-moderator": [
    "Triade", "Velocity", "KeyMetrics", "ProsCons", "ActionItems",
    "Chart", "MetricsHistory", "About", "SimilarTrends",
  ],
};

// Which 3 metric card labels to highlight per role
export const METRIC_EMPHASIS: Record<string, string[]> = {
  "content-creator": ["Current Interest", "Week Change", "Volatility"],
  "marketing-team": ["Month Change", "Consistency", "Current Interest"],
  "general-user": ["Current Interest", "Peak Interest", "Week Change"],
  "platform-moderator": ["Volatility", "Week Change", "Month Change"],
};

// Role-specific labels for triade dimensions
export const ROLE_LABELS: Record<string, { fragmentation: string; saturation: string; exhaustion: string }> = {
  "content-creator": {
    fragmentation: "Audience Drift",
    saturation: "Content Fatigue",
    exhaustion: "Creator Burnout",
  },
  "marketing-team": {
    fragmentation: "Market Fragmentation",
    saturation: "Ad Saturation",
    exhaustion: "Commercial Exhaustion",
  },
  "general-user": {
    fragmentation: "Community Fragmentation",
    saturation: "Semantic Saturation",
    exhaustion: "Commercial Exhaustion",
  },
  "platform-moderator": {
    fragmentation: "Community Split Risk",
    saturation: "Signal Noise Ratio",
    exhaustion: "Monetization Decay",
  },
};

// Role-specific context strings for various sections
export const ROLE_CONTEXT: Record<string, { chart: string; metrics: string; similarTrends: string }> = {
  "content-creator": {
    chart: "Track engagement windows to time your content drops for maximum reach.",
    metrics: "Key signals that determine your content's potential performance.",
    similarTrends: "Content adjacencies for cross-pollination reach.",
  },
  "marketing-team": {
    chart: "Identify campaign timing windows and budget allocation inflection points.",
    metrics: "Campaign reliability indicators and ROI predictors.",
    similarTrends: "Adjacent markets for budget diversification and audience expansion.",
  },
  "general-user": {
    chart: "See how public interest evolves over time.",
    metrics: "Key numbers that tell the trend's story at a glance.",
    similarTrends: "Discover related topics worth exploring next.",
  },
  "platform-moderator": {
    chart: "Monitor volume spikes that may require moderation resources.",
    metrics: "Risk and volatility indicators for platform health.",
    similarTrends: "Connected trends that may amplify or trigger moderation events.",
  },
};

// Role-specific descriptions for metric cards on hover
export const METRIC_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "content-creator": {
    "Current Interest": "How much your potential audience is searching right now",
    "Peak Interest": "The biggest content opportunity window this trend had",
    "Week Change": "Whether you should post now or wait — momentum indicator",
    "Month Change": "Long-term content viability gauge",
    "Volatility": "How risky your content bet is — high = unpredictable reach",
    "Consistency": "Whether this trend sustains views or spikes then dies",
  },
  "marketing-team": {
    "Current Interest": "Audience size indicator for campaign targeting",
    "Peak Interest": "Maximum addressable attention for this market",
    "Week Change": "Short-term campaign timing signal",
    "Month Change": "Campaign sustainability and budget commitment indicator",
    "Volatility": "Campaign reliability indicator — high = unstable ROI",
    "Consistency": "Budget predictability score — higher is safer for long campaigns",
  },
  "general-user": {
    "Current Interest": "Current popularity relative to peak (0-100)",
    "Peak Interest": "Highest popularity score in the last 90 days",
    "Week Change": "7-day growth rate compared to previous week",
    "Month Change": "Monthly momentum — growth or decline",
    "Volatility": "How much interest fluctuates day-to-day",
    "Consistency": "How reliably interest is maintained over time",
  },
  "platform-moderator": {
    "Current Interest": "Current platform load indicator for this topic",
    "Peak Interest": "Maximum moderation burden this trend generated",
    "Week Change": "Surge detection — fast rises need mod attention",
    "Month Change": "Sustained pressure indicator on moderation queue",
    "Volatility": "Unpredictability risk — high means sudden spikes likely",
    "Consistency": "Whether this is a persistent burden or flash event",
  },
};
