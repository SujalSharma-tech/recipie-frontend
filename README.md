# ReciPIE - Full Stack Recipe Management Application

This comprehensive documentation covers both the frontend and backend components of the Recipie, a full-featured recipe sharing and management platform.

## Table of Contents

- Project Overview
- Features
- Tech Stack
- Frontend Documentation
  - Setup and Installation
  - Application Structure
  - Key Components
  - Routes
  - State Management
- Backend Documentation
  - Setup and Installation
  - API Documentation
  - Database Schema
- Deployment

## Project Overview

ReciPie is a full-stack application that allows users to create, share, discover, and save recipes. Users can comment on recipes, organize them into collections, and mark favorites for quick access. The platform features user profiles, ratings, search functionality, and much more.

## Features

### User Management
- Registration and authentication
- Profile management with avatar and cover image
- Public user profiles 

### Recipe Management
- Create, read, update, delete (CRUD) operations for recipes
- Rich recipe details (ingredients, steps, cooking time, difficulty, etc.)
- Image uploads for recipes
- YouTube video embedding
- Nutrition information

### Social Features
- Comment on recipes
- Share recipes
- Save favorite recipes
- Create personal collections of recipes

### Discoverability
- Search recipes by title, ingredients, or tags
- Filter by cuisine, difficulty, cooking time
- Browse popular and recent recipes

## Tech Stack

### Frontend
- React with TypeScript
- React Router for navigation
- Shadcn/UI components
- Lucide React for icons
- React Hook Form for form handling
- Sonner for toast notifications

### Backend
- Laravel PHP framework
- Laravel Sanctum for authentication
- PostgreSQL database
- File storage for images

## Frontend Documentation

### Frontend Setup and Installation

```bash
# Clone the repository
git clone [repository-url]
cd recipieapp

# Install dependencies
npm install

# Start development server
npm run dev
```

### Application Structure

```
src/
├── components/        # Reusable UI components
├── lib/              # Utility functions and API client
├── pages/            # Page components for routes
├── context/          # React context providers
├── hooks/            # Custom React hooks
└── types/            # TypeScript type definitions
```

### Key Components

#### Authentication

The application uses a context-based authentication system:

```tsx
// Usage example
import { useAuth } from "@/lib/auth";

function MyComponent() {
  const { user, login, logout, register } = useAuth();
  
  // Use auth functions and state
}
```

Authentication features include:
- Login with email/password
- Registration with name, username, email, and password
- Password reset functionality
- Protected routes for authenticated users

#### Recipe Management

The application provides comprehensive recipe management:

1. **View Recipes**: Browse all recipes with filtering and search capabilities
2. **Recipe Details**: View complete recipe information including ingredients, steps, and nutrition
3. **Create/Edit Recipes**: Form-based interface for adding and updating recipes
4. **Delete Recipes**: Remove recipes with confirmation dialog

#### Comments System

Users can interact with recipes through comments:
- Add new comments
- Edit existing comments (for comment authors)
- Delete comments (for comment authors and recipe owners)

#### Collections and Favorites

Users can organize recipes:
- Save recipes to favorites for quick access
- Create and manage collections of recipes
- Add recipes to collections

### Routes

```
/                        # Home page with featured recipes
/recipes                 # Browse all recipes with filters
/recipes/:id             # View single recipe details
/recipes/create          # Create new recipe form
/recipes/:id/edit        # Edit existing recipe
/auth/login              # Login page
/auth/register           # Registration page
/profile                 # Current user profile
/profile?tab=collections # User collections
/profile?tab=saved       # User saved recipes
/users/:id               # Public user profiles
/favorites               # User favorite recipes
/collections             # User collections
/collections/:id         # View single collection
```

### State Management

The application uses React context for global state management:
- `AuthContext` - For user authentication state
- `RecipeContext` - For recipe data and operations

Local component state is used for UI-specific state management.

## Backend Documentation

### Backend Setup and Installation

```bash
# Navigate to the backend directory
cd server

# Install PHP dependencies
composer install

# Copy environment file and configure
cp .env.example .env

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# Start development server
php artisan serve
```

### API Documentation

#### Authentication Endpoints

1. **Register a new user**
   - **Endpoint**: `POST /api/auth/register`
   - **Request Body**:
     ```json
     {
       "name": "John Doe",
       "username": "johndoe123",
       "email": "john@example.com",
       "password": "password",
       "password_confirmation": "password"
     }
     ```

2. **Login**
   - **Endpoint**: `POST /api/auth/login`
   - **Request Body**:
     ```json
     {
       "email": "john@example.com",
       "password": "password"
     }
     ```

3. **Logout**
   - **Endpoint**: `POST /api/auth/logout`
   - **Headers**: `Authorization: Bearer token`

4. **Get Current User**
   - **Endpoint**: `GET /api/auth/me`
   - **Headers**: `Authorization: Bearer token`

