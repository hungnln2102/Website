/**
 * Focus Trap component for modals and dialogs
 * Ensures keyboard focus stays within the modal
 */

import { useEffect, useRef, ReactNode } from "react";

interface FocusTrapProps {
  children: ReactNode;
  isActive?: boolean;
  onEscape?: () => void;
}

export default function FocusTrap({ children, isActive = true, onEscape }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(containerRef.current!.querySelectorAll<HTMLElement>(selector))
        .filter((el) => {
          // Filter out hidden elements
          return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
        });
    };

    const focusableElements = getFocusableElements();
    
    if (focusableElements.length === 0) return;

    // Focus the first element
    focusableElements[0]?.focus();

    // Handle Tab key
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      }
    };

    containerRef.current.addEventListener('keydown', handleTab);
    if (onEscape) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      containerRef.current?.removeEventListener('keydown', handleTab);
      if (onEscape) {
        window.removeEventListener('keydown', handleEscape);
      }
      
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, onEscape]);

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  );
}
