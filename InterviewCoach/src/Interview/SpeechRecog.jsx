import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";

const EnhancedSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const recognitionRef = useRef(null);
  const resultBufferRef = useRef("");
  
  useEffect(() => {
    console.log("Speech Recognition State:", {
      isListening,
      transcribedText,
      recognitionActive: !!recognitionRef.current
    });
  }, [isListening, transcribedText]);

  const createSpeechRecognition = useCallback(() => {
    console.log("Creating speech recognition instance");
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error("Speech recognition not supported");
    }

    const recognition = new SpeechRecognition();

    // Optimize for accuracy and speed
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    // Add noise handling
    recognition.audioSettings = {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    // Add custom grammar if supported
    if (window.SpeechGrammarList) {
      console.log("Adding custom grammar");
      const speechGrammarList = new window.SpeechGrammarList();
      // Add domain-specific vocabulary
      const commands = [
        "yes",
        "no",
        "maybe",
        "experience",
        "skills",
        "background",
        "project",
        "challenge",
        "solution",
        "team",
        "leadership",
        "management",
      ].join(" | ");
      const grammar = `#JSGF V1.0; grammar commands; public <command> = ${commands};`;
      speechGrammarList.addFromString(grammar, 1);
      recognition.grammars = speechGrammarList;
    }

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    try {
      resultBufferRef.current = ""; // Add this line
      setTranscribedText("");
      const recognition = createSpeechRecognition();
      recognitionRef.current = recognition;

      // Implement smart result handling
      let confidenceThreshold = 0.8;
      let resultBuffer = [];
      let lastProcessedTime = Date.now();

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = resultBufferRef.current;

        // Process results with confidence weighting
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          // Implement dynamic confidence threshold
          const timeSinceLastProcess = Date.now() - lastProcessedTime;
          if (timeSinceLastProcess > 5000) {
            confidenceThreshold = Math.max(0.6, confidenceThreshold - 0.1);
          }

          if (confidence > confidenceThreshold) {
            if (result.isFinal) {
              // Use highest confidence alternative
              let bestTranscript = transcript;
              let bestConfidence = confidence;

              for (let j = 1; j < result.length; j++) {
                if (result[j].confidence > bestConfidence) {
                  bestTranscript = result[j].transcript;
                  bestConfidence = result[j].confidence;
                }
              }

              finalTranscript += bestTranscript + " ";
              resultBufferRef.current = finalTranscript;
              lastProcessedTime = Date.now();

              // Reset confidence threshold
              confidenceThreshold = 0.8;
            } else {
              interimTranscript = transcript;
            }
          }
        }

        // Smart result buffering
        resultBuffer.push({
          text: finalTranscript.trim() + " " + interimTranscript,
          timestamp: Date.now(),
        });

        // Clean old results
        const MAX_BUFFER_AGE = 2000; // 2 seconds
        resultBuffer = resultBuffer.filter(
          (item) => Date.now() - item.timestamp < MAX_BUFFER_AGE
        );

        // Update UI with smoothing
        if (resultBuffer.length > 0) {
          const latestResult = resultBuffer[resultBuffer.length - 1].text;
          setTranscribedText(latestResult);
        }
      };

      // Enhanced error handling
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        switch (event.error) {
          case "network":
            handleNetworkError(recognition);
            break;
          case "no-speech":
            handleNoSpeechError(recognition);
            break;
          case "audio-capture":
            handleAudioCaptureError();
            break;
          default:
            handleGenericError(event.error);
        }
      };

      // Continuous recognition handling
      recognition.onend = () => {
        if (isListening) {
          const restartDelay = Math.random() * 1000; // Random delay to prevent rapid restarts
          setTimeout(() => {
            recognition.start();
          }, restartDelay);
        }
      };

      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      alert(
        "Speech recognition failed to start. Please check your microphone and browser settings."
      );
    }
  }, [createSpeechRecognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      console.log("Stopping speech recognition");
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Error handling functions
  const handleNetworkError = (recognition) => {
    setTimeout(() => {
      if (isListening) recognition.start();
    }, 1000);
  };

  const handleNoSpeechError = (recognition) => {
    setTimeout(() => {
      if (isListening) recognition.start();
    }, 500);
  };

  const handleAudioCaptureError = () => {
    alert("Please check your microphone settings and permissions.");
    setIsListening(false);
  };

  const handleGenericError = (error) => {
    console.warn(`Speech recognition error: ${error}`);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    transcribedText,
    startListening,
    stopListening,
  };
};

export default EnhancedSpeechRecognition;
