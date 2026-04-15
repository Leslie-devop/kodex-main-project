import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Crown, Download, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";

interface Ranking {
  id: string;
  name: string;
  username: string;
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  bestWpm: number;
}

export default function Leaderboard({ classroomId }: { classroomId: string }) {
  const { data: rankings, isLoading } = useQuery<Ranking[]>({
    queryKey: [`/api/classrooms/${classroomId}/rankings`],
    refetchInterval: 30000,
  });

  const downloadRankings = () => {
    if (!rankings) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Rank,Name,Username,Avg WPM,Avg Accuracy,Best WPM,Total Sessions\n"
      + rankings.map((r, i) => `${i + 1},"${r.name}",${r.username},${r.avgWpm},${r.avgAccuracy}%,${r.bestWpm},${r.totalSessions}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `classroom_ranking_${classroomId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs border border-dashed border-white/10 rounded-3xl">
        No ranking data available yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Tactical Standings</h3>
         </div>
         <Button 
           variant="ghost" 
           size="sm" 
           onClick={downloadRankings}
           className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl"
         >
           <Download className="h-3 w-3 mr-2" /> Export Rankings
         </Button>
      </div>

      <div className="space-y-3">
        {rankings.map((rank, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={rank.id}
          >
            <Card className={`relative overflow-hidden bg-white/5 border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all ${i === 0 ? 'border-amber-500/30 ring-1 ring-amber-500/10' : ''}`}>
              {i === 0 && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg border ${
                      i === 0 ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                      i === 1 ? 'bg-slate-300/20 border-slate-300/30 text-slate-300' :
                      i === 2 ? 'bg-amber-700/20 border-amber-700/30 text-amber-700' :
                      'bg-white/5 border-white/10 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    {i === 0 && <Crown className="absolute -top-3 -right-3 h-6 w-6 text-amber-500 fill-amber-500 rotate-12" />}
                  </div>

                  <div>
                    <p className="font-bold text-lg leading-none">{rank.name}</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">@{rank.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                   <div className="text-right">
                      <div className="flex items-center justify-end gap-2 text-xl font-black text-blue-400">
                         <TrendingUp className="h-4 w-4" />
                         {rank.avgWpm}
                      </div>
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">AVG WPM</p>
                   </div>
                   <div className="text-right">
                      <div className="flex items-center justify-end gap-2 text-xl font-black text-emerald-400">
                         <Target className="h-4 w-4" />
                         {rank.avgAccuracy}%
                      </div>
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">ACCURACY</p>
                   </div>
                   <div className="hidden lg:block text-right min-w-[100px]">
                      <Badge variant="outline" className="border-white/10 text-white font-black text-[10px] px-3">
                         {rank.totalSessions} MISSIONS
                      </Badge>
                   </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
