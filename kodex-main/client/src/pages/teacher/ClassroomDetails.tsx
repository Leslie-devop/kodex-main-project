import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Search,
  ArrowLeft,
  Mail,
  Loader2,
  Check,
  Plus
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

interface Classroom {
  id: string;
  name: string;
  section: string;
}

export default function ClassroomDetails() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/teacher/classrooms/:id");
  const classroomId = params?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const { data: classroom } = useQuery<Classroom>({
    queryKey: [`/api/classrooms/${classroomId}`],
    enabled: !!classroomId,
  });

  const { data: classroomStudents, isLoading: isRosterLoading } = useQuery<User[]>({
    queryKey: [`/api/classrooms/${classroomId}/students`],
    enabled: !!classroomId,
  });

  const { data: allStudents } = useQuery<User[]>({
    queryKey: ["/api/teacher/students"],
  });

  const addStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await fetch(`/api/classrooms/${classroomId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) throw new Error("Failed to add student");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/students`] });
      toast({ title: "Student Added", description: "The student has been added to the roster." });
    }
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await fetch(`/api/classrooms/${classroomId}/students/${studentId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to remove student");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/students`] });
      toast({ title: "Student Removed", description: "The student has been removed from the roster." });
    }
  });

  if (!isAuthenticated || user?.role !== "teacher") return null;

  const availableStudents = allStudents?.filter(s => 
    !classroomStudents?.some(cs => cs.id === s.id) &&
    (s.firstName?.toLowerCase().includes(studentSearch.toLowerCase()) || 
     s.username?.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const filteredRoster = classroomStudents?.filter(s => 
    s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/teacher/classrooms">
          <Button variant="ghost" className="mb-8 text-gray-400 hover:text-white rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classrooms
          </Button>
        </Link>

        {classroom && (
          <div className="mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-white">{classroom.name}</h2>
            <p className="text-gray-400 uppercase tracking-[0.2em] font-black text-xs">{classroom.section || "General Section"}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roster Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center">
                <Users className="mr-3 h-5 w-5 text-blue-500" />
                Student Roster
                <span className="ml-3 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                  {classroomStudents?.length || 0} Total
                </span>
              </h3>
              
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Filter roster..." 
                  className="pl-10 bg-white/5 border-white/10 rounded-xl w-64 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                {isRosterLoading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto" />
                  </div>
                ) : filteredRoster && filteredRoster.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {filteredRoster.map((student) => (
                      <div key={student.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/5 font-bold text-blue-400">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-bold text-white uppercase tracking-tight">{student.firstName} {student.lastName}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Mail className="h-3 w-3 mr-1" /> {student.email}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                          onClick={() => removeStudentMutation.mutate(student.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center">
                    <Users className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No students in roster</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Students Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <UserPlus className="mr-3 h-5 w-5 text-emerald-500" />
              Add Students
            </h3>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl sticky top-24">
              <CardContent className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Search directory..." 
                    className="pl-10 bg-white/5 border-white/10 rounded-xl"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableStudents && availableStudents.length > 0 ? (
                    availableStudents.map((s) => (
                      <div key={s.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.08] transition-all flex items-center justify-between group">
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm truncate">{s.firstName} {s.lastName}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">@{s.username}</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg h-8 w-8 p-0"
                          onClick={() => addStudentMutation.mutate(s.id)}
                          disabled={addStudentMutation.isPending}
                        >
                          {addStudentMutation.isPending ? <Loader2 className="animate-spin h-3 w-3" /> : <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-xs italic">No matching students found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
