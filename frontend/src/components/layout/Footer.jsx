import { Link } from 'react-router-dom'
import { FiMail, FiPhone, FiMapPin, FiShield, FiTruck } from 'react-icons/fi'
import { useAuthStore } from '@stores/authStore'
import { PROVIDER_ROLES } from '@lib/constants'

export const Footer = () => {
  const user = useAuthStore((state) => state.user)
  const isProvider = PROVIDER_ROLES.includes(user?.role)
  return (
    <footer className="bg-secondary-50 dark:bg-secondary-900/50 border-t border-secondary-200 dark:border-secondary-800 mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              InduService
            </Link>
            <p className="mt-3 text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed">
              مارکت‌پلیس تخصصی خدمات صنعتی و MRO. تامین قطعات یدکی، تعمیرات تخصصی و اورهال تجهیزات.
            </p>
            <div className="flex gap-2 mt-4">
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                <FiShield className="h-3 w-3" /> پرداخت امن
              </span>
              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                <FiTruck className="h-3 w-3" /> ارسال سریع
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-4">خدمات</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600">خدمات MRO</Link></li>
              <li><Link to="/products" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600">محصولات صنعتی</Link></li>
              {!isProvider && (
                <li><Link to="/request-service" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600">درخواست خدمت</Link></li>
              )}
              <li><Link to="/blog" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600">وبلاگ تخصصی</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-4">پشتیبانی</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600">درباره ما</Link></li>
              <li><Link to="/contact" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600">تماس با ما</Link></li>
              <li><Link to="/terms" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600">قوانین و مقررات</Link></li>
              <li><Link to="/privacy" className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600">حریم خصوصی</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-4">تماس</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                <FiPhone className="h-4 w-4 text-primary-500" />
                <span>021-88309231</span>
              </li>
              <li className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                <FiMail className="h-4 w-4 text-primary-500" />
                <span>info@induservice.pro</span>
              </li>
              <li className="flex items-start gap-2 text-secondary-600 dark:text-secondary-400">
                <FiMapPin className="h-4 w-4 text-primary-500 mt-0.5" />
                <span>تهران، خیابان مطهری، خیابان سلیمان خاطر</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-secondary-200 dark:border-secondary-800 text-center">
          <p className="text-sm text-secondary-500 dark:text-secondary-500">
            © {new Date().getFullYear()} InduService. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  )
}