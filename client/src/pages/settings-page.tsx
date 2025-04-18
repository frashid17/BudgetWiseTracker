import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings2, Sun, MoonStar, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Schema for profile update
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

// Schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Schema for appearance settings
const appearanceSchema = z.object({
  darkMode: z.boolean().default(false),
  highContrast: z.boolean().default(false),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');
  
  // Get user settings if available
  const { data: settings } = useQuery({
    queryKey: ['/api/user/settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/user/settings', {
          credentials: 'include',
        });
        
        if (res.status === 404) {
          // If settings don't exist yet, return defaults
          return {
            theme: 'light',
            highContrast: false
          };
        }
        
        if (!res.ok) throw new Error('Failed to fetch settings');
        return await res.json();
      } catch (error) {
        console.error('Error fetching settings:', error);
        return {
          theme: 'light',
          highContrast: false
        };
      }
    },
    enabled: !!user,
  });

  // Set initial theme
  useState(() => {
    if (settings?.theme) {
      setSelectedTheme(settings.theme);
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }
  });
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Appearance form
  const appearanceForm = useForm<z.infer<typeof appearanceSchema>>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      darkMode: settings?.theme === 'dark' || false,
      highContrast: settings?.highContrast || false,
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], (oldData: any) => ({
        ...oldData,
        ...data,
      }));
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to change password",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update appearance settings mutation
  const updateAppearanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appearanceSchema>) => {
      const theme = data.darkMode ? 'dark' : 'light';
      const res = await apiRequest("PATCH", "/api/user/settings", {
        theme,
        highContrast: data.highContrast,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user/settings'], data);
      document.documentElement.classList.toggle('dark', data.theme === 'dark');
      toast({
        title: "Appearance updated",
        description: "Your appearance settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update appearance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload profile picture
  const uploadProfilePicture = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const res = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to upload profile picture');
      }
      
      const data = await res.json();
      // Update profile image in state
      setProfileImage(data.imageUrl);
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to upload profile picture",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    }
  };

  // Handle file select
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadProfilePicture(file);
    }
  };
  
  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    changePasswordMutation.mutate(data);
  };
  
  const onAppearanceSubmit = (data: z.infer<typeof appearanceSchema>) => {
    setSelectedTheme(data.darkMode ? 'dark' : 'light');
    updateAppearanceMutation.mutate(data);
  };

  // Toggle theme manually
  const toggleTheme = (theme: 'light' | 'dark') => {
    setSelectedTheme(theme);
    appearanceForm.setValue('darkMode', theme === 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };
  
  if (!user) {
    return null; // Protected route will handle redirect
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar className="h-full border-r-0" />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          title="Settings" 
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                      Manage your profile information and profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                      <div className="flex flex-col items-center gap-3">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={profileImage || user.profilePicture || undefined} />
                          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <Button 
                          variant="outline" 
                          onClick={triggerFileUpload}
                          className="flex items-center"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Change
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileSelect} 
                          className="hidden" 
                          accept="image/*"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <FormField
                                control={profileForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="submit" 
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Password Tab */}
              <TabsContent value="password" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to ensure your account stays secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 8 characters long
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Appearance Tab */}
              <TabsContent value="appearance" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize how BudgetWise looks for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Theme Selector */}
                      <div>
                        <h3 className="text-sm font-medium mb-4">Theme</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div
                            className={`flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedTheme === 'light' ? 'border-primary bg-primary/10' : 'border-border'
                            }`}
                            onClick={() => toggleTheme('light')}
                          >
                            <div className="bg-white border rounded-full p-2 mb-3">
                              <Sun className="w-5 h-5 text-yellow-500" />
                            </div>
                            <span className="text-sm font-medium">Light</span>
                          </div>
                          <div
                            className={`flex flex-col items-center border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedTheme === 'dark' ? 'border-primary bg-primary/10' : 'border-border'
                            }`}
                            onClick={() => toggleTheme('dark')}
                          >
                            <div className="bg-slate-900 border rounded-full p-2 mb-3">
                              <MoonStar className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium">Dark</span>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <Form {...appearanceForm}>
                        <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-4">
                          <FormField
                            control={appearanceForm.control}
                            name="darkMode"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Dark Mode</FormLabel>
                                  <FormDescription>
                                    Use dark theme throughout the application
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={appearanceForm.control}
                            name="highContrast"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">High Contrast</FormLabel>
                                  <FormDescription>
                                    Increase contrast for better visibility
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            disabled={updateAppearanceMutation.isPending}
                          >
                            {updateAppearanceMutation.isPending ? 'Saving...' : 'Save Preferences'}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}