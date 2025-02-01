import React, { useState, useRef } from "react";
import { Globe, Mic, MicOff, MessageSquare, User, Brain, Camera } from "lucide-react";


export const InterviewCoach = () => {
    const [audioUrl, setAudioUrl] = useState("");
    const [transcribedText, setTranscribedText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [aiResponse, setAiResponse] = useState("");
    const [messages, setMessages] = useState([]);
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const userId = "user123";
    const chatContainerRef = useRef(null);

    const startListening = () => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        const recognition = new (window.webkitSpeechRecognition ||
            window.SpeechRecognition)();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
            let text = "";
            for (let i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript + " ";
            }
            setTranscribedText(text.trim());
        };

        recognition.start();
        setIsListening(true);
    };

    const handleDoneSpeaking = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
        if (transcribedText) {
            setMessages(prev => [...prev, { type: 'user', text: transcribedText, timestamp: new Date() }]);
            generateVoice(transcribedText);
        }
    };

      const generateVoice = async (text) => {
        if (!text) return;
    
        try {
            const response = await fetch("http://localhost:5000/generate-voice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, text, role: "data analyst" }),
            });
            
            const data = await response.json();
            
            // Convert base64 to binary using browser API
            const binaryString = atob(data.audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(audioBlob);
            
            setAudioUrl(url);
            setAiResponse(data.text);
            setMessages(prev => [...prev, { type: 'ai', text: data.text, timestamp: new Date() }]);
            setIsPlaying(true);
            
            const audio = new Audio(url);
            audioRef.current = audio;
            
            audio.onended = () => {
                setIsPlaying(false);
            };
            
            audio.play();
        } catch (error) {
            console.error("Error generating voice:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#242424]">
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-3rem)]">
                    {/* Main Content - Left 8 columns */}
                    <div className="col-span-8 space-y-6">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-white mb-2 font-heading">Saarthi AI</h1>
                            <p className="text-white font-light">Practice your interview skills with real-time AI feedback</p>
                        </div>

                        {/* Main Interface */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* AI Avatar Section */}
                            <div className="bg-white rounded-2xl p-6 relative shadow-lg border border-blue-100">
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full">
                                    <Brain className="w-4 h-4" />
                                    <span>AI Assistant</span>
                                </div>
                                
                                <div className="flex items-center justify-center h-64">
                                    <div className="relative">
                                        <Globe 
                                            className={`w-32 h-32 ${
                                                isPlaying ? 'text-blue-500' : 'text-blue-200'
                                            } transition-colors duration-300`} 
                                        />
                                        {isPlaying && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="absolute w-full h-full animate-ping rounded-full bg-blue-400/10" />
                                                <div className="absolute w-3/4 h-3/4 animate-ping rounded-full bg-blue-400/20" style={{ animationDelay: "200ms" }} />
                                                <div className="absolute w-1/2 h-1/2 animate-ping rounded-full bg-blue-400/30" style={{ animationDelay: "400ms" }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Voice Control */}
                                <div className="flex justify-center mt-4">
                                    <button
                                        onClick={isListening ? handleDoneSpeaking : startListening}
                                        className={`px-6 py-3 rounded-full font-medium text-white transition-all duration-300 flex items-center gap-3 shadow-md
                                            ${isListening 
                                                ? "bg-red-500 hover:bg-red-600" 
                                                : "bg-blue-500 hover:bg-blue-600"
                                            }`}
                                    >
                                        {isListening ? (
                                            <>
                                                <MicOff className="w-5 h-5" />
                                                Stop Recording
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="w-5 h-5" />
                                                Start Speaking
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Video Feed */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Camera className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-blue-900 font-medium">Video Feed</h3>
                                </div>
                                <div className="aspect-video bg-blue-50 rounded-xl overflow-hidden">
                                    <img 
                                        src="http://localhost:6500/video_feed1"
                                        alt="Webcam Feed"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat History - Right 4 columns */}
                    <div className="col-span-4">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                <h3 className="text-blue-900 font-medium">Interview Conversation</h3>
                            </div>
                            <div 
                                ref={chatContainerRef}
                                className="space-y-4 h-[calc(100vh-8rem)] overflow-y-auto pr-4 custom-scrollbar"
                            >
                                {messages.map((message, index) => (
                                    <div 
                                        key={index} 
                                        className={`bg-blue-50 rounded-lg p-4 ${
                                            message.type === 'user' ? 'border-l-2 border-blue-500' : 'border-l-2 border-blue-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            {message.type === 'user' ? (
                                                <>
                                                    <User className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm text-blue-700">You</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Brain className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm text-blue-700">AI</span>
                                                </>
                                            )}
                                            <span className="text-xs text-blue-500/70 ml-auto">
                                                {message.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-blue-900 text-sm">{message.text}</p>
                                    </div>
                                ))}
                                {/* Show current transcribed text if available */}
                                {transcribedText && !messages.find(m => m.text === transcribedText) && (
                                    <div className="bg-blue-50/50 rounded-lg p-4 border-l-2 border-blue-300">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm text-blue-600">You (typing...)</span>
                                        </div>
                                        <p className="text-blue-800/70 text-sm">{transcribedText}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};