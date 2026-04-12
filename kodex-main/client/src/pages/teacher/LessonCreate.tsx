import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, 
  ArrowLeft, 
  Settings2, 
  Trophy, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

interface CreateLessonData {
  title: string;
  description: string;
  content: string;
  difficulty: string;
  estimatedTime: number;
  maxAttempts: number;
  timeLimit: number;
}

export default function LessonCreate() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateLessonData>({
    title: "",
    description: "",
    content: "",
    difficulty: "beginner",
    estimatedTime: 10,
    maxAttempts: 0,
    timeLimit: 0,
  });

  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: CreateLessonData) => {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lessonData),
      });

      if (!response.ok) {
        throw new Error("Failed to create lesson");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lesson Deployed",
        description: "Your typing lesson is now available in the library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/dashboard-stats"] });
      navigate("/teacher/lessons");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast({
        title: "Missing Information",
        description: "Title and lesson content are mandatory.",
        variant: "destructive",
      });
      return;
    }

    createLessonMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateLessonData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isAuthenticated || user?.role !== "teacher") return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate("/teacher/lessons")}
            className="mb-6 text-gray-400 hover:text-white rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
          </Button>
          
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center">
            <Sparkles className="mr-4 h-8 w-8 text-amber-400" />
            Craft New Lesson
          </h2>
          <p className="text-gray-400">Design high-fidelity typing challenges with custom constraints.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8">
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-3 h-5 w-5 text-blue-500" />
                  Core Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Lesson Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter lesson title..."
                    className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Objectives / Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="What will students learn from this lesson?"
                    rows={3}
                    className="bg-white/5 border-white/10 rounded-2xl p-4 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content" className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Lesson Content (Typing Text)</Label>
                    <span className="text-[10px] text-gray-500 font-bold">{formData.content.length} characters</span>
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    placeholder="Enter the practice text here..."
                    rows={12}
                    className="bg-white/5 border-white/10 rounded-2xl p-6 font-mono text-blue-100 focus:ring-blue-500 leading-relaxed"
                    required
                  />
                  <div className="flex items-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-300 text-xs">
                    <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                    Students will be required to type this text exactly as shown. Double check for typos!
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8">
                <CardTitle className="flex items-center">
                  <Settings2 className="mr-3 h-5 w-5 text-purple-500" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Difficulty Profile</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => handleInputChange("difficulty", value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 uppercase tracking-widest text-[10px] font-bold flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> Estimated Time (Min)
                  </Label>
                  <Input
                    type="number"
                    value={formData.estimatedTime}
                    onChange={(e) => handleInputChange("estimatedTime", parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 uppercase tracking-widest text-[10px] font-bold flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Typing Time Limit (Sec)
                  </Label>
                  <Input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => handleInputChange("timeLimit", parseInt(e.target.value) || 0)}
                    placeholder="0 for unlimited"
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    min="0"
                  />
                  <p className="text-[10px] text-gray-500 italic">Forces lesson termination after time expires.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 uppercase tracking-widest text-[10px] font-bold flex items-center">
                    <Trophy className="h-3 w-3 mr-1" /> Max Attempts
                  </Label>
                  <Input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => handleInputChange("maxAttempts", parseInt(e.target.value) || 0)}
                    placeholder="0 for unlimited"
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    min="0"
                  />
                  <p className="text-[10px] text-gray-500 italic">Limits how many times a student can try.</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full h-16 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 group"
                disabled={createLessonMutation.isPending}
              >
                {createLessonMutation.isPending ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  <>
                    Deploy Lesson
                    <CheckCircle2 className="ml-2 h-5 w-5 group-hover:scale-125 transition-transform" />
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/teacher/lessons")}
                className="w-full h-14 rounded-2xl text-gray-500 hover:text-white hover:bg-white/5 font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
