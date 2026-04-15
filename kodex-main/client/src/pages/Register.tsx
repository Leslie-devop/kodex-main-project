import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Keyboard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLocalRegister, setShowLocalRegister] = useState(false);

  const handleComingSoon = (provider: string) => {
    toast({
      title: "Coming Soon",
      description: `${provider} authentication is currently under development.`,
    });
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      // Basic split for username if not provided
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, firstName, lastName })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: () => {
      // The router handles redirection based on user verification status
      toast({
        title: "Account Created",
        description: "Verify your email to continue.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleLocalRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields to create an account.",
        variant: "destructive"
      });
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#010205] relative overflow-hidden p-4 selection:bg-purple-500/30">
      {/* Background Atmosphere */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3.5s' }}></div>

      <Card className="w-full max-w-[400px] bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-[1.5rem] shadow-2xl relative z-10 overflow-hidden border-t-2 border-t-purple-500/50">
        <CardHeader className="space-y-3 flex flex-col items-center pt-6 pb-1">
          <div className="relative group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-950 rounded-lg flex items-center justify-center relative border border-white/20 shadow-lg shadow-purple-500/20 transform group-hover:scale-105 transition-transform duration-500">
               <Keyboard className="w-6 h-6 text-white" strokeWidth={1.5}/>
            </div>
          </div>
          <div className="text-center space-y-0.5">
            <CardTitle className="text-xl font-black tracking-tight text-white italic leading-tight flex flex-col items-center">
              <span className="uppercase tracking-tighter">KODEX</span>
              <span className="text-purple-500 not-italic text-sm tracking-normal">Master Your Typing</span>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 px-5 pb-8 pt-3">
          {!showLocalRegister ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                type="button" 
                className="w-full h-10 justify-center space-x-2 bg-white/[0.02] hover:bg-white/5 border border-white/5 text-white rounded-lg transition-all"
                onClick={() => window.location.href = '/api/auth/google'}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-black text-[9px] uppercase tracking-widest">GOOGLE</span>
              </Button>

              <Button 
                variant="outline" 
                type="button" 
                className="w-full h-10 justify-center space-x-2 bg-white/[0.02] hover:bg-white/5 border border-white/5 text-white rounded-lg transition-all"
                onClick={() => setShowLocalRegister(true)}
              >
                <span className="font-black text-[9px] uppercase tracking-widest">Uplink</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLocalRegister} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-[8px] font-bold text-gray-600 uppercase tracking-widest ml-2 italic">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="PROTOCOL"
                    className="h-9 bg-white/[0.04] border border-white/10 rounded-md text-[13px] text-white font-bold px-3"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-[8px] font-bold text-gray-600 uppercase tracking-widest ml-2 italic">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="ALPHA"
                    className="h-9 bg-white/[0.04] border border-white/10 rounded-md text-[13px] text-white font-bold px-3"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-[8px] font-bold text-gray-600 uppercase tracking-widest ml-2 italic">Link</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="operator@system.nexus"
                  className="h-9 bg-white/[0.04] border border-white/10 rounded-md text-[13px] text-white font-bold px-3"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-[8px] font-bold text-gray-600 uppercase tracking-widest ml-2 italic">Protocol</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="PROTECTED KEY"
                  className="h-9 bg-white/[0.04] border border-white/10 rounded-md text-[13px] text-white font-bold px-3"
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full h-10 justify-center bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] uppercase tracking-widest rounded-lg shadow-md transition-all border-b border-purple-900 mt-1"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "GENERATE"}
              </Button>

              <Button 
                variant="ghost" 
                type="button" 
                className="w-full h-6 text-[8px] font-bold text-gray-600 hover:text-purple-400 uppercase tracking-widest transition-colors"
                onClick={() => setShowLocalRegister(false)}
              >
                Abort
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-white/5 text-center">
            <Button 
              variant="ghost" 
              type="button" 
              className="w-full h-9 justify-center text-[9px] font-bold text-blue-500 hover:text-blue-300 hover:bg-blue-500/5 rounded-md uppercase tracking-widest border border-blue-500/10"
              onClick={() => setLocation('/login')}
            >
              LOG IN
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}