#### Recipe Endpoints

1. **List Recipes**
   - **Endpoint**: `GET /api/recipes`
   - **Query Parameters**:
     - `search` - Search term
     - `cuisine` - Filter by cuisine type
     - `difficulty` - Filter by difficulty
     - `time` - Filter by cooking time range

2. **Get Single Recipe**
   - **Endpoint**: `GET /api/recipes/{id}`

3. **Create Recipe**
   - **Endpoint**: `POST /api/recipes`
   - **Headers**: `Authorization: Bearer token`
   - **Content-Type**: `multipart/form-data`
   - **Request Body**:
     ```
     title: "Recipe Title"
     description: "Recipe Description"
     time: 30
     difficulty: "Medium" 
     servings: 4
     cuisine: "Italian"
     is_public: 1
     allow_copy: 1
     ingredients: ["Ingredient 1", "Ingredient 2"]
     steps: ["Step 1 description", "Step 2 description"]
     image: [File Upload]
     nutrition: {"calories": "400", "protein": "20", "carbs": "30", "fat": "15"}
     tags: ["Tag1", "Tag2"]
     youtube_video: "https://youtu.be/example" (optional)
     ```

4. **Update Recipe**
   - **Endpoint**: `PUT /api/recipes/{id}`
   - **Headers**: `Authorization: Bearer token`
   - **Content-Type**: `multipart/form-data`
   - **Request Body**: Same as Create Recipe

5. **Delete Recipe**
   - **Endpoint**: `DELETE /api/recipes/{id}`
   - **Headers**: `Authorization: Bearer token`

#### Comments Endpoints

1. **Add Comment**
   - **Endpoint**: `POST /api/recipes/{recipeId}/comments`
   - **Headers**: `Authorization: Bearer token`
   - **Request Body**:
     ```json
     {
       "content": "This recipe is amazing!"
     }
     ```

2. **Update Comment**
   - **Endpoint**: `PUT /api/recipes/{recipeId}/comments/{commentId}`
   - **Headers**: `Authorization: Bearer token`
   - **Request Body**:
     ```json
     {
       "content": "Updated comment text"
     }
     ```

3. **Delete Comment**
   - **Endpoint**: `DELETE /api/recipes/{recipeId}/comments/{commentId}`
   - **Headers**: `Authorization: Bearer token`

#### User Profile Endpoints

1. **Update Profile**
   - **Endpoint**: `PUT /api/users/profile`
   - **Headers**: `Authorization: Bearer token`
   - **Content-Type**: `multipart/form-data`
   - **Request Body**:
     ```
     name: "Updated Name"
     username: "username"
     email: "email@example.com"
     bio: "User bio"
     location: "User location"
     website: "https://example.com"
     avatar: [File Upload] (optional)
     cover_image: [File Upload] (optional)
     ```

2. **Get User Recipes**
   - **Endpoint**: `GET /api/users/{id}/recipes`

3. **Get User Collections**
   - **Endpoint**: `GET /api/users/{id}/collections`

4. **Get Saved Recipes**
   - **Endpoint**: `GET /api/users/{id}/saved`

#### Collections Endpoints

1. **List User Collections**
   - **Endpoint**: `GET /api/collections`
   - **Headers**: `Authorization: Bearer token`

2. **Create Collection**
   - **Endpoint**: `POST /api/collections`
   - **Headers**: `Authorization: Bearer token`
   - **Request Body**:
     ```json
     {
       "name": "Collection Name",
       "description": "Collection Description",
       "is_public": true
     }
     ```

3. **Add Recipe to Collection**
   - **Endpoint**: `POST /api/collections/{id}/recipes/{recipeId}`
   - **Headers**: `Authorization: Bearer token`

4. **Remove Recipe from Collection**
   - **Endpoint**: `DELETE /api/collections/{id}/recipes/{recipeId}`
   - **Headers**: `Authorization: Bearer token`

### Database Schema

The backend uses PostgreSQL with the following key tables:

1. **users** - User accounts
2. **recipes** - Recipe information
3. **ingredients** - Recipe ingredients
4. **steps** - Recipe preparation steps
5. **comments** - User comments on recipes
6. **collections** - User recipe collections
7. **collection_recipe** - Junction table for recipes in collections
8. **saved_recipes** - Junction table for user saved recipes
9. **tags** - Recipe tags
10. **recipe_tag** - Junction table for recipe tags

## Deployment

### Frontend Deployment

1. Build the production version:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting provider of choice (Netlify, Vercel, etc.)

### Backend Deployment

1. Configure your production environment variables in `.env`

2. Set up a web server (Apache/Nginx) with PHP 8.0+ and PostgreSQL

3. Deploy the Laravel application following standard Laravel deployment practices

4. Configure your web server to point to the public directory

5. Set up proper file permissions for storage directories