import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Keyboard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showLocalLogin, setShowLocalLogin] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, password })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter your email/username and password.",
        variant: "destructive"
      });
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EBF0FA] dark:bg-gray-900/50 p-4">
      <Card className="w-full max-w-[400px] shadow-sm border border-gray-200 bg-white dark:bg-gray-950 p-2">
        <CardHeader className="space-y-4 flex flex-col items-center pt-8 pb-4">
          <div className="w-[52px] h-[52px] bg-[#1d52f0] rounded-lg flex items-center justify-center mb-1">
             <Keyboard className="w-8 h-8 fill-current text-white" strokeWidth={2}/>
          </div>
          <CardTitle className="text-[26px] font-bold tracking-tight text-[#1C1F26] dark:text-white">
            Welcome to Kodex
          </CardTitle>
          <CardDescription className="text-[15px] font-medium text-[#464A53]">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 px-6 pb-6 pt-2">
          {!showLocalLogin ? (
            <>
              <Button 
                className="w-full h-12 justify-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[15px] rounded-lg shadow-sm transition-colors"
                onClick={() => window.location.href = '/api/auth/google'}
              >
                Sign in with Google
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 justify-center font-medium text-[15px] text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
                onClick={() => setShowLocalLogin(true)}
              >
                Use Email / Username
              </Button>
            </>
          ) : (
            <form onSubmit={handleLocalLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-gray-700 text-sm">Email or Username</Label>
                <Input 
                  id="identifier" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  placeholder="name@example.com"
                  className="h-11 bg-gray-50/50"
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password"
                  className="h-11 bg-gray-50/50"
                  disabled={loginMutation.isPending}
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full h-12 justify-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[15px] rounded-lg shadow-sm transition-colors mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in securely"}
              </Button>
              
              <Button 
                variant="ghost" 
                type="button" 
                className="w-full h-10 mt-2 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setShowLocalLogin(false)}
                disabled={loginMutation.isPending}
              >
                Back to all sign in options
              </Button>
            </form>
          )}
          
          <p className="text-xs text-center text-gray-500 pt-2 px-4 mt-2">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>

          <Button 
            variant="ghost" 
            type="button" 
            className="w-full mt-2 h-10 justify-center text-sm font-medium text-gray-600 hover:text-gray-900 shadow-none border-0"
            onClick={() => setLocation('/register')}
          >
            Don't have an account? Sign up
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}