import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ApiClient from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  Video,
  Loader2,
} from "lucide-react";

export default function EditRecipePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cooking_time: "",
    servings: "",
    youtube_video: "",
    difficulty: "Medium",
    is_public: true,
    allow_copy: false,
    cuisine_type: "",
  });

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [nutrition, setNutrition] = useState({
    calories: "",
    fat: "",
    protein: "",
    carbs: "",
  });
  const [mainImage, setMainImage] = useState<File | null>(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;

      setIsLoading(true);

      try {
        const response = await ApiClient.get(`/recipes/${id}`);
        const fetchedRecipe = response.recipe;

        if (user?.id !== fetchedRecipe.author_id) {
          toast.error("You don't have permission to edit this recipe");
          navigate(`/recipes/${id}`);
          return;
        }

        setRecipe(fetchedRecipe);

        // Set basic form data
        setFormData({
          title: fetchedRecipe.title || "",
          description: fetchedRecipe.description || "",
          cooking_time: fetchedRecipe.cooking_time || "",
          servings: fetchedRecipe.servings || "",
          youtube_video: fetchedRecipe.youtube_video || "",
          difficulty: fetchedRecipe.difficulty || "Medium",
          is_public: fetchedRecipe.is_public || true,
          allow_copy: fetchedRecipe.allow_copy || false,
          cuisine_type: fetchedRecipe.cuisine_type || "",
        });

        // Parse ingredients
        const parsedIngredients = Array.isArray(fetchedRecipe.ingredients)
          ? fetchedRecipe.ingredients
          : typeof fetchedRecipe.ingredients === "string"
          ? JSON.parse(fetchedRecipe.ingredients)
          : [];

        setIngredients(parsedIngredients.length ? parsedIngredients : [""]);

        // Parse steps - focus on this field rather than instructions
        const parsedSteps = Array.isArray(fetchedRecipe.steps)
          ? fetchedRecipe.steps.map((step) =>
              // Remove numbering if present (like "1. Step description")
              step.replace(/^\d+\.\s*/, "")
            )
          : [];

        setSteps(parsedSteps.length ? parsedSteps : [""]);

        // Set nutrition
        setNutrition({
          calories: fetchedRecipe.nutrition?.calories || "",
          fat: fetchedRecipe.nutrition?.fat || "",
          protein: fetchedRecipe.nutrition?.protein || "",
          carbs: fetchedRecipe.nutrition?.carbs || "",
        });

        // Set image preview
        if (fetchedRecipe.image) {
          setMainImagePreview(
            fetchedRecipe.image.startsWith("http")
              ? fetchedRecipe.image
              : `${
                  import.meta.env.VITE_API_URL || "http://localhost:8000"
                }/storage/${fetchedRecipe.image}`
          );
        }
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
        toast.error("Failed to load recipe data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [id, navigate, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleNutritionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNutrition((prev) => ({ ...prev, [name]: value }));
  };

  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newSteps[targetIndex];
    newSteps[targetIndex] = newSteps[index];
    newSteps[index] = temp;
    setSteps(newSteps);
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("time", formData.cooking_time.toString());
      formDataToSend.append("difficulty", formData.difficulty);
      formDataToSend.append("servings", formData.servings.toString());
      formDataToSend.append("cuisine", formData.cuisine_type);
      formDataToSend.append("is_public", formData.is_public ? "1" : "0");
      formDataToSend.append("allow_copy", formData.allow_copy ? "1" : "0");
      formDataToSend.append("youtube_video", formData.youtube_video);

      // Fix 1: Send ingredients as an array of strings without wrapping in objects
      const filteredIngredients = ingredients.filter((ing) => ing.trim());
      formDataToSend.append("ingredients", JSON.stringify(filteredIngredients));

      // Fix 2: Send steps as an array of strings without extra formatting
      const filteredSteps = steps.filter((step) => step.trim());
      formDataToSend.append("steps", JSON.stringify(filteredSteps));

      formDataToSend.append(
        "nutrition",
        JSON.stringify({
          calories: nutrition.calories || "0",
          protein: nutrition.protein || "0",
          carbs: nutrition.carbs || "0",
          fat: nutrition.fat || "0",
        })
      );

      if (mainImage) {
        formDataToSend.append("image", mainImage);
      }

      await ApiClient.putFormData(`/recipes/${id}`, formDataToSend);

      toast.success("Recipe updated successfully");
      navigate(`/recipes/${id}`);
    } catch (error: any) {
      console.error("Failed to update recipe:", error);
      toast.error("Failed to update recipe", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
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

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p>Recipe not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Recipe</h1>
          <p className="text-muted-foreground">
            Update your recipe details and instructions
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="steps">Steps & Tutorial</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Details</CardTitle>
                  <CardDescription>
                    Edit the basic information about your recipe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Recipe Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a descriptive title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Briefly describe your recipe"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cuisine_type">Cuisine</Label>
                      <Select
                        value={formData.cuisine_type}
                        onValueChange={(value) =>
                          handleSelectChange("cuisine_type", value)
                        }
                      >
                        <SelectTrigger id="cuisine_type">
                          <SelectValue placeholder="Select cuisine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Italian">Italian</SelectItem>
                          <SelectItem value="Mexican">Mexican</SelectItem>
                          <SelectItem value="Indian">Indian</SelectItem>
                          <SelectItem value="Chinese">Chinese</SelectItem>
                          <SelectItem value="Japanese">Japanese</SelectItem>
                          <SelectItem value="Thai">Thai</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="American">American</SelectItem>
                          <SelectItem value="Mediterranean">
                            Mediterranean
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <RadioGroup
                        value={formData.difficulty}
                        onValueChange={(value) =>
                          handleSelectChange("difficulty", value)
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Easy" id="difficulty-easy" />
                          <Label htmlFor="difficulty-easy">Easy</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Medium"
                            id="difficulty-medium"
                          />
                          <Label htmlFor="difficulty-medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Hard" id="difficulty-hard" />
                          <Label htmlFor="difficulty-hard">Hard</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cooking_time">
                        Cooking Time (minutes)
                      </Label>
                      <Input
                        id="cooking_time"
                        name="cooking_time"
                        type="number"
                        value={formData.cooking_time}
                        onChange={handleInputChange}
                        placeholder="e.g., 30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="servings">Servings</Label>
                      <Input
                        id="servings"
                        name="servings"
                        type="number"
                        value={formData.servings}
                        onChange={handleInputChange}
                        placeholder="e.g., 4"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube_video">YouTube Video URL</Label>
                    <Input
                      id="youtube_video"
                      name="youtube_video"
                      value={formData.youtube_video}
                      onChange={handleInputChange}
                      placeholder="https://youtu.be/example"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Main Image</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                      {mainImagePreview ? (
                        <div className="relative w-full aspect-video">
                          <img
                            src={mainImagePreview}
                            alt="Recipe preview"
                            className="object-cover rounded-md w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setMainImage(null);
                              setMainImagePreview(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag and drop an image, or click to browse
                          </p>
                          <Input
                            id="main-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleMainImageChange}
                          />
                          <Button asChild variant="secondary" size="sm">
                            <label htmlFor="main-image">Choose File</label>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                  <CardDescription>
                    List all ingredients needed for your recipe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ingredient}
                        onChange={(e) =>
                          updateIngredient(index, e.target.value)
                        }
                        placeholder={`Ingredient ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeIngredient(index)}
                        disabled={ingredients.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addIngredient}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="steps" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preparation Steps</CardTitle>
                  <CardDescription>
                    Describe the steps to prepare your recipe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className="space-y-4 border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Step {index + 1}</h3>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveStep(index, "up")}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveStep(index, "down")}
                            disabled={index === steps.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(index)}
                            disabled={steps.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        placeholder={`Describe step ${index + 1}`}
                        className="min-h-[100px]"
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addStep}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <Card>
              <CardHeader>
                <CardTitle>Nutrition Information</CardTitle>
                <CardDescription>
                  Add nutritional details for your recipe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      name="calories"
                      value={nutrition.calories}
                      onChange={handleNutritionChange}
                      placeholder="e.g., 450 kcal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein</Label>
                    <Input
                      id="protein"
                      name="protein"
                      value={nutrition.protein}
                      onChange={handleNutritionChange}
                      placeholder="e.g., 15g"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs</Label>
                    <Input
                      id="carbs"
                      name="carbs"
                      value={nutrition.carbs}
                      onChange={handleNutritionChange}
                      placeholder="e.g., 40g"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat</Label>
                    <Input
                      id="fat"
                      name="fat"
                      value={nutrition.fat}
                      onChange={handleNutritionChange}
                      placeholder="e.g., 25g"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing Options</CardTitle>
                <CardDescription>
                  Configure how your recipe will be shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_public">Make Recipe Public</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to discover and view your recipe
                    </p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("is_public", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow_copy">Allow Others to Copy</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others save a copy of your recipe to their collection
                    </p>
                  </div>
                  <Switch
                    id="allow_copy"
                    checked={formData.allow_copy}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("allow_copy", checked)
                    }
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/recipes/${id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </Tabs>
        </form>
      </div>
    </div>
  );
}
