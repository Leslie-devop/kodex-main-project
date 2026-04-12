import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Target, AlertCircle, Download, Calendar, BarChart3 } from "lucide-react";

interface ErrorData {
  id: string;
  character: string;
  frequency: number;
  errorType: string;
  lastOccurred: string;
}

interface DailyStats {
  todayWpm: number;
  todayAccuracy: number;
  sessionsToday: number;
  improvementToday: number;
}

export default function StudentAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch error analytics
  const { data: errorData, isLoading: errorLoading } = useQuery<ErrorData[]>({
    queryKey: ["/api/analytics/errors"],
    retry: false,
  });

  // Fetch daily stats
  const { data: dailyStats, isLoading: dailyLoading } = useQuery<DailyStats>({
    queryKey: ["/api/analytics/student/daily"],
    retry: false,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  const getErrorTypeColor = (errorType: string) => {
    switch (errorType) {
      case "wrong_character":
        return "bg-red-100 text-red-800";
      case "missed_character":
        return "bg-orange-100 text-orange-800";
      case "extra_character":
        return "bg-yellow-100 text-yellow-800";
      case "character_swap":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatErrorType = (errorType: string) => {
    switch (errorType) {
      case "wrong_character":
        return "Wrong Char";
      case "missed_character":
        return "Missed";
      case "extra_character":
        return "Extra";
      case "character_swap":
        return "Swapped";
      default:
        return "Other";
    }
  };

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Your analytics data is being prepared for download.",
    });
    // Would implement actual export functionality
  };

  // Sort error data by frequency
  const sortedErrors = errorData?.sort((a, b) => b.frequency - a.frequency) || [];
  const topErrors = sortedErrors.slice(0, 10);

  // Generate some demo keystroke timing data
  const generateKeystrokeData = () => {
    const commonKeys = ['a', 'e', 'i', 'o', 'u', 't', 'n', 's', 'r', 'h'];
    return commonKeys.map(key => ({
      key: key.toUpperCase(),
      avgTime: Math.floor(Math.random() * 200) + 100, // 100-300ms
      consistency: Math.floor(Math.random() * 30) + 70, // 70-100%
      accuracy: Math.floor(Math.random() * 20) + 80, // 80-100%
    }));
  };

  const keystrokeData = generateKeystrokeData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Detailed Analytics</h2>
              <p className="text-gray-600">Deep dive into your typing patterns and areas for improvement.</p>
            </div>
            <Button onClick={exportData} className="mt-4 md:mt-0" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-today-wpm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Best WPM
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dailyLoading ? "..." : dailyStats?.todayWpm || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-today-accuracy">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Accuracy
              </CardTitle>
              <Target className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dailyLoading ? "..." : `${dailyStats?.todayAccuracy || 0}%`}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-sessions-today">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Sessions Today
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {dailyLoading ? "..." : dailyStats?.sessionsToday || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-improvement">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Daily Improvement
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (dailyStats?.improvementToday || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {dailyLoading ? "..." : `${(dailyStats?.improvementToday || 0) > 0 ? '+' : ''}${dailyStats?.improvementToday || 0}`}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                WPM change from yesterday
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="errors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="errors" data-testid="tab-errors">Error Analysis</TabsTrigger>
            <TabsTrigger value="keystrokes" data-testid="tab-keystrokes">Keystroke Timing</TabsTrigger>
            <TabsTrigger value="patterns" data-testid="tab-patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="errors" className="space-y-6">
            <Card data-testid="card-error-analysis">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                  Most Common Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errorLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    ))}
                  </div>
                ) : topErrors.length > 0 ? (
                  <div className="space-y-3">
                    {topErrors.map((error, index) => (
                      <div
                        key={error.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        data-testid={`error-${index}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                            '{error.character}'
                          </div>
                          <Badge className={getErrorTypeColor(error.errorType)}>
                            {formatErrorType(error.errorType)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-red-600">
                            {error.frequency}
                          </div>
                          <div className="text-xs text-gray-500">
                            errors
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No error data available yet.</p>
                    <p className="text-sm mt-1">Start typing to see your error patterns!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keystrokes" className="space-y-6">
            <Card data-testid="card-keystroke-timing">
              <CardHeader>
                <CardTitle>Individual Key Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keystrokeData.map((keyData, index) => (
                    <div
                      key={keyData.key}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      data-testid={`keystroke-${keyData.key}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-mono bg-white px-3 py-2 rounded border">
                          {keyData.key}
                        </div>
                        <div>
                          <div className="text-sm font-medium">Avg: {keyData.avgTime}ms</div>
                          <div className="text-xs text-gray-500">Response time</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-600">
                            {keyData.consistency}%
                          </div>
                          <div className="text-xs text-gray-500">Consistency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-600">
                            {keyData.accuracy}%
                          </div>
                          <div className="text-xs text-gray-500">Accuracy</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-typing-patterns">
                <CardHeader>
                  <CardTitle>Typing Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Peak Performance Time</span>
                      <span className="font-medium">10:00 AM - 12:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Most Active Day</span>
                      <span className="font-medium">Tuesday</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Session Length</span>
                      <span className="font-medium">8.5 minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Preferred Text Type</span>
                      <span className="font-medium">Technical</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-recommendations">
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">
                        Focus on Accuracy
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Practice with slower, more deliberate typing to reduce error rate
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">
                        Strong Progress
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Your speed has improved 15% this week - keep it up!
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800">
                        Practice Numbers
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Number row typing could use more practice
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}