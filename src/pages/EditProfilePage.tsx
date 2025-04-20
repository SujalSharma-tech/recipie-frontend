import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiClient from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Camera, Loader2, AlertCircle } from "lucide-react";

interface ProfileUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  cover_image: string | null;
  email_verified_at: string | null;
  joined_date: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [user, setUser] = useState<ProfileUser | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    website: "",
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) {
        navigate("/auth/login");
        return;
      }

      setIsLoadingProfile(true);
      setError(null);

      try {
        // Fetch current user profile using the auth/me endpoint
        const response = await ApiClient.get<{ user: ProfileUser }>("/auth/me");
        setUser(response.user);

        // Initialize form with user data
        setFormData({
          name: response.user.name || "",
          username: response.user.username || "",
          email: response.user.email || "",
          bio: response.user.bio || "",
          location: response.user.location || "",
          website: response.user.website || "",
        });

        // Set image previews if they exist
        if (response.user.avatar) {
          setProfileImagePreview(formatImageUrl(response.user.avatar));
        }

        if (response.user.cover_image) {
          setCoverImagePreview(formatImageUrl(response.user.cover_image));
        }
      } catch (error: any) {
        console.error("Failed to fetch user profile", error);
        setError(error.message || "Failed to load user profile");
        toast.error("Failed to load profile", {
          description: error.message || "Please try again",
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [authUser, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  // Format image URLs
  const formatImageUrl = (path: string | null) => {
    if (!path) return "/placeholder.svg";
    if (path.startsWith("http")) return path;
    return `${
      import.meta.env.VITE_API_URL || "http://localhost:8000"
    }/storage/${path}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsLoading(true);

    try {
      // Create form data for multipart/form-data request
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("bio", formData.bio || "");
      formDataToSend.append("location", formData.location || "");
      formDataToSend.append("website", formData.website || "");

      // Only append images if they were changed
      if (profileImage) {
        formDataToSend.append("avatar", profileImage);
      }

      if (coverImage) {
        formDataToSend.append("cover_image", coverImage);
      }

      // Update user profile
      await ApiClient.putFormData(`/users/${user.id}`, formDataToSend);

      toast.success("Profile updated successfully");
      navigate("/profile");
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load profile</h2>
          <p className="text-muted-foreground mb-6">
            {error || "User not found"}
          </p>
          <Button onClick={() => navigate("/profile")}>Back to Profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your personal information and profile images
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>
                  This image will appear at the top of your profile page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[3/1] overflow-hidden rounded-lg border bg-muted">
                  {/* Background/Preview Image */}
                  {coverImagePreview ? (
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="object-cover w-full h-full absolute inset-0"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground">No cover image</p>
                    </div>
                  )}

                  {/* Upload Overlay - THIS IS THE KEY PART */}
                  <label
                    htmlFor="cover-image"
                    className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10"
                  >
                    <div className="flex flex-col items-center text-white">
                      <Upload className="h-8 w-8 mb-2" />
                      <p className="text-sm font-medium mb-1">
                        Upload a cover image
                      </p>
                      <p className="text-xs">
                        Recommended size: 1200 x 400 pixels
                      </p>
                    </div>
                  </label>

                  {/* Hidden File Input */}
                  <Input
                    id="cover-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageChange}
                  />

                  {/* Remove Button */}
                  {coverImagePreview && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 z-20"
                      onClick={(e) => {
                        e.preventDefault();
                        setCoverImage(null);
                        setCoverImagePreview(null);
                      }}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Image */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  This image will be shown next to your name and on your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={profileImagePreview || "/placeholder.svg"}
                        alt="Profile"
                      />
                      <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <div className="relative">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full"
                          type="button"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        <Input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleProfileImageChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium">Upload a new photo</h3>
                    <p className="text-sm text-muted-foreground">
                      Square images work best. Maximum file size 5MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleChange}
                      placeholder="New York, USA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website || ""}
                      onChange={handleChange}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                type="button"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
