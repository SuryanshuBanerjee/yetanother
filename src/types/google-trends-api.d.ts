declare module 'google-trends-api' {
    interface TrendsOptions {
        keyword: string | string[];
        startTime?: Date;
        endTime?: Date;
        geo?: string;
        hl?: string;
        timezone?: number;
        category?: number;
    }

    interface DailyTrendsOptions {
        trendDate?: Date;
        geo?: string;
        hl?: string;
    }

    interface RealTimeTrendsOptions {
        geo?: string;
        hl?: string;
        category?: 'all' | 'entertainment' | 'sports' | 'sci' | 'tech' | 'business' | 'top stories';
    }

    function interestOverTime(options: TrendsOptions): Promise<string>;
    function interestByRegion(options: TrendsOptions): Promise<string>;
    function relatedTopics(options: TrendsOptions): Promise<string>;
    function relatedQueries(options: TrendsOptions): Promise<string>;
    function dailyTrends(options: DailyTrendsOptions): Promise<string>;
    function realTimeTrends(options: RealTimeTrendsOptions): Promise<string>;

    export = {
        interestOverTime,
        interestByRegion,
        relatedTopics,
        relatedQueries,
        dailyTrends,
        realTimeTrends,
    };
}
