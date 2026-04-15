import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";

interface Classroom {
  id: string;
  name: string;
  section: string;
  inviteCode?: string;
  teacherId: string;
}

export default function MyRooms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const { data: classrooms, isLoading } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms/student"],
    refetchInterval: 60000,
  });

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to join room");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms/student"] });
      setIsJoinOpen(false);
      setInviteCode("");
      toast({ title: "Success", description: "Successfully joined classroom" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleJoin = () => {
    if (inviteCode.trim()) {
      joinMutation.mutate(inviteCode.trim());
    }
  };

  return (
    <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-sm dark:shadow-none overflow-hidden flex flex-col h-full">
      <CardHeader className="p-8 pb-4 border-b border-gray-50 dark:border-white/5 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center">
          <Users className="w-5 h-5 mr-3 text-blue-500" />
          My Rooms
        </CardTitle>
        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl font-bold text-xs uppercase tracking-widest px-3 border border-blue-500/20">
              <Plus className="w-3 h-3 mr-1" /> Join Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-white/10 text-slate-900 dark:text-white rounded-3xl backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Join Classroom</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter the invite code provided by your instructor.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Invite Code</label>
                <Input 
                  placeholder="e.g. aty82z" 
                  className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl h-14 font-mono text-lg text-center tracking-widest uppercase text-slate-900 dark:text-white"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsJoinOpen(false)} className="rounded-xl h-12 font-bold text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">
                Cancel
              </Button>
              <Button 
                onClick={handleJoin}
                disabled={joinMutation.isPending || !inviteCode.trim()}
                className="bg-blue-600 hover:bg-blue-500 rounded-xl h-12 font-bold px-8"
              >
                {joinMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify & Join"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0 flex-1 bg-gradient-to-b from-white/[0.02] to-transparent">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : classrooms && classrooms.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {classrooms.map((room) => (
              <div key={room.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => {
                setLocation(`/student/classrooms/${room.id}`);
              }}>
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    {room.name}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mt-1">
                    {room.section || "General"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <Users className="w-12 h-12 text-slate-300 dark:text-gray-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-400 dark:text-gray-500 mb-2">No Rooms Found</h4>
            <p className="text-sm text-slate-400 dark:text-gray-500 max-w-[200px] mb-6">You haven't joined any classrooms yet.</p>
            <Button onClick={() => setIsJoinOpen(true)} className="bg-blue-600/10 dark:bg-white/10 hover:bg-blue-600/20 dark:hover:bg-white/20 text-blue-600 dark:text-white rounded-xl font-bold shadow-lg h-10 px-6 text-sm">
              JOIN YOUR FIRST ROOM
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
