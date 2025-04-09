import { useEffect, useState } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
//import Navbar from './components/Navbar'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom' // Added Link here

import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import About from './pages/About'
import Food from './pages/Food'
//import { BlocksNav } from './components/BlocksNav'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check session storage for user login status
    const user = sessionStorage.getItem('user')
    setIsLoggedIn(!!user) // Set to true if user exists, false otherwise
  }, [])
  

  return (
    <>
    
       {/* Navigation Menu */}
      <NavigationMenu className="flex items-center justify-between px-8 py-4 shadow-md bg-white rounded-lg w-full">
        {/* Logo */}
        <div className="flex items-center">
          <img src="/logo.webp" alt="Logo" className="h-12 w-12" />
        </div>

        {/* Navigation Links */}
        <NavigationMenuList className="flex gap-8">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/" className="text-gray-800 hover:text-gray-600">Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/login" className="text-gray-800 hover:text-gray-600">Login</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/signup" className="text-gray-800 hover:text-gray-600">Sign Up</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/about" className="text-gray-800 hover:text-gray-600">About</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/food" className="text-gray-800 hover:text-gray-600">Food</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>

        {/* User Status */}
        <div className="flex items-center">
          {isLoggedIn ? (
            <div className="h-8 w-8 rounded-full bg-green-500"></div> // Green circle for logged-in users
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-400"></div> // Gray circle for not logged-in users
          )}
        </div>
      </NavigationMenu>
      

      {/* Routes */}
      <div className="mt-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<About />} />
          <Route path="/food" element={<Food />} />
        </Routes>
      </div>
  
    </>
  )
}

export default App
