---
name: UI/UX Design & Implementation
description: Comprehensive UI/UX design, prototyping, and implementation skill for creating beautiful, accessible, and user-friendly interfaces
---

# UI/UX Design & Implementation Skill

## Purpose
This skill guides you through the complete UI/UX design and implementation process, from user research to final implementation, ensuring beautiful, accessible, and user-friendly interfaces.

## When to Use This Skill
- Designing new features or pages
- Improving existing user interfaces
- Conducting usability reviews
- Creating design systems and component libraries
- Implementing responsive designs
- Ensuring accessibility compliance

## Workflow

### 1. Research & Discovery
**Objective**: Understand user needs and context

- **Analyze User Requirements**
  - Review user stories and feature requests
  - Identify target users and their goals
  - Document pain points in current design (if applicable)
  
- **Competitive Analysis**
  - Research similar features in competitor products
  - Identify best practices and design patterns
  - Note what works well and what doesn't

- **Technical Constraints**
  - Review existing design system and components
  - Identify technical limitations
  - Check browser/device support requirements

### 2. Design Planning
**Objective**: Create a clear design strategy

- **Information Architecture**
  - Map out user flows and navigation
  - Define content hierarchy
  - Plan responsive breakpoints

- **Design Principles**
  - Consistency: Use existing design tokens and patterns
  - Clarity: Ensure clear visual hierarchy
  - Feedback: Provide clear user feedback for actions
  - Accessibility: Follow WCAG 2.1 AA standards
  - Performance: Optimize for fast load times

### 3. Visual Design
**Objective**: Create beautiful and functional designs

- **Color & Typography**
  - Use consistent color palette from design system
  - Ensure sufficient color contrast (4.5:1 for text)
  - Apply typography scale consistently
  - Use semantic colors (success, error, warning, info)

- **Layout & Spacing**
  - Apply consistent spacing scale (4px, 8px, 16px, 24px, 32px, etc.)
  - Use grid systems for alignment
  - Ensure proper whitespace and breathing room
  - Design for multiple screen sizes

- **Components & Patterns**
  - Reuse existing components when possible
  - Create new components following design system guidelines
  - Document component variants and states
  - Consider hover, focus, active, and disabled states

### 4. Interaction Design
**Objective**: Create smooth and intuitive interactions

- **Micro-interactions**
  - Add hover effects for interactive elements
  - Implement smooth transitions (200-300ms for most UI)
  - Provide loading states for async operations
  - Show success/error feedback clearly

- **Animations**
  - Use subtle animations to guide attention
  - Ensure animations are performant (use transform/opacity)
  - Provide reduced motion alternatives
  - Keep animations under 500ms for UI feedback

### 5. Accessibility
**Objective**: Ensure inclusive design for all users

- **Semantic HTML**
  - Use proper heading hierarchy (h1 → h2 → h3)
  - Use semantic elements (nav, main, article, etc.)
  - Ensure proper form labels and ARIA attributes

- **Keyboard Navigation**
  - Ensure all interactive elements are keyboard accessible
  - Provide visible focus indicators
  - Implement logical tab order
  - Support common keyboard shortcuts

- **Screen Reader Support**
  - Add descriptive alt text for images
  - Use ARIA labels for icon-only buttons
  - Provide skip links for navigation
  - Test with screen readers (NVDA, JAWS, VoiceOver)

- **Color & Contrast**
  - Ensure 4.5:1 contrast for normal text
  - Ensure 3:1 contrast for large text and UI components
  - Don't rely on color alone to convey information

### 6. Responsive Design
**Objective**: Ensure great experience across all devices

- **Breakpoints** (recommended)
  - Mobile: 320px - 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px+
  - Large Desktop: 1440px+

- **Mobile-First Approach**
  - Design for mobile first, then enhance for larger screens
  - Use flexible layouts (flexbox, grid)
  - Ensure touch targets are at least 44x44px
  - Test on real devices when possible

### 7. Implementation
**Objective**: Build the design with clean, maintainable code

- **CSS Architecture**
  - Use CSS custom properties for theming
  - Follow BEM or similar naming convention
  - Keep specificity low
  - Organize styles logically (layout → components → utilities)

- **Component Structure**
  - Create reusable, composable components
  - Separate concerns (structure, style, behavior)
  - Document props and usage
  - Include TypeScript types

- **Performance**
  - Optimize images (use WebP, lazy loading)
  - Minimize CSS and JavaScript
  - Use CSS containment for complex layouts
  - Avoid layout thrashing

### 8. Testing & Validation
**Objective**: Ensure quality and consistency

- **Visual Testing**
  - Test in multiple browsers (Chrome, Firefox, Safari, Edge)
  - Test on different screen sizes
  - Verify design matches mockups
  - Check for visual bugs and inconsistencies

- **Functional Testing**
  - Test all interactive elements
  - Verify form validation
  - Test error states
  - Ensure smooth animations

- **Accessibility Testing**
  - Run automated tests (axe, Lighthouse)
  - Test keyboard navigation
  - Test with screen readers
  - Verify color contrast

- **Performance Testing**
  - Run Lighthouse audit
  - Check Core Web Vitals
  - Test on slow networks
  - Optimize based on results

## Design System Reference

### Color Tokens
```css
/* Primary Colors */
--color-primary: #your-primary-color;
--color-primary-hover: #your-primary-hover;
--color-primary-active: #your-primary-active;

/* Semantic Colors */
--color-success: #10b981;
--color-error: #ef4444;
--color-warning: #f59e0b;
--color-info: #3b82f6;

/* Neutral Colors */
--color-text-primary: #111827;
--color-text-secondary: #6b7280;
--color-border: #e5e7eb;
--color-background: #ffffff;
```

### Spacing Scale
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### Typography Scale
```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 30px;
```

## Common Patterns

### Form Design
- Group related fields together
- Provide clear labels and placeholders
- Show validation errors inline
- Disable submit button during processing
- Show success message after submission

### Table Design
- Use zebra striping for readability
- Provide sorting and filtering
- Show loading states
- Handle empty states gracefully
- Make responsive (stack on mobile)

### Modal Design
- Darken background with overlay
- Center modal on screen
- Provide clear close button
- Trap focus within modal
- Close on ESC key or overlay click

### Button Hierarchy
- Primary: Main action (filled, high contrast)
- Secondary: Alternative action (outlined)
- Tertiary: Low priority action (text only)
- Destructive: Dangerous action (red)

## Deliverables

When completing a UI/UX task, provide:

1. **Design Rationale**: Explain design decisions
2. **Component Documentation**: Document new components
3. **Accessibility Notes**: Highlight accessibility features
4. **Browser Support**: Note any browser-specific considerations
5. **Screenshots/Recordings**: Show the final result

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Inclusive Components](https://inclusive-components.design/)
- [Web.dev Accessibility](https://web.dev/accessibility/)
