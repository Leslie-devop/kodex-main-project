import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft,
  Settings,
  RefreshCw,
  Trash2,
  Save,
  Loader2
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";

interface Classroom {
  id: string;
  name: string;
  section: string;
  inviteCode?: string;
}

export default function ClassroomSettings() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/teacher/classrooms/:id/settings");
  const [, setLocation] = useLocation();
  const classroomId = params?.id;

  const { data: classroom, isLoading } = useQuery<Classroom>({
    queryKey: [`/api/classrooms/${classroomId}`],
    enabled: !!classroomId,
  });

  const [formData, setFormData] = useState({
    name: "",
    section: "",
  });

  useEffect(() => {
    if (classroom) {
      setFormData({
        name: classroom.name || "",
        section: classroom.section || "",
      });
    }
  }, [classroom]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/classrooms/${classroomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      toast({ title: "Success", description: "Room settings updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/classrooms/${classroomId}/regenerate-code`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to regenerate join code");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/classrooms/${classroomId}`], data);
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      toast({ title: "Code Regenerated", description: "A new join code has been generated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/classrooms/${classroomId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete classroom");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      toast({ title: "Success", description: "Classroom deleted" });
      setLocation("/teacher/classrooms");
    }
  });

  if (!isAuthenticated || user?.role !== "teacher") return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href={`/teacher/classrooms/${classroomId}`}>
          <Button variant="ghost" className="mb-8 text-gray-400 hover:text-white rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Room
          </Button>
        </Link>

        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Room Settings</h2>
          <p className="text-gray-400">Manage your room configuration</p>
        </div>

        <div className="space-y-6">
          {/* Room Details block */}
          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-xl font-bold">Room Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Room Name *</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl font-bold text-white h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Subject / Section</label>
                <Input 
                  value={formData.section}
                  onChange={(e) => setFormData(p => ({ ...p, section: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl font-bold text-white h-12"
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={() => updateMutation.mutate(formData)}
                  disabled={updateMutation.isPending || !formData.name}
                  className="bg-blue-600 hover:bg-blue-500 rounded-xl font-bold px-6 h-12"
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Code block */}
          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-xl font-bold">Join Code</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Current Join Code</label>
                <div className="bg-white/5 rounded-xl h-16 flex items-center justify-center border border-white/10">
                  <span className="font-mono text-2xl font-black tracking-widest text-white">
                    {classroom?.inviteCode || "N/A"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 pt-2">Students can use this code to join your room from their dashboard.</p>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold h-12"
              >
                {regenerateMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Regenerate Join Code
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone block */}
          <Card className="bg-red-500/5 border border-red-500/20 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-red-500/10 bg-red-500/[0.02]">
              <CardTitle className="text-xl font-bold text-red-500">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Deleting this room will remove all associated data including assignments, activities, and student memberships. This action cannot be undone.
              </p>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to delete this room? This action cannot be undone.")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-12 px-6"
              >
                {deleteMutation.isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Trash2 className="h-5 w-5 mr-2" />}
                Delete Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
