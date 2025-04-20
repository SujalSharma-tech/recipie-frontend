// src/context/RecipeContext.tsx
import React, { createContext, useState, useContext, useCallback } from "react";
import ApiClient from "@/lib/api";

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
}

interface RecipeContextType {
  recipes: Recipe[];
  recipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
  fetchRecipes: (query?: Record<string, string>) => Promise<void>;
  fetchRecipe: (id: string | number) => Promise<void>;
  createRecipe: (recipeData: any) => Promise<Recipe>;
  updateRecipe: (id: string | number, recipeData: any) => Promise<Recipe>;
  deleteRecipe: (id: string | number) => Promise<void>;
  likeRecipe: (id: string | number) => Promise<void>;
  unlikeRecipe: (id: string | number) => Promise<void>;
  saveRecipe: (id: string | number) => Promise<void>;
  unsaveRecipe: (id: string | number) => Promise<void>;
  clearError: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async (query?: Record<string, string>) => {
    setIsLoading(true);
    setError(null);

    try {
      let endpoint = "/recipes";

      if (query && Object.keys(query).length > 0) {
        const queryString = new URLSearchParams(query).toString();
        endpoint = `${endpoint}?${queryString}`;
      }

      const response = await ApiClient.get<{ recipes: Recipe[] }>(endpoint);
      setRecipes(response.recipes);
    } catch (err: any) {
      setError(err.message || "Failed to fetch recipes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRecipe = useCallback(async (id: string | number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiClient.get<{ recipe: Recipe }>(
        `/recipes/${id}`
      );
      setRecipe(response.recipe);
    } catch (err: any) {
      setError(err.message || "Failed to fetch recipe");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRecipe = useCallback(async (recipeData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiClient.post<{ recipe: Recipe }>(
        "/recipes",
        recipeData
      );
      setRecipes((prev) => [response.recipe, ...prev]);
      return response.recipe;
    } catch (err: any) {
      setError(err.message || "Failed to create recipe");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRecipe = useCallback(
    async (id: string | number, recipeData: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ApiClient.put<{ recipe: Recipe }>(
          `/recipes/${id}`,
          recipeData
        );
        setRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === response.recipe.id ? response.recipe : recipe
          )
        );
        setRecipe(response.recipe);
        return response.recipe;
      } catch (err: any) {
        setError(err.message || "Failed to update recipe");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteRecipe = useCallback(
    async (id: string | number) => {
      setIsLoading(true);
      setError(null);

      try {
        await ApiClient.delete(`/recipes/${id}`);
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== Number(id)));
        if (recipe?.id === Number(id)) setRecipe(null);
      } catch (err: any) {
        setError(err.message || "Failed to delete recipe");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [recipe]
  );

  // Like/unlike and save/unsave recipe
  const likeRecipe = useCallback(async (id: string | number) => {
    try {
      await ApiClient.post(`/recipes/${id}/like`, {});
    } catch (err: any) {
      setError(err.message || "Failed to like recipe");
      throw err;
    }
  }, []);

  const unlikeRecipe = useCallback(async (id: string | number) => {
    try {
      await ApiClient.post(`/recipes/${id}/unlike`, {});
    } catch (err: any) {
      setError(err.message || "Failed to unlike recipe");
      throw err;
    }
  }, []);

  const saveRecipe = useCallback(async (id: string | number) => {
    try {
      await ApiClient.post(`/recipes/${id}/save`, {});
    } catch (err: any) {
      setError(err.message || "Failed to save recipe");
      throw err;
    }
  }, []);

  const unsaveRecipe = useCallback(async (id: string | number) => {
    try {
      await ApiClient.post(`/recipes/${id}/unsave`, {});
    } catch (err: any) {
      setError(err.message || "Failed to unsave recipe");
      throw err;
    }
  }, []);

  const clearError = () => setError(null);

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        recipe,
        isLoading,
        error,
        fetchRecipes,
        fetchRecipe,
        createRecipe,
        updateRecipe,
        deleteRecipe,
        likeRecipe,
        unlikeRecipe,
        saveRecipe,
        unsaveRecipe,
        clearError,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
}
