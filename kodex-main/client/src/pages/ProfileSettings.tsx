import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { User, Lock, Save, Loader2, ShieldCheck, Mail, Camera } from "lucide-react";
import Header from "@/components/layout/Header";

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const getInitials = (first?: string | null, last?: string | null) => {
    if (!first && !last) return "U";
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; password?: string; profileImageUrl?: string }) => {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      setPassword("");
      setConfirmPassword("");
      setIsUpdating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsUpdating(false);
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/me', {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      window.location.href = "/login";
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSavePersonalInfo = () => {
    setIsUpdating(true);
    updateProfileMutation.mutate({ firstName, lastName });
  };

  const handleSavePassword = () => {
    if (!password) {
      toast({
        title: "Validation Error",
        description: "Please enter a new password.",
        variant: "destructive"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    updateProfileMutation.mutate({ password });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex flex-col transition-colors">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 pl-1">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase italic">Profile Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage your account credentials and personal preferences.</p>
        </div>

        <Tabs defaultValue="personal" className="w-full max-w-3xl space-y-6">
          <TabsList className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 h-12 p-1 rounded-xl shadow-sm">
            <TabsTrigger 
              value="personal" 
              className="rounded-lg data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm px-6 h-full font-bold uppercase text-[10px] tracking-widest"
            >
              <User className="h-4 w-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="rounded-lg data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm px-6 h-full font-bold uppercase text-[10px] tracking-widest"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0">
            <Card className="border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden rounded-2xl bg-white dark:bg-white/5">
              <CardHeader className="bg-white dark:bg-black/20 border-b border-gray-100 dark:border-white/10 pb-6">
                <CardTitle className="text-xl font-black flex items-center text-slate-900 dark:text-white uppercase italic tracking-tighter">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 font-medium">
                  Update your display name and contact detail references.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 bg-gray-50/50 dark:bg-transparent">
                <div className="flex items-center space-x-6 p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                  <div className="relative group cursor-pointer">
                    <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-white/10 shadow-xl transition-all duration-200 group-hover:brightness-75 group-hover:blur-[1px]">
                      <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
                      <AvatarFallback className="text-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-black">
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatarUpload" 
                      className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    >
                      <Camera className="w-8 h-8 text-white drop-shadow-md" />
                    </label>
                    <input 
                      type="file" 
                      id="avatarUpload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (file.size > 5 * 1024 * 1024) {
                             toast({ title: "Image Too Large", description: "Profile pictures must be under 5MB.", variant: "destructive" });
                             return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                             updateProfileMutation.mutate({ profileImageUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                      {user?.firstName || "Unknown"} {user?.lastName || ""}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2 font-bold bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full border border-gray-100 dark:border-white/5 w-fit">
                      <Mail className="h-3 w-3 mr-2 text-blue-600 dark:text-blue-400" />
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-white/5 p-8 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 ml-1">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      placeholder="Enter your first name"
                      className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl px-6 font-bold text-slate-900 dark:text-white focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 ml-1">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      placeholder="Enter your last name"
                      className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl px-6 font-bold text-slate-900 dark:text-white focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-white dark:bg-black/20 border-t border-gray-100 dark:border-white/10 px-8 py-5">
                <Button 
                  onClick={handleSavePersonalInfo} 
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 ml-auto shadow-lg shadow-blue-600/20 rounded-xl h-12 px-8 font-black uppercase text-xs tracking-widest text-white active:scale-95 transition-all"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 border-r-transparent animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <Card className="border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden rounded-2xl bg-white dark:bg-white/5">
              <CardHeader className="bg-white dark:bg-black/20 border-b border-gray-100 dark:border-white/10 pb-6">
                <CardTitle className="text-xl font-black flex items-center text-slate-900 dark:text-white uppercase italic tracking-tighter">
                  <Lock className="h-5 w-5 mr-2 text-blue-600" />
                  Authentication Credentials
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 font-medium">
                  Modify your password or set one up to allow local login.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 bg-gray-50/50 dark:bg-transparent">
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm space-y-6 max-w-xl">
                  <div className="space-y-3">
                    <Label htmlFor="newPassword" className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 ml-1">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter new password"
                      className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl px-6 font-bold text-slate-900 dark:text-white focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 ml-1">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Confirm new password"
                      className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl px-6 font-bold text-slate-900 dark:text-white focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-white dark:bg-black/20 border-t border-gray-100 dark:border-white/10 px-8 py-5 flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Set a strong password to enable direct credentials access.
                </p>
                <Button 
                  onClick={handleSavePassword} 
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl h-12 px-8 font-black uppercase text-xs tracking-widest text-white active:scale-95 transition-all"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Update Password
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden rounded-2xl bg-white dark:bg-white/5 mt-8">
              <CardHeader className="bg-red-50/50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20 pb-6">
                <CardTitle className="text-xl font-black flex items-center text-red-600 dark:text-red-400 uppercase italic tracking-tighter">
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-red-500/70 dark:text-red-400/70 font-medium">
                  Permanently delete your account and all associated data.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 bg-red-50/20 dark:bg-transparent">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium max-w-xl">
                  Once you delete your account, there is no going back. Please be certain. All your progress, lessons, and classrooms will be permanently wiped.
                </p>
              </CardContent>
              <CardFooter className="bg-red-50/50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20 px-8 py-5 flex justify-end">
                <Button 
                  onClick={() => {
                    if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
                      deleteAccountMutation.mutate();
                    }
                  }} 
                  disabled={deleteAccountMutation.isPending}
                  variant="destructive"
                  className="shadow-lg shadow-red-600/20 rounded-xl h-12 px-8 font-black uppercase text-xs tracking-widest active:scale-95 transition-all"
                >
                  {deleteAccountMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Delete Account
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
