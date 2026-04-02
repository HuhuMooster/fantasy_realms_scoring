import { Link, createFileRoute } from '@tanstack/react-router'

import { SessionForm } from '@/components/sessions/session-form'
import { editionsQueryOptions } from '@/lib/cards/queries'

export const Route = createFileRoute('/(authed)/sessions/new')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(editionsQueryOptions())
  },
  component: NewSessionPage,
})

function NewSessionPage() {
  return (
    <div className="p-4 max-w-lg mx-auto">
      <Link to="/sessions" className="btn btn-ghost btn-sm mb-4">
        {'Games'}
      </Link>
      <h1 className="text-2xl font-bold mb-5">{'New game'}</h1>
      <SessionForm />
    </div>
  )
}
