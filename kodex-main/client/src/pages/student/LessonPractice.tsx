import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import TypingSession from "@/components/typing/TypingSession";
import AISuggestions from "@/components/student/AISuggestions";
import PostureGuide from "@/components/student/PostureGuide";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Target, Clock } from "lucide-react";
import { Link } from "wouter";

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  content: string;
}

export default function LessonPractice() {
  const [match, params] = useRoute("/student/lesson/:lessonId");
  const { user, isAuthenticated } = useAuth();
  const lessonId = params?.lessonId;

  // Fetch lesson data
  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
    retry: false,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">You need to be logged in to access this lesson.</p>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "intermediate":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-white/10 rounded w-1/3"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
            <div className="h-64 bg-white/10 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#0f172a]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <BookOpen className="mx-auto h-20 w-20 text-gray-700 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Lesson Not Found
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              The requested educational mission parameters were not found in the local intelligence database.
            </p>
            <Link to="/student/lessons">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-12 px-8 font-bold">
                <ArrowLeft className="h-4 w-4 mr-2" />
                RETURN TO MISSION HUB
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Lesson Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <Link to="/student/lessons">
              <Button variant="ghost" className="text-gray-400 hover:text-white rounded-xl" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Mission Hub
              </Button>
            </Link>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-4" data-testid="text-lesson-title">
                  {lesson.title}
                </h1>
                <p className="text-xl text-gray-400 max-w-3xl leading-relaxed" data-testid="text-lesson-description">
                  {lesson.description}
                </p>
              </div>
              <Badge className={`px-4 py-1 text-xs font-black uppercase tracking-widest ${getDifficultyColor(lesson.difficulty)}`}>
                {lesson.difficulty}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                Est. Time: {lesson.estimatedTime} Minutes
              </div>
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2 text-emerald-500" />
                Objective: Precision & Velocity
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Typing Area */}
          <div className="lg:col-span-3 space-y-12">
            <TypingSession lessonId={lessonId} />
          </div>

          {/* Sidebar Components */}
          <div className="space-y-8">
            {/* Lesson Info Card */}
            <Card data-testid="card-lesson-info" className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border-t-4 border-t-blue-500/50">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Lesson Protocol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                    Difficulty Level
                  </div>
                  <Badge className={`w-full justify-center px-4 py-1 text-xs font-bold uppercase ${getDifficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                    Operational Limit
                  </div>
                  <div className="flex items-center text-lg font-bold text-white">
                    <Clock className="h-5 w-5 mr-3 text-blue-500" />
                    {lesson.estimatedTime} Minutes
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                    Neural Focus Areas
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/5 border-white/10 text-gray-400 text-[10px] font-bold px-3 py-1">VELOCITY</Badge>
                    <Badge className="bg-white/5 border-white/10 text-gray-400 text-[10px] font-bold px-3 py-1">PRECISION</Badge>
                    <Badge className="bg-white/5 border-white/10 text-gray-400 text-[10px] font-bold px-3 py-1">CADENCE</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posture Guide */}
            <PostureGuide />

            {/* AI Suggestions */}
            <AISuggestions />
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-16">
          <Card data-testid="card-lesson-tips" className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-white/5">
              <CardTitle className="text-2xl font-bold flex items-center">
                <Target className="mr-4 h-6 w-6 text-amber-500" />
                Operational Intel & Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Pre-Mission Protocol</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-4 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">Position your neural connectors (fingers) correctly on the home-row anchors.</span>
                    </li>
                    <li className="flex items-start space-x-4 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">Calibrate your visual sensors; ensure ergonomic alignment with the data terminal.</span>
                    </li>
                    <li className="flex items-start space-x-4 text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">Sync your respiratory rhythm; stay calm and focused for optimal cadence.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Active engagement tactics</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-4 text-gray-400">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">Prioritize precision coefficients over raw velocity; speed matures with rhythm.</span>
                    </li>
                    <li className="flex items-start space-x-4 text-gray-400">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">Maintain a consistent neural flow; avoid stutter-stepping between keystrokes.</span>
                    </li>
                    <li className="flex items-start space-x-4 text-gray-400">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">Rely on muscle memory protocols; decouple visual tracking from physical input.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}