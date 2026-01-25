/**
 * Hook for enhanced keyboard navigation
 */

import { useEffect, useCallback } from "react";

interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onHome,
    onEnd,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't interfere with input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          if (onArrowUp) {
            e.preventDefault();
            onArrowUp();
          }
          break;
        case "ArrowDown":
          if (onArrowDown) {
            e.preventDefault();
            onArrowDown();
          }
          break;
        case "ArrowLeft":
          if (onArrowLeft) {
            e.preventDefault();
            onArrowLeft();
          }
          break;
        case "ArrowRight":
          if (onArrowRight) {
            e.preventDefault();
            onArrowRight();
          }
          break;
        case "Enter":
          if (onEnter && !e.shiftKey) {
            e.preventDefault();
            onEnter();
          }
          break;
        case "Escape":
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;
        case "Home":
          if (onHome && e.ctrlKey) {
            e.preventDefault();
            onHome();
          }
          break;
        case "End":
          if (onEnd && e.ctrlKey) {
            e.preventDefault();
            onEnd();
          }
          break;
      }
    },
    [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onHome, onEnd]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
}

/**
 * Hook for list navigation (arrow keys to navigate items)
 */
export function useListNavigation<T>(
  items: T[],
  onSelect: (item: T, index: number) => void,
  options: { enabled?: boolean; initialIndex?: number } = {}
) {
  const { enabled = true, initialIndex = -1 } = options;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useKeyboardNavigation({
    enabled,
    onArrowUp: () => {
      setSelectedIndex((prev) => {
        const newIndex = prev <= 0 ? items.length - 1 : prev - 1;
        if (items[newIndex]) {
          onSelect(items[newIndex], newIndex);
        }
        return newIndex;
      });
    },
    onArrowDown: () => {
      setSelectedIndex((prev) => {
        const newIndex = prev >= items.length - 1 ? 0 : prev + 1;
        if (items[newIndex]) {
          onSelect(items[newIndex], newIndex);
        }
        return newIndex;
      });
    },
    onHome: () => {
      if (items[0]) {
        setSelectedIndex(0);
        onSelect(items[0], 0);
      }
    },
    onEnd: () => {
      if (items.length > 0) {
        const lastIndex = items.length - 1;
        setSelectedIndex(lastIndex);
        onSelect(items[lastIndex], lastIndex);
      }
    },
  });

  return { selectedIndex, setSelectedIndex };
}

import { useState } from "react";
