# Testing Guide - Sri Portfolio

## Overview

This document describes the testing infrastructure and patterns used in the Sri Portfolio project. We use **Jest** and **React Testing Library** for comprehensive test coverage of critical functionality.

## Quick Start

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are organized by type in the `app/__tests__/` directory:

```
app/__tests__/
├── components/          # Component rendering tests
│   ├── AboutSection.test.js
│   ├── ProjectsSection.test.js
│   ├── SkillsSection.test.js
│   └── TabButton.test.js
├── hooks/               # Custom hook tests
│   ├── useNavigation.test.js
│   └── useSettings.test.js
├── integration/         # Full workflow tests
│   ├── navigation.test.js
│   └── form-submission.test.js
└── navigation.test.js   # Navigation unit tests
```

## Test Categories

### 1. Navigation Tests (`app/__tests__/navigation.test.js`)

Tests core navigation functionality:
- ✅ Section navigation (home → about → projects → skills)
- ✅ Tab switching within sections
- ✅ Navigation history tracking
- ✅ Back/forward button functionality

**Test count: 4 test cases**

### 2. Component Rendering Tests (`app/__tests__/components/`)

#### AboutSection Tests
- ✅ Renders with correct content
- ✅ Tab buttons have correct state
- ✅ Tab switching works
- ✅ Buttons are accessible

#### ProjectsSection Tests
- ✅ Renders projects list
- ✅ Displays all projects by default
- ✅ Can switch to deployed projects
- ✅ Tab states are correct

#### SkillsSection Tests
- ✅ Renders skills view
- ✅ Displays skills overview initially
- ✅ Can switch to GitHub stats
- ✅ Tab states are correct

#### TabButton Tests
- ✅ Active state displays correctly
- ✅ Inactive state displays correctly
- ✅ Click handler is called
- ✅ State switching works
- ✅ Accessibility attributes are correct
- ✅ Multiple buttons work in tab group

**Test count: 18 test cases**

### 3. Hook Tests (`app/__tests__/hooks/`)

#### useNavigation Tests
- ✅ Returns correct initial values
- ✅ Can update active section
- ✅ Can update active tab
- ✅ Independent state management
- ✅ Section state persists across tab changes
- ✅ Handles multiple state transitions

#### useSettings Tests
- ✅ Returns correct initial settings
- ✅ Can toggle sound setting
- ✅ Can toggle music setting
- ✅ Can set arbitrary settings
- ✅ Settings persist across toggles
- ✅ Multiple toggles work independently
- ✅ Can batch update settings

**Test count: 13 test cases**

### 4. Integration Tests (`app/__tests__/integration/`)

#### Navigation Integration
- ✅ Full page navigation flow
- ✅ Navigation buttons show correct active state
- ✅ Tab switching updates content
- ✅ Tab state resets when changing sections
- ✅ Complex navigation sequences
- ✅ Rapid navigation changes

#### Form Submission Integration
- ✅ Can fill and submit form
- ✅ Validates required fields
- ✅ Validates email format
- ✅ Disables fields during submission
- ✅ Clears form after successful submission
- ✅ Allows multiple submissions

**Test count: 12 test cases**

## Writing New Tests

### Basic Test Pattern

```javascript
import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

describe('Feature Name', () => {
  it('should do something', () => {
    // 1. Render component
    render(<MyComponent />)

    // 2. Query for elements using accessible queries
    const element = screen.getByRole('button', { name: /click me/i })

    // 3. Interact with elements
    fireEvent.click(element)

    // 4. Assert expected outcome
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

### Recommended Queries (in order of preference)

```javascript
// Best: Use semantic queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByPlaceholderText('Enter name')
screen.getByDisplayValue('John')

// Good: Use test IDs when necessary
screen.getByTestId('submit-button')

