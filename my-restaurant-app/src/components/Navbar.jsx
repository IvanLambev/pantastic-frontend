import React, { useState } from 'react';
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryClick = (category) => {
    sessionStorage.setItem('selectedCategory', category);
    window.dispatchEvent(new Event('category-change'));
    navigate('/food');
  };

  const hasItems = cartItems.length > 0;
  const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

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
                <NavigationMenuTrigger className="bg-black text-white hover:bg-white hover:text-black focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-white data-[state=open]:text-black">
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
                <NavigationMenuTrigger className="bg-black text-white hover:bg-white hover:text-black focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-white data-[state=open]:text-black">
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
                <NavigationMenuTrigger className="bg-black text-white hover:bg-white hover:text-black focus:bg-zinc-900 focus:text-white data-[active]:bg-zinc-900 data-[state=open]:bg-white data-[state=open]:text-black">
                  Делукс Кутии
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem title="Делукс бокс за двама" onClick={() => handleCategoryClick('deluxe')}>
                      Перфектно за споделяне с любим човек.
                    </ListItem>
                    <ListItem title="Делукс бокс за четирима" onClick={() => handleCategoryClick('deluxe')}>
                      Подходящ за цялото семейство.
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
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-xs font-bold"
              >
                {totalQuantity}
              </Badge>
            </Link>
          )}

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-2 text-white hover:text-gray-300 transition-colors outline-none">
                  <CiUser className="h-7 w-7" />
                  <span className="sr-only">{t('nav.profile')}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">{t('nav.dashboard')}</Link>
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
            <div className="hidden md:flex items-center gap-2">
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
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal={false}>
            <SheetTrigger asChild>
              <button className="text-white md:hidden hover:text-gray-300 transition-colors">
                <FaBars className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black text-white border-zinc-800 overflow-y-auto">
              <SheetTitle className="text-white mb-2 mt-2">Меню</SheetTitle>
              <div className="flex flex-col gap-3 mt-2 px-2">
                <SheetClose asChild>
                  <Link
                    to="/"
                    className="text-lg font-medium hover:bg-zinc-900 hover:text-white transition-colors px-4 py-3 rounded-lg -mx-2"
                  >
                    {t('nav.home')}
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/about"
                    className="text-lg font-medium hover:bg-zinc-900 hover:text-white transition-colors px-4 py-3 rounded-lg -mx-2"
                  >
                    {t('nav.about')}
                  </Link>
                </SheetClose>

                <div className="space-y-2 pt-1 border-t border-zinc-800">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">Сладки Палачинки</h3>
                  <div className="flex flex-col gap-1.5">
                    <SheetClose asChild>
                      <button
                        onClick={() => handleCategoryClick('sweet')}
                        className="text-left hover:bg-zinc-900 transition-colors px-4 py-2.5 rounded-lg"
                      >
                        Сладки Палачинки
                      </button>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={() => handleCategoryClick('american')}
                        className="text-left hover:bg-zinc-900 transition-colors px-4 py-2.5 rounded-lg"
                      >
                        Американски Палачинки
                      </button>
                    </SheetClose>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-zinc-800">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">Солени Палачинки</h3>
                  <div className="flex flex-col gap-1.5">
                    <SheetClose asChild>
                      <button
                        onClick={() => handleCategoryClick('savory')}
                        className="text-left hover:bg-zinc-900 transition-colors px-4 py-2.5 rounded-lg"
                      >
                        Солени Палачинки
                      </button>
                    </SheetClose>
                    <div className="text-gray-500 px-4 py-2.5">Американски Солени (Скоро)</div>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-zinc-800">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">Делукс Кутии</h3>
                  <div className="flex flex-col gap-1.5">
                    <SheetClose asChild>
                      <button
                        onClick={() => handleCategoryClick('deluxe')}
                        className="text-left hover:bg-zinc-900 transition-colors px-4 py-2.5 rounded-lg"
                      >
                        Делукс бокс за двама
                      </button>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={() => handleCategoryClick('deluxe')}
                        className="text-left hover:bg-zinc-900 transition-colors px-4 py-2.5 rounded-lg"
                      >
                        Делукс бокс за четирима
                      </button>
                    </SheetClose>
                  </div>
                </div>

                {/* User Menu Section for Logged-in Users */}
                {isLoggedIn && (
                  <div className="mt-auto pt-4 border-t border-zinc-800">
                    <SheetClose asChild>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 text-lg font-medium hover:bg-zinc-900 hover:text-white transition-colors px-4 py-3 rounded-lg -mx-2"
                      >
                        <CiUser className="h-5 w-5" />
                        {t('nav.dashboard')}
                      </Link>
                    </SheetClose>
                    {isAdmin && (
                      <SheetClose asChild>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 text-lg font-medium hover:bg-zinc-900 hover:text-white transition-colors px-4 py-3 rounded-lg -mx-2"
                        >
                          {t('nav.admin')}
                        </Link>
                      </SheetClose>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 text-lg font-medium text-red-600 hover:bg-zinc-900 transition-colors px-4 py-3 rounded-lg -mx-2 text-left"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}

                {/* Login/Signup Section for Logged-out Users */}
                {!isLoggedIn && (
                  <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-2">
                    <SheetClose asChild>
                      <Link to="/login">
                        <Button variant="ghost" className="w-full text-white hover:bg-white/10 hover:text-white">
                          {t('nav.login')}
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/signup">
                        <Button className="w-full bg-white text-black hover:bg-gray-200">
                          Регистрация
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
