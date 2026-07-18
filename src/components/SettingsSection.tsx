import type { ReactNode } from 'react'

type SettingsSectionProps = {
  id: string
  icon: string
  title: string
  description?: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
  badge?: string
}

function SettingsSection({
  id,
  icon,
  title,
  description,
  isOpen,
  onToggle,
  children,
  badge,
}: SettingsSectionProps) {
  return (
    <section
      className={`settings-section${isOpen ? ' settings-section--open' : ''}`}
    >
      <button
        type="button"
        className="settings-section__trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
      >
        <span className="settings-section__icon" aria-hidden="true">
          {icon}
        </span>

        <span className="settings-section__heading">
          <span className="settings-section__title-row">
            <span className="settings-section__title">{title}</span>

            {badge && <span className="settings-section__badge">{badge}</span>}
          </span>

          {description && (
            <span className="settings-section__description">{description}</span>
          )}
        </span>

        <span
          className="settings-section__arrow"
          aria-hidden="true"
        >
          {isOpen ? '⌃' : '›'}
        </span>
      </button>

      {isOpen && (
        <div
          id={`${id}-content`}
          className="settings-section__content"
        >
          {children}
        </div>
      )}
    </section>
  )
}

export default SettingsSection