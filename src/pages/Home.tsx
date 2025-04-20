import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Bookmark, Clock, ChefHat, Share2 } from "lucide-react";
import { useRecipes } from "@/context/RecipeContext";
import ApiClient from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import ShareRecipeDialog from "@/components/share-recipe-dialog";

export interface Recipe {
  id: number;
  title: string;
  description: string | null;
  cooking_time: string;
  time: string | null;
  difficulty: string;
  servings: string;
  cuisine_type: string;
  is_public: boolean;
  allow_copy: boolean;
  image: string | null;
  youtube_video: string | null;
  ingredients: string;
  instructions: string;
  nutrition: string;
  author_id: number | null;
  author: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  saved?: boolean;
  popular?: boolean;
}

interface Cuisine {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export default function Home() {
  const { user } = useAuth();
  const {
    recipes: allRecipes,
    isLoading: recipesLoading,
    error: recipesError,
    fetchRecipes,
  } = useRecipes();
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoadingCuisines, setIsLoadingCuisines] = useState(true);
  const [cuisinesError, setCuisinesError] = useState<string | null>(null);

  // Fetch recipes
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Fetch popular recipes
  useEffect(() => {
    const getPopularRecipes = async () => {
      try {
        const response = await ApiClient.get<{ recipes: Recipe[] }>(
          "/recipes?sort=popular"
        );
        setPopularRecipes(response.recipes);
      } catch (error) {
        console.error("Failed to fetch popular recipes", error);
      }
    };

    getPopularRecipes();
  }, []);

  // Fetch recent recipes
  useEffect(() => {
    const getRecentRecipes = async () => {
      try {
        const response = await ApiClient.get<{ recipes: Recipe[] }>(
          "/recipes?sort=recent"
        );
        setRecentRecipes(response.recipes);
      } catch (error) {
        console.error("Failed to fetch recent recipes", error);
      }
    };

    getRecentRecipes();
  }, []);

  // Fetch saved recipes (only if user is logged in)
  useEffect(() => {
    const getSavedRecipes = async () => {
      if (!user) {
        setSavedRecipes([]);
        return;
      }

      try {
        const response = await ApiClient.get<{
          recipes: PaginatedResponse<Recipe>;
        }>(`/users/${user.id}/saved`);
        setSavedRecipes(response.recipes.data);
      } catch (error) {
        console.error("Failed to fetch saved recipes", error);
      }
    };

    getSavedRecipes();
  }, [user]);

  // Fetch cuisines
  useEffect(() => {
    const getCuisines = async () => {
      setIsLoadingCuisines(true);
      setCuisinesError(null);

      try {
        const response = await ApiClient.get<{ cuisines: Cuisine[] }>(
          "/search/cuisines"
        );
        setCuisines(response.cuisines);
      } catch (error: any) {
        console.error("Failed to fetch cuisines", error);
        setCuisinesError(error.message || "Failed to load cuisines");
      } finally {
        setIsLoadingCuisines(false);
      }
    };

    getCuisines();
  }, []);

  // Handle save recipe
  const handleSaveRecipe = async (recipeId: number) => {
    if (!user) {
      toast.error("Please sign in to save recipes");
      return;
    }

    try {
      await ApiClient.post(`/recipes/${recipeId}/save`, {});
      toast.success("Recipe saved to your collection");

      const response = await ApiClient.get<{
        recipes: PaginatedResponse<Recipe>;
      }>(`/users/${user.id}/saved`);
      setSavedRecipes(response.recipes.data);
    } catch (error) {
      toast.error("Failed to save recipe");
    }
  };

  // If we have no cuisine data yet, render default ones to prevent UI breaking
  const displayCuisines =
    cuisines?.length > 0
      ? cuisines
      : [
          { id: 1, name: "Italian", slug: "italian", image: "/pasta.jpeg" },
          { id: 2, name: "Chinese", slug: "chinese", image: "/pasta.jpeg" },
          { id: 3, name: "Mexican", slug: "mexican", image: "/pasta.jpeg" },
          { id: 4, name: "Indian", slug: "indian", image: "/pasta.jpeg" },
          { id: 5, name: "Japanese", slug: "japanese", image: "/pasta.jpeg" },
          { id: 6, name: "Thai", slug: "thai", image: "/pasta.jpeg" },
        ];

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your Virtual Recipe Book
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Save, organize, and share your favorite recipes with step-by-step
              video tutorials.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button asChild>
                <Link to={"/recipes/create"}>Create Recipe</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={"/recipes"}>Explore Recipes</Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full md:w-1/2 aspect-video rounded-lg overflow-hidden">
            <img
              src="/homelogo.svg?height=400&width=600"
              alt="Delicious food collage"
              className="object-cover w-full h-full absolute top-0 left-0"
            />
          </div>
        </div>
      </section>

      <Tabs defaultValue="all" className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Discover Recipes</h2>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          {recipesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : recipesError ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-destructive">
                {recipesError}
              </h3>
              <Button onClick={() => fetchRecipes()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : allRecipes.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No recipes found</h3>
              <p className="text-muted-foreground mt-2">
                Be the first to add a recipe!
              </p>
              <Button asChild className="mt-4">
                <Link to="/recipes/create">Create Recipe</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSave={() => handleSaveRecipe(recipe.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="mt-0">
          {recipesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : popularRecipes.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No popular recipes yet</h3>
              <p className="text-muted-foreground mt-2">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSave={() => handleSaveRecipe(recipe.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          {recipesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : recentRecipes.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No recent recipes</h3>
              <p className="text-muted-foreground mt-2">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSave={() => handleSaveRecipe(recipe.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          {!user ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">
                Sign in to view saved recipes
              </h3>
              <Button asChild className="mt-4">
                <Link to="/auth/login">Sign In</Link>
              </Button>
            </div>
          ) : recipesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : savedRecipes.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No saved recipes</h3>
              <p className="text-muted-foreground mt-2">
                Save recipes to access them later
              </p>
              <Button asChild className="mt-4">
                <Link to="/recipes">Find Recipes</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSave={() => handleSaveRecipe(recipe.id)}
                  saved={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Browse by Cuisine</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/recipes">View All</Link>
          </Button>
        </div>

        {isLoadingCuisines ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : cuisinesError ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-destructive">
              {cuisinesError}
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayCuisines.map((cuisine) => (
              <Link
                key={cuisine.id}
                to={`/recipes?cuisine=${cuisine.slug}`}
                className="group relative aspect-square rounded-lg overflow-hidden"
              >
                <img
                  src={cuisine.image || "/pasta.jpeg"}
                  alt={cuisine.name}
                  className="object-cover transition-transform group-hover:scale-105 w-full h-full absolute top-0 left-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                  <span className="text-white font-medium">{cuisine.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  onSave: () => void;
  saved?: boolean;
}

function RecipeCard({ recipe, onSave, saved = false }: RecipeCardProps) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video">
        <img
          src={recipe.image || "/pasta.jpeg"}
          alt={recipe.title}
          className="object-cover w-full h-full absolute inset-0"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 text-black rounded-full"
          onClick={onSave}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          <span className="sr-only">
            {saved ? "Unsave recipe" : "Save recipe"}
          </span>
        </Button>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {recipe.cooking_time}
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
