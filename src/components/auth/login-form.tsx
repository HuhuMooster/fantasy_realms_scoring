import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MutationError } from '@/components/ui/mutation-error'
import { authQueryOptions, loginMutationOptions } from '@/lib/auth/queries'
import { loginFormSchema } from '@/lib/validators'

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    ...loginMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryOptions().queryKey })
      router.navigate({ to: '/' })
    },
  })

  const form = useForm({
    defaultValues: { username: '', password: '' },
    validators: { onSubmit: loginFormSchema, onChange: loginFormSchema },
    onSubmit: async ({ value }) => {
      loginMutation.mutate({ data: value })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-3"
    >
      <form.Field name="username">
        {(field) => (
          <Input
            label="Username"
            autoComplete="username"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]?.message}
          />
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]?.message}
          />
        )}
      </form.Field>

      <MutationError mutation={loginMutation} fallback="Login failed" />
      <Button type="submit" loading={loginMutation.isPending} className="mt-2">
        {'Sign In'}
      </Button>
      <p className="text-center text-sm text-base-content/60">
        {'No account? '}
        <Link to="/register" className="link link-primary">
          {'Register'}
        </Link>
      </p>
    </form>
  )
}
