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
    <div className="min-h-screen flex items-center justify-center bg-[#010205] relative overflow-hidden p-4 selection:bg-blue-500/30">
      {/* Background Atmosphere */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>

      <Card className="w-full max-w-[320px] bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-[1.5rem] shadow-2xl relative z-10 overflow-hidden border-t-2 border-t-blue-500/50">
        <CardHeader className="space-y-3 flex flex-col items-center pt-6 pb-1">
          <div className="relative group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-950 rounded-lg flex items-center justify-center relative border border-white/20 shadow-lg shadow-blue-500/20 transform group-hover:scale-105 transition-transform duration-500">
               <Keyboard className="w-6 h-6 text-white" strokeWidth={1.5}/>
            </div>
          </div>
          <div className="text-center space-y-0.5">
            <CardTitle className="text-xl font-black tracking-tight text-white italic leading-tight flex flex-col items-center">
              <span className="uppercase tracking-tighter">KODEX</span>
              <span className="text-blue-500 not-italic text-sm tracking-normal">Master Your Typing</span>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 px-5 pb-8 pt-3">
          {!showLocalLogin ? (
            <div className="grid grid-cols-1 gap-3">
              <Button 
                className="w-full h-10 justify-center bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest rounded-lg shadow-md transition-all border-b border-blue-900"
                onClick={() => window.location.href = '/api/auth/google'}
              >
                GOOGLE
              </Button>
              
              <div className="relative py-1 flex items-center justify-center">
                <div className="absolute w-full h-[0.5px] bg-white/5"></div>
                <div className="relative px-2 bg-[#010205] text-[7px] font-black text-gray-700 uppercase tracking-widest">
                  OR MANUAL
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full h-10 justify-center font-black text-[11px] uppercase tracking-widest text-gray-500 bg-white/[0.02] hover:bg-white/5 hover:text-white border border-white/5 rounded-lg transition-all"
                onClick={() => setShowLocalLogin(true)}
              >
                STANDARD PORT
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLocalLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="identifier" className="text-[8px] font-bold text-gray-600 uppercase tracking-widest ml-2 italic">Designation</Label>
                <Input 
                  id="identifier" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  placeholder="USERNAME / EMAIL"
                  className="h-9 bg-white/[0.04] border border-white/10 rounded-md text-[13px] text-white placeholder:text-gray-800 focus:ring-0 transition-all px-3"
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-[8px] font-bold text-gray-600 uppercase tracking-widest ml-2 italic">Passcode</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="ACCESS KEY"
                  className="h-9 bg-white/[0.04] border border-white/10 rounded-md text-[13px] text-white placeholder:text-gray-800 focus:ring-0 transition-all px-3"
                  disabled={loginMutation.isPending}
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full h-10 justify-center bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest rounded-lg shadow-md transition-all border-b border-blue-900 mt-1"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "AUTHENTICATE"}
              </Button>
              
              <Button 
                variant="ghost" 
                type="button" 
                className="w-full h-6 text-[8px] font-bold text-gray-600 hover:text-blue-400 uppercase tracking-widest transition-colors"
                onClick={() => setShowLocalLogin(false)}
                disabled={loginMutation.isPending}
              >
                Abort & Return
              </Button>
            </form>
          )}
          
          <div className="pt-4 border-t border-white/5 text-center">
            <Button 
              variant="ghost" 
              type="button" 
              className="w-full h-9 justify-center text-[9px] font-bold text-blue-500 hover:text-blue-300 hover:bg-blue-500/5 rounded-md uppercase tracking-widest border border-blue-500/10"
              onClick={() => setLocation('/register')}
            >
              INITIALIZE PROFILE
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}