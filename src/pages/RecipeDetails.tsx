/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  ChefHat,
  Users,
  Heart,
  Bookmark,
  Edit,
  Play,
  Check,
  Share2,
  FolderPlus,
  Loader2,
  Trash2,
  AlertCircle,
  MoreVertical,
  Send,
  MessageCircle,
  Pencil,
  Trash,
} from "lucide-react";
import ShareRecipeDialog from "@/components/share-recipe-dialog";
import { useAuth } from "@/lib/auth";
import ApiClient from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

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
  ingredients: string[] | string;
  instructions: string[] | string | null;
  steps: string[] | null;
  nutrition: Record<string, string> | string;
  tags: string[] | null;
  author_id: number | null;
  author: {
    id: number;
    name: string;
    username: string;
    email?: string;
    avatar: string | null;
  } | null;
  comments: any[];
  ratings: any[];
  created_at: string;
  updated_at: string;
  views: number;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = React.useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [userCollections, setUserCollections] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await ApiClient.get<{ recipe: Recipe }>(
          `/recipes/${id}`
        );
        setRecipe(response.recipe);

        if (user) {
          try {
            const userResponse = await ApiClient.get<{
              is_liked: boolean;
              is_saved: boolean;
            }>(`/recipes/${id}/getStatus`);
            setIsLiked(userResponse.is_liked);
            setIsSaved(userResponse.is_saved);
          } catch (err) {
            console.error("Could not check user recipe status", err);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch recipe");
        console.error("Error fetching recipe:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [id, user]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      try {
        if (recipe && recipe.comments) {
          setComments(recipe.comments);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };

    if (recipe) {
      fetchComments();
    }
  }, [id, recipe]);

  useEffect(() => {
    if (user) {
      const fetchCollections = async () => {
        try {
          const response = await ApiClient.get<{ collections: any }>(
            "/collections"
          );
          const userOwnedCollections = response.collections.data.filter(
            (collection: any) => collection.user_id === user.id
          );
          setUserCollections(userOwnedCollections);
        } catch (error) {
          console.error("Failed to fetch collections", error);
        }
      };

      fetchCollections();
    }
  }, [user]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like recipes");
      return;
    }

    if (!recipe) return;

    try {
      if (isLiked) {
        await ApiClient.post(`/recipes/${recipe.id}/unlike`, {});
        toast.success("Removed like from recipe");
        setIsLiked(false);
      } else {
        await ApiClient.post(`/recipes/${recipe.id}/like`, {});
        toast.success("Recipe liked!");
        setIsLiked(true);
      }
    } catch (error) {
      toast.error("Failed to update like status");
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save recipes");
      return;
    }

    if (!recipe) return;

    try {
      if (isSaved) {
        await ApiClient.post(`/recipes/${recipe.id}/unsave`, {});
        toast.success("Recipe removed from your collection");
        setIsSaved(false);
      } else {
        await ApiClient.post(`/recipes/${recipe.id}/save`, {});
        toast.success("Recipe saved to your collection");
        setIsSaved(true);
      }
    } catch (error) {
      toast.error("Failed to update save status");
    }
  };

  const handleAddToCollection = async () => {
    if (!selectedCollection) return;

    setIsAddingToCollection(true);

    try {
      await ApiClient.post(`/collections/${selectedCollection}/recipes`, {
        recipe_id: recipe?.id,
      });

      toast.success("Recipe added to collection");
      setIsCollectionDialogOpen(false);
      setSelectedCollection("");
    } catch (error: any) {
      toast.error("Failed to add recipe to collection", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsAddingToCollection(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipe) return;

    setIsDeleting(true);

    try {
      await ApiClient.delete(`/recipes/${recipe.id}`);
      toast.success("Recipe deleted successfully");
      setIsDeleteDialogOpen(false);
      navigate("/recipes");
    } catch (error: any) {
      toast.error("Failed to delete recipe", {
        description: error.message || "Please try again",
      });
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to leave a comment");
      return;
    }

    if (!commentText.trim()) return;

    setIsSubmittingComment(true);

    try {
      const response = await ApiClient.post(`/recipes/${id}/comments`, {
        content: commentText,
      });

      const newComment = response.comment;
      setComments((prev) => [...prev, newComment]);

      setRecipe((prev) =>
        prev
          ? {
              ...prev,
              comments: [...(prev.comments || []), newComment],
            }
          : null
      );

      toast.success("Comment added successfully");
      setCommentText("");
    } catch (error: any) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (e: React.FormEvent, commentId: number) => {
    e.preventDefault();

    if (!user || !editCommentText.trim()) return;

    try {
      const response = await ApiClient.put(
        `/recipes/${id}/comments/${commentId}`,
        {
          content: editCommentText,
        }
      );

      const updatedComment = response.comment;
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? updatedComment : comment
        )
      );

      setRecipe((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((comment) =>
                comment.id === commentId ? updatedComment : comment
              ),
            }
          : null
      );

      toast.success("Comment updated");
      setEditingCommentId(null);
      setEditCommentText("");
    } catch (error: any) {
      console.error("Failed to update comment:", error);
      toast.error("Failed to update comment", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;

    try {
      await ApiClient.delete(`/recipes/${id}/comments/${commentId}`);

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));

      setRecipe((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter(
                (comment) => comment.id !== commentId
              ),
            }
          : null
      );

      toast.success("Comment deleted");
    } catch (error: any) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment", {
        description: error.message || "Please try again",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          Error Loading Recipe
        </h2>
        <p className="text-muted-foreground mb-8">
          {error || "Recipe not found"}
        </p>
        <Button asChild>
          <Link to="/recipes">Browse Recipes</Link>
        </Button>
      </div>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : typeof recipe.ingredients === "string"
    ? JSON.parse(recipe.ingredients)
    : [];

  const instructions = recipe.steps
    ? recipe.steps
    : Array.isArray(recipe.instructions)
    ? recipe.instructions
    : typeof recipe.instructions === "string" && recipe.instructions
    ? JSON.parse(recipe.instructions)
    : [];

  const nutrition =
    typeof recipe.nutrition === "string"
      ? JSON.parse(recipe.nutrition)
      : recipe.nutrition;

  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];

  const imageUrl = recipe.image
    ? recipe.image.startsWith("http")
      ? recipe.image
      : `${
          import.meta.env.REACT_APP_API_URL || "http://localhost:8000"
        }/recipes/${recipe.image}`
    : "/placeholder.svg";

  const videoUrl = recipe.youtube_video
    ? recipe.youtube_video.replace("watch?v=", "embed/")
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Link
                to="/recipes"
                className="text-muted-foreground hover:text-foreground"
              >
                Recipes
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link
                to={`/recipes?cuisine=${recipe.cuisine_type}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {recipe.cuisine_type}
              </Link>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">{recipe.title}</h1>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSave}
                  className={isSaved ? "text-primary border-primary" : ""}
                >
                  <Bookmark
                    className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`}
                  />
                  <span className="sr-only">
                    {isSaved ? "Unsave recipe" : "Save recipe"}
                  </span>
                </Button>
                <ShareRecipeDialog
                  recipeId={recipe.id.toString()}
                  recipeTitle={recipe.title}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLike}
                  className={isLiked ? "text-red-500 border-red-500" : ""}
                >
                  <Heart
                    className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`}
                  />
                  <span className="sr-only">
                    {isLiked ? "Unlike recipe" : "Like recipe"}
                  </span>
                </Button>
                <Dialog
                  open={isCollectionDialogOpen}
                  onOpenChange={setIsCollectionDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FolderPlus className="h-4 w-4" />
                      Add to Collection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add to Collection</DialogTitle>
                      <DialogDescription>
                        Add this recipe to one of your collections
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                      {userCollections.length > 0 ? (
                        <div className="space-y-4">
                          <Select
                            value={selectedCollection}
                            onValueChange={setSelectedCollection}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a collection" />
                            </SelectTrigger>
                            <SelectContent>
                              {userCollections.map((collection) => (
                                <SelectItem
                                  key={collection.id}
                                  value={collection.id.toString()}
                                >
                                  {collection.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground mb-4">
                            You don't have any collections yet
                          </p>
                          <Button
                            variant="outline"
                            asChild
                            onClick={() => setIsCollectionDialogOpen(false)}
                          >
                            <Link to="/collections">Create Collection</Link>
                          </Button>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCollectionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddToCollection}
                        disabled={!selectedCollection || isAddingToCollection}
                      >
                        {isAddingToCollection ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add to Collection"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {user && recipe.author_id === user.id && (
                  <>
                    <Button variant="outline" asChild>
                      <Link to={`/recipes/${recipe.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <Dialog
                      open={isDeleteDialogOpen}
                      onOpenChange={setIsDeleteDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="text-destructive border-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Recipe</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this recipe? This
                            action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteRecipe}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Recipe"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{recipe.cooking_time} mins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ChefHat className="h-4 w-4 text-muted-foreground" />
                <span>{recipe.difficulty}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{recipe.servings}</span>
              </div>
              <Badge variant="outline">{recipe.cuisine_type}</Badge>
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="secondary">+{tags.length - 3}</Badge>
              )}
            </div>

            {recipe.author && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Link to={`/users/${recipe.author.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={recipe.author.avatar || undefined} />
                      <AvatarFallback>
                        {recipe.author.name?.substring(0, 1).toUpperCase() ||
                          "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <span className="text-sm font-medium">
                    <Link
                      to={`/users/${recipe.author.id}`}
                      className="hover:underline"
                    >
                      {recipe.author.name}
                    </Link>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="relative aspect-video rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={recipe.title}
              className="object-cover w-full h-full"
            />
          </div>

          {recipe.description && (
            <div className="prose max-w-none">
              <p>{recipe.description}</p>
            </div>
          )}

          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              {videoUrl && (
                <TabsTrigger value="video">Video Tutorial</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="instructions" className="space-y-6 pt-4">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Ingredients</h2>
                <ul className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-6 w-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Steps</h2>
                <ol className="space-y-6">
                  {instructions.map((step, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <div className="space-y-2 pt-1">
                        <p>{step}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>
            {videoUrl && (
              <TabsContent value="video" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Video Tutorial</h2>
                  <div className="aspect-video">
                    <iframe
                      src={videoUrl}
                      title={`${recipe.title} Video Tutorial`}
                      className="w-full h-full rounded-md"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Nutrition Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(nutrition).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </div>
                    <div className="font-medium">
                      {value}
                      {key.charAt(0).toUpperCase() + key.slice(1) == "Calories"
                        ? "Kcal"
                        : "g"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {tags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Link key={index} to={`/recipes?tag=${tag}`}>
                      <Badge variant="outline" className="hover:bg-secondary">
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="lg:col-span-3 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Comments ({recipe.comments?.length || 0})
            </CardTitle>
            <CardDescription>
              Share your thoughts or ask questions about this recipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Comment Form */}
            {user ? (
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>
                    {user.name?.substring(0, 1) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <textarea
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      placeholder="Add your comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      required
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmittingComment || !commentText.trim()}
                      >
                        {isSubmittingComment ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Post Comment
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-muted-foreground mb-2">
                  Please sign in to leave a comment
                </p>
                <Button asChild variant="outline">
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6 mt-6">
              <Separator />

              {recipe.comments && recipe.comments.length > 0 ? (
                recipe.comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={comment.user?.avatar || undefined}
                          />
                          <AvatarFallback>
                            {comment.user?.name?.substring(0, 1) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.user?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(comment.created_at),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>

                          {editingCommentId === comment.id ? (
                            <form
                              onSubmit={(e) =>
                                handleUpdateComment(e, comment.id)
                              }
                              className="mt-2 space-y-2"
                            >
                              <textarea
                                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                value={editCommentText}
                                onChange={(e) =>
                                  setEditCommentText(e.target.value)
                                }
                                required
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingCommentId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={!editCommentText.trim()}
                                >
                                  Save
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <p className="text-sm mt-1">{comment.content}</p>
                          )}
                        </div>
                      </div>

                      {user &&
                        (user.id === comment.user_id ||
                          user.id === recipe.author_id) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.id === comment.user_id && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditCommentText(comment.content);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>

                    {comment.id !==
                      recipe.comments[recipe.comments.length - 1].id && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
