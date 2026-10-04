import { useState, useRef, useEffect } from 'react';

/**
 * Reusable Global Custom Dropdown component.
 * Replaces native OS <select> with a sleek, accessible, high-end popover.
 *
 * @param {Object} props
 * @param {string|number} props.value - Selected option value
 * @param {Function} props.onChange - Selection change callback
 * @param {Array<{value: string|number, label: string, dot?: string, badge?: string, icon?: React.ReactNode}>} props.options - Option list
 * @param {string} [props.placeholder] - Fallback placeholder text
 * @param {React.ReactNode} [props.prefixIcon] - Icon to display on left of trigger
 * @param {string} [props.ariaLabel] - Accessibility label
 * @param {string} [props.className] - Optional custom CSS class
 * @param {'left'|'right'} [props.align='left'] - Popover alignment
 * @param {'sm'|'md'} [props.size='md'] - Sizing variant
 */
export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  prefixIcon = null,
  ariaLabel = 'Select option',
  className = '',
  align = 'left',
  size = 'md',
  direction = 'down',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown-container ${className} size-${size} ${isOpen ? 'is-open' : ''}`}
    >
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="dropdown-trigger-content">
          {prefixIcon && <span className="dropdown-prefix-icon">{prefixIcon}</span>}
          {selectedOption?.dot && (
            <span
              className="dropdown-option-dot"
              style={{ backgroundColor: selectedOption.dot }}
            ></span>
          )}
          <span className="dropdown-trigger-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <svg
          className={`dropdown-chevron ${isOpen ? 'chevron-rotated' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className={`custom-dropdown-menu align-${align} direction-${direction}`} role="listbox">
          <div className="custom-dropdown-menu-inner">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  className={`custom-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="dropdown-item-left">
                    {option.dot && (
                      <span
                        className="dropdown-option-dot"
                        style={{ backgroundColor: option.dot }}
                      ></span>
                    )}
                    {option.icon && <span className="dropdown-item-icon">{option.icon}</span>}
                    <span className="dropdown-item-label">{option.label}</span>
                  </div>

                  <div className="dropdown-item-right">
                    {option.badge && <span className="dropdown-item-badge">{option.badge}</span>}
                    {isSelected && (
                      <svg
                        className="dropdown-check-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
