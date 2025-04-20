import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ApiClient from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Search,
  Clock,
  ChefHat,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { Recipe } from "./Home";

export default function AddRecipesToCollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<any | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch collection and available recipes
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) {
        navigate("/collections");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get collection details first to verify ownership
        const collectionResponse = await ApiClient.get<{ collection: any }>(
          `/collections/${id}`
        );

        setCollection(collectionResponse.collection);

        // Check if user owns this collection
        if (collectionResponse.collection.user_id !== user.id) {
          navigate(`/collections/${id}`);
          toast.error("You don't have permission to edit this collection");
          return;
        }

        // Get all recipes to display
        const recipesResponse = await ApiClient.get<{ recipes: Recipe[] }>(
          "/recipes"
        );

        // Get recipes already in collection to exclude them
        const collectionRecipesResponse = await ApiClient.get<{
          recipes: Recipe[];
        }>(`/collections/${id}/recipes`);

        // Filter out recipes already in collection
        const existingRecipeIds = collectionRecipesResponse.recipes.map(
          (recipe) => recipe.id
        );
        const availableRecipes = recipesResponse.recipes.filter(
          (recipe) => !existingRecipeIds.includes(recipe.id)
        );

        setRecipes(availableRecipes);
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        setError(error.message || "Failed to load data");
        toast.error("Failed to load recipes", {
          description: error.message || "Please try again",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  // Filter recipes based on search
  const filteredRecipes = recipes.filter((recipe) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      recipe.title.toLowerCase().includes(query) ||
      (recipe.description?.toLowerCase() || "").includes(query) ||
      recipe.cuisine_type.toLowerCase().includes(query)
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleToggleRecipe = (recipeId: number) => {
    setSelectedRecipes((prev) => {
      if (prev.includes(recipeId)) {
        return prev.filter((id) => id !== recipeId);
      } else {
        return [...prev, recipeId];
      }
    });
  };

  const handleAddRecipes = async () => {
    if (!collection || selectedRecipes.length === 0) return;

    setIsSubmitting(true);

    try {
      // Add each recipe to the collection
      await Promise.all(
        selectedRecipes.map((recipeId) =>
          ApiClient.post(`/collections/${collection.id}/recipes`, {
            recipe_id: recipeId,
          })
        )
      );

      toast.success(`Added ${selectedRecipes.length} recipes to collection`);
      navigate(`/collections/${collection.id}`);
    } catch (error: any) {
      console.error("Failed to add recipes:", error);
      toast.error("Failed to add recipes", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Error loading collection
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "Collection not found"}
          </p>
          <Button onClick={() => navigate("/collections")}>
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/collections/${collection.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collection
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Add Recipes to "{collection.name}"
          </h1>
          <p className="text-muted-foreground">
            Select recipes you want to add to your collection
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search recipes..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p>
          {selectedRecipes.length} recipe
          {selectedRecipes.length !== 1 ? "s" : ""} selected
        </p>
        <Button
          onClick={handleAddRecipes}
          disabled={selectedRecipes.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Add Selected Recipes
            </>
          )}
        </Button>
      </div>

      <Separator className="mb-8" />

      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => {
            const isSelected = selectedRecipes.includes(recipe.id);

            return (
              <Card
                key={recipe.id}
                className={`overflow-hidden h-full flex flex-col cursor-pointer border-2 ${
                  isSelected ? "border-primary" : "border-transparent"
                }`}
                onClick={() => handleToggleRecipe(recipe.id)}
              >
                <div className="relative aspect-video">
                  <img
                    src={formatImageUrl(recipe.image)}
                    alt={recipe.title}
                    className="object-cover w-full h-full absolute inset-0"
                  />
                  <div className="absolute top-2 right-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/80 border border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
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
                  <CardTitle className="text-xl">{recipe.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {recipe.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2 flex-grow">
                  <div className="inline-block bg-muted text-xs font-medium px-2.5 py-0.5 rounded">
                    {recipe.cuisine_type}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRecipe(recipe.id);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Deselect
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Select
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No recipes available</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "No recipes match your search criteria"
              : "All recipes are already in this collection or you haven't created any recipes yet."}
          </p>
          <Link to="/recipes/new">
            <Button>Create a New Recipe</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
