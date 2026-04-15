import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  School, 
  Plus, 
  Users, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Search,
  ExternalLink,
  Loader2,
  X,
  Settings,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface Classroom {
  id: string;
  name: string;
  section: string;
  description?: string;
  inviteCode?: string;
}

export default function Classrooms() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    section: "",
    description: ""
  });

  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: classrooms, isLoading } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    retry: false,
    refetchInterval: 60000,
  });


  const createMutation = useMutation({
    mutationFn: async (data: typeof newClassroom) => {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to create classroom");
      return json;
    },
    onSuccess: (newClassroom) => {
      queryClient.setQueryData<Classroom[]>(["/api/classrooms"], (old) => {
        if (!old) return [newClassroom];
        return [newClassroom, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/dashboard-stats"] });
      setIsCreateOpen(false);
      setNewClassroom({ name: "", section: "", description: "" });
      toast({ title: "Success", description: "Classroom created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/classrooms/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to delete classroom");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/dashboard-stats"] });
      toast({ title: "Success", description: "Classroom deleted" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async (data: Classroom) => {
      const res = await fetch(`/api/classrooms/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, section: data.section }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to update classroom");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      setIsEditOpen(false);
      setEditingClassroom(null);
      toast({ title: "Success", description: "Classroom updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/classrooms/${id}/regenerate-code`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to regenerate code");
      return res.json();
    },
    onSuccess: (updatedClassroom) => {
      queryClient.setQueryData<Classroom[]>(["/api/classrooms"], (old) => {
        if (!old) return old;
        return old.map(c => c.id === updatedClassroom.id ? updatedClassroom : c);
      });
      toast({ title: "Success", description: "Join code regenerated" });
    }
  });

  if (!isAuthenticated || user?.role !== "teacher") {
    return null;
  }

  const filteredClassrooms = classrooms?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center text-slate-900 dark:text-white">
              <School className="mr-4 h-8 w-8 text-blue-600 dark:text-blue-500" />
              Classrooms
            </h2>
            <p className="text-slate-500 dark:text-gray-400">Establish and manage your student educational groups.</p>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="Search rooms..." 
                className="pl-10 w-full md:w-64 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6 h-11 shadow-lg shadow-blue-500/20">
                  <Plus className="mr-2 h-5 w-5" />
                  New Room
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/10 text-slate-900 dark:text-white rounded-3xl backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">Create New Room</DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-gray-400">
                    Fill in the details to create a new room
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Room Name *</label>
                    <Input 
                      placeholder="e.g., Typing Class" 
                      className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl h-12 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      value={newClassroom.name}
                      onChange={(e) => setNewClassroom({...newClassroom, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Teacher Name *</label>
                    <Input 
                      readOnly
                      value={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || ''}
                      className="bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl h-12 text-slate-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Subject (Optional)</label>
                    <Input 
                      placeholder="e.g., Computer Science" 
                      className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl h-12 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      value={newClassroom.section}
                      onChange={(e) => setNewClassroom({...newClassroom, section: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Description (Optional)</label>
                    <Textarea 
                      placeholder="Brief description of this room..." 
                      className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl min-h-[100px] text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-y"
                      value={newClassroom.description}
                      onChange={(e) => setNewClassroom({...newClassroom, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl h-12 font-bold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createMutation.mutate(newClassroom)}
                    disabled={createMutation.isPending || !newClassroom.name}
                    className="bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-bold px-8 text-white shadow-lg"
                  >
                    {createMutation.isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                    Create Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="bg-[#1e293b] border-white/10 text-white rounded-3xl backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Edit Classroom</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Update the details of your educational group.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Room Name</label>
                    <Input 
                      placeholder="e.g. BSIT-4 Keyboarding" 
                      className="bg-white/5 border-white/10 rounded-xl h-12"
                      value={editingClassroom?.name || ""}
                      onChange={(e) => editingClassroom && setEditingClassroom({...editingClassroom, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Section / Period</label>
                    <Input 
                      placeholder="e.g. Afternoon Session" 
                      className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl h-12 text-slate-900 dark:text-white"
                      value={editingClassroom?.section || ""}
                      onChange={(e) => editingClassroom && setEditingClassroom({...editingClassroom, section: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl h-12 font-bold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => editingClassroom && editMutation.mutate(editingClassroom)}
                    disabled={editMutation.isPending || !editingClassroom?.name}
                    className="bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-bold px-8"
                  >
                    {editMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : filteredClassrooms && filteredClassrooms.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredClassrooms.map((room) => (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden relative border-l-4 border-l-blue-500 flex flex-col h-full shadow-sm dark:shadow-none">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{room.name}</h3>
                        <p className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">{room.section || "No Section"}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-4 border border-gray-100 dark:border-white/5 mb-6 text-center shadow-inner">
                        <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Join Code</p>
                        <div className="font-mono text-3xl font-black text-slate-900 dark:text-white tracking-[0.2em] mb-3">
                          {room.inviteCode ? room.inviteCode : (
                            <span className="text-amber-500 text-lg tracking-normal">MISSING</span>
                          )}
                        </div>
                        <Button 
                          variant={room.inviteCode ? "ghost" : "default"}
                          size="sm"
                          onClick={() => regenerateMutation.mutate(room.id)}
                          disabled={regenerateMutation.isPending}
                          className={`w-full font-bold h-9 rounded-xl ${room.inviteCode ? 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}
                        >
                          {regenerateMutation.isPending ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />} 
                          {room.inviteCode ? "Regenerate Code" : "Generate Now"}
                        </Button>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2">
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-500 rounded-xl h-10 font-bold shadow-lg"
                          onClick={() => window.location.href = `/teacher/classrooms/${room.id}`}
                        >
                          View Roster
                        </Button>
                        <Button 
                          variant="outline"
                          className="bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 rounded-xl h-10 px-3 transition-colors"
                          onClick={() => window.location.href = `/teacher/classrooms/${room.id}/settings`}
                          title="Settings"
                        >
                          <Settings className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
            <School className="h-20 w-20 text-slate-300 dark:text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Classrooms Detected</h3>
            <p className="text-slate-500 dark:text-gray-500 max-w-sm mx-auto mb-8">
              Start your journey by creating your first educational group to manage students more effectively.
            </p>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 px-10 font-bold shadow-lg shadow-blue-500/20"
            >
              INITIALIZE FIRST ROOM
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
