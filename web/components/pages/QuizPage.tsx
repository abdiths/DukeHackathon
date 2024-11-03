import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizProps {
  fileContent?: string;
  fileName?: string;
  onClose?: () => void;
}

const QuizPage = ({ fileContent, fileName, onClose }: QuizProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simulate quiz generation based on file content
  useEffect(() => {
    const generateQuiz = async () => {
      setLoading(true);
      // This is a mock example
      const mockQuestions: Question[] = [
        {
          id: 1,
          question: "What is the main topic covered in this material?",
          options: ["True", "False"],
          correctAnswer: 0,
          explanation: "This is the explanation for the correct answer."
        },
        {
          id: 2,
          question: "Which concept is most emphasized in the content?",
          options: ["True", "False"],
          correctAnswer: 1,
          explanation: "Here's why False is correct..."
        },
      ];
      
      setQuestions(mockQuestions);
      setAnswered(new Array(mockQuestions.length).fill(false));
      setLoading(false);
    };

    generateQuiz();
  }, [fileContent]);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      if (selectedAnswer === questions[currentQuestion].correctAnswer) {
        setScore(prev => prev + 1);
      }
      
      const newAnswered = [...answered];
      newAnswered[currentQuestion] = true;
      setAnswered(newAnswered);

      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
      } else {
        setShowResult(true);
      }
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswered(new Array(questions.length).fill(false));
    setShowExplanation(false);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span>Generating quiz from {fileName}...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResult) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quiz Complete!</CardTitle>
          <CardDescription>
            You scored {score} out of {questions.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(score / questions.length) * 100} 
            className="h-2 mb-4"
          />
          <Alert className={score === questions.length ? "bg-green-50" : "bg-blue-50"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {score === questions.length 
                ? "Perfect Score!" 
                : "Good Effort!"}
            </AlertTitle>
            <AlertDescription>
              {score === questions.length 
                ? "You've mastered this material!" 
                : "Review the material and try again to improve your score."}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={restartQuiz}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
        <CardDescription>
          Quiz on: {fileName}
        </CardDescription>
        <Progress 
          value={(currentQuestion / questions.length) * 100} 
          className="h-2"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-lg font-medium">
          {questions[currentQuestion].question}
        </div>
        <RadioGroup
          onValueChange={(value) => handleAnswer(parseInt(value))}
          value={selectedAnswer?.toString()}
        >
          {questions[currentQuestion].options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
        
        {showExplanation && (
          <Alert className={
            selectedAnswer === questions[currentQuestion].correctAnswer 
              ? "bg-green-50" 
              : "bg-red-50"
          }>
            {selectedAnswer === questions[currentQuestion].correctAnswer 
              ? <CheckCircle2 className="h-4 w-4 text-green-600" />
              : <XCircle className="h-4 w-4 text-red-600" />
            }
            <AlertTitle>
              {selectedAnswer === questions[currentQuestion].correctAnswer 
                ? "Correct!" 
                : "Incorrect"}
            </AlertTitle>
            <AlertDescription>
              {questions[currentQuestion].explanation}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setShowExplanation(true)}
          disabled={selectedAnswer === null}
        >
          Show Explanation
        </Button>
        <Button 
          onClick={handleNext}
          disabled={selectedAnswer === null}
        >
          {currentQuestion + 1 === questions.length ? "Finish" : "Next"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizPage;