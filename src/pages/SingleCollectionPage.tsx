import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  ChefHat,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  X,
  Heart,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react";
import { Recipe } from "./Home";
import ShareRecipeDialog from "@/components/share-recipe-dialog";

interface Collection {
  id: number;
  name: string;
  description: string | null;
  cover_image: string | null;
  is_public: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
  recipes_count?: number; // Updated from recipe_count to recipes_count
}

export default function SingleCollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );

  // Fetch collection data
  useEffect(() => {
    const fetchCollectionData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        // First fetch the collection details
        const collectionResponse = await ApiClient.get<{
          collection: Collection;
        }>(`/collections/${id}`);

        setCollection(collectionResponse.collection);
        setEditForm({
          name: collectionResponse.collection.name,
          description: collectionResponse.collection.description || "",
        });

        // Initialize cover image preview
        if (collectionResponse.collection.cover_image) {
          setCoverImagePreview(
            formatImageUrl(collectionResponse.collection.cover_image)
          );
        }

        // Then fetch the recipes in this collection using the proper endpoint
        const recipesResponse = await ApiClient.get<{ recipes: Recipe[] }>(
          `/collections/${id}/recipes`
        );

        setRecipes(recipesResponse.recipes || []);
      } catch (error: any) {
        console.error("Failed to fetch collection:", error);
        setError(error.message || "Failed to load collection");
        toast.error("Failed to load collection", {
          description: error.message || "Please try again",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionData();
  }, [id]);

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter((recipe) => {
    if (!searchQuery) return true;
    return (
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
      recipe.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the filter above
  };

  const handleEditCollection = async () => {
    if (!collection) return;

    try {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("description", editForm.description || "");
      formData.append("is_public", collection.is_public.toString()); // Preserve existing value

      // Add cover image if selected
      if (coverImage) {
        formData.append("cover_image", coverImage);
      }

      // Use PUT with FormData
      await ApiClient.putFormData(`/collections/${collection.id}`, formData);

      // Update local state
      setCollection({
        ...collection,
        name: editForm.name,
        description: editForm.description,
      });

      toast.success("Collection updated successfully");
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to update collection:", error);
      toast.error("Failed to update collection", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleDeleteCollection = async () => {
    if (!collection) return;

    if (
      confirm(
        "Are you sure you want to delete this collection? This action cannot be undone."
      )
    ) {
      try {
        await ApiClient.delete(`/collections/${collection.id}`);
        toast.success("Collection deleted successfully");
        navigate("/collections");
      } catch (error: any) {
        console.error("Failed to delete collection:", error);
        toast.error("Failed to delete collection", {
          description: error.message || "Please try again",
        });
      }
    }
  };

  const handleRemoveRecipe = async (recipeId: number) => {
    if (!collection) return;

    try {
      await ApiClient.delete(
        `/collections/${collection.id}/recipes/${recipeId}`
      );

      // Update local state
      setRecipes(recipes.filter((recipe) => recipe.id !== recipeId));

      toast.success("Recipe removed from collection");
    } catch (error: any) {
      console.error("Failed to remove recipe:", error);
      toast.error("Failed to remove recipe", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
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

  const isOwner = user && collection && user.id === collection.user_id;

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
          <h2 className="text-2xl font-semibold mb-2">Collection not found</h2>
          <p className="text-muted-foreground mb-4">
            {error || "The requested collection could not be found"}
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
          onClick={() => navigate("/collections")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collections
        </Button>
      </div>

      {/* Collection Header */}
      <div className="relative mb-8">
        <div className="relative h-48 md:h-64 w-full rounded-lg overflow-hidden bg-muted">
          <img
            src={formatImageUrl(collection.cover_image)}
            alt={collection.name}
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              {collection.name}
            </h1>
            <p className="text-white/80 max-w-2xl">{collection.description}</p>
          </div>
          {isOwner && (
            <div className="absolute top-4 right-4 flex gap-2">
              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Collection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Collection</DialogTitle>
                    <DialogDescription>
                      Update your collection details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Cover image upload */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-cover-image">Cover Image</Label>
                      <div className="relative aspect-[3/1] overflow-hidden rounded-lg border bg-muted">
                        {coverImagePreview ? (
                          <img
                            src={coverImagePreview}
                            alt="Cover preview"
                            className="object-cover w-full h-full absolute inset-0"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <p className="text-muted-foreground">
                              No cover image
                            </p>
                          </div>
                        )}

                        {/* Upload Overlay */}
                        <label
                          htmlFor="edit-cover-image"
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
                          id="edit-cover-image"
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Collection Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        placeholder="e.g., Breakfast Favorites"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your collection"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setCoverImage(null);

                        // Reset cover image preview to original if available
                        if (collection.cover_image) {
                          setCoverImagePreview(
                            formatImageUrl(collection.cover_image)
                          );
                        } else {
                          setCoverImagePreview(null);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditCollection}
                      disabled={!editForm.name.trim()}
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDeleteCollection}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Collection Info */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Created {new Date(collection.created_at).toLocaleDateString()}
            </span>
            <span>•</span>
            <span>
              Updated {new Date(collection.updated_at).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2">
            <Badge variant="outline">
              {collection.recipes_count || recipes.length} recipes
            </Badge>
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search in this collection..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {isOwner && (
            <Button
              onClick={() =>
                navigate(`/collections/${collection.id}/add-recipes`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Recipe
            </Button>
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Recipes Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
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
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 text-black rounded-full"
                    onClick={() => handleRemoveRecipe(recipe.id)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove from collection</span>
                  </Button>
                )}
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
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            No recipes in this collection
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "No recipes match your search criteria"
              : "This collection is empty. Add some recipes to get started."}
          </p>
          {isOwner && (
            <Button
              onClick={() =>
                navigate(`/collections/${collection.id}/add-recipes`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Recipe
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}
