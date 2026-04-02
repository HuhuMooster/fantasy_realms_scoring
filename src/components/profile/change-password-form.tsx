import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MutationError } from '@/components/ui/mutation-error'
import { changePasswordMutationOptions } from '@/lib/auth/queries'
import { changePasswordFormSchema } from '@/lib/validators'

export function ChangePasswordForm() {
  const mutation = useMutation(changePasswordMutationOptions())

  const form = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: changePasswordFormSchema,
      onChange: changePasswordFormSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(
        {
          data: {
            currentPassword: value.currentPassword,
            newPassword: value.newPassword,
          },
        },
        { onSuccess: () => form.reset() }
      )
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="card bg-base-100 p-4 flex flex-col gap-3 shadow-sm shadow-primary"
    >
      <form.Field name="currentPassword">
        {(field) => (
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]?.message}
          />
        )}
      </form.Field>

      <form.Field name="newPassword">
        {(field) => (
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]?.message}
          />
        )}
      </form.Field>

      <form.Field name="confirmPassword">
        {(field) => (
          <Input
            label="Repeat new password"
            type="password"
            autoComplete="new-password"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.errors[0]?.message}
          />
        )}
      </form.Field>

      <MutationError mutation={mutation} fallback="Failed to change password" />
      {mutation.isSuccess && (
        <p className="text-success text-sm">{'Password changed successfully.'}</p>
      )}
      <Button type="submit" loading={mutation.isPending} className="mt-1">
        {'Change password'}
      </Button>
    </form>
  )
}
