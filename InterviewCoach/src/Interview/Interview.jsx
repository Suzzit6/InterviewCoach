import { useState, useRef } from "react";
import axios from "axios";
import WebcamFeed from "./WebcamFeed";
import { AudioVisualizer } from 'react-audio-visualize';

export function Interview() {
  const [audioUrl, setAudioUrl] = useState("");
  const [transcribedText, setTranscribedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const userId = "user123";

  const startListening = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new (window.webkitSpeechRecognition ||
      window.SpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = true; // Keep listening until stopped
    recognition.interimResults = false; // Only return final results
    recognitionRef.current = recognition; // Store instance

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      setTranscribedText(text.trim()); // Store full transcribed text
    };

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    generateVoice(transcribedText); // Send transcribed text to AI voice
  };

  const generateVoice = async (text) => {
    if (!text) return; // Don't generate if no text is captured

    try {
      const response1 = await axios.get(
        "http://localhost:5000",
      );
      const response = await axios.post(
        "http://localhost:5000/generate-voice",
        { userId, text, role: "data analyst" },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
    } catch (error) {
      console.error("Error generating voice:", error);
    }
  };

  return (
    <div>
      <button onClick={startListening} disabled={isListening}>
        🎙️ Start Talking
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        ✋ Stop Talking
      </button>
      <p>📝 Transcribed Text: {transcribedText}</p>
      {audioUrl && <audio src={audioUrl} controls autoPlay />}
    </div>
  );
}
