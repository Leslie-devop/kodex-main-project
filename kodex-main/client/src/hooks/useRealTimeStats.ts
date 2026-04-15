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
    refetchInterval: 5000, // Refresh every 5 seconds for high responsiveness
  });

  // Fetch student stats
  const { data: studentStats, refetch: refetchStudentStats } = useQuery<StudentStats>({
    queryKey: ["/api/analytics/student/stats"],
    retry: false,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch weekly progress
  const { data: weeklyProgress, refetch: refetchWeeklyProgress } = useQuery<WeeklyProgress[]>({
    queryKey: ["/api/analytics/student/weekly"],
    retry: false,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Simulate real-time WPM fluctuation for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      if (dailyStats?.todayWpm) {
        // Add slight variation to make it feel live
        const baseWpm = dailyStats.todayWpm;
        const variation = (Math.random() * 2) - 1; // +/- 1 WPM for smoother delta
        setLiveWpm(Number((baseWpm + variation).toFixed(2)));
      }
    }, 1000); // Pulse every second

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
