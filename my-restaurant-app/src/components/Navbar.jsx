import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/use-cart';
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { FaBars } from 'react-icons/fa';
import { IoCartOutline } from "react-icons/io5";
import { CiUser } from "react-icons/ci";
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
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    sessionStorage.setItem('selectedCategory', category);
    window.dispatchEvent(new Event('category-change'));
    navigate('/food');
  };

  const hasItems = cartItems.length > 0;

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
                  <Link to="/" className={cn(navigationMenuTriggerStyle(), "bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900 data-[state=open]:text-white")}>
                    {t('nav.home')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/about" className={cn(navigationMenuTriggerStyle(), "bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900 data-[state=open]:text-white")}>
                    {t('nav.about')}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900 data-[state=open]:text-white">
                  Сладки Палачинки
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem title="Сладки Палачинки" onClick={() => handleCategoryClick('sweet')}>
                      Вкусни сладки палачинки за всеки вкус.
                    </ListItem>
                    <ListItem title="Американски Палачинки" onClick={() => handleCategoryClick('american')}>
                      Пухкави палачинки в американски стил.
                    </ListItem>
                    <ListItem title="Мини Американски Палачинки" onClick={() => handleCategoryClick('american')}>
                      Мини американски палачинки.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900 data-[state=open]:text-white">
                  Солени Палачинки
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem title="Солени Палачинки" onClick={() => handleCategoryClick('savory')}>
                      Солени палачинки за обилно хранене.
                    </ListItem>
                    <ListItem title="Американски Солени Палачинки" badge="Очаквайте скоро">
                      Нови солени американски палачинки очаквайте скоро!
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-black text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-zinc-900 data-[state=open]:text-white">
                  Делукс Кутии
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem title="Делукс Кутия за Един" onClick={() => handleCategoryClick('deluxe')}>
                      Специално лакомство само за вас.
                    </ListItem>
                    <ListItem title="Делукс Кутия за Двама" onClick={() => handleCategoryClick('deluxe')}>
                      Перфектно за споделяне с любим човек.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {hasItems && (
            <Link
              to="/cart"
              className="text-white hover:text-gray-300 transition-colors relative animate-in slide-in-from-right duration-500"
            >
              <IoCartOutline className="h-6 w-6" />
            </Link>
          )}

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors outline-none">
                  <CiUser className="h-7 w-7" />
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
                  Регистрация
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="text-white md:hidden hover:text-gray-300 transition-colors">
                <FaBars className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black text-white border-zinc-800 overflow-y-auto">
              <SheetTitle className="text-white">Меню</SheetTitle>
              <div className="flex flex-col gap-6 mt-8">
                <Link to="/" className="text-lg font-medium hover:text-gray-300">
                  {t('nav.home')}
                </Link>
                <Link to="/about" className="text-lg font-medium hover:text-gray-300">
                  {t('nav.about')}
                </Link>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Сладки Палачинки</h3>
                  <div className="flex flex-col gap-2 pl-4">
                    <button onClick={() => handleCategoryClick('sweet')} className="text-left hover:text-gray-300">Сладки Палачинки</button>
                    <button onClick={() => handleCategoryClick('american')} className="text-left hover:text-gray-300">Американски Палачинки</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Солени Палачинки</h3>
                  <div className="flex flex-col gap-2 pl-4">
                    <button onClick={() => handleCategoryClick('savory')} className="text-left hover:text-gray-300">Солени Палачинки</button>
                    <div className="text-gray-500">Американски Солени (Скоро)</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Делукс Кутии</h3>
                  <div className="flex flex-col gap-2 pl-4">
                    <button onClick={() => handleCategoryClick('deluxe')} className="text-left hover:text-gray-300">Делукс Кутия за Един</button>
                    <button onClick={() => handleCategoryClick('deluxe')} className="text-left hover:text-gray-300">Делукс Кутия за Двама</button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
