import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FaShoppingCart, FaUserCircle, FaBars } from 'react-icons/fa';
import { cn } from "@/lib/utils";
import { t } from '@/utils/translations';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ListItem = React.forwardRef(({ className, title, children, badge, onClick, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
            className
          )}
          onClick={onClick}
          {...props}
        >
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium leading-none">{title}</div>
            {badge && <Badge variant="secondary" className="text-[10px] h-5 px-1">{badge}</Badge>}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

const Navbar = () => {
  const { isLoggedIn, handleLogout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    sessionStorage.setItem('selectedCategory', category);
    window.dispatchEvent(new Event('category-change'));
    navigate('/food');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-black text-white">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <img src="/desktop-logo.png" alt="Pantastic" className="hidden md:block h-10 object-contain" />
          <img src="/mobile-logo.webp" alt="Pantastic" className="block md:hidden h-10 object-contain" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/" className={cn(navigationMenuTriggerStyle(), "bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900")}>
                    {t('nav.home')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/about" className={cn(navigationMenuTriggerStyle(), "bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900")}>
                    {t('nav.about')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900">
                  Sweet Pancakes
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem title="Sweet Pancakes" onClick={() => handleCategoryClick('sweet')}>
                      Delicious sweet pancakes for every taste.
                    </ListItem>
                    <ListItem title="American Pancakes" onClick={() => handleCategoryClick('american')}>
                      Fluffy American style pancakes.
                    </ListItem>
                    <ListItem title="Mini American Pancakes" onClick={() => handleCategoryClick('american')}>
                      Bite-sized American pancakes.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900">
                  Sour Pancakes
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem title="Sour Pancakes" onClick={() => handleCategoryClick('savory')}>
                      Savory pancakes for a hearty meal.
                    </ListItem>
                    <ListItem title="American Sour Pancakes" badge="Coming Soon">
                      New savory American pancakes coming soon!
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900">
                  Deluxe Boxes
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem title="Deluxe Box for One" onClick={() => handleCategoryClick('deluxe')}>
                      A special treat just for you.
                    </ListItem>
                    <ListItem title="Deluxe Box for Two" onClick={() => handleCategoryClick('deluxe')}>
                      Perfect for sharing with a loved one.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <Link to="/cart" className="text-white hover:text-gray-300 transition-colors relative">
            <FaShoppingCart className="h-6 w-6" />
          </Link>

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors outline-none">
                  <FaUserCircle className="h-7 w-7" />
                  <span className="sr-only">{t('nav.profile')}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/user-dashboard" className="cursor-pointer">{t('nav.dashboard')}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">{t('nav.admin')}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-white text-black hover:bg-gray-200">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button className="text-white md:hidden hover:text-gray-300 transition-colors">
            <FaBars className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
