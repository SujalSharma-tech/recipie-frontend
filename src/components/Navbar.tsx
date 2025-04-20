import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Menu,
  X,
  PlusCircle,
  BookOpen,
  FolderPlus,
  Heart,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  //   const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // router.push(`/recipes?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    // router.push("/");
  };

  const closeMenu = () => setOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link to={"/"} className="font-bold text-xl">
            ReciPie
          </Link>

          {!isMobile && (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Explore</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-rose-500 to-orange-500 p-6 no-underline outline-none focus:shadow-md"
                            href="/"
                          >
                            <div className="mt-4 mb-2 text-lg font-medium text-white">
                              Featured Recipes
                            </div>
                            <p className="text-sm leading-tight text-white/90">
                              Discover our most popular and trending recipes
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link
                          to={"/recipes?cuisine=italian"}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            Italian
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Pasta, pizza, and more Italian classics
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={"/recipes?cuisine=asian"}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            Asian
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Chinese, Japanese, Thai, and more Asian cuisines
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={"/recipes?difficulty=easy"}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            Quick & Easy
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Ready in 30 minutes or less
                          </p>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to={"/collections"}
                      className={navigationMenuTriggerStyle()}
                    >
                      Collections
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to={"/recipes"}
                      className={navigationMenuTriggerStyle()}
                    >
                      All recipes
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isMobile ? (
            <>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search recipes..."
                  className="w-[200px] lg:w-[300px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {user ? (
                <>
                  <Button asChild>
                    <Link to={"/recipes/create"}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Recipe
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.avatar || "/placeholder.svg"}
                            alt={user.name}
                          />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={"/profile"}>
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={"/profile"}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>My Recipes</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={"/profile?tab=collections"}>
                          <FolderPlus className="mr-2 h-4 w-4" />
                          <span>Collections</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={"/profile?tab=saved"}>
                          <Heart className="mr-2 h-4 w-4" />
                          <span>Favorites</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/favorites"
                          className="flex items-center gap-2 w-full cursor-pointer"
                        >
                          <Heart className="h-4 w-4" />
                          Favorite Recipes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={"/settings"}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to={"/auth/login"}>Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link to={"/auth/register"}>Sign up</Link>
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="h-5 w-5" />
              </Button>
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <Link
                        to={"/"}
                        className="font-bold text-xl"
                        onClick={() => setOpen(false)}
                      >
                        Recipe Book
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="space-y-4 flex-1">
                      {user && (
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="font-medium">Explore</div>
                        <nav className="grid gap-1">
                          <Link
                            to={"/recipes"}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                            onClick={() => setOpen(false)}
                          >
                            All Recipes
                          </Link>
                          <Link
                            to={"/collections"}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                            onClick={() => setOpen(false)}
                          >
                            Collections
                          </Link>
                          <Link
                            to={"/recipes?cuisine=italian"}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                            onClick={() => setOpen(false)}
                          >
                            Italian
                          </Link>
                          <Link
                            to={"/recipes?cuisine=asian"}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                            onClick={() => setOpen(false)}
                          >
                            Asian
                          </Link>
                          <Link
                            to={"/recipes?difficulty=easy"}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                            onClick={() => setOpen(false)}
                          >
                            Quick & Easy
                          </Link>
                        </nav>
                      </div>

                      {user ? (
                        <div className="space-y-2">
                          <div className="font-medium">Account</div>
                          <nav className="grid gap-1">
                            <Link
                              to={"/profile"}
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                              onClick={() => setOpen(false)}
                            >
                              <BookOpen className="h-4 w-4" />
                              My Recipes
                            </Link>
                            <Link
                              to={"/profile?tab=collections"}
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                              onClick={() => setOpen(false)}
                            >
                              <FolderPlus className="h-4 w-4" />
                              Collections
                            </Link>
                            <Link
                              to={"/profile?tab=saved"}
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                              onClick={() => setOpen(false)}
                            >
                              <Heart className="h-4 w-4" />
                              Favorites
                            </Link>
                            <Link
                              to={"/settings"}
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                              onClick={() => setOpen(false)}
                            >
                              <Settings className="h-4 w-4" />
                              Settings
                            </Link>
                            <Link
                              to="/favorites"
                              className="flex items-center gap-2 px-4 py-2 text-sm"
                              onClick={closeMenu}
                            >
                              <Heart className="h-4 w-4" />
                              Favorite Recipes
                            </Link>
                            <button
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1 text-left"
                              onClick={() => {
                                handleLogout();
                                setOpen(false);
                              }}
                            >
                              <LogOut className="h-4 w-4" />
                              Log out
                            </button>
                          </nav>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="font-medium">Account</div>
                          <nav className="grid gap-1">
                            <Link
                              to={"/auth/login"}
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                              onClick={() => setOpen(false)}
                            >
                              Sign in
                            </Link>
                            <Link
                              to={"/auth/register"}
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground py-1"
                              onClick={() => setOpen(false)}
                            >
                              Sign up
                            </Link>
                          </nav>
                        </div>
                      )}
                    </div>

                    {user && (
                      <div className="pt-4">
                        <Button className="w-full" asChild>
                          <Link
                            to={"/recipes/create"}
                            onClick={() => setOpen(false)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Recipe
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>

      {isMobile && searchOpen && (
        <div className="container mx-auto px-4 py-3 border-t">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search recipes..."
              className="w-full pl-8"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      )}
    </header>
  );
}
