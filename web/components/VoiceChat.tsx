import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function VoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        // Here you would typically send the audioBlob to your AI service
        // For now, we'll just add the transcript to messages
        if (transcript) {
          setMessages((prev) => [
            ...prev,
            { role: "user", content: transcript },
          ]);
          // Simulate AI response
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `I understood your message: "${transcript}". How can I help you learn about this topic?`,
              },
            ]);
          }, 1000);
        }
      };

      mediaRecorder.current.start();
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setTranscript("");
  };

  const playResponse = async (message: string) => {
    if ("speechSynthesis" in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopPlaying = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <p>{message.content}</p>
                {message.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      isPlaying ? stopPlaying() : playResponse(message.content)
                    }
                  >
                    {isPlaying ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recording Interface */}
      <div className="border-t p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {transcript && (
              <p className="text-sm text-gray-600">
                Current transcript: {transcript}
              </p>
            )}
          </div>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-2" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" /> Start Recording
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
