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
      window.location.href = '/onboarding';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 p-4">
      <Card className="w-full max-w-sm mx-4 shadow-md border-0 bg-white dark:bg-gray-950">
        <CardHeader className="space-y-4 flex flex-col items-center pt-8 pb-4">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center mb-2">
             <Keyboard className="w-8 h-8 text-white dark:text-black" />
          </div>
          <CardTitle className="text-2xl font-medium tracking-tight">
            Sign up for Kodex
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Create an account to get started
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3 px-8 pb-8 pt-2 text-gray-700 dark:text-gray-300">
          {!showLocalRegister ? (
            <>
              <Button 
                variant="outline" 
                type="button" 
                className="w-full h-11 justify-center space-x-2 bg-white hover:bg-gray-50 border-gray-200 shadow-sm text-black rounded-lg"
                onClick={() => window.location.href = '/api/auth/google'}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-medium text-[15px]">Continue with Google</span>
              </Button>

              <Button 
                variant="outline" 
                type="button" 
                className="w-full h-11 justify-center space-x-2 bg-white hover:bg-gray-50 border-gray-200 shadow-sm text-black rounded-lg"
                onClick={() => handleComingSoon('Apple')}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M16.365 21.435c-1.325.962-2.348 1.002-3.483.99-1.229-.013-2.147-.393-3.088-1.579-2.316-2.905-3.754-7.534-2.802-10.741.523-1.748 1.488-2.613 2.545-3.125 1.705-.83 3.612-.224 4.542.443.951.68 1.832 1.053 2.923.633 1.008-.387 2.146-.879 3.6-.339 1.411.522 2.213 1.547 2.656 2.298-2.6.938-3.013 3.307-1.42 5.176 1.11 1.304 2.5 1.529 2.5 1.529-1.026 3.468-2.349 4.398-3.033 4.908-.949.702-1.996.671-2.946-.024l-.117-.087c-1.121-.836-2.433-1.082-3.83-1.139-1.4-.055-2.713.208-3.836 1.045l-.116.087c-1.056.79-2.147.825-3.14.077m4.05-18.172c-.85.495-1.921.93-2.585.313-.815-.758-1.066-2.336-.723-3.21.36-.92 1.353-1.485 2.183-1.785.836-.3 1.879-.387 2.612.35.539.544.755 1.332.65 2.228-.088.756-.596 1.625-1.187 2.102-.387.315-1.242.493-2.115.424zM8.334 16.59c-.933 1.168-1.776 2.584-2.001 4.095-.275 1.848.336 3.23.821 3.513 1.144.664 2.593.425 3.91.242 1.258-.175 2.457-.341 3.456.402.949.702 1.996.671 2.946-.024v.001c.797-.589 1.954-1.408 2.59-4.249.208-.934.343-1.895.402-2.859-1.742-.71-3.28-1.89-4.46-3.414-1.637-2.146-2.22-4.831-1.688-7.391C12.44 6.702 10.669 6.273 9.4 7.026c-1.071.635-1.997 1.85-2.455 3.391-.849 2.871-.59 6.467 1.389 6.173z"/></svg>
                <span className="font-medium text-[15px]">Continue with Apple</span>
              </Button>

              <Button 
                variant="outline" 
                type="button" 
                className="w-full h-11 justify-center space-x-2 bg-white hover:bg-gray-50 border-gray-200 shadow-sm text-black rounded-lg"
                onClick={() => setShowLocalRegister(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" /><rect x="3" y="5" width="18" height="14" rx="2" /></svg>
                <span className="font-medium text-[15px]">Continue with email</span>
              </Button>
            </>
          ) : (
            <form onSubmit={handleLocalRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 text-sm">First name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    placeholder="John"
                    className="bg-gray-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 text-sm">Last name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    placeholder="Doe"
                    className="bg-gray-50/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 text-sm">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@example.com"
                  className="bg-gray-50/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Create a strong password"
                  className="bg-gray-50/50"
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full h-11 justify-center bg-black hover:bg-gray-800 text-white font-medium text-[15px] rounded-lg shadow-sm transition-colors mt-2"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
              </Button>

              <Button 
                variant="ghost" 
                type="button" 
                className="w-full h-10 mt-2 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setShowLocalRegister(false)}
              >
                Back to all sign up options
              </Button>
            </form>
          )}

          <Button 
            variant="ghost" 
            type="button" 
            className="w-full h-11 justify-center bg-gray-50/50 hover:bg-gray-100 text-gray-700 shadow-none border-0 rounded-lg font-medium text-[15px]"
            onClick={() => setLocation('/login')}
          >
            Sign in securely
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}