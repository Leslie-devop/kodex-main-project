import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  X
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
}

export default function Classrooms() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    section: ""
  });

  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: classrooms, isLoading } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newClassroom) => {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create classroom");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/dashboard-stats"] });
      setIsCreateOpen(false);
      setNewClassroom({ name: "", section: "" });
      toast({ title: "Success", description: "Classroom created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/classrooms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete classroom");
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
      if (!res.ok) throw new Error("Failed to update classroom");
      return res.json();
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

  if (!isAuthenticated || user?.role !== "teacher") {
    return null;
  }

  const filteredClassrooms = classrooms?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center">
              <School className="mr-4 h-8 w-8 text-blue-500" />
              Classrooms
            </h2>
            <p className="text-gray-400">Establish and manage your student educational groups.</p>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="Search rooms..." 
                className="pl-10 w-full md:w-64 bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500 focus:border-blue-500"
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
              <DialogContent className="bg-[#1e293b] border-white/10 text-white rounded-3xl backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Launch New Classroom</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Enter the details of your new educational group.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Room Name</label>
                    <Input 
                      placeholder="e.g. BSIT-4 Keyboarding" 
                      className="bg-white/5 border-white/10 rounded-xl h-12"
                      value={newClassroom.name}
                      onChange={(e) => setNewClassroom({...newClassroom, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Section / Period</label>
                    <Input 
                      placeholder="e.g. Afternoon Session" 
                      className="bg-white/5 border-white/10 rounded-xl h-12"
                      value={newClassroom.section}
                      onChange={(e) => setNewClassroom({...newClassroom, section: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl h-12 font-bold text-gray-400 hover:text-white hover:bg-white/5">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createMutation.mutate(newClassroom)}
                    disabled={createMutation.isPending || !newClassroom.name}
                    className="bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-bold px-8"
                  >
                    {createMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Deploy Room"}
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
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Section / Period</label>
                    <Input 
                      placeholder="e.g. Afternoon Session" 
                      className="bg-white/5 border-white/10 rounded-xl h-12"
                      value={editingClassroom?.section || ""}
                      onChange={(e) => editingClassroom && setEditingClassroom({...editingClassroom, section: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl h-12 font-bold text-gray-400 hover:text-white hover:bg-white/5">
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
              <div key={i} className="h-64 rounded-3xl bg-white/5 border border-white/10 animate-pulse"></div>
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
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden relative border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white rounded-xl">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1e293b] border-white/10 text-white rounded-xl backdrop-blur-xl">
                          <DropdownMenuItem 
                            className="p-3 cursor-pointer hover:bg-white/5"
                            onClick={() => {
                              setEditingClassroom(room);
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="p-3 cursor-pointer text-red-400 hover:bg-red-500/10 focus:text-red-400"
                            onClick={() => {
                              if(confirm("Are you sure? All roster data will be lost.")) {
                                deleteMutation.mutate(room.id);
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Dissolve Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{room.name}</h3>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">{room.section || "No Section"}</p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Status</span>
                          <span className="flex items-center text-emerald-400 font-bold">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                            Active
                          </span>
                        </div>
                      </div>

                      <div className="mt-8 flex gap-3">
                        <Button 
                          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl h-11 text-sm font-bold transition-all"
                          onClick={() => window.location.href = `/teacher/classrooms/${room.id}`}
                        >
                          OPEN ROSTER
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl border border-white/5 hover:bg-blue-600 hover:text-white transition-all h-11 w-11"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <School className="h-20 w-20 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No Classrooms Detected</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
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
