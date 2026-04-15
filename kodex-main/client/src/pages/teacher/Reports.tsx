import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Download, 
  FileText, 
  Mail,
  Calendar as CalendarIcon,
  Trophy,
  Zap,
  Target,
  BarChart3,
  ArrowDownToLine,
  Filter,
  User,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ReportData {
  id: string; // Assignment ID
  classroomId?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  lesson: {
    id: string;
    title: string;
    difficulty: string;
  } | null;
  lessonTitle?: string;
  status: string;
  assignedAt: string;
  dueDate?: string;
  completedAt?: string;
  sessions: any[];
  averageWpm: number;
  averageAccuracy: number;
  averagePostureScore?: number;
  totalTime: number;
}

export default function Reports() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("all");
  const [lessonFilter, setLessonFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "podium">("podium");

  const { data: classrooms } = useQuery<any[]>({
    queryKey: ["/api/classrooms"],
    retry: false
  });

  const { data: reports, isLoading } = useQuery<ReportData[]>({
    queryKey: ["/api/teacher/reports"],
    retry: false,
  });

  if (!isAuthenticated || user?.role !== "teacher") return null;

  const validReports = reports || [];

  const uniqueLessons = Array.from(new Set(validReports.map(r => r.lesson?.title || r.lessonTitle).filter(Boolean))).sort();

  const filteredReports = validReports.filter(report => {
    const studentName = `${report.student?.firstName || ''} ${report.student?.lastName || ''}`.toLowerCase();
    const lessonTitle = (report.lesson?.title || report.lessonTitle || "").toLowerCase();
    
    const matchesSearch = 
      studentName.includes(searchQuery.toLowerCase()) ||
      lessonTitle.includes(searchQuery.toLowerCase());
      
    const matchesClassroom = classroomFilter === "all" || report.classroomId === classroomFilter || (classroomFilter === "unassigned" && !report.classroomId);
    
    const actualLessonTitle = report.lesson?.title || report.lessonTitle;
    const matchesLesson = lessonFilter === "all" || actualLessonTitle === lessonFilter;
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;

    const matchesDate = !selectedDate || (
       report.completedAt && new Date(report.completedAt).toDateString() === selectedDate.toDateString()
    );

    return matchesSearch && matchesClassroom && matchesLesson && matchesStatus && matchesDate;
  });

  // Sorting for Rankings (Fastest = Higher WPM)
  const sortedBySpeed = [...filteredReports].sort((a, b) => (b.averageWpm || 0) - (a.averageWpm || 0));
  
  const top3 = sortedBySpeed.slice(0, 3);
  const bottom3 = sortedBySpeed.length > 5 ? sortedBySpeed.slice(-3).reverse() : [];

  const handleSelectAll = () => {
     if (selectedReports.length === filteredReports.length) {
         setSelectedReports([]);
     } else {
         setSelectedReports(filteredReports.map(r => r.id));
     }
  };

  const handleExportReport = (format: 'csv' | 'pdf' | 'excel') => {
    const dataToExport = selectedReports.length > 0 
        ? filteredReports.filter(r => selectedReports.includes(r.id))
        : filteredReports;

    if (format === 'pdf') {
       toast({ title: "Generating PDF", description: "Preparing data for print synchronization." });
       setTimeout(() => window.print(), 500);
       return;
    }

    toast({
      title: "Export Initiated",
      description: `Preparing ${format.toUpperCase()} report for ${dataToExport.length} tactical units.`,
    });
  };

  const totalReportsCount = validReports.length;
  const completedReportsCount = validReports.filter(r => r.status === 'completed').length || 0;
  
  const activeReports = validReports.filter(r => (r.sessions?.length || 0) > 0);
  const activeCount = activeReports.length;
  
  const averageWpm = activeCount > 0 ? 
    Math.round(activeReports.reduce((sum, r) => sum + (r.averageWpm || 0), 0) / activeCount) : 0;
    
  const averageAccuracy = activeCount > 0 ? 
    (activeReports.reduce((sum, r) => sum + (r.averageAccuracy || 0), 0) / activeCount).toFixed(2) : "0.00";

  const averagePosture = activeCount > 0 ?
    Math.round(activeReports.reduce((sum, r) => sum + (r.averagePostureScore || 100), 0) / activeCount) : 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors selection:bg-blue-500/20">
      <div className="print:hidden">
        <Header />
      </div>

      {/* PRINT VIEW (Ranked exactly like the pic) */}
      <div className="hidden print:block p-10 font-sans">
         <h1 className="text-4xl font-black text-slate-900 mb-2">Kodex - Reports & Analytics</h1>
         <p className="text-slate-500 mb-6 text-sm">Generated on: {new Date().toLocaleString()}</p>
         
         <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
           <span className="font-bold">Total Reports:</span> {totalReportsCount} | 
           <span className="font-bold ml-4">Completed:</span> {completedReportsCount} | 
           <span className="font-bold ml-4">Average WPM:</span> {averageWpm} | 
           <span className="font-bold ml-4">Average Accuracy:</span> {averageAccuracy}% |
           <span className="font-bold ml-4">Avg Posture:</span> {averagePosture}%
         </div>

         <table className="w-full border-collapse border border-slate-300">
           <thead>
             <tr className="bg-[#4285f4] text-white">
               <th className="p-3 border border-slate-300">Rank</th>
               <th className="p-3 border border-slate-300">Student</th>
               <th className="p-3 border border-slate-300">Email</th>
               <th className="p-3 border border-slate-300">Lesson</th>
               <th className="p-3 border border-slate-300">Status</th>
               <th className="p-3 border border-slate-300">WPM</th>
               <th className="p-3 border border-slate-300">Accuracy</th>
               <th className="p-3 border border-slate-300">Posture</th>
               <th className="p-3 border border-slate-300">Sessions</th>
               <th className="p-3 border border-slate-300">Assigned</th>
               <th className="p-3 border border-slate-300">Completed</th>
             </tr>
           </thead>
           <tbody>
             {(selectedReports.length > 0 ? filteredReports.filter(r => selectedReports.includes(r.id)) : sortedBySpeed).map((r, i) => (
                <tr key={r.id}>
                  <td className={cn(
                    "p-3 border border-slate-300 font-black text-center",
                    i === 0 ? "bg-[#fbbc04]" : i === 1 ? "bg-[#e0e0e0]" : i === 2 ? "bg-[#cd7f32]" : ""
                  )}>{i + 1}</td>
                  <td className="p-3 border border-slate-300 font-bold">{r.student?.firstName} {r.student?.lastName}</td>
                  <td className="p-3 border border-slate-300">{r.student?.email}</td>
                  <td className="p-3 border border-slate-300">{r.lesson?.title || r.lessonTitle}</td>
                  <td className="p-3 border border-slate-300 italic">{r.status}</td>
                  <td className="p-3 border border-slate-300 font-bold">{Math.round(r.averageWpm)}</td>
                  <td className="p-3 border border-slate-300 text-blue-600 font-bold">{r.averageAccuracy.toFixed(2)}%</td>
                  <td className="p-3 border border-slate-300 text-purple-600 font-bold">{r.averagePostureScore || 100}%</td>
                  <td className="p-3 border border-slate-300">{r.sessions?.length || 0}</td>
                  <td className="p-3 border border-slate-300">{new Date(r.assignedAt).toLocaleDateString()}</td>
                  <td className="p-3 border border-slate-300">{r.completedAt ? new Date(r.completedAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
             ))}
           </tbody>
         </table>
      </div>

      <main className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10 print:hidden space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
            REPORTS & <span className="text-blue-600 dark:text-blue-500">ANALYTICS</span>
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium mt-1">
            View comprehensive reports on student performance and assignment completion
          </p>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 border-gray-100 dark:border-white/5">Total Reports</Badge>
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white">{totalReportsCount}</div>
              <div className="text-[10px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-1">Global Database Depth</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden group hover:border-emerald-500/30 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-lg group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                  <Trophy className="h-5 w-5 text-slate-600 dark:text-gray-400 group-hover:text-emerald-500" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 border-gray-100 dark:border-white/5">Completed</Badge>
              </div>
              <div className="text-4xl font-black text-emerald-600">{completedReportsCount}</div>
              <div className="text-[10px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-1">{totalReportsCount > 0 ? Math.round((completedReportsCount / totalReportsCount) * 100) : 0}% Completion Rate</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                  <Zap className="h-5 w-5 text-slate-600 dark:text-gray-400 group-hover:text-blue-500" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 border-gray-100 dark:border-white/5">Average WPM</Badge>
              </div>
              <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{averageWpm}</div>
              <div className="text-[10px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-1">Words Per Minute Velocity</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden group hover:border-amber-500/30 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-lg group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 transition-colors">
                  <Target className="h-5 w-5 text-slate-600 dark:text-gray-400 group-hover:text-amber-500" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 border-gray-100 dark:border-white/5">Average Accuracy</Badge>
              </div>
              <div className="text-4xl font-black text-amber-600 dark:text-amber-400 font-mono">{averageAccuracy}%</div>
              <div className="text-[10px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-1">Typing Precision Integrity</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-lg group-hover:bg-purple-50 dark:group-hover:bg-purple-500/10 transition-colors">
                  <User className="h-5 w-5 text-slate-600 dark:text-gray-400 group-hover:text-purple-500" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 border-gray-100 dark:border-white/5">AI POSTURE</Badge>
              </div>
              <div className="text-4xl font-black text-purple-600 dark:text-purple-400 font-mono">{averagePosture}%</div>
              <div className="text-[10px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-1">Ergonomic Alignment Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Tactical Filters & Selection Bar */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm dark:shadow-none transition-colors">
          <div className="flex flex-col lg:flex-row gap-6 items-end">
             <div className="flex-1 space-y-2 w-full">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Search Matrix</Label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    placeholder="Identify student or lesson..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl focus:ring-blue-500/10 focus:border-blue-500/30 font-medium text-sm w-full text-slate-900 dark:text-white transition-all"
                  />
                </div>
             </div>

             <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Classroom</Label>
                  <Select value={classroomFilter} onValueChange={setClassroomFilter}>
                    <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-900 dark:text-white transition-all">
                      <SelectValue placeholder="All Rooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rooms</SelectItem>
                      {classrooms?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Assignment / Lesson</Label>
                  <Select value={lessonFilter} onValueChange={setLessonFilter}>
                    <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-blue-500/50 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm text-slate-900 dark:text-white">
                      <SelectValue placeholder="All Lessons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Content</SelectItem>
                      {uniqueLessons.map(l => <SelectItem key={l as string} value={l as string}>{l as string}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Timeline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(
                        "h-12 w-[180px] justify-start text-left font-bold text-xs uppercase tracking-widest rounded-xl border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-slate-900 dark:text-white",
                        !selectedDate && "text-slate-500 dark:text-gray-500"
                      )}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-slate-200 rounded-2xl shadow-xl" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
             </div>

             <div className="flex items-center gap-2 h-12">
               <Button 
                variant={viewMode === "podium" ? "default" : "outline"}
                onClick={() => setViewMode("podium")}
                className="h-10 w-10 p-0 rounded-xl"
               >
                 <Trophy className="h-4 w-4" />
               </Button>
               <Button 
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className="h-10 w-10 p-0 rounded-xl"
               >
                 <BarChart3 className="h-4 w-4" />
               </Button>
               <div className="w-[1px] h-6 bg-slate-200 mx-1" />
               <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                     variant="outline"
                     className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800"
                    >
                      <Download className="h-3.3 w-3.5 mr-2" /> Export
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-white border-slate-200 rounded-xl shadow-xl flex flex-col gap-1">
                     <Button variant="ghost" onClick={() => handleExportReport('csv')} className="justify-start h-9 text-xs font-bold uppercase tracking-tighter"><Download className="h-3 w-3 mr-2" /> Export All CSV</Button>
                     <Button variant="ghost" onClick={() => handleExportReport('pdf')} className="justify-start h-9 text-xs font-bold uppercase tracking-tighter"><Download className="h-3 w-3 mr-2" /> Export All PDF</Button>
                     <Button variant="ghost" onClick={() => handleExportReport('excel')} className="justify-start h-9 text-xs font-bold uppercase tracking-tighter"><Download className="h-3 w-3 mr-2" /> Export All Excel</Button>
                  </PopoverContent>
               </Popover>
             </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 px-2">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10">
                  {selectedReports.length === filteredReports.length && filteredReports.length > 0 ? "Deselect All" : "Select All"}
                </Button>
                {selectedReports.length > 0 && (
                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                     {selectedReports.length} Tactical Units Selected
                   </span>
                )}
             </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "podium" ? (
            <motion.div 
              key="podium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="bg-[#0f172a] dark:bg-white/5 rounded-[2.5rem] p-10 border border-white/5 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 flex items-center gap-4">
                   <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black uppercase tracking-widest">Podium</Badge>
                </div>
                <div className="mb-12">
                  <div className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.3em] mb-1">FASTEST TIME TO OWN</div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Top 3 <span className="text-blue-500">Students</span></h3>
                </div>

                <div className="flex items-end justify-between gap-4 h-64 relative">
                   {top3.length > 1 && <PodiumComponent student={top3[1]} rank={2} color="bg-slate-300" label="SILVER" height="h-40" delay={0.1} />}
                   {top3.length > 0 && <PodiumComponent student={top3[0]} rank={1} color="bg-amber-400" label="GOLD" height="h-56" delay={0} />}
                   {top3.length > 2 && <PodiumComponent student={top3[2]} rank={3} color="bg-[#cd7f32]" label="BRONZE" height="h-32" delay={0.2} />}
                   {top3.length === 0 && <div className="w-full flex items-center justify-center text-slate-700 italic font-black uppercase tracking-widest text-xs">Waiting for tactical engagement.</div>}
                </div>
              </div>

              <div className="bg-[#1e1b21] dark:bg-white/5 rounded-[2.5rem] p-10 border border-red-500/5 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8"><Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-black uppercase tracking-widest">Podium</Badge></div>
                <div className="mb-12">
                  <div className="text-[10px] font-black text-red-500/50 uppercase tracking-[0.3em] mb-1">SLOWEST TIME TO OWN</div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Bottom 3 <span className="text-red-500">Students</span></h3>
                </div>

                <div className="flex items-end justify-between gap-4 h-64 relative">
                   {bottom3.length > 1 && <PodiumComponent student={bottom3[1]} rank={2} color="bg-orange-800" label="COPPER" height="h-40" delay={0.1} variant="danger" />}
                   {bottom3.length > 0 && <PodiumComponent student={bottom3[0]} rank={1} color="bg-slate-800" label="IRON" height="h-56" delay={0} variant="danger" />}
                   {bottom3.length > 2 && <PodiumComponent student={bottom3[2]} rank={3} color="bg-slate-600" label="TIN" height="h-32" delay={0.2} variant="danger" />}
                   {bottom3.length === 0 && <div className="w-full h-full flex items-center justify-center text-slate-700 italic font-black uppercase tracking-widest text-xs">Fleet synchronization stable.</div>}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                    <th className="p-6 w-12 text-center">Sel</th>
                    <th className="p-6">Personnel</th>
                    <th className="p-6">Protocol</th>
                    <th className="p-6 text-center">Velocity</th>
                    <th className="p-6 text-center">Accuracy</th>
                    <th className="p-6 text-center">Posture</th>
                    <th className="p-6 text-right">Completion Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredReports.map((report, index) => {
                    const isSelected = selectedReports.includes(report.id);
                    return (
                      <tr key={report.id} className={cn("hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors", isSelected && "bg-blue-50/30 dark:bg-blue-500/10")}>
                        <td className="p-6 text-center">
                           <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) setSelectedReports(prev => prev.filter(id => id !== report.id));
                                else setSelectedReports(prev => [...prev, report.id]);
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                           />
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold relative">
                                {report.student?.firstName?.[0]}{report.student?.lastName?.[0]}
                                <Badge className={cn("absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[8px] font-black", index === 0 ? "bg-[#fbbc04]" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-[#cd7f32]" : "bg-slate-100 text-slate-400 border")}>
                                  #{index + 1}
                                </Badge>
                             </div>
                             <div>
                               <div className="font-bold text-sm text-slate-900 dark:text-white">{report.student?.firstName} {report.student?.lastName}</div>
                               <div className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase tracking-widest">{report.student?.email}</div>
                             </div>
                          </div>
                        </td>
                        <td className="p-6">
                           <div className="text-sm font-bold text-slate-700 dark:text-gray-300">{report.lesson?.title || report.lessonTitle}</div>
                           <div className="text-[9px] font-black uppercase text-slate-400 dark:text-gray-500 mt-1">{report.lesson?.difficulty || 'Standard'} Phase</div>
                        </td>
                        <td className="p-6 text-center">
                           <div className="text-lg font-black text-blue-600 dark:text-blue-400 italic tracking-tighter">{Math.round(report.averageWpm)} <span className="text-[10px] uppercase not-italic">Wpm</span></div>
                        </td>
                        <td className="p-6 text-center">
                           <div className="text-lg font-black text-amber-600 font-mono tracking-tighter">{report.averageAccuracy.toFixed(2)}% <span className="text-[10px] uppercase font-sans">Acc</span></div>
                        </td>
                        <td className="p-6 text-center">
                           <div className="text-lg font-black text-purple-600 font-mono tracking-tighter">{(report.averagePostureScore || 100)}% <span className="text-[10px] uppercase font-sans">Pos</span></div>
                        </td>
                        <td className="p-6 text-right">
                           <Badge className={cn(
                             "px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest",
                             report.status === "completed" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/5 text-slate-600 dark:text-gray-400"
                           )}>
                             {report.status}
                           </Badge>
                           <div className="text-[9px] font-bold text-slate-400 uppercase mt-2">
                              {report.completedAt ? format(new Date(report.completedAt), "MMM dd, yyyy") : "In Flight"}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredReports.length === 0 && (
                <div className="p-20 text-center italic text-slate-400 uppercase font-black tracking-widest text-xs">
                   No tactical data sequences retrieved from current matrix.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function PodiumComponent({ student, rank, color, label, height, delay, variant = "success" }: { 
  student: ReportData, 
  rank: number, 
  color: string, 
  label: string, 
  height: string, 
  delay: number,
  variant?: "success" | "danger"
}) {
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ delay, duration: 0.8, ease: "circOut" }}
      className="flex flex-col items-center flex-1"
    >
       <div className="flex flex-col items-center mb-6 relative px-2">
          {/* Rank Badge */}
          <div className={`absolute -top-3 -right-2 h-6 w-6 rounded-full ${variant === "success" ? "bg-emerald-500" : "bg-red-500"} text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0f172a] z-10`}>
            #{rank}
          </div>
          <div className="h-16 w-16 rounded-full border-2 border-white/10 p-1 mb-3 relative group">
             <div className={`absolute inset-0 rounded-full blur-md opacity-20 ${variant === "success" ? "bg-emerald-500" : "bg-red-500"}`}></div>
             <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center font-black text-white text-lg relative overflow-hidden">
                {student.student?.firstName?.[0]}{student.student?.lastName?.[0]}
                {/* Simulated profile pic overlay */}
                <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
             </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] font-black text-white uppercase leading-tight max-w-[120px] line-clamp-2">
              {student.student?.firstName} {student.student?.lastName}
            </div>
            <div className="text-[10px] font-bold text-slate-500 tracking-widest mt-1">
              {Math.round(student.averageWpm)} WPM • {student.averagePostureScore || 100}% POS
            </div>
          </div>
       </div>
       
       <div className={cn(
         "w-full rounded-2xl relative flex flex-col items-center justify-center p-4 border border-white/5",
         color,
         height
       )}>
          <div className="text-[10px] font-black text-slate-900/50 dark:text-white/50 uppercase tracking-[0.2em] mb-1">{label}</div>
          <div className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">
            {(student.totalTime ? Math.round(student.totalTime / 3600 * 100) / 100 : 0.01)}h
          </div>
       </div>
    </motion.div>
  );
}