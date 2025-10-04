
export interface ApiKeys {
    youtube: string;
    gemini: string;
    telegramBotToken: string;
    telegramChatId: string;
}

export interface Channel {
    id: string;
}

export interface Video {
    id: string;
    title: string;
    channelTitle: string;
    publishedAt: Date;
}

export enum ProcessState {
    Idle = 'IDLE',
    Running = 'RUNNING',
}

export enum LogType {
    Info = 'INFO',
    Success = 'SUCCESS',
    Error = 'ERROR',
    System = 'SYSTEM',
}

export interface Log {
    message: string;
    type: LogType;
    timestamp: Date;
}

export interface Report {
    processedVideos: number;
    failedVideos: number;
    totalVideosFound: number;
    scannedChannels: number;
    startTime: Date;
    endTime: Date | null;
}
