import { Link } from 'react-router-dom'
import { RegisterForm } from '@features/auth/components/RegisterForm'
import { Card } from '@components/ui'

export const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full" padding="p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              InduService
            </h1>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-secondary-900 dark:text-white">
            ثبت‌نام در InduService
          </h2>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
              وارد شوید
            </Link>
          </p>
        </div>

        <RegisterForm />
      </Card>
    </div>
  )
}

export default RegisterPage