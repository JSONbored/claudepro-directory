import { useEffect, useState } from 'react';

// Global keyboard navigation state
let isUsingKeyboard = false;

export function FocusIndicator() {
  const [showIndicators, setShowIndicators] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show indicators when using Tab, Arrow keys, Enter, or Space
      if (
        ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)
      ) {
        if (!isUsingKeyboard) {
          isUsingKeyboard = true;
          setShowIndicators(true);
          document.body.classList.add('keyboard-navigation');
        }
      }
    };

    const handleMouseDown = () => {
      if (isUsingKeyboard) {
        isUsingKeyboard = false;
        setShowIndicators(false);
        document.body.classList.remove('keyboard-navigation');
      }
    };

    // Listen for keyboard and mouse events
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleMouseDown, true);

    // Also listen for focus events to catch programmatic focus
    document.addEventListener('focusin', () => {
      if (isUsingKeyboard) {
        setShowIndicators(true);
        document.body.classList.add('keyboard-navigation');
      }
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, []);

  useEffect(() => {
    if (showIndicators) {
      // Add CSS for focus indicators
      const style = document.createElement('style');
      style.textContent = `
        .keyboard-navigation *:focus-visible {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: 2px !important;
          border-radius: 4px;
        }
        
        .keyboard-navigation button:focus-visible,
        .keyboard-navigation [role="button"]:focus-visible {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1) !important;
        }
        
        .keyboard-navigation input:focus-visible,
        .keyboard-navigation textarea:focus-visible,
        .keyboard-navigation select:focus-visible {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: 1px !important;
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1) !important;
        }
        
        .keyboard-navigation [role="article"]:focus-visible {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1) !important;
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }
        
        .keyboard-navigation [tabindex="0"]:focus-visible {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: 2px !important;
        }
      `;
      style.id = 'keyboard-navigation-styles';
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('keyboard-navigation-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }

    return () => {
      // Cleanup function for when showIndicators is false
    };
  }, [showIndicators]);

  return null;
}

// Hook to check if keyboard navigation is active
export function useKeyboardNavigation() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkKeyboardNavigation = () => {
      setIsActive(isUsingKeyboard);
    };

    // Check initial state
    checkKeyboardNavigation();

    // Listen for changes
    const interval = setInterval(checkKeyboardNavigation, 100);

    return () => clearInterval(interval);
  }, []);

  return isActive;
}
