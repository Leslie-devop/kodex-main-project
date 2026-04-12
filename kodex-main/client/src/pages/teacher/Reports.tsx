import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Download, 
  FileText, 
  Clock, 
  User, 
  BarChart3, 
  TrendingUp,
  Filter,
  ArrowDownToLine,
  Mail,
  Calendar,
  Trophy,
  Zap,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReportData {
  assignmentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  lesson: {
    title: string;
    difficulty: string;
  } | null;
  status: string;
  assignedAt: string;
  dueDate?: string;
  completedAt?: string;
  sessions: number;
  averageWpm: number;
  averageAccuracy: number;
  totalTime: number;
}

export default function Reports() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch reports data
  const { data: reports, isLoading } = useQuery<ReportData[]>({
    queryKey: ["/api/teacher/reports"],
    retry: false,
  });

  if (!isAuthenticated || user?.role !== "teacher") return null;

  const filteredReports = reports?.filter(report => 
    report.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.lesson?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const generateCSV = (dataToExport: ReportData[]) => {
    const headers = ['Student Name', 'Email', 'Lesson', 'Difficulty', 'Status', 'WPM', 'Accuracy', 'Sessions', 'Assigned At', 'Completed At'];
    const rows = dataToExport.map(r => [
      `"${r.student?.firstName || ''} ${r.student?.lastName || ''}"`,
      `"${r.student?.email || ''}"`,
      `"${r.lesson?.title || ''}"`,
      `"${r.lesson?.difficulty || ''}"`,
      `"${r.status || ''}"`,
      r.averageWpm || 0,
      r.averageAccuracy || 0,
      r.sessions || 0,
      `"${new Date(r.assignedAt).toLocaleDateString()}"`,
      r.completedAt ? `"${new Date(r.completedAt).toLocaleDateString()}"` : '""'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `intelligence_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Artifact Generated",
      description: "The CSV data packet has been downloaded successfully.",
    });
  };

  const handleExportReport = (format: 'csv' | 'pdf', singleReport?: ReportData) => {
    const dataToExport = singleReport ? [singleReport] : filteredReports;
    if (format === 'csv') {
      generateCSV(dataToExport);
    } else {
      toast({
        title: "Generating Artifact",
        description: "Preparing system for document printing. Please save as PDF.",
      });
      setTimeout(() => window.print(), 500);
    }
  };

  const totalReports = reports?.length || 0;
  const completedReports = reports?.filter(r => r.status === 'completed').length || 0;
  const averageWpm = reports && reports.length > 0 ? 
    Math.round(reports.reduce((sum, r) => sum + r.averageWpm, 0) / reports.length) : 0;
  const averageAccuracy = reports && reports.length > 0 ? 
    Math.round(reports.reduce((sum, r) => sum + r.averageAccuracy, 0) / reports.length) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center">
            <BarChart3 className="mr-4 h-8 w-8 text-emerald-500" />
            Intelligence Reports
          </h2>
          <p className="text-gray-400">Deep-dive into student performance metrics and engagement analytics.</p>
        </motion.div>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
           <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Total Packets</div>
              <div className="text-2xl font-black">{totalReports}</div>
              <p className="text-[10px] text-gray-600 mt-1 uppercase font-bold tracking-tighter">Reports Generated</p>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Completion Rate</div>
              <div className="text-2xl font-black text-emerald-400">
                {totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0}%
              </div>
              <p className="text-[10px] text-emerald-900 mt-1 uppercase font-bold tracking-tighter">Tasks Finished</p>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group">
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Fleet Velocity</div>
              <div className="text-2xl font-black text-blue-400 flex items-center">
                {averageWpm} <span className="text-xs ml-1 text-gray-500">WPM</span>
              </div>
              <p className="text-[10px] text-blue-900 mt-1 uppercase font-bold tracking-tighter">Avg System Speed</p>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-1">Precision Index</div>
              <div className="text-2xl font-black text-purple-400">
                {averageAccuracy}%
              </div>
              <p className="text-[10px] text-purple-900 mt-1 uppercase font-bold tracking-tighter">System Accuracy</p>
           </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              placeholder="Search reports by student or lesson..." 
              className="pl-11 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-emerald-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest px-6" onClick={() => handleExportReport('csv')}>
                <ArrowDownToLine className="mr-2 h-4 w-4" /> CSV
             </Button>
             <Button variant="outline" className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest px-6" onClick={() => handleExportReport('pdf')}>
                <ArrowDownToLine className="mr-2 h-4 w-4" /> PDF
             </Button>
          </div>
        </div>

        {/* Reports Table/Grid */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-3xl bg-white/5 animate-pulse border border-white/5" />)}
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {filteredReports.map((report) => (
                <motion.div
                  key={report.assignmentId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col lg:flex-row lg:items-center gap-8 hover:bg-white/[0.07] transition-all hover:border-emerald-500/30"
                >
                  <div className="flex items-center space-x-6 shrink-0">
                    <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-black text-emerald-400 text-xl">
                      {report.student?.firstName?.[0]}{report.student?.lastName?.[0]}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold uppercase tracking-tight">{report.student?.firstName} {report.student?.lastName}</h4>
                      <div className="flex items-center text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                        <Mail className="h-3 w-3 mr-1" /> {report.student?.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                     <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center">
                          <Target className="h-3 w-3 mr-1" /> Lesson Title
                        </div>
                        <p className="text-sm font-bold text-gray-300 truncate max-w-[150px]">{report.lesson?.title}</p>
                        <div className={`mt-1.5 px-2 py-0.5 rounded text-[10px] w-fit font-black uppercase tracking-tighter ${
                          report.lesson?.difficulty === 'advanced' ? 'bg-red-500/20 text-red-400' :
                          report.lesson?.difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {report.lesson?.difficulty}
                        </div>
                     </div>

                     <div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center">
                          <Zap className="h-3 w-3 mr-1" /> Velocity
                        </div>
                        <p className="text-2xl font-black text-blue-400">{Math.round(report.averageWpm)} <span className="text-[10px] text-gray-500">WPM</span></p>
                     </div>

                     <div>
                        <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1 flex items-center">
                          <Trophy className="h-3 w-3 mr-1" /> Accuracy
                        </div>
                        <p className="text-2xl font-black text-purple-400">{Math.round(report.averageAccuracy)}%</p>
                     </div>

                     <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center">
                           <Calendar className="h-3 w-3 mr-1" /> Timeline
                        </div>
                        <p className="text-xs text-gray-400 font-bold">
                           {report.completedAt ? `COMPLETED ${new Date(report.completedAt).toLocaleDateString()}` : `ASSIGNED ${new Date(report.assignedAt).toLocaleDateString()}`}
                        </p>
                        <p className="text-[10px] text-gray-600 font-black mt-1 uppercase tracking-tighter">
                          {report.sessions} Intelligence Sessions
                        </p>
                     </div>
                  </div>

                  <Button onClick={() => handleExportReport('csv', report)} variant="ghost" size="icon" className="rounded-2xl border border-white/5 hover:bg-emerald-600 hover:text-white transition-all h-14 w-14 shrink-0">
                    <Download className="h-6 w-6" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <FileText className="h-20 w-20 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No Reports Synthesized</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Intelligence packets will appear here once students engage with assigned content.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}