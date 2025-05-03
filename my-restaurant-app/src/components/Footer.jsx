import { Link } from 'react-router-dom'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
        
            <span className="text-2xl font-bold tracking-tight">Pantastic®</span>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <nav className="flex gap-6">
              <Link to="/" className="text-muted-foreground font-medium hover:text-primary transition-colors">Home</Link>
              <Link to="/food" className="text-muted-foreground font-medium hover:text-primary transition-colors">Food</Link>
              <Link to="/about" className="text-muted-foreground font-medium hover:text-primary transition-colors">About</Link>
            </nav>
            <p className="text-sm text-muted-foreground">© {currentYear} All rights reserved</p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Support Line</div>
            <a href="tel:+359889869698" className="text-lg font-semibold hover:text-primary transition-colors">
              +359 889 869 698
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}