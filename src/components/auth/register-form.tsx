import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MutationError } from '@/components/ui/mutation-error'
import { registerMutationOptions } from '@/lib/auth/queries'
import { registerFormSchema } from '@/lib/validators'

export function RegisterForm() {
  const router = useRouter()

  const registerMutation = useMutation({
    ...registerMutationOptions(),
    onSuccess: () => router.navigate({ to: '/' }),
  })

  const form = useForm({
    defaultValues: { username: '', password: '', inviteCode: '' },
    validators: { onSubmit: registerFormSchema, onChange: registerFormSchema },
    onSubmit: async ({ value }) => {
      registerMutation.mutate({ data: value })
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
            autoComplete="new-password"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]?.message}
          />
        )}
      </form.Field>

      <form.Field name="inviteCode">
        {(field) => (
          <Input
            label="Invite Code"
            placeholder="8-character code"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]?.message}
          />
        )}
      </form.Field>

      <MutationError mutation={registerMutation} fallback="Registration failed" />
      <Button type="submit" loading={registerMutation.isPending} className="mt-2">
        {'Create Account'}
      </Button>
      <p className="text-center text-sm text-base-content/60">
        {'Already have an account? '}
        <Link to="/login" className="link link-primary">
          {'Sign in'}
        </Link>
      </p>
    </form>
  )
}
