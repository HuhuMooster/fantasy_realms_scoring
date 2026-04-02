import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MutationError } from '@/components/ui/mutation-error'

describe('MutationError', () => {
  it('renders nothing when isError is false', () => {
    const { container } = render(
      <MutationError
        mutation={{ isError: false, error: null }}
        fallback="Something went wrong"
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the error message when error is an Error instance', () => {
    render(
      <MutationError
        mutation={{ isError: true, error: new Error('Bad credentials') }}
        fallback="Fallback text"
      />
    )
    expect(screen.getByText('Bad credentials')).toBeInTheDocument()
  })

  it('renders the fallback string when error is not an Error instance', () => {
    render(
      <MutationError
        mutation={{ isError: true, error: 'raw string' }}
        fallback="Generic error"
      />
    )
    expect(screen.getByText('Generic error')).toBeInTheDocument()
  })

  it('renders the fallback when error is null', () => {
    render(
      <MutationError
        mutation={{ isError: true, error: null }}
        fallback="Null fallback"
      />
    )
    expect(screen.getByText('Null fallback')).toBeInTheDocument()
  })
})
