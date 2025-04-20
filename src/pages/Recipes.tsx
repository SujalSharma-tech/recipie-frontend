import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ChefHat,
  Search,
  SlidersHorizontal,
  X,
  Bookmark,
  Share2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRecipes } from "@/context/RecipeContext";
import ShareButton from "@/components/share-recipe-dialog";

export default function RecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [filters, setFilters] = useState({
    cuisine: searchParams.get("cuisine") || "",
    difficulty: searchParams.get("difficulty") || "",
    time: [0, 120],
    ingredients: [] as string[],
  });

  const { recipes, isLoading, error, fetchRecipes, saveRecipe, unsaveRecipe } =
    useRecipes();

  // Fetch recipes when search params change
  useEffect(() => {
    // Convert search params to query object
    const query: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      query[key] = value;
    }

    fetchRecipes(query);
  }, [searchParams, fetchRecipes]);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== "";
  }).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Update URL with search params
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  const handleFilterChange = (key: string, value: any) => {
    // If value is "all", treat it as empty string for filtering purposes
    if (value === "all") {
      value = "";
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    // Update URL with filter params
    const params = new URLSearchParams(searchParams.toString());

    if (filters.cuisine) {
      params.set("cuisine", filters.cuisine);
    } else {
      params.delete("cuisine");
    }

    if (filters.difficulty) {
      params.set("difficulty", filters.difficulty);
    } else {
      params.delete("difficulty");
    }

    if (filters.time[0] !== 0 || filters.time[1] !== 120) {
      params.set("min_time", filters.time[0].toString());
      params.set("max_time", filters.time[1].toString());
    } else {
      params.delete("min_time");
      params.delete("max_time");
    }

    setSearchParams(params);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      cuisine: "",
      difficulty: "",
      time: [0, 120],
      ingredients: [],
    });
    setSearchQuery("");
    setSearchParams({});
  };

  const toggleSaveRecipe = async (recipe: any) => {
    if (recipe.saved) {
      await unsaveRecipe(recipe.id);
    } else {
      await saveRecipe(recipe.id);
    }
    // Refetch to update the UI
    const query: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      query[key] = value;
    }
    fetchRecipes(query);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and filter UI */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recipes</h1>
          <p className="text-muted-foreground">
            Discover and explore delicious recipes
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filter Recipes</SheetTitle>
                <SheetDescription>
                  Narrow down recipes based on your preferences
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Cuisine</h3>
                  <Select
                    value={filters.cuisine || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("cuisine", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any cuisine</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Mexican">Mexican</SelectItem>
                      <SelectItem value="Indian">Indian</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Thai">Thai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Difficulty</h3>
                  <Select
                    value={filters.difficulty || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("difficulty", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any difficulty</SelectItem>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Cooking Time</h3>
                    <span className="text-sm text-muted-foreground">
                      {filters.time[0]} - {filters.time[1]} min
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 120]}
                    min={0}
                    max={120}
                    step={5}
                    value={filters.time}
                    onValueChange={(value) => handleFilterChange("time", value)}
                  />
                </div>
              </div>

              <SheetFooter>
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button onClick={applyFilters}>Apply Filters</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.cuisine && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Cuisine: {filters.cuisine}
              <button
                onClick={() => handleFilterChange("cuisine", "")}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.difficulty && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Difficulty: {filters.difficulty}
              <button
                onClick={() => handleFilterChange("difficulty", "")}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.time[0] !== 0 || filters.time[1] !== 120) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Time: {filters.time[0]}-{filters.time[1]} min
              <button
                onClick={() => handleFilterChange("time", [0, 120])}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Show loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Show error state */}
      {!isLoading && error && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Error loading recipes
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => fetchRecipes()}>Try Again</Button>
        </div>
      )}

      {/* Show empty state */}
      {!isLoading && !error && recipes.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No recipes found</h2>
          <p className="text-muted-foreground mb-6">
            Try adjusting your filters or search for something else.
          </p>
          <Button onClick={resetFilters}>Clear Filters</Button>
        </div>
      )}

      {/* Display recipes */}
      {!isLoading && !error && recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onToggleSave={() => toggleSaveRecipe(recipe)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  onToggleSave,
}: {
  recipe: any;
  onToggleSave: () => void;
}) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative aspect-video">
        <img
          src={recipe.image || "/placeholder.svg"}
          alt={recipe.title}
          className="object-cover w-full h-full"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 text-black rounded-full"
          onClick={onToggleSave}
        >
          <Bookmark
            className={`h-4 w-4 ${recipe.saved ? "fill-current" : ""}`}
          />
          <span className="sr-only">
            {recipe.saved ? "Unsave recipe" : "Save recipe"}
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
        <ShareButton
          recipeId={recipe.id.toString()}
          recipeTitle={recipe.title}
        />
      </CardFooter>
    </Card>
  );
}
