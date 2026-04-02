import { useForm } from '@tanstack/react-form'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MutationError } from '@/components/ui/mutation-error'
import { editionsQueryOptions } from '@/lib/cards/queries'
import { createSessionMutationOptions } from '@/lib/sessions/queries'
import { cn } from '@/lib/utils'
import { createSessionFormSchema } from '@/lib/validators'

export function SessionForm() {
  const router = useRouter()
  const { data: editions } = useSuspenseQuery(editionsQueryOptions())

  const baseEdition = editions.find((ed) => ed.slug === 'base')

  const createMutation = useMutation({
    ...createSessionMutationOptions(),
    onSuccess: (result) =>
      router.navigate({ to: '/sessions/$id/edit', params: { id: result.id } }),
  })

  const form = useForm({
    defaultValues: {
      name: '',
      editionIds: baseEdition?.id ? [baseEdition.id] : ([] as string[]),
      nicknames: ['', ''],
    },
    validators: { onSubmit: createSessionFormSchema },
    onSubmit: async ({ value }) => {
      const filled = value.nicknames.map((n) => n.trim()).filter(Boolean)
      createMutation.mutate({
        data: {
          name: value.name.trim(),
          editionIds: value.editionIds,
          nicknames: filled,
        },
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-5"
    >
      <form.Field name="name">
        {(field) => (
          <Input
            label="Game name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="e.g. Friday night game"
            error={field.state.meta.errors[0]?.message}
          />
        )}
      </form.Field>

      {/* Editions */}
      <form.Field name="editionIds">
        {(field) => (
          <fieldset className="fieldset">
            <label className="fieldset-label">{'Editions'}</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {editions.map((ed) => {
                const isBase = ed.slug === 'base'
                return (
                  <label
                    key={ed.id}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer select-none',
                      isBase && 'cursor-not-allowed opacity-80'
                    )}
                    aria-disabled={isBase}
                  >
                    <input
                      type="checkbox"
                      className={cn(
                        'checkbox checkbox-sm',
                        isBase && 'cursor-not-allowed'
                      )}
                      disabled={isBase}
                      aria-disabled={isBase}
                      checked={field.state.value.includes(ed.id)}
                      onChange={
                        isBase
                          ? undefined
                          : () =>
                              field.handleChange(
                                field.state.value.includes(ed.id)
                                  ? field.state.value.filter((id) => id !== ed.id)
                                  : [...field.state.value, ed.id]
                              )
                      }
                    />
                    <span className="text-sm" aria-disabled={isBase}>
                      {ed.name}
                    </span>
                  </label>
                )
              })}
            </div>
            {field.state.meta.errors[0] && (
              <p className="text-error text-sm mt-1">
                {field.state.meta.errors[0].message}
              </p>
            )}
          </fieldset>
        )}
      </form.Field>

      {/* Players */}
      <form.Field name="nicknames">
        {(field) => (
          <fieldset className="fieldset">
            <label className="fieldset-label">{'Players'}</label>
            <div className="flex flex-col gap-2 mt-1">
              {field.state.value.map((_, i) => (
                <form.Field key={i} name={`nicknames[${i}]`}>
                  {(subField) => (
                    <div className="flex items-center gap-2">
                      <input
                        className="input input-bordered flex-1"
                        placeholder={`Player ${i + 1} nickname`}
                        value={subField.state.value}
                        onChange={(e) => subField.handleChange(e.target.value)}
                        maxLength={32}
                      />
                      {field.state.value.length > 2 && (
                        <button
                          type="button"
                          onClick={() => field.removeValue(i)}
                          className="btn btn-ghost btn-sm text-error px-2"
                          aria-label="Remove player"
                        >
                          {'✕'}
                        </button>
                      )}
                    </div>
                  )}
                </form.Field>
              ))}
              {field.state.value.length < 6 && (
                <button
                  type="button"
                  onClick={() => field.pushValue('')}
                  className="btn btn-ghost btn-sm self-start"
                >
                  {'+ Add player'}
                </button>
              )}
            </div>
            {field.state.meta.errors[0] && (
              <p className="text-error text-sm mt-1">
                {field.state.meta.errors[0].message}
              </p>
            )}
          </fieldset>
        )}
      </form.Field>

      <MutationError mutation={createMutation} fallback="Failed to create game" />
      <Button type="submit" loading={createMutation.isPending}>
        {'Create game'}
      </Button>
    </form>
  )
}
