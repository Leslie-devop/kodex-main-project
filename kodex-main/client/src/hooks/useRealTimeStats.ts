import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { DailyStats, StudentStats, WeeklyProgress } from "@/types";

export function useRealTimeStats() {
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  // Fetch daily stats
  const { data: dailyStats, refetch: refetchDailyStats } = useQuery<DailyStats>({
    queryKey: ["/api/analytics/student/daily"],
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch student stats
  const { data: studentStats, refetch: refetchStudentStats } = useQuery<StudentStats>({
    queryKey: ["/api/analytics/student/stats"],
    retry: false,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch weekly progress
  const { data: weeklyProgress, refetch: refetchWeeklyProgress } = useQuery<WeeklyProgress[]>({
    queryKey: ["/api/analytics/student/weekly"],
    retry: false,
    refetchInterval: 60000, // Refresh every minute
  });

  // Simulate real-time WPM fluctuation for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      if (dailyStats?.todayWpm) {
        // Add slight variation to make it feel live
        const baseWpm = dailyStats.todayWpm;
        const variation = Math.floor(Math.random() * 6) - 3; // +/- 3 WPM
        setLiveWpm(Math.max(20, Math.min(120, baseWpm + variation)));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [dailyStats?.todayWpm]);

  // Simulate real-time accuracy fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      if (dailyStats?.todayAccuracy) {
        // Add slight variation to make it feel live
        const baseAccuracy = dailyStats.todayAccuracy;
        const variation = Math.floor(Math.random() * 4) - 2; // +/- 2%
        setLiveAccuracy(Math.max(70, Math.min(100, baseAccuracy + variation)));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [dailyStats?.todayAccuracy]);

  const refreshStats = () => {
    refetchDailyStats();
    refetchStudentStats();
    refetchWeeklyProgress();
  };

  return {
    dailyStats,
    studentStats,
    weeklyProgress,
    liveWpm,
    liveAccuracy,
    refreshStats,
  };
}
