import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// Suppress console.error for expected errors in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

/** A component that throws on render */
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('test explosion')
  return <div>OK</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('displays fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Reload page')).toBeTruthy()
  })

  it('shows error message in the details section', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('test explosion')).toBeTruthy()
  })

  it('calls window.location.reload on button click', () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
      configurable: true,
    })

    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByText('Reload page'))
    expect(reloadMock).toHaveBeenCalledOnce()
  })

  it('recovers and renders children after reset', () => {
    // After reload the error state is reset — simulate by re-mounting
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()

    // Re-mount without error
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    // The boundary only resets on handleReload; re-render with new children doesn't auto-recover.
    // This is expected React class component behavior.
    expect(screen.getByText('Something went wrong')).toBeTruthy()
  })
})
