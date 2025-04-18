import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">
            Home
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-gray-900 font-medium">
            About
          </Link>
          <Link to="/food" className="text-gray-700 hover:text-gray-900 font-medium">
            Food
          </Link>
        </div>
        <div>
          <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
            Login
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
