import React, { useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  MoreVertical,
  Presentation as PresentationScreen,
  Brain,
  ChevronRight,
} from "lucide-react";
import EnhancedSpeechRecognition from "./SpeechRecog";

export const InterviewCoach = () => {
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [messages, setMessages] = useState([]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const userId = "user123";
  const chatContainerRef = useRef(null);
  const [interviewResults, setInterviewResults] = useState(null);

  const { isListening, transcribedText, startListening, stopListening } =
    EnhancedSpeechRecognition();

  const fetchAndStoreConversation = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/get-conversation/${userId}`
      );
      const data = await response.json();

      if (data.success) {
        // Store in localStorage
        localStorage.setItem(
          "interviewConversation",
          JSON.stringify({
            conversation: data.conversation,
            timestamp: new Date().toISOString(),
          })
        );

        // Update state if needed
        setMessages(data.conversation);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const handleDoneSpeaking = async () => {
    stopListening();

    if (transcribedText) {
      // Add user message to chat
      setMessages((prev) => [
        ...prev,
        { type: "user", text: transcribedText, timestamp: new Date()},
      ]);

      // Generate AI response
      await generateVoice(transcribedText);
    }
  };

  const generateVoice = async (text) => {
    if (!text?.trim()) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("http://localhost:5000/generate-voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, text, role: "Full Stack development" }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.actions) {
        if (data.actions.endInterview) {
          handleEndInterview();
        }
        if (data.actions.codingTask) {
          console.log("Coding task detected!");
          alert("You have a coding task to complete!");
        }
      }
      const audioData = Uint8Array.from(atob(data.audio), (c) =>
        c.charCodeAt(0)
      );
      const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
      const url = URL.createObjectURL(audioBlob);

      setAudioUrl(url);
      setAiResponse(data.text);
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: data.text, timestamp: new Date() },
      ]);
      setIsPlaying(true);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (error) {
      console.error("Error generating voice:", error);
      setIsPlaying(false);
      alert("Failed to generate voice response. Please try again.");
    }
  };

  const handleEndInterview = async () => {
    try {
      // Fetch and store conversation first
      await fetchAndStoreConversation();

      const response = await fetch("http://localhost:6500/api/end-interview");
      const results = await response.json();

      // Store results in localStorage
      localStorage.setItem(
        "lastInterviewResults",
        JSON.stringify({
          ...results,
          timestamp: new Date().toISOString(),
        })
      );

      setInterviewResults(results);

      // Stop any ongoing recording
      if (isListening) {
        handleDoneSpeaking();
      }
    } catch (error) {
      console.error("Error ending interview:", error);
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    if (!isMicOn) {
      startListening();
    } else {
      handleDoneSpeaking();
    }
    setIsMicOn(!isMicOn);
  };

  return (
    <div className="min-h-[90vh] bg-[#202124] relative">
      {/* Main Video Grid */}
      <div className="h-[calc(81vh-5rem)] w-[calc(150vh)] p-4 grid grid-cols-2 gap-4">
        {/* User Video */}
        <div className="relative rounded-lg overflow-hidden bg-[#3c4043] shadow-lg">
          <img
            src="http://localhost:6500/video_feed1"
            alt="Your video"
            className={`w-full h-full object-cover ${!isCameraOn && "hidden"}`}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-[#5f6368] flex items-center justify-center">
                <span className="text-4xl text-white">You</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-[#000000cc] text-white px-3 py-1 rounded-md text-sm">
            You
          </div>
        </div>

        {/* AI Video */}
        <div className="relative rounded-lg overflow-hidden bg-[#3c4043] shadow-lg">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Audio Visualization Rings */}
              {isPlaying && (
                <>
                  <div className="absolute inset-0 -m-8">
                    <div className="absolute inset-0 border-4 border-blue-400/20 rounded-full animate-[ping_2s_ease-in-out_infinite]"></div>
                  </div>
                  <div className="absolute inset-0 -m-12">
                    <div className="absolute inset-0 border-4 border-blue-400/15 rounded-full animate-[ping_2s_ease-in-out_infinite_500ms]"></div>
                  </div>
                  <div className="absolute inset-0 -m-16">
                    <div className="absolute inset-0 border-4 border-blue-400/10 rounded-full animate-[ping_2s_ease-in-out_infinite_1000ms]"></div>
                  </div>
                  {/* Circular Wave Animation */}
                  <div className="absolute inset-0 -m-6">
                    <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full animate-[wave_2s_ease-in-out_infinite]"></div>
                  </div>
                </>
              )}
              <div
                className={`w-24 h-24 rounded-full bg-[#1a73e8] flex items-center justify-center transition-transform duration-300 ${
                  isPlaying ? "scale-110" : "scale-100"
                }`}
              >
                <Brain
                  className={`w-16 h-16 text-white transition-all duration-300 ${
                    isPlaying ? "opacity-100 scale-110" : "opacity-80 scale-100"
                  }`}
                />
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 bg-[#000000cc] text-white px-3 py-1 rounded-md text-sm">
            AI Assistant
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-12 left-0  right-0 h-16 bg-[#202124] border-t border-[#3c4043]">
        <div className="max-w-screen-xl mx-auto h-full flex items-center justify-between px-8">
          {/* Time */}
          <div className="text-[#e8eaed] text-sm">
            {new Date().toLocaleTimeString()}
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full transition-all duration-300 ${
                isMicOn
                  ? "bg-[#3c4043] hover:bg-[#4a4d51]"
                  : "bg-[#ea4335] hover:bg-[#ea4335]/80"
              }`}
            >
              {isMicOn ? (
                <Mic className="w-6 h-6 text-white" />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all duration-300 ${
                isCameraOn
                  ? "bg-[#3c4043] hover:bg-[#4a4d51]"
                  : "bg-[#ea4335] hover:bg-[#ea4335]/80"
              }`}
            >
              {isCameraOn ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={handleEndInterview}
              className="p-4 rounded-full bg-[#ea4335] hover:bg-[#ea4335]/80 transition-all duration-300"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-3 rounded-full hover:bg-[#3c4043] transition-all duration-300"
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </button>
            <button className="p-3 rounded-full hover:bg-[#3c4043] transition-all duration-300">
              <Users className="w-6 h-6 text-white" />
            </button>
            <button className="p-3 rounded-full hover:bg-[#3c4043] transition-all duration-300">
              <Settings className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="absolute top-0 right-0 bottom-0 w-[360px] bg-white shadow-xl transition-all duration-300 transform translate-x-0">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <button
              onClick={() => setShowChat(false)}
              className="p-2 hover:bg-gray-200 rounded-full transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-medium text-gray-900">
              Interview Chat
            </h3>
            <div className="w-8" /> {/* Spacer for alignment */}
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="h-[calc(100vh-9rem)] overflow-y-auto p-4 space-y-4 bg-gray-50/50"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start speaking to begin the interview</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-[80%] ${
                      message.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs ${
                          message.type === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.type === "user" ? "You" : "AI Assistant"}
                      </span>
                      <span
                        className={`text-xs ${
                          message.type === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm break-words">{message.text}</p>
                  </div>
                </div>
              ))
            )}

            {/* Live Transcription */}
            {transcribedText && (
              <div className="flex justify-end">
                <div className="p-3 rounded-lg bg-blue-100 text-gray-800 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-blue-500">You</span>
                    <span className="text-xs text-blue-400">
                      <span className="animate-pulse">●</span> Speaking...
                    </span>
                  </div>
                  <p className="text-sm break-words">{transcribedText}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// export default InterviewCoach;
