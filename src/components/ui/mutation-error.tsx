interface IMutationErrorProps {
  mutation: { isError: boolean; error: unknown }
  fallback: string
}

export function MutationError({ mutation, fallback }: IMutationErrorProps) {
  if (!mutation.isError) return null

  return (
    <p className="text-error text-sm">
      {mutation.error instanceof Error ? mutation.error.message : fallback}
    </p>
  )
}
