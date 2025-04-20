"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Share2,
  Copy,
  Check,
  FacebookIcon,
  TwitterIcon,
  Mail,
} from "lucide-react";

interface ShareRecipeDialogProps {
  recipeId: string;
  recipeTitle: string;
}

export default function ShareRecipeDialog({
  recipeId,
  recipeTitle,
}: ShareRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);

  const recipeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/recipes/${recipeId}`
      : `/recipes/${recipeId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async (platform: string) => {
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          recipeUrl
        )}&quote=${encodeURIComponent(
          `Check out this recipe: ${recipeTitle}`
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          recipeUrl
        )}&text=${encodeURIComponent(`Check out this recipe: ${recipeTitle}`)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(
          `Recipe: ${recipeTitle}`
        )}&body=${encodeURIComponent(
          `Check out this recipe: ${recipeTitle}\n\n${recipeUrl}`
        )}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share recipe</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Recipe</DialogTitle>
          <DialogDescription>
            Share this recipe with friends and family
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  defaultValue={recipeUrl}
                  readOnly
                  className="h-9"
                />
              </div>
              <Button size="sm" onClick={handleCopyLink} className="px-3">
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy</span>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public-recipe">Public Recipe</Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can view this recipe
                  </p>
                </div>
                <Switch
                  id="public-recipe"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-copy">Allow Copy</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others save a copy of this recipe to their collection
                  </p>
                </div>
                <Switch
                  id="allow-copy"
                  checked={allowCopy}
                  onCheckedChange={setAllowCopy}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="py-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => handleShare("facebook")}
              >
                <FacebookIcon className="h-6 w-6 mb-2" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => handleShare("twitter")}
              >
                <TwitterIcon className="h-6 w-6 mb-2" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => handleShare("email")}
              >
                <Mail className="h-6 w-6 mb-2" />
                <span className="text-xs">Email</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
