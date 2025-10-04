
import React, { useState, useCallback, useRef } from 'react';
import { ApiKeys, Channel, Log, LogType, ProcessState, Report, Video } from './types';
import { getRecentVideos, getTranscript } from './services/youtubeService';
import { summarizeTranscript } from './services/geminiService';
import { sendMessage } from './services/telegramService';
import { sleep, splitMessage } from './utils/helpers';
import ApiKeyInput from './components/ApiKeyInput';
import ChannelInput from './components/ChannelInput';
import LogItem from './components/LogItem';
import SummaryReport from './components/SummaryReport';

const App: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKeys>({
        youtube: '',
        gemini: '',
        telegramBotToken: '8452545680:AAEVuFuaxcg-A7oCfAy5B_jDhE4aLCK5M5M',
        telegramChatId: '-1003129826607',
    });
    const [channels, setChannels] = useState<Channel[]>([]);
    const [processState, setProcessState] = useState<ProcessState>(ProcessState.Idle);
    const [logs, setLogs] = useState<Log[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [finalReport, setFinalReport] = useState<Report | null>(null);

    const logsEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const addLog = useCallback((message: string, type: LogType) => {
        setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
        setTimeout(scrollToBottom, 100);
    }, []);

    const handleApiKeyChange = useCallback((key: keyof ApiKeys, value: string) => {
        setApiKeys(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleStartProcessing = useCallback(async () => {
        if (!apiKeys.youtube || !apiKeys.gemini || !apiKeys.telegramBotToken || !apiKeys.telegramChatId) {
            addLog("Missing API keys or Telegram info. Please fill all fields.", LogType.Error);
            return;
        }
        if (channels.length === 0) {
            addLog("No channel IDs provided.", LogType.Error);
            return;
        }

        setProcessState(ProcessState.Running);
        setLogs([]);
        setFinalReport(null);
        addLog("Starting process...", LogType.Info);

        const report: Report = {
            processedVideos: 0,
            failedVideos: 0,
            totalVideosFound: 0,
            scannedChannels: 0,
            startTime: new Date(),
            endTime: null,
        };

        const allVideos: Video[] = [];
        const videoLimit = 100;

        // Step 1: Fetch all videos up to the limit
        addLog(`Scanning ${channels.length} channels for recent videos...`, LogType.Info);
        for (const channel of channels) {
            if (allVideos.length >= videoLimit) break;
            report.scannedChannels++;
            try {
                addLog(`Fetching videos for channel: ${channel.id}`, LogType.System);
                const videos = await getRecentVideos(channel.id, apiKeys.youtube);
                const videosToAdd = videos.slice(0, videoLimit - allVideos.length);
                allVideos.push(...videosToAdd);
                report.totalVideosFound += videos.length;
                addLog(`Found ${videos.length} videos. Added ${videosToAdd.length} to the queue.`, LogType.Success);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Failed to fetch videos for channel ${channel.id}: ${errorMessage}`, LogType.Error);
            }
        }
        
        addLog(`Total videos to process: ${allVideos.length}. Capped at ${videoLimit}.`, LogType.Info);
        setProgress({ current: 0, total: allVideos.length });

        // Step 2: Process videos one by one
        for (const video of allVideos) {
            setProgress(prev => ({ ...prev, current: prev.current + 1 }));
            try {
                addLog(`Processing: ${video.title}`, LogType.Info);

                // Get transcript
                addLog(`Fetching transcript...`, LogType.System);
                const transcript = await getTranscript(video.id);
                if (!transcript) {
                    throw new Error("Transcript not available.");
                }
                addLog(`Transcript found. Length: ${transcript.length} chars.`, LogType.Success);

                // Summarize with Gemini
                addLog(`Summarizing with Gemini...`, LogType.System);
                const summary = await summarizeTranscript(transcript, apiKeys.gemini);
                addLog(`Summary generated.`, LogType.Success);

                // Send to Telegram
                const messageHeader = `🎬 **${video.title}**\n\n📺 Kanal: ${video.channelTitle}\n🔗 Link: https://www.youtube.com/watch?v=${video.id}\n\n---\n\n`;
                const messageFooter = `\n\n---\n⏱️ İşlenme: ${new Date().toLocaleString('tr-TR')}`;
                const fullMessage = messageHeader + summary + messageFooter;
                
                const messageChunks = splitMessage(fullMessage, 4096);
                
                addLog(`Sending ${messageChunks.length} message(s) to Telegram...`, LogType.System);
                for (const chunk of messageChunks) {
                    await sendMessage(apiKeys.telegramBotToken, apiKeys.telegramChatId, chunk);
                    await sleep(1500); // Wait between messages
                }
                addLog(`Message sent successfully.`, LogType.Success);

                report.processedVideos++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`Failed to process video ${video.title}: ${errorMessage}`, LogType.Error);
                report.failedVideos++;
            }
        }

        report.endTime = new Date();
        setFinalReport(report);

        // Send final report to Telegram
        try {
            const reportMessage = `📊 **GÜNLÜK ÖZET RAPORU**\n\n✅ Toplam işlenen video: ${report.processedVideos}\n❌ Başarısız: ${report.failedVideos}\n📹 Taranan toplam video: ${report.totalVideosFound}\n📺 Taranan kanal sayısı: ${report.scannedChannels}\n\n⏱️ ${report.endTime.toLocaleString('tr-TR')}`;
            await sendMessage(apiKeys.telegramBotToken, apiKeys.telegramChatId, reportMessage);
            addLog("Final report sent to Telegram.", LogType.Success);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`Failed to send final report to Telegram: ${errorMessage}`, LogType.Error);
        }

        setProcessState(ProcessState.Idle);
    }, [apiKeys, channels, addLog]);

    const isRunning = processState === ProcessState.Running;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">YouTube Video Summarizer Bot</h1>
                    <p className="text-gray-400 mt-2">Automate summarizing YouTube videos and sending them to Telegram.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Configuration Section */}
                    <div className="space-y-6 bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-semibold border-b border-gray-700 pb-3">1. Configuration</h2>
                        <ApiKeyInput label="YouTube API Key" apiKey={apiKeys.youtube} onKeyChange={(val) => handleApiKeyChange('youtube', val)} disabled={isRunning} />
                        <ApiKeyInput label="Gemini API Key" apiKey={apiKeys.gemini} onKeyChange={(val) => handleApiKeyChange('gemini', val)} disabled={isRunning} />
                        <h3 className="text-xl font-medium pt-2">Telegram Settings</h3>
                        <ApiKeyInput label="Telegram Bot Token" apiKey={apiKeys.telegramBotToken} onKeyChange={(val) => handleApiKeyChange('telegramBotToken', val)} disabled={isRunning} isDefault={true} />
                        <ApiKeyInput label="Telegram Chat ID" apiKey={apiKeys.telegramChatId} onKeyChange={(val) => handleApiKeyChange('telegramChatId', val)} disabled={isRunning} isDefault={true} />
                        <ChannelInput onChannelsChange={setChannels} disabled={isRunning} />
                    </div>

                    {/* Controls & Logs Section */}
                    <div className="space-y-6 bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
                        <h2 className="text-2xl font-semibold border-b border-gray-700 pb-3">2. Execution & Logs</h2>
                        <button
                            onClick={handleStartProcessing}
                            disabled={isRunning}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                        >
                            {isRunning ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                            <span>{isRunning ? "Processing..." : "Start Processing"}</span>
                        </button>
                        
                        {isRunning && (
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}></div>
                                <p className="text-center text-sm mt-1">{progress.current} / {progress.total}</p>
                            </div>
                        )}

                        <div className="flex-grow bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto border border-gray-700">
                            <div className="space-y-2">
                                {logs.map((log, index) => <LogItem key={index} log={log} />)}
                                <div ref={logsEndRef} />
                            </div>
                            {logs.length === 0 && <p className="text-gray-500 text-center pt-16">Logs will appear here...</p>}
                        </div>
                    </div>
                </div>

                {finalReport && (
                    <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg">
                        <SummaryReport report={finalReport} />
                    </div>
                )}
                 <div className="mt-8 p-4 bg-yellow-900/30 text-yellow-200 border border-yellow-700 rounded-lg">
                    <h3 className="font-bold text-lg">📢 Important Note: Transcript Fetching is Simulated</h3>
                    <p className="mt-2">The official YouTube API does not provide a public method for fetching video transcripts. Libraries that do this often scrape YouTube's website, which is not possible from a browser due to security restrictions (CORS). </p>
                    <p className="mt-2">For this demonstration, the "Get Transcript" step is **simulated**. It will always return a sample pre-written transcript to allow the rest of the workflow (Gemini summarization and Telegram sending) to function correctly. The video fetching from the YouTube API is real.</p>
                </div>
            </div>
        </div>
    );
};

export default App;
