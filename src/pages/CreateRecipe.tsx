import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import ApiClient from "@/lib/api";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, X, AlertCircle } from "lucide-react";

// Define the form schema with zod
const recipeFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title must not exceed 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description must not exceed 500 characters" })
    .nullable(),
  cooking_time: z.string().min(1, { message: "Cooking time is required" }),
  difficulty: z.string().min(1, { message: "Difficulty level is required" }),
  servings: z.string().min(1, { message: "Number of servings is required" }),
  cuisine_type: z.string().min(1, { message: "Cuisine type is required" }),
  is_public: z.boolean().default(true),
  allow_copy: z.boolean().default(true),
  youtube_video: z.string().nullable(),
  nutrition: z.object({
    calories: z.string().optional(),
    fat: z.string().optional(),
    carbs: z.string().optional(),
    protein: z.string().optional(),
  }),
  tags: z.array(z.string()).default([]),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export default function CreateRecipePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState("");
  const [currentTag, setCurrentTag] = useState("");

  // Initialize the form
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      cooking_time: "",
      difficulty: "Easy",
      servings: "2",
      cuisine_type: "Italian",
      is_public: true,
      allow_copy: true,
      youtube_video: "",
      nutrition: {
        calories: "",
        fat: "",
        carbs: "",
        protein: "",
      },
      tags: [],
    },
  });

  // Handle file selection for the recipe image
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding an ingredient
  const handleAddIngredient = () => {
    if (currentIngredient.trim()) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient("");
    }
  };

  // Handle removing an ingredient
  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  // Handle adding an instruction step
  const handleAddStep = () => {
    if (currentStep.trim()) {
      setSteps([...steps, currentStep.trim()]);
      setCurrentStep("");
    }
  };

  // Handle removing an instruction step
  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, idx) => idx !== index));
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (
      currentTag.trim() &&
      !form.getValues("tags").includes(currentTag.trim())
    ) {
      const updatedTags = [...form.getValues("tags"), currentTag.trim()];
      form.setValue("tags", updatedTags);
      setCurrentTag("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = form
      .getValues("tags")
      .filter((tag) => tag !== tagToRemove);
    form.setValue("tags", updatedTags);
  };

  // Handle form submission
  const onSubmit = async (data: RecipeFormValues) => {
    if (!user) {
      toast.error("You must be logged in to create recipes");
      navigate("/auth/login");
      return;
    }

    if (ingredients.length === 0) {
      toast.error("You must add at least one ingredient");
      return;
    }

    if (steps.length === 0) {
      toast.error("You must add at least one instruction step");
      return;
    }

    setIsSubmitting(true);

    try {
      // First create a FormData object to handle the multipart/form-data request
      const formData = new FormData();

      // Append text fields
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("cooking_time", data.cooking_time);
      formData.append("difficulty", data.difficulty);
      formData.append("servings", data.servings);
      formData.append("cuisine_type", data.cuisine_type);
      formData.append("is_public", data.is_public ? "1" : "0");
      formData.append("allow_copy", data.allow_copy ? "1" : "0");
      formData.append("youtube_video", data.youtube_video || "");

      // Append ingredients as a JSON array
      formData.append("ingredients", JSON.stringify(ingredients));

      // Append steps as a JSON array
      formData.append("steps", JSON.stringify(steps));

      // Append nutrition as a JSON object
      formData.append("nutrition", JSON.stringify(data.nutrition));

      // Append tags as a JSON array
      formData.append("tags", JSON.stringify(data.tags));

      // Append the image if one was selected
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      // Send the recipe data to the API
      const response = await ApiClient.upload("/recipes", formData);

      toast.success("Recipe created successfully!");
      navigate(`/recipes/${response.recipe.id}`);
    } catch (error: any) {
      console.error("Error creating recipe:", error);
      toast.error("Failed to create recipe", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground mb-6">
            You must be logged in to create recipes.
          </p>
          <Button onClick={() => navigate("/auth/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Recipe</h1>
            <p className="text-muted-foreground mt-2">
              Share your favorite recipe with the community.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 pb-10"
            >
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipe Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="E.g. Homemade Margherita Pizza"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of your recipe"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cooking_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cooking Time (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="30"
                              type="number"
                              min="1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servings</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="2"
                              type="number"
                              min="1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Easy">Easy</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cuisine_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuisine Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cuisine" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Italian">Italian</SelectItem>
                              <SelectItem value="Mexican">Mexican</SelectItem>
                              <SelectItem value="Chinese">Chinese</SelectItem>
                              <SelectItem value="Indian">Indian</SelectItem>
                              <SelectItem value="Japanese">Japanese</SelectItem>
                              <SelectItem value="American">American</SelectItem>
                              <SelectItem value="French">French</SelectItem>
                              <SelectItem value="Thai">Thai</SelectItem>
                              <SelectItem value="Mediterranean">
                                Mediterranean
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Recipe Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <FormLabel>Upload Image</FormLabel>
                      <div className="mt-2">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        <FormDescription>
                          Upload an appetizing photo of your recipe. Max size:
                          5MB.
                        </FormDescription>
                      </div>
                    </div>
                    {imagePreview && (
                      <div className="relative aspect-video w-full max-w-md rounded-md overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Recipe preview"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    <div>
                      <FormField
                        control={form.control}
                        name="youtube_video"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>YouTube Video URL (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://www.youtube.com/watch?v=..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Add a link to a YouTube video tutorial for your
                              recipe.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an ingredient (e.g. 2 cups flour)"
                      value={currentIngredient}
                      onChange={(e) => setCurrentIngredient(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddIngredient();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddIngredient}
                      variant="secondary"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {ingredients.length > 0 ? (
                    <ul className="space-y-2 mt-4">
                      {ingredients.map((ingredient, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <span>{ingredient}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveIngredient(index)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">
                      No ingredients added yet. Add the ingredients needed for
                      your recipe.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Instruction Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Textarea
                      placeholder="Add a step for your recipe..."
                      value={currentStep}
                      onChange={(e) => setCurrentStep(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          e.preventDefault();
                          handleAddStep();
                        }
                      }}
                      className="resize-none"
                    />
                    <Button
                      type="button"
                      onClick={handleAddStep}
                      variant="secondary"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>

                  {steps.length > 0 ? (
                    <ol className="space-y-4 mt-4">
                      {steps.map((step, index) => (
                        <li key={index} className="flex gap-4">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-2 border-b pb-4">
                            <div className="flex items-start justify-between">
                              <p>{step}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveStep(index)}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">
                      No steps added yet. Add the steps to prepare your recipe.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nutrition Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Nutrition Information (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="nutrition.calories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calories</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 250" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nutrition.fat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fat (g)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 10" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nutrition.carbs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carbs (g)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 30" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nutrition.protein"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Protein (g)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 15" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Tags */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Tags</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag (e.g. vegetarian, dessert)"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddTag}
                        variant="secondary"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {form.getValues("tags").map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </Badge>
                      ))}
                      {form.getValues("tags").length === 0 && (
                        <span className="text-muted-foreground text-sm">
                          No tags added yet. Tags help others discover your
                          recipe.
                        </span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Visibility Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Visibility Settings</h3>

                    <FormField
                      control={form.control}
                      name="is_public"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Public Recipe</FormLabel>
                            <FormDescription>
                              Make your recipe visible to everyone
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allow_copy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Allow Copy</FormLabel>
                            <FormDescription>
                              Allow others to copy and modify your recipe
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Recipe"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