// Avoid: querySelector and other implementation details
screen.getByText('Click me')  // Only if no better option
```

### Testing User Interactions

```javascript
it('should handle button click', () => {
  render(<MyComponent />)
  
  const button = screen.getByRole('button')
  fireEvent.click(button)
  
  expect(screen.getByText('Clicked')).toBeInTheDocument()
})
```

### Testing Forms

```javascript
it('should submit form with data', () => {
  render(<ContactForm />)
  
  fireEvent.change(screen.getByLabelText('Name'), { 
    target: { value: 'John' } 
  })
  fireEvent.change(screen.getByLabelText('Email'), { 
    target: { value: 'john@example.com' } 
  })
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

### Testing Hooks

```javascript
import { renderHook, act } from '@testing-library/react'

it('should update state', () => {
  const { result } = renderHook(() => useMyHook())
  
  act(() => {
    result.current.setValue('new value')
  })
  
  expect(result.current.value).toBe('new value')
})
```

### Testing Async Operations

```javascript
import { waitFor } from '@testing-library/react'

it('should load data', async () => {
  render(<DataComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

## Mock Data Utilities

The `test-utils.jsx` file provides helpful mock data generators:

```javascript
import { mockData } from '../test-utils'

// Generate mock project
const project = mockData.mockProject()

// Generate multiple projects
const projects = mockData.mockProjects(5)

// Generate mock skills
const skills = mockData.mockSkills(3)

// Generate navigation state
const nav = mockData.mockNavigation()

// Generate settings
const settings = mockData.mockSettings()
```

## Accessibility Testing

Always test using accessible queries:

```javascript
it('should have accessible buttons', () => {
  render(<MyComponent />)
  
  // Use role-based queries
  const button = screen.getByRole('button', { name: /action/i })
  expect(button).toBeInTheDocument()
  
  // Verify ARIA attributes
  expect(button).toHaveAttribute('aria-selected')
})
```

## Best Practices

### ✅ DO

- Test **behavior**, not implementation
- Use semantic HTML queries (role, label, placeholder)
- Test from user perspective
- Keep tests focused and readable
- Use descriptive test names
- Test accessibility
- Mock external services (APIs, emailjs, etc.)
- Use `data-testid` only when necessary

### ❌ DON'T

- Test internal state directly
- Use class names or element attributes for queries
- Mock more than necessary
- Use `waitFor` for everything (prefer stable queries)
- Create snapshot tests (they're brittle)
- Test implementation details
- Skip accessibility testing

## Common Test Scenarios

### Tab/Section Navigation

```javascript
it('should switch tabs', () => {
  function Wrapper() {
    const [activeTab, setActiveTab] = useState('profile')
    return (
      <div>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
        <div>{activeTab}</div>
      </div>
    )
  }
  
  render(<Wrapper />)
  fireEvent.click(screen.getByText('Settings'))
  expect(screen.getByText('settings')).toBeInTheDocument()
})
```

### Form Validation

```javascript
it('should validate required fields', () => {
  render(<Form />)
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(screen.getByText('Name is required')).toBeInTheDocument()
})
```

### State Persistence

```javascript
it('should persist state', () => {
  const { result } = renderHook(() => useSettings())
  
  act(() => {
    result.current.setSetting('theme', 'light')
  })
  
  act(() => {
    result.current.toggleSound()
  })
  
  expect(result.current.settings.theme).toBe('light')
  expect(result.current.settings.soundEnabled).toBe(false)
})
```

## Coverage Reporting

Generate a detailed coverage report:

```bash
npm run test:coverage
```

This creates a coverage report showing:
- **Statements**: % of code statements executed
- **Branches**: % of conditional branches tested
- **Functions**: % of functions called
- **Lines**: % of code lines executed

## Continuous Integration

Tests automatically run before commits via git hooks. To run tests manually:

```bash
npm test
```

## Debugging Tests

### Run Single Test File

```bash
npm test -- navigation.test.js
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should navigate"
```

### Debug Output

```bash
npm test -- --verbose
```

### Watch Mode

```bash
npm run test:watch
```

## Next Steps (Phase 2)

- Add tests for real component implementations
- Test integration with external APIs (EmailJS, GitHub)
- Add E2E tests with Cypress or Playwright
- Achieve 50%+ code coverage
- Add performance benchmarks

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessible Queries](https://testing-library.com/docs/queries/about)

## Questions?

Refer to test files in `app/__tests__/` for concrete examples of each pattern.
