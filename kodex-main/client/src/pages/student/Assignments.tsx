import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import AssignedLessons from "@/components/student/AssignedLessons";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, AlertTriangle, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LessonAssignment } from "@/types";

type FilterStatus = "all" | "pending" | "in_progress" | "completed" | "overdue";

export default function StudentAssignments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  const { data: assignments, isLoading } = useQuery<LessonAssignment[]>({
    queryKey: ["/api/assignments/student"],
    retry: false,
    refetchInterval: 60000,
  });

  const stats = useMemo(() => {
    if (!assignments) return { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
    
    return assignments.reduce((acc, curr) => {
      if (curr.status === "completed") acc.completed++;
      else if (curr.dueDate && new Date(curr.dueDate) < new Date()) acc.overdue++;
      else if (curr.status === "in_progress") acc.in_progress++;
      else acc.pending++;
      return acc;
    }, { pending: 0, in_progress: 0, completed: 0, overdue: 0 });
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    
    return assignments.filter(a => {
      const matchesSearch = (a.lesson?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (a.lesson?.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (activeFilter === "all") return true;
      
      const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
      if (activeFilter === "overdue") return isOverdue && a.status !== "completed";
      if (activeFilter === "pending") return a.status === "pending" && !isOverdue;
      return a.status === activeFilter;
    });
  }, [assignments, searchTerm, activeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">
              MY <span className="text-blue-500">ASSIGNMENTS</span>
            </h1>
            <p className="text-gray-400 font-medium tracking-wide">
              Complete your assigned typing lessons and track your progress.
            </p>
          </div>

          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <Input 
              placeholder="Search missions..." 
              className="pl-12 h-14 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-400 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { id: "pending", label: "Pending", count: stats.pending, icon: Clock, color: "blue" },
            { id: "in_progress", label: "In Progress", count: stats.in_progress, icon: PlayCircle, color: "amber" },
            { id: "completed", label: "Completed", count: stats.completed, icon: CheckCircle2, color: "emerald" },
            { id: "overdue", label: "Overdue", count: stats.overdue, icon: AlertTriangle, color: "red" }
          ].map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(activeFilter === item.id ? "all" : item.id as FilterStatus)}
              className={`cursor-pointer p-6 rounded-3xl border-2 transition-all duration-300 ${
                activeFilter === item.id 
                  ? `bg-${item.color}-500/10 border-${item.color}-500/50 shadow-lg shadow-${item.color}-500/10` 
                  : "bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm dark:shadow-none"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl bg-${item.color}-500/10`}>
                  <item.icon className={`h-5 w-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                </div>
                <div className={`text-4xl font-black ${activeFilter === item.id ? `text-${item.color}-600 dark:text-${item.color}-400` : "text-slate-800 dark:text-white"}`}>
                  {item.count}
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{item.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Overdue Warning Alert */}
        <AnimatePresence>
          {stats.overdue > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center gap-5 backdrop-blur-md shadow-sm dark:shadow-none">
                <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-red-400">Overdue Assignments Detected</h4>
                  <p className="text-xs text-red-500/60 font-medium mt-1 uppercase tracking-tight">
                    You have {stats.overdue} mission objective(s) past schedule. Please complete them as soon as possible.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Display */}
        {activeFilter !== "all" && (
           <div className="mb-8 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Active Filter:</span>
              <div className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                {activeFilter.replace('_', ' ')}
                <button onClick={() => setActiveFilter("all")} className="hover:text-white transition-colors">×</button>
              </div>
           </div>
        )}

        {/* Assignments List Component */}
        <AssignedLessons 
          assignments={filteredAssignments} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
