"use client";

import { useState } from "react";
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
import { Upload, FileText, MessageSquare, Brain } from "lucide-react";
import { useSession } from "next-auth/react";
import VoiceChat from "../VoiceChat";

export default function DashboardPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const { data: session } = useSession();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileList = event.target.files;
    if (!fileList) return;

    setUploading(true);
    try {
      const newFiles = Array.from(fileList);
      setFiles((prev) => [...prev, ...newFiles]);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated upload
      setActiveTab("chat");
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleViewClick = () => {
    setActiveTab("chat");
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
          <TabsList>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="w-4 h-4 mr-2" />
              My Content
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Wiz AI
            </TabsTrigger>
            <TabsTrigger value="quiz">
              <Brain className="w-4 h-4 mr-2" />
              Quiz Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Learning Material</CardTitle>
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
                  />
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">Uploaded Files</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center p-2 bg-white rounded-md border"
                      >
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="flex-1">{file.name}</span>
                        <span className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>My Learning Content</CardTitle>
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
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border"
                      >
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-3 text-blue-500" />
                          <div>
                            <h4 className="font-medium">{file.name}</h4>
                            <p className="text-sm text-gray-500">
                              Uploaded just now •{" "}
                              {(file.size / 1024 / 1024).toFixed(2)} MB
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Wiz AI Assistant</CardTitle>
                <CardDescription>
                  Chat with Wiz AI about your learning materials using voice or
                  text
                </CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Upload some learning materials to start chatting with Wiz
                    AI!
                  </div>
                ) : (
                  <VoiceChat />
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
                <div className="text-center py-8 text-gray-500">
                  Select a document to generate a quiz from its contents!
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
