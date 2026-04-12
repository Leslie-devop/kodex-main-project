import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Lightbulb, Hand, Target, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { AISuggestion } from "@/types";

export default function AISuggestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading, error } = useQuery<AISuggestion[]>({
    queryKey: ["/api/ai/suggestions"],
    retry: false,
  });

  // Acknowledge suggestion mutation
  const acknowledgeSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const response = await apiRequest("POST", `/api/ai/suggestions/${suggestionId}/acknowledge`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/suggestions"] });
      toast({
        title: "Suggestion Acknowledged",
        description: "Thank you for the feedback!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to acknowledge suggestion",
        variant: "destructive",
      });
    },
  });

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "technique":
        return <Lightbulb className="h-4 w-4 text-amber-400" />;
      case "posture":
        return <Hand className="h-4 w-4 text-emerald-400" />;
      case "practice":
        return <Target className="h-4 w-4 text-blue-400" />;
      default:
        return <Bot className="h-4 w-4 text-indigo-400" />;
    }
  };

  const getSuggestionColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      case "medium":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "low":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      default:
        return "bg-white/5 border-white/10 text-gray-400";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] font-black uppercase tracking-tighter">CRITICAL ALERT</Badge>;
      case "medium":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] font-black uppercase tracking-tighter">SYSTEM ADVISORY</Badge>;
      case "low":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-black uppercase tracking-tighter">OPTIMAL SYNC</Badge>;
      default:
        return <Badge className="bg-white/5 border-white/10 text-gray-400 text-[9px] font-black uppercase tracking-tighter">{priority.toUpperCase()}</Badge>;
    }
  };

  const handleAcknowledge = (suggestionId: string) => {
    acknowledgeSuggestionMutation.mutate(suggestionId);
  };

  // Mock suggestions for demo when no real data
  const mockSuggestions = [
    {
      id: "mock-1",
      type: "technique",
      content: "Focus on 'th' combinations - you're 15% slower on these letter pairs. Practice typing words like 'the', 'that', 'think' repeatedly.",
      priority: "medium",
      acknowledged: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      type: "posture",
      content: "Great posture detected! Keep your wrists straight and maintain this positioning for optimal performance.",
      priority: "low",
      acknowledged: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const displaySuggestions = suggestions && suggestions.length > 0 ? suggestions : mockSuggestions;

  if (isLoading) {
    return (
      <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem]">
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-black text-gray-400 uppercase tracking-widest">
            <Bot className="h-4 w-4 mr-3 text-blue-500" />
            Neural Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-white/5">
        <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center">
          <Bot className="h-4 w-4 mr-3 text-blue-400" />
          Neural Feedback System
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8">
        <div className="space-y-6">
          {displaySuggestions.slice(0, 3).map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`p-5 border rounded-2xl transition-all hover:bg-white/[0.03] ${getSuggestionColor(suggestion.priority)}`}
              data-testid={`suggestion-${index}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-black/20 rounded-lg">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  {getPriorityBadge(suggestion.priority)}
                </div>
                
                {!suggestion.acknowledged && (
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAcknowledge(suggestion.id)}
                      className="h-8 w-8 p-0 hover:bg-white/5 rounded-full"
                      disabled={acknowledgeSuggestionMutation.isPending}
                      data-testid={`button-acknowledge-${index}`}
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="text-sm font-bold leading-relaxed mb-3" data-testid={`suggestion-content-${index}`}>
                {suggestion.content}
              </div>
              
              <div className="text-[10px] font-black uppercase tracking-widest opacity-50">
                Logged: {new Date(suggestion.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}

          {displaySuggestions.length === 0 && (
            <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
              <Bot className="h-16 w-16 mx-auto mb-4 text-gray-700" />
              <p className="font-bold text-white uppercase tracking-widest text-xs">Awaiting Analysis</p>
              <p className="text-[10px] text-gray-500 mt-2">Neural patterns insufficient for diagnostic output.</p>
            </div>
          )}
        </div>

        <Button 
          className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-14 font-black tracking-widest text-xs shadow-lg shadow-blue-500/10"
          data-testid="button-view-posture-guide"
        >
          OPEN POSTURE REPOSITORY
        </Button>
      </CardContent>
    </Card>
  );
}
