import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { describe, expect, it, vi } from 'vitest'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

function OnlineProbe() {
  const { isOnline } = useOnlineStatus()
  return <div>{isOnline ? 'online' : 'offline'}</div>
}

describe('useOnlineStatus', () => {
  it('refleja el estado inicial del navegador', () => {
    vi.stubGlobal('navigator', { onLine: true })
    render(<OnlineProbe />)
    expect(screen.getByText('online')).toBeInTheDocument()
  })
})
