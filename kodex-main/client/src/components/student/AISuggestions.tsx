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

  const acknowledgeSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const response = await apiRequest("POST", `/api/ai/suggestions/${suggestionId}/acknowledge`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/suggestions"] });
    },
  });

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "technique": return <Lightbulb className="h-3 w-3 text-amber-400" />;
      case "posture": return <Hand className="h-3 w-3 text-emerald-400" />;
      case "practice": return <Target className="h-3 w-3 text-blue-400" />;
      default: return <Bot className="h-3 w-3 text-indigo-400" />;
    }
  };

  const getSuggestionColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400";
      case "medium": return "bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400";
      default: return "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    }
  };

  if (isLoading) return null;

  const displaySuggestions = suggestions || [];

  return (
    <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader className="p-6 pb-4 border-b border-gray-50 dark:border-white/5 flex flex-row items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
             <Bot className="h-4 w-4 text-blue-400" />
          </div>
          <CardTitle className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">
            NEURAL FEEDBACK
          </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {displaySuggestions.slice(0, 2).map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`p-4 border rounded-2xl transition-all ${getSuggestionColor(suggestion.priority)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-black/20 rounded-md">
                  {getSuggestionIcon(suggestion.type)}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-80">
                  {suggestion.priority === 'high' ? 'CRITICAL VECTOR' : 'TACTICAL ADVISORY'}
                </span>
              </div>
              {!suggestion.acknowledged && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => acknowledgeSuggestionMutation.mutate(suggestion.id)}
                  className="h-6 w-6 p-0 hover:bg-white/10 transition-colors"
                  disabled={acknowledgeSuggestionMutation.isPending}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 opacity-60 hover:opacity-100" />
                </Button>
              )}
            </div>
            <div className="text-[11px] font-black leading-relaxed italic uppercase tracking-tight">
              {suggestion.content}
            </div>
          </div>
        ))}

        {displaySuggestions.length === 0 && (
          <div className="text-center py-10 bg-gray-50/50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-[2rem]">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-[0.2em]">SYNCING ANALYTICS...</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-600 mt-2">Awaiting neural link stabilization.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
