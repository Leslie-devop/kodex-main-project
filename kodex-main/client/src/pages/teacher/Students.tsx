import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Mail, Eye, Signal, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export default function Students() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/teacher/students"],
    retry: false,
  });

  if (!isAuthenticated || user?.role !== "teacher") return null;

  const filteredStudents = students?.filter(student => 
    student.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleViewProgress = (studentId: string) => {
    window.location.href = `/teacher/progress?student=${studentId}`;
  };

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
              <Users className="mr-4 h-8 w-8 text-blue-500" />
              Student Directory
            </h2>
            <p className="text-gray-400">Total of {students?.length || 0} registered assets ready for training.</p>
          </motion.div>

          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Search by name, email or username..." 
              className="pl-11 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5" />)}
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.07] transition-all hover:border-blue-500/30 flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                      <span className="text-xl font-black text-blue-400 uppercase tracking-tighter">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white uppercase tracking-tight">{student.firstName} {student.lastName}</h4>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">@{student.username}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                     <div className="flex items-center text-sm text-gray-400">
                        <Mail className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="truncate">{student.email}</span>
                     </div>
                     <div className="h-[1px] w-full bg-white/5"></div>
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Signal Status</span>
                        <div className="flex items-center text-emerald-400 text-[10px] font-black">
                           <Signal className="h-3 w-3 mr-1" /> ONLINE
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/10 rounded-xl h-12 text-xs font-black uppercase tracking-widest hover:bg-white/10"
                      onClick={() => handleViewProgress(student.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Metrics
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-500 rounded-xl h-12 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20"
                      onClick={() => window.location.href = `/teacher/assignments?student=${student.id}`}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <Users className="h-20 w-20 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No Match Detected</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We couldn't find any students matching your current search parameters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}