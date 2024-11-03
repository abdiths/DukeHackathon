import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Speaker, Send, FileText } from "lucide-react";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface Message {
  text: string;
  type: "user" | "assistant";
}

interface FileWithPreview extends File {
  preview?: string;
  path?: string;
}

export default function VoiceChat({ files }: { files: FileWithPreview[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcomeMessage = {
      text: "Hey there! 👋 I'm Wiz AI, your AI learning assistant! I've noticed you've uploaded " + 
      (files.length === 1 ? "a document" : files.length + " documents") + 
      ". I'm here to help you understand the material, quiz you on the content, or just chat about what you're learning. What would you like to focus on today?",
      type: "assistant" as const
    };
    setMessages([welcomeMessage]);
  }, [files]);

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
      let context = `You are Wiz AI, a friendly and encouraging learning assistant. You should:
      - Be conversational and enthusiastic about helping students learn
      - Use emoji occasionally to keep the tone light and engaging
      - Break down complex topics into simpler terms
      - Provide examples and analogies to help understanding
      - Ask follow-up questions to ensure understanding
      - Encourage critical thinking rather than just giving answers
      - Be supportive and motivating
      
      The user has uploaded the following files: ${files.map(f => f.name).join(", ")}. 
      Refer to these materials in your responses when relevant.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system" as const, content: context },
          ...messages.map((msg) => ({
            role: msg.type as "user" | "assistant",
            content: msg.text,
          })),
          { role: "user" as const, content: userMessage },
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

    const userMessage = { text: inputText, type: "user" as const };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

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
      {/* Uploaded Files Section */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-sm font-medium mb-2">Uploaded Materials:</h3>
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center p-2 bg-white rounded-md border text-sm"
            >
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              <span>{file.name}</span>
            </div>
          ))}
        </div>
      </div>

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
                <p className="whitespace-pre-wrap">{message.text}</p>
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
            placeholder="Ask me anything about your materials..."
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