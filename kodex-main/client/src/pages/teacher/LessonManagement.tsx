
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Edit, Trash2, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  estimatedTime: number;
  createdAt: string;
}

export default function LessonManagement() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    content: "",
    difficulty: "beginner",
    estimatedTime: 10
  });

  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
    retry: false,
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiRequest("DELETE", `/api/lessons/${lessonId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lesson deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof lessonForm }) => {
      const response = await apiRequest("PUT", `/api/lessons/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      setEditingLesson(null);
      setIsEditOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Lesson updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lesson",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setLessonForm({
      title: "",
      description: "",
      content: "",
      difficulty: "beginner",
      estimatedTime: 10
    });
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || "",
      content: lesson.content,
      difficulty: lesson.difficulty,
      estimatedTime: lesson.estimatedTime || 10
    });
    setIsEditOpen(true);
  };

  const handleSubmit = () => {
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data: lessonForm });
    }
  };

  if (!isAuthenticated || user?.role !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleDelete = (lesson: Lesson) => {
    setDeletingLesson(lesson);
  };

  const handleAssign = (lessonId: string) => {
    navigate(`/teacher/lessons/${lessonId}/assign`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "intermediate": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "advanced": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-white/5 text-gray-400 border-white/10";
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">Lesson Repository</h2>
            <p className="text-gray-400 font-medium font-mono text-sm uppercase tracking-widest">Protocol Management: Lesson Architect Module</p>
          </div>
          <Button onClick={() => navigate("/teacher/lessons/create")} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8 h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/10">
            <Plus className="h-4 w-4 mr-2" />
            Initialize New Lesson
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2.5rem] animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : lessons && lessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-2xl">
                <CardHeader className="p-8 pb-4 border-b border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{lesson.title}</CardTitle>
                    <Badge className={`${getDifficultyColor(lesson.difficulty)} text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm`}>
                      {lesson.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                  {lesson.description && (
                    <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">{lesson.description}</p>
                  )}
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-400 transition-colors">
                      <Clock className="h-3 w-3 mr-2" />
                      SYNCHRONIZATION DURATION: {lesson.estimatedTime} Min
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Protocol Preview Source:</p>
                      <div className="font-mono text-[10px] bg-black/40 text-blue-400/80 p-4 rounded-2xl border border-white/5 line-clamp-3 leading-relaxed">
                        {lesson.content}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest h-11 rounded-xl transition-all"
                        onClick={() => openEditDialog(lesson)}
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Modify
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest h-11 rounded-xl transition-all"
                        onClick={() => navigate(`/teacher/lessons/${lesson.id}/assign`)}
                      >
                        Deploy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 h-11 w-11 p-0 rounded-xl transition-all"
                        onClick={() => handleDelete(lesson)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border border-dashed border-white/10 rounded-[3rem] p-20">
            <CardContent className="text-center">
              <BookOpen className="h-20 w-20 mx-auto mb-6 text-gray-700" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Repository Empty</h3>
              <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">No typing protocols found in the database. Initialize your first lesson to begin.</p>
              <Button onClick={() => navigate("/teacher/lessons/create")} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8 h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/10">
                <Plus className="h-4 w-4 mr-2" />
                Initialize First Protocol
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Lesson Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          if (!open) {
            setIsEditOpen(false);
            setEditingLesson(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lesson</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                  placeholder="Lesson title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                  placeholder="Brief description of the lesson"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={lessonForm.difficulty} onValueChange={(value) => setLessonForm({...lessonForm, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={lessonForm.estimatedTime}
                    onChange={(e) => setLessonForm({...lessonForm, estimatedTime: Number(e.target.value)})}
                    min="1"
                    max="180"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="content">Lesson Content</Label>
                <Textarea
                  id="content"
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({...lessonForm, content: e.target.value})}
                  placeholder="Enter the text content for typing practice..."
                  rows={10}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Characters: {lessonForm.content.length} | Words: {lessonForm.content.split(' ').filter(w => w).length}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  disabled={updateLessonMutation.isPending}
                >
                  {updateLessonMutation.isPending ? "Updating..." : "Update Lesson"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingLesson(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingLesson} onOpenChange={(open) => !open && setDeletingLesson(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingLesson?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingLesson) {
                    deleteLessonMutation.mutate(deletingLesson.id);
                    setDeletingLesson(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Lesson
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
