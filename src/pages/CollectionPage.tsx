import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApiClient from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  FolderPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaginatedResponse } from "@/types";

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

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: "",
    description: "",
    is_public: true,
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await ApiClient.get<{
          collections: PaginatedResponse<Collection>;
        }>(`/collections`);
        setCollections(response.collections.data);
      } catch (error: any) {
        console.error("Failed to fetch collections", error);
        setError(error.message || "Failed to load collections");
        toast.error("Failed to load collections", {
          description: error.message || "Please try again",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [user, navigate]);

  // Filter collections
  const filteredCollections = collections.filter((collection) => {
    if (!searchQuery) return true;
    return (
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (collection.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      )
    );
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the filter above
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateCollection = async () => {
    if (!user) {
      toast.error("You must be logged in to create a collection");
      return;
    }

    if (!newCollection.name.trim()) {
      toast.error("Collection name is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newCollection.name);
      formData.append("description", newCollection.description || "");
      formData.append("is_public", newCollection.is_public.toString());

      if (coverImage) {
        formData.append("cover_image", coverImage);
      }

      const response = await ApiClient.upload<{ collection: Collection }>(
        "/collections",
        formData
      );

      toast.success("Collection created successfully");
      setCollections([...collections, response.collection]);
      setNewCollection({ name: "", description: "", is_public: true });
      setCoverImage(null);
      setCoverImagePreview(null);
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to create collection", error);
      toast.error("Failed to create collection", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleDeleteCollection = async (id: number, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await ApiClient.delete(`/collections/${id}`);
      toast.success(`Collection "${name}" deleted successfully`);
      setCollections(collections.filter((collection) => collection.id !== id));
    } catch (error: any) {
      console.error("Failed to delete collection", error);
      toast.error("Failed to delete collection", {
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
          <p className="text-muted-foreground">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (error && collections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            Failed to load collections
          </h2>
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
          <h1 className="text-3xl font-bold mb-2">Recipe Collections</h1>
          <p className="text-muted-foreground">
            Organize your recipes into themed collections
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search collections..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogDescription>
                  Create a new collection to organize your recipes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cover-image">Cover Image</Label>
                  <div className="relative aspect-[3/1] overflow-hidden rounded-lg border bg-muted">
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
                    <label
                      htmlFor="create-cover-image"
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
                    <Input
                      id="create-cover-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageChange}
                    />
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
                    value={newCollection.name}
                    onChange={(e) =>
                      setNewCollection({
                        ...newCollection,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Breakfast Favorites"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCollection.description || ""}
                    onChange={(e) =>
                      setNewCollection({
                        ...newCollection,
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
                    setIsCreateDialogOpen(false);
                    setNewCollection({
                      name: "",
                      description: "",
                      is_public: true,
                    });
                    setCoverImage(null);
                    setCoverImagePreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCollection}
                  disabled={!newCollection.name.trim()}
                >
                  Create Collection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Card
              key={collection.id}
              className="overflow-hidden h-full flex flex-col"
            >
              <div className="relative aspect-video">
                <img
                  src={formatImageUrl(collection.cover_image)}
                  alt={collection.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {collection.name}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {collection.recipe_count || 0} recipes
                    </p>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/20 hover:bg-black/40 text-white rounded-full"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          to={`/collections/${collection.id}/edit`}
                          className="flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Collection
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          handleDeleteCollection(collection.id, collection.name)
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Collection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="py-4">
                <p className="text-muted-foreground line-clamp-2">
                  {collection.description || "No description"}
                </p>
              </CardContent>
              <CardFooter className="pt-0 mt-auto">
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/collections/${collection.id}`}>
                    View Collection
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No collections found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "No collections match your search criteria"
              : "You haven't created any collections yet"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Your First Collection
          </Button>
        </div>
      )}
    </div>
  );
}
