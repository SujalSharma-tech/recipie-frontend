import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApiClient from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  ChefHat,
  Edit,
  Settings,
  BookOpen,
  Heart,
  FolderOpen,
  Share2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import ShareRecipeDialog from "@/components/share-recipe-dialog";
import { formatDate } from "@/lib/utils";
import { Recipe } from "./Home";
import { PaginatedResponse } from "@/types";

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
  created_at: string;
  updated_at: string;
}

interface Collection {
  id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  recipe_count?: number;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("recipes");

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  // Track counts manually since there's no stats API
  const [recipeCount, setRecipeCount] = useState(0);
  const [collectionCount, setCollectionCount] = useState(0);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const [userError, setUserError] = useState<string | null>(null);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) {
        navigate("/auth/login");
        return;
      }

      setIsLoadingUser(true);
      setUserError(null);

      try {
        // Fetch current user profile using the auth/me endpoint
        const response = await ApiClient.get<{ user: ProfileUser }>("/auth/me");
        setUser(response.user);

        // Initial fetch of recipes
        fetchUserRecipes(response.user.id);
      } catch (error: any) {
        console.error("Failed to fetch user profile", error);
        setUserError(error.message || "Failed to load user profile");
        toast.error("Failed to load profile", {
          description: error.message || "Please try again",
        });
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, [authUser, navigate]);

  // Fetch user recipes
  const fetchUserRecipes = async (userId: number) => {
    setIsLoadingRecipes(true);
    setRecipesError(null);

    try {
      const response = await ApiClient.get<{
        recipes: PaginatedResponse<Recipe>;
      }>(`/users/${userId}/recipes`);
      setUserRecipes(response.recipes.data);
      setRecipeCount(response.recipes.total); // Use total from pagination for count
    } catch (error: any) {
      console.error("Failed to fetch user recipes", error);
      setRecipesError(error.message || "Failed to load recipes");
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Update the fetchUserCollections function to handle paginated data
  const fetchUserCollections = async (userId: number) => {
    if (userCollections.length > 0) return; // Don't fetch if we already have them

    setIsLoadingCollections(true);
    setCollectionsError(null);

    try {
      const response = await ApiClient.get<{
        collections: PaginatedResponse<Collection>;
      }>(`/users/${userId}/collections`);
      setUserCollections(response.collections.data);
      setCollectionCount(response.collections.total); // Use total from pagination
    } catch (error: any) {
      console.error("Failed to fetch user collections", error);
      setCollectionsError(error.message || "Failed to load collections");
    } finally {
      setIsLoadingCollections(false);
    }
  };

  // Fetch saved recipes
  const fetchSavedRecipes = async (userId: number) => {
    if (savedRecipes.length > 0) return; // Don't fetch if we already have them

    setIsLoadingSaved(true);
    setSavedError(null);

    try {
      const response = await ApiClient.get<{
        recipes: PaginatedResponse<Recipe>;
      }>(`/users/${userId}/saved`);
      setSavedRecipes(response.recipes.data);
    } catch (error: any) {
      console.error("Failed to fetch saved recipes", error);
      setSavedError(error.message || "Failed to load saved recipes");
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Handle tab changes to load relevant data
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (!user) return;

    if (value === "collections") {
      fetchUserCollections(user.id);
    } else if (value === "saved") {
      fetchSavedRecipes(user.id);
    }
  };

  // Handle save/unsave recipe
  const handleSaveRecipe = async (recipeId: number, isSaved: boolean) => {
    if (!authUser) {
      toast.error("Please sign in to save recipes");
      return;
    }

    try {
      if (isSaved) {
        await ApiClient.post(`/recipes/${recipeId}/unsave`, {});
        toast.success("Recipe removed from your saved items");

        // Update saved recipes list if we're on that tab
        if (activeTab === "saved" && user) {
          const response = await ApiClient.get<{
            recipes: PaginatedResponse<Recipe>;
          }>(`/users/${user.id}/saved`);
          setSavedRecipes(response.recipes.data);
        }
      } else {
        await ApiClient.post(`/recipes/${recipeId}/save`, {});
        toast.success("Recipe saved to your collection");
      }
    } catch (error: any) {
      toast.error("Failed to update saved status", {
        description: error.message || "Please try again",
      });
    }
  };

  // Handle uploading a new avatar
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      toast.loading("Uploading avatar...");
      const response = await ApiClient.upload<{ user: ProfileUser }>(
        `/users/${user.id}/avatar`,
        formData
      );
      setUser((prev) =>
        prev ? { ...prev, avatar: response.user.avatar } : null
      );
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      toast.error("Failed to update avatar", {
        description: error.message || "Please try again",
      });
    } finally {
      toast.dismiss();
    }
  };

  // Handle uploading a new cover image
  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("cover", file);

    try {
      toast.loading("Uploading cover image...");
      const response = await ApiClient.upload<{ user: ProfileUser }>(
        `/users/${user.id}/cover`,
        formData
      );
      setUser((prev) =>
        prev ? { ...prev, cover_image: response.user.cover_image } : null
      );
      toast.success("Cover image updated successfully");
    } catch (error: any) {
      toast.error("Failed to update cover image", {
        description: error.message || "Please try again",
      });
    } finally {
      toast.dismiss();
    }
  };

  // Format image URLs
  const formatImageUrl = (path: string | null) => {
    if (!path) return "/placeholder.svg";
    if (path.startsWith("http")) return path;
    return `${
      import.meta.env.VITE_API_URL || "http://localhost:8000"
    }/recipes/${path}`;
  };

  // Show loading state
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (userError || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load profile</h2>
          <p className="text-muted-foreground mb-6">
            {userError || "User not found"}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 w-full bg-muted">
        <img
          src={formatImageUrl(user.cover_image)}
          alt="Cover"
          className="object-cover w-full h-full absolute inset-0"
        />
      </div>

      <div className="container px-4 mx-auto">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage
                  src={formatImageUrl(user.avatar)}
                  alt={user.name}
                />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 cursor-pointer bg-primary text-white rounded-full p-1.5 shadow-md">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <Edit className="h-4 w-4" />
              </label>
            </div>

            <div className="flex-1 pt-4 md:pt-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/profile/edit">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </div>

              <p className="mt-4 max-w-2xl">{user.bio || "No bio yet."}</p>

              <div className="flex flex-wrap gap-6 mt-4">
                <div className="flex items-center gap-1">
                  <Badge variant="secondary">{recipeCount}</Badge>
                  <span>Recipes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary">{collectionCount}</Badge>
                  <span>Collections</span>
                </div>
                <div className="text-muted-foreground">
                  Joined{" "}
                  {user.joined_date
                    ? formatDate(user.joined_date)
                    : formatDate(user.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Profile Content */}
        <Tabs
          defaultValue="recipes"
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="recipes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">My Recipes</span>
                <span className="sm:hidden">Recipes</span>
              </TabsTrigger>
              <TabsTrigger
                value="collections"
                className="flex items-center gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Collections</span>
                <span className="sm:hidden">Collections</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Saved Recipes</span>
                <span className="sm:hidden">Saved</span>
              </TabsTrigger>
            </TabsList>

            {activeTab === "recipes" && (
              <Button asChild>
                <Link to="/recipes/create">Create Recipe</Link>
              </Button>
            )}

            {activeTab === "collections" && (
              <Button asChild>
                <Link to="/collections/create">Create Collection</Link>
              </Button>
            )}
          </div>

          <TabsContent value="recipes" className="space-y-6">
            {isLoadingRecipes ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recipesError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">{recipesError}</p>
                <Button
                  onClick={() => fetchUserRecipes(user.id)}
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : userRecipes.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first recipe to get started.
                </p>
                <Button asChild>
                  <Link to="/recipes/create">Create Recipe</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    showStats
                    onSave={(saved) => handleSaveRecipe(recipe.id, saved)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            {isLoadingCollections ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : collectionsError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">{collectionsError}</p>
                <Button
                  onClick={() => fetchUserCollections(user.id)}
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : userCollections.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No collections yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first collection to organize your recipes.
                </p>
                <Button asChild>
                  <Link to="/collections/create">Create Collection</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            {isLoadingSaved ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : savedError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">{savedError}</p>
                <Button
                  onClick={() => fetchSavedRecipes(user.id)}
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            ) : savedRecipes.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No saved recipes</h3>
                <p className="text-muted-foreground mb-6">
                  Save recipes to access them later.
                </p>
                <Button asChild>
                  <Link to="/recipes">Browse Recipes</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    showAuthor
                    onSave={(saved) => handleSaveRecipe(recipe.id, saved)}
                    saved={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  showStats?: boolean;
  showAuthor?: boolean;
  saved?: boolean;
  onSave: (isSaved: boolean) => void;
}

function RecipeCard({
  recipe,
  showStats,
  showAuthor,
  saved = false,
  onSave,
}: RecipeCardProps) {
  // Format image URLs
  const formatImageUrl = (path: string | null) => {
    if (!path) return "/placeholder.svg";
    if (path.startsWith("http")) return path;
    return `${
      import.meta.env.REACT_APP_API_URL || "http://localhost:8000"
    }/recipes/${path}`;
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video">
        <img
          src={formatImageUrl(recipe.image)}
          alt={recipe.title}
          className="object-cover w-full h-full absolute inset-0"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 text-black rounded-full"
          onClick={() => onSave(saved)}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          <span className="sr-only">
            {saved ? "Unsave recipe" : "Save recipe"}
          </span>
        </Button>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {recipe.cooking_time} min
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ChefHat className="h-3.5 w-3.5" />
            {recipe.difficulty}
          </span>
        </div>
        <CardTitle className="text-xl">
          <Link to={`/recipes/${recipe.id}`} className="hover:underline">
            {recipe.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {recipe.description || "No description available"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="inline-block bg-muted text-xs font-medium px-2.5 py-0.5 rounded">
          {recipe.cuisine_type}
        </div>

        {showAuthor && recipe.author && (
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={formatImageUrl(recipe.author.avatar)}
                alt={recipe.author.name}
              />
              <AvatarFallback>{recipe.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs">{recipe.author.name}</span>
          </div>
        )}

        {showStats && (
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {recipe.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {recipe.views || 0}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/recipes/${recipe.id}`}>View Recipe</Link>
        </Button>
        <ShareRecipeDialog
          recipeId={recipe.id.toString()}
          recipeTitle={recipe.title}
        />
      </CardFooter>
    </Card>
  );
}

function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

interface CollectionCardProps {
  collection: Collection;
}

function CollectionCard({ collection }: CollectionCardProps) {
  // Format image URL
  const formatImageUrl = (path: string | null) => {
    if (!path) return "/placeholder.svg";
    if (path.startsWith("http")) return path;
    return `${
      import.meta.env.VITE_API_URL || "http://localhost:8000"
    }/recipes/${path}`;
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video">
        <img
          src={formatImageUrl(collection.cover_image)}
          alt={collection.name}
          className="object-cover w-full h-full absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
          <div>
            <h3 className="text-white font-bold text-lg">{collection.name}</h3>
            <p className="text-white/80 text-sm">
              {collection.recipe_count || 0} recipes
            </p>
          </div>
        </div>
      </div>
      <CardContent className="py-4">
        <p className="text-muted-foreground line-clamp-2">
          {collection.description || "No description available"}
        </p>
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        <Button variant="outline" className="w-full" asChild>
          <Link to={`/collections/${collection.id}`}>View Collection</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
