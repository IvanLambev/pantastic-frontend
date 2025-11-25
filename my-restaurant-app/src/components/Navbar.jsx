import React from 'react';
import { Link } from 'react-router-dom';
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
import { User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { t } from '@/utils/translations';

const Navbar = () => {
  const { isLoggedIn, handleLogout, isAdmin } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-black text-white backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-14 items-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/" legacyBehavior passHref>
                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-black text-white hover:bg-gray-900 hover:text-white focus:bg-gray-900 focus:text-white")}>
                  {t('nav.home')}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/about" legacyBehavior passHref>
                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-black text-white hover:bg-gray-900 hover:text-white focus:bg-gray-900 focus:text-white")}>
                  {t('nav.about')}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/food" legacyBehavior passHref>
                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-black text-white hover:bg-gray-900 hover:text-white focus:bg-gray-900 focus:text-white")}>
                  {t('nav.food')}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex items-center space-x-4 text-white">
            <button className="burger-menu text-white">☰</button>
            <Link to="/cart" className="cart-icon text-white">🛒</Link>
          </div>
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-white">
                  <User className="h-6 w-6" />
                  <span className="sr-only">{t('nav.profile')}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/user-dashboard">{t('nav.dashboard')}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">{t('nav.admin')}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>{t('nav.logout')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className={cn(navigationMenuTriggerStyle(), "bg-black text-white hover:bg-gray-900 hover:text-white")}>{t('nav.login')}</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
