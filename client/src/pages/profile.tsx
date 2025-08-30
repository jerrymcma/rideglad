import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, User, Camera, Save, Edit3 } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ui/object-uploader";
import type { UploadResult } from "@uppy/core";

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function Profile() {
  console.log('Profile component rendering');
  const { user } = useAuth();
  console.log('Profile user:', user);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      return await apiRequest('PATCH', '/api/auth/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const profilePictureUploadMutation = useMutation({
    mutationFn: async (profilePictureURL: string) => {
      return await apiRequest('PATCH', '/api/profile/picture', { profilePictureURL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest('POST', '/api/profile/upload-url');
    return {
      method: 'PUT' as const,
      url: (response as any).uploadURL,
    };
  };

  const handleProfilePictureComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        profilePictureUploadMutation.mutate(uploadedFile.uploadURL as string);
      }
    }
  };

  // Get the profile picture URL for display
  const getProfilePictureUrl = () => {
    if (user?.profileImageUrl && user.profileImageUrl.startsWith('/objects/')) {
      return user.profileImageUrl;
    }
    return user?.profileImageUrl || null;
  };

  const onSubmit = (data: ProfileUpdateData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="max-w-sm mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#6b46c1] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <h1 className="font-extrabold text-[#6b46c1] text-[22px]">Account Profile</h1>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Edit3 size={20} className="text-[#6b46c1]" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Picture Section */}
        <Card className="border-[#6b46c1] border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-[#6b46c1] flex items-center justify-center overflow-hidden">
                  {getProfilePictureUrl() ? (
                    <img 
                      src={getProfilePictureUrl() || ''} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-white" />
                  )}
                </div>
                {isEditing && (
                  <div className="absolute bottom-0 right-0">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB limit for profile pictures
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleProfilePictureComplete}
                      buttonClassName="bg-white rounded-full p-2 border-2 border-[#6b46c1] hover:bg-gray-50 transition-colors"
                    >
                      <Camera size={16} className="text-[#6b46c1]" />
                    </ObjectUploader>
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-[#6b46c1] text-lg">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <User size={20} />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself..." 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-[#6b46c1] hover:bg-[#5b21b6]"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save size={16} />
                          Save Changes
                        </div>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">First Name</Label>
                    <p className="mt-1 text-sm text-gray-900">{user.firstName || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Last Name</Label>
                    <p className="mt-1 text-sm text-gray-900">{user.lastName || "Not set"}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                  <p className="mt-1 text-sm text-gray-900">{user.phone || "Not set"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Bio</Label>
                  <p className="mt-1 text-sm text-gray-900">{user.bio || "No bio added yet"}</p>
                </div>

                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-[#6b46c1] hover:bg-[#5b21b6] mt-4"
                >
                  <Edit3 size={16} className="mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">User Type</span>
              <span className="text-sm text-gray-900 capitalize">{user.userType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Member Since</span>
              <span className="text-sm text-gray-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
            {user.userType === 'driver' && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Driver Rating</span>
                <span className="text-sm text-gray-900">{user.rating?.toFixed(1) || "No rating"}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}