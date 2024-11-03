"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, MessageSquare, Brain, X } from "lucide-react";
import { useSession } from "next-auth/react";
import VoiceChat from "../VoiceChat";

// Add local storage helpers
const LOCAL_STORAGE_KEYS = {
  FILES: 'wiz-ai-files',
  MESSAGES: 'wiz-ai-messages',
};

interface FileWithPreview extends File {
  preview?: string;
  path?: string;
}

interface Message {
  text: string;
  type: "user" | "assistant";
}

export default function DashboardPage() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const { data: session } = useSession();

  // Load saved files and messages from localStorage
  useEffect(() => {
    const loadSavedData = () => {
      const savedFiles = localStorage.getItem(LOCAL_STORAGE_KEYS.FILES);
      const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEYS.MESSAGES);

      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        setFiles(parsedFiles.map((file: any) => {
          // Recreate File objects from stored data
          return new File([new Blob()], file.name, {
            type: file.type,
          }) as FileWithPreview;
        }));
      }

      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    };

    loadSavedData();
  }, []);

  // Save files and messages to localStorage when they change
  useEffect(() => {
    const filesToSave = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }));
    localStorage.setItem(LOCAL_STORAGE_KEYS.FILES, JSON.stringify(filesToSave));
  }, [files]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = event.target.files;
    if (!fileList) return;

    setUploading(true);
    try {
      const newFiles = Array.from(fileList).map((file) => {
        const newFile = new File([file], file.name, {
          type: file.type,
        }) as FileWithPreview;
        newFile.preview = URL.createObjectURL(file);
        newFile.path = file.name;
        return newFile;
      });
      setFiles((prev) => [...prev, ...newFiles]);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated upload
      setActiveTab("chat");
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(prevFiles => {
      const newFiles = prevFiles.filter((_, index) => index !== indexToRemove);
      return newFiles;
    });
  };

  const handleViewClick = () => {
    setActiveTab("chat");
  };

  const FileItem = ({ file, index }: { file: FileWithPreview; index: number }) => {
    const [showDelete, setShowDelete] = useState(false);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    return (
      <div
        className="relative flex items-center p-2 bg-white rounded-md border group"
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
      >
        <FileText className="w-4 h-4 mr-2 text-blue-500" />
        <span className="flex-1">{file.name}</span>
        <span className="text-sm text-gray-500 mr-2">{fileSizeMB} MB</span>
        {showDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
            onClick={() => handleRemoveFile(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Hi, {session?.user?.name}!</h1>
          <p className="text-gray-600">
            Manage your learning materials and study sessions
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* TabsList remains the same */}
          <TabsList>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Wiz AI
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="w-4 h-4 mr-2" />
              My Content
            </TabsTrigger>
            <TabsTrigger value="quiz">
              <Brain className="w-4 h-4 mr-2" />
              Quiz Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Material</CardTitle>
                <CardDescription>
                  Upload your lecture notes, slides, or any study material
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="material">Material Type</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="lecture">Lecture Notes</option>
                    <option value="slides">Slides</option>
                    <option value="textbook">Textbook Chapter</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    multiple
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Uploaded Files</h3>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <FileItem key={index} file={file} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Academic Content</CardTitle>
                <CardDescription>
                  Access and manage your uploaded materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No content uploaded yet. Start by uploading some learning
                    materials!
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {files.map((file, index) => {
                      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border"
                        >
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 mr-3 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{file.name}</h4>
                              <p className="text-sm text-gray-500">
                                Uploaded just now • {fileSizeMB} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleViewClick}
                          >
                            Talk with Wiz AI
                          </Button>
                        </div>
                      )}
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Learning Assistant</CardTitle>
                <CardDescription>
                  Chat with Wiz AI about your learning materials using voice or text
                </CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Upload some learning materials to start chatting with Wiz AI!
                  </div>
                ) : (
                  <VoiceChat 
                    files={files}
                    messages={messages}
                    setMessages={setMessages}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="quiz">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Mode</CardTitle>
                <CardDescription>
                  Test your knowledge with AI-generated quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Upload some materials first to generate quizzes!
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a document to generate a quiz from its contents!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}