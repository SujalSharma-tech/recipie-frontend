import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApiClient from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  ChefHat,
  Search,
  Heart,
  Loader2,
  AlertCircle,
} from "lucide-react";
import ShareRecipeDialog from "@/components/share-recipe-dialog";
import { PaginatedResponse } from "@/types";
import { Recipe } from "./Home";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Using the saved recipes endpoint
        const response = await ApiClient.get<{
          recipes: PaginatedResponse<Recipe>;
        }>(`/users/${user.id}/saved`);
        setFavorites(response.recipes.data);
      } catch (error: any) {
        console.error("Failed to fetch favorite recipes", error);
        setError(error.message || "Failed to load favorite recipes");
        toast.error("Failed to load favorites", {
          description: error.message || "Please try again",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user, navigate]);

  // Filter and sort favorites
  const filteredFavorites = favorites
    .filter((recipe) => {
      if (!searchQuery) return true;
      return (
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (recipe.description?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        recipe.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "time") {
        return parseInt(a.cooking_time) - parseInt(b.cooking_time);
      }
      return 0;
    });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the filter above
  };

  const handleRemoveFavorite = async (id: number) => {
    try {
      await ApiClient.post(`/recipes/${id}/unsave`, {});
      setFavorites(favorites.filter((recipe) => recipe.id !== id));
      toast.success("Recipe removed from favorites");
    } catch (error: any) {
      console.error("Failed to remove favorite", error);
      toast.error("Failed to remove from favorites", {
        description: error.message || "Please try again",
      });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading favorite recipes...</p>
        </div>
      </div>
    );
  }

  if (error && favorites.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load favorites</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Favorite Recipes</h1>
          <p className="text-muted-foreground">
            Your saved recipes for quick access
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search favorites..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Saved</SelectItem>
              <SelectItem value="title">Alphabetical</SelectItem>
              <SelectItem value="time">Cooking Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden h-full flex flex-col"
            >
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
                  onClick={() => handleRemoveFavorite(recipe.id)}
                >
                  <Heart className="h-4 w-4 fill-current text-rose-500" />
                  <span className="sr-only">Remove from favorites</span>
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
                  <Link
                    to={`/recipes/${recipe.id}`}
                    className="hover:underline"
                  >
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

                {recipe.author && (
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      to={`/users/${recipe.author.id}`}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={formatImageUrl(recipe.author.avatar)}
                          alt={recipe.author.name}
                        />
                        <AvatarFallback>
                          {recipe.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{recipe.author.name}</span>
                    </Link>
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
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No favorites found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "No favorites match your search criteria"
              : "You haven't saved any recipes to your favorites yet"}
          </p>
          <Button asChild>
            <Link to="/recipes">Browse Recipes</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
