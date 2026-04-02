import { createFileRoute } from '@tanstack/react-router'

import { LoginForm } from '@/components/auth/login-form'

export const Route = createFileRoute('/(auth)/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 ">
      <div className="card w-full max-w-sm bg-base-100 shadow-sm shadow-primary">
        <div className="card-body">
          <h1 className="card-title text-2xl mb-4">{'Sign In'}</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
