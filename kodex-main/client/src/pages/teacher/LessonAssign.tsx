import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Calendar, Users, BookOpen, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  estimatedTime: number;
}

interface AssignmentData {
  lessonId: string;
  studentId: string;
  dueDate?: string;
}

export default function LessonAssign() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/teacher/lessons/:id/assign");
  const lessonId = params?.id;

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  // Fetch lesson details
  const { data: lesson, isLoading: lessonLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
    retry: false,
  });

  // Fetch students
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/teacher/students"],
    retry: false,
  });

  // Assignment creation mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignments: AssignmentData[]) => {
      const promises = assignments.map(assignment =>
        fetch("/api/assignments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assignment),
        })
      );
      
      const responses = await Promise.all(promises);
      const failedResponses = responses.filter(response => !response.ok);
      
      if (failedResponses.length > 0) {
        throw new Error(`Failed to create ${failedResponses.length} assignment(s)`);
      }
      
      return responses.map(response => response.json());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Lesson assigned to ${selectedStudents.length} student(s) successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/teacher"] });
      // Navigate back to lessons
      window.location.href = "/teacher/lessons";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  if (!lessonId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson Not Found</h2>
          <p className="text-gray-600">The lesson you're trying to assign was not found.</p>
          <Link href="/teacher/lessons">
            <Button className="mt-4">Back to Lessons</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students?.map(s => s.id) || []);
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    if (students && selectedStudents.length === students.length && students.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, students]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student.",
        variant: "destructive",
      });
      return;
    }

    if (!lessonId) {
      toast({
        title: "Error",
        description: "Lesson ID is required.",
        variant: "destructive",
      });
      return;
    }

    const assignments: AssignmentData[] = selectedStudents.map(studentId => ({
      lessonId,
      studentId,
      ...(dueDate && { dueDate: new Date(dueDate).toISOString() }),
    }));

    createAssignmentMutation.mutate(assignments);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (lessonLoading || studentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/teacher/lessons" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Lessons
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assign Lesson</h2>
          <p className="text-gray-600">Select students to assign this lesson to.</p>
        </div>

        {/* Lesson Details */}
        {lesson && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  {lesson.title}
                </CardTitle>
                <Badge className={getDifficultyColor(lesson.difficulty)}>
                  {lesson.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lesson.description && (
                  <p className="text-gray-600">{lesson.description}</p>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Estimated time: {lesson.estimatedTime} minutes
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Content Preview:</h4>
                  <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                    <p className="font-mono text-sm text-gray-700 whitespace-pre-wrap">
                      {lesson.content}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Assignment Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                  data-testid="input-due-date"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave blank for no due date
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Student Selection */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Select Students ({selectedStudents.length} selected)
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                  <Label htmlFor="selectAll" className="text-sm">
                    Select All
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students && students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                      data-testid={`student-card-${student.id}`}
                    >
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleStudentToggle(student.id)}
                        data-testid={`checkbox-student-${student.id}`}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={`student-${student.id}`}
                          className="font-medium text-gray-900 cursor-pointer"
                        >
                          {student.firstName} {student.lastName}
                        </Label>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                  <p className="text-gray-600">There are no students registered yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/teacher/lessons">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createAssignmentMutation.isPending || selectedStudents.length === 0}
              data-testid="button-assign-lesson"
            >
              {createAssignmentMutation.isPending 
                ? "Assigning..." 
                : `Assign to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}