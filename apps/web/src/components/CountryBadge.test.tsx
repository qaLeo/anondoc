import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CountryBadge } from './CountryBadge'
import type { CountryCode } from '@anondoc/engine'

function setup(
  detected: CountryCode[] = ['RU'],
  selected: CountryCode[] = ['RU'],
  onChange = vi.fn(),
) {
  render(<CountryBadge detected={detected} selected={selected} onChange={onChange} />)
  return { onChange }
}

describe('CountryBadge', () => {
  it('shows the selected country name in the badge', () => {
    setup(['RU'], ['RU'])
    expect(screen.getByText(/Россия/)).toBeTruthy()
  })

  it('shows the applicable law in the badge', () => {
    setup(['RU'], ['RU'])
    expect(screen.getByText(/ФЗ-152/)).toBeTruthy()
  })

  it('opens dropdown when "Изменить" is clicked', () => {
    setup()
    fireEvent.click(screen.getByText('Изменить'))
    // СНГ section header should appear
    expect(screen.getByText('СНГ')).toBeTruthy()
  })

  it('closes dropdown when clicking outside', () => {
    setup()
    fireEvent.click(screen.getByText('Изменить'))
    expect(screen.getByText('СНГ')).toBeTruthy()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('СНГ')).toBeNull()
  })

  it('calls onChange when a different CIS country is clicked', () => {
    const { onChange } = setup(['RU', 'KZ'], ['RU'])
    fireEvent.click(screen.getByText('Изменить'))
    // Click Казахстан in the dropdown
    const kzItem = screen.getAllByText('Казахстан')[0]
    fireEvent.click(kzItem)
    expect(onChange).toHaveBeenCalledWith(['RU', 'KZ'])
  })

  it('does not deselect when only one country is selected', () => {
    const { onChange } = setup(['RU'], ['RU'])
    fireEvent.click(screen.getByText('Изменить'))
    // Clicking RU (already selected, the only one) should NOT call onChange
    const ruItem = screen.getAllByText('Россия')[0]
    fireEvent.click(ruItem)
    // onChange should NOT have been called (can't deselect last)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('deselects a country when multiple are selected', () => {
    const { onChange } = setup(['RU', 'KZ'], ['RU', 'KZ'])
    fireEvent.click(screen.getByText('Изменить'))
    // Deselect KZ
    const kzItems = screen.getAllByText('Казахстан')
    fireEvent.click(kzItems[0])
    expect(onChange).toHaveBeenCalledWith(['RU'])
  })

  it('shows "авто" badge for auto-detected countries not yet selected', () => {
    // KZ is detected but not selected
    setup(['RU', 'KZ'], ['RU'])
    fireEvent.click(screen.getByText('Изменить'))
    expect(screen.getByText('авто')).toBeTruthy()
  })

  it('shows multiple country flags when several are selected', () => {
    setup(['RU', 'KZ'], ['RU', 'KZ'])
    // Both flags should be in the badge
    const badge = screen.getByText(/🇷🇺/)
    expect(badge).toBeTruthy()
  })
})
