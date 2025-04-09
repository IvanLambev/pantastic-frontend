import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav style={{ padding: '1rem', backgroundColor: '#eee' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
      <Link to="/login">Login</Link>
      <Link to="/about" style={{ marginLeft: '1rem' }}>About</Link>
    </nav>
  )
}

export default Navbar
