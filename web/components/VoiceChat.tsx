import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Speaker, Send } from "lucide-react";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface Message {
  text: string;
  type: "user" | "assistant";
}

export default function VoiceChat({ files }: { files: File[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const generateSpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => setIsSpeaking(false);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      setIsSpeaking(false);
    }
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      // Create context from uploaded files
      let context = "You are a helpful AI assistant named Wiz AI. ";
      if (files.length > 0) {
        context +=
          "The user has uploaded the following files: " +
          files.map((f) => f.name).join(", ") +
          ". ";
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: context },
          ...messages.map((msg) => ({
            role: msg.type === "user" ? "user" : ("assistant" as const),
            content: msg.text,
          })),
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return (
        completion.choices[0]?.message?.content ||
        "I'm sorry, I couldn't generate a response."
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      return "I apologize, but I encountered an error while processing your request.";
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    // Add user message
    const userMessage = { text: inputText, type: "user" as const };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Get AI response
    setIsLoading(true);
    try {
      const aiResponse = await getAIResponse(inputText);
      const assistantMessage = { text: aiResponse, type: "assistant" as const };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p>{message.text}</p>
                {message.type === "assistant" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => generateSpeech(message.text)}
                    disabled={isSpeaking}
                  >
                    <Speaker className="w-4 h-4 mr-2" />
                    {isSpeaking ? "Speaking..." : "Listen"}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-100">
                <p className="animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-1"
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
            <Button variant="outline" className="flex-1" disabled={isLoading}>
              <Mic className="w-4 h-4 mr-2" />
              Voice
            </Button>
          </div>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
