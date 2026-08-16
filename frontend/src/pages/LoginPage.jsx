import { Link } from 'react-router-dom'
import { LoginForm } from '@features/auth/components/LoginForm'
import { Card } from '@components/ui'

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full" padding="p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              InduService
            </h1>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-secondary-900 dark:text-white">
            ورود به حساب کاربری
          </h2>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            حساب کاربری ندارید؟{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
              ثبت‌نام کنید
            </Link>
          </p>
        </div>

        <LoginForm />
      </Card>
    </div>
  )
}

export default LoginPage