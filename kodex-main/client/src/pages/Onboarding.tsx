import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, BookOpen } from 'lucide-react';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const roleMutation = useMutation({
    mutationFn: async (role: 'student' | 'teacher') => {
      const response = await fetch('/api/auth/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to Kodex!",
        description: `Your account is set up as a ${data.user.role}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Redirect to home page
      setLocation('/');
      // Full refresh to rebuild router with proper role based dashboard
      setTimeout(() => window.location.reload(), 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-2xl mx-4 shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pb-8">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Account Verification
          </CardTitle>
          <CardDescription className="text-lg">
            Please select your role to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid md:grid-cols-2 gap-6 p-6">
          <Button
            variant="outline"
            className="h-48 flex flex-col items-center justify-center space-y-4 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => roleMutation.mutate('student')}
            disabled={roleMutation.isPending}
          >
            <GraduationCap className="h-16 w-16 text-primary" />
            <div className="space-y-1 text-center">
              <h3 className="font-semibold text-lg">I am a Student</h3>
              <p className="text-sm text-muted-foreground whitespace-normal">Take lessons and improve typing</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-48 flex flex-col items-center justify-center space-y-4 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => roleMutation.mutate('teacher')}
            disabled={roleMutation.isPending}
          >
            <BookOpen className="h-16 w-16 text-primary" />
            <div className="space-y-1 text-center">
              <h3 className="font-semibold text-lg">I am a Teacher</h3>
              <p className="text-sm text-muted-foreground whitespace-normal">Create lessons and track progress</p>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
