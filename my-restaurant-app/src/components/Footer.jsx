import { Link } from 'react-router-dom'
import { t } from '@/utils/translations'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-black text-white">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">

            <span className="text-2xl font-bold tracking-tight text-white">Pantastic®</span>
          </div>

          <div className="flex flex-col items-center gap-4">
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link to="/" className="text-gray-300 font-medium hover:text-white transition-colors">{t('nav.home')}</Link>
              <Link to="/food" className="text-gray-300 font-medium hover:text-white transition-colors">{t('nav.food')}</Link>
              <Link to="/about" className="text-gray-300 font-medium hover:text-white transition-colors">{t('nav.about')}</Link>
            </nav>
            <nav className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Политика за поверителност</Link>
              <Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Общи условия</Link>
              <Link to="/eula" className="text-gray-400 hover:text-white transition-colors">EULA</Link>
            </nav>
            <p className="text-sm text-gray-400">© {currentYear} {t('footer.allRightsReserved')}</p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">{t('footer.phone')}</div>
            <a href="tel:+359889869698" className="text-lg font-semibold text-white hover:text-gray-200 transition-colors">
              +359 889 869 698
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}