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
    <div className="min-h-screen flex items-center justify-center bg-[#010205] relative overflow-hidden p-8 sm:p-24 selection:bg-blue-500/30">
      {/* Colossal Background Atmosphere */}
      <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[250px] animate-pulse"></div>
      <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[250px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.08]"></div>

      <Card className="w-full max-w-[1800px] bg-white/[0.04] border-2 border-white/20 backdrop-blur-[120px] rounded-[6rem] shadow-[0_0_200px_rgba(0,0,0,0.9)] relative z-10 overflow-hidden border-t-[12px] border-t-blue-500/50">
        <CardHeader className="space-y-20 flex flex-col items-center pt-40 pb-20">
          <div className="relative group">
            <div className="absolute inset-x-0 inset-y-0 bg-blue-500 blur-[80px] opacity-40 group-hover:opacity-70 transition-opacity animate-pulse"></div>
            <div className="w-64 h-64 bg-gradient-to-br from-blue-600 to-blue-950 rounded-[4rem] flex items-center justify-center relative border-4 border-white/30 shadow-2xl shadow-blue-500/60 transform group-hover:scale-105 transition-transform duration-700">
               <Keyboard className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]" strokeWidth={3}/>
            </div>
          </div>
          <div className="text-center space-y-12">
            <CardTitle className="text-9xl sm:text-[14rem] font-black tracking-[-0.06em] text-white uppercase italic leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              KODEX <span className="text-blue-500 not-italic">COMMAND</span>
            </CardTitle>
            <div className="flex items-center justify-center space-x-16 opacity-80 scale-150">
              <div className="h-[3px] w-48 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              <CardDescription className="text-2xl font-black text-blue-400 uppercase tracking-[1em]">
                NEURAL INTERFACE ACCESS // MASTER TERMINAL
              </CardDescription>
              <div className="h-[3px] w-48 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-20 px-16 sm:px-48 pb-64 pt-20">
          {!showLocalLogin ? (
            <div className="grid grid-cols-1 gap-14">
              <Button 
                className="w-full h-44 justify-center bg-blue-600 hover:bg-blue-500 text-white font-black text-4xl uppercase tracking-[0.3em] rounded-[4.5rem] shadow-[0_20px_60px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.03] active:scale-[0.98] border-b-[12px] border-blue-900"
                onClick={() => window.location.href = '/api/auth/google'}
              >
                ESTABLISH GOOGLE LINK
              </Button>
              
              <div className="relative py-20 flex items-center justify-center">
                <div className="absolute w-full h-[3px] bg-white/10"></div>
                <div className="relative px-20 bg-[#010205] border-2 border-white/10 rounded-full py-6 text-2xl font-black text-gray-500 uppercase tracking-[0.5em] shadow-2xl">
                  OR USE MANUAL UPLINK
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full h-44 justify-center font-black text-4xl uppercase tracking-[0.3em] text-gray-400 bg-white/[0.03] hover:bg-white/10 hover:text-white border-4 border-white/10 rounded-[4.5rem] transition-all"
                onClick={() => setShowLocalLogin(true)}
              >
                ACCESS STANDARD PORT
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLocalLogin} className="space-y-16">
              <div className="space-y-10">
                <Label htmlFor="identifier" className="text-3xl font-black text-gray-500 uppercase tracking-[0.4em] ml-12 italic">Identity Designation</Label>
                <Input 
                  id="identifier" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  placeholder="USERNAME / SYSTEM EMAIL"
                  className="h-36 bg-white/[0.06] border-4 border-white/10 rounded-[4rem] text-5xl text-white placeholder:text-gray-900 focus:border-blue-500 focus:ring-0 transition-all font-bold px-20"
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-10">
                <Label htmlFor="password" className="text-3xl font-black text-gray-500 uppercase tracking-[0.4em] ml-12 italic">Master Passcode</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="ACCESS KEY"
                  className="h-36 bg-white/[0.06] border-4 border-white/10 rounded-[4rem] text-5xl text-white placeholder:text-gray-900 focus:border-blue-500 focus:ring-0 transition-all font-bold px-20"
                  disabled={loginMutation.isPending}
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full h-44 justify-center bg-blue-600 hover:bg-blue-500 text-white font-black text-4xl uppercase tracking-[0.3em] rounded-[4.5rem] shadow-[0_20px_60px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.03] border-b-[12px] border-blue-900 mt-20"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="h-16 w-16 animate-spin" /> : "AUTHENTICATE CONNECTION"}
              </Button>
              
              <Button 
                variant="ghost" 
                type="button" 
                className="w-full h-20 text-2xl font-black text-gray-600 hover:text-blue-400 uppercase tracking-[0.6em] transition-colors"
                onClick={() => setShowLocalLogin(false)}
                disabled={loginMutation.isPending}
              >
                Abort & Return to Nexus
              </Button>
            </form>
          )}
          
          <div className="pt-32 border-t-4 border-white/10 text-center space-y-20">
            <p className="text-lg font-black text-gray-600 uppercase tracking-[0.3em] px-40 leading-relaxed opacity-50 italic">
              Warning: Direct neural link established. Data integrity monitored by Command Center. 
              Violation of usage protocols will result in immediate session termination.
            </p>

            <Button 
              variant="ghost" 
              type="button" 
              className="w-full h-32 justify-center text-3xl font-black text-blue-500 hover:text-blue-300 hover:bg-blue-500/10 rounded-[4rem] uppercase tracking-[0.5em] border-4 border-blue-500/30"
              onClick={() => setLocation('/register')}
            >
              INITIALIZE NEW OPERATOR PROFILE
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}