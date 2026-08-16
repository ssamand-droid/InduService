import { Link } from 'react-router-dom'
import { FiHome, FiArrowRight } from 'react-icons/fi'
import { Button } from '@components/ui'

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">۴۰۴</h1>
        <h2 className="mt-4 text-3xl font-bold text-secondary-900 dark:text-white">
          صفحه مورد نظر یافت نشد
        </h2>
        <p className="mt-2 text-secondary-600 dark:text-secondary-400">
          متاسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد.
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button variant="primary" size="lg">
              بازگشت به صفحه اصلی
              <FiArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage