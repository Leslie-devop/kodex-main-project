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
import { User, Lock, Save, Loader2, ShieldCheck, Mail } from "lucide-react";
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
    mutationFn: async (data: { firstName?: string; lastName?: string; password?: string }) => {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 pl-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-2">Manage your account credentials and personal preferences.</p>
        </div>

        <Tabs defaultValue="personal" className="w-full max-w-3xl space-y-6">
          <TabsList className="bg-white border text-gray-600 h-12 p-1 rounded-xl shadow-sm">
            <TabsTrigger 
              value="personal" 
              className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm px-6 h-full font-medium"
            >
              <User className="h-4 w-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm px-6 h-full font-medium"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0">
            <Card className="border shadow-none overflow-hidden rounded-2xl">
              <CardHeader className="bg-white border-b pb-6">
                <CardTitle className="text-xl flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your display name and contact detail references.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 bg-gray-50/50">
                <div className="flex items-center space-x-6 p-4 bg-white border rounded-xl shadow-sm">
                  <Avatar className="h-20 w-20 ring-4 ring-white shadow-md">
                    <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-700 font-medium">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user?.firstName || "Unknown"} {user?.lastName || ""}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Mail className="h-4 w-4 mr-1.5" />
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 border rounded-xl shadow-sm">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      placeholder="Enter your first name"
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      placeholder="Enter your last name"
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-white border-t px-6 py-4">
                <Button 
                  onClick={handleSavePersonalInfo} 
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 ml-auto shadow-sm"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 border-r-transparent animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <Card className="border shadow-none overflow-hidden rounded-2xl">
              <CardHeader className="bg-white border-b pb-6">
                <CardTitle className="text-xl flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-blue-600" />
                  Authentication Credentials
                </CardTitle>
                <CardDescription>
                  Modify your password or set one up to allow local login alongside Google Authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 bg-gray-50/50">
                <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-700">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter new password"
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Confirm new password"
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-white border-t px-6 py-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  You can log in directly after setting up a strong password.
                </p>
                <Button 
                  onClick={handleSavePassword} 
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
