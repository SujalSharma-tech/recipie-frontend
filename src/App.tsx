import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";
import { RecipeProvider } from "@/context/RecipeContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecipesPage from "./pages/Recipes";
import CreateRecipePage from "./pages/CreateRecipe";
import RecipeDetailPage from "./pages/RecipeDetails";
import CollectionsPage from "./pages/CollectionPage"; // Added import
import FavoritesPage from "./pages/FavoritePage"; // Added import
import { Toaster } from "@/components/ui/sonner-toast"; // Updated import!
import EditProfilePage from "./pages/EditProfilePage"; // Added import
import SingleCollectionPage from "./pages/SingleCollectionPage"; // Added import
import AddRecipesToCollectionPage from "./pages/AddRecipesToCollectionPage"; // Added import
import EditRecipePage from "./pages/EditRecipePage"; // Import the edit recipe page component

// Protected route wrapper
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <RecipeProvider>
          {/* Wrap the entire app content including Navbar in a React Fragment */}
          <>
            <Navbar />
            <main className="min-h-screen pt-16">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route
                  path="/collections/:id"
                  element={<SingleCollectionPage />}
                />
                <Route
                  path="/collections/:id/add-recipes"
                  element={<AddRecipesToCollectionPage />}
                />
                {/* <Route
                  path="/collections/:id"
                  element={<CollectionDetailPage />}
                /> */}

                {/* <Route
                  path="/collections/:id/edit"
                  element={<EditCollectionPage />}
                /> */}

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/recipes/create"
                    element={<CreateRecipePage />}
                  />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/edit" element={<EditProfilePage />} />
                  {/* Add more protected routes here */}
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/recipes/:id/edit"
                    element={<EditRecipePage />}
                  />
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route path="/favorites" element={<FavoritesPage />} />
                </Route>
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Toaster />
          </>
        </RecipeProvider>
      </AuthProvider>
    </Router>
  );
}
