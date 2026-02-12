/**
 * Form Submission Integration Tests
 * Tests for contact form and other form workflows
 */

import React, { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

/**
 * Mock contact form component
 */
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required')
      return
    }
    if (!formData.message.trim()) {
      setError('Message is required')
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100))

      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
    } catch (err) {
      setError('Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="contact-form" noValidate>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          data-testid="input-name"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          data-testid="input-email"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          data-testid="input-message"
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div data-testid="error-message" role="alert">
          {error}
        </div>
      )}

      {submitted && (
        <div data-testid="success-message" role="status">
          Message sent successfully!
        </div>
      )}

      <button type="submit" data-testid="submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}

describe('Form Submission Integration Tests', () => {
  /**
   * Test: Can fill and submit form
   * Verifies form submission workflow
   */
  it('should fill and submit form successfully', async () => {
    render(<ContactForm />)

    // Fill form
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByTestId('input-message'), { target: { value: 'Hello, this is a test' } })

    // Verify values
    expect(screen.getByTestId('input-name')).toHaveValue('John Doe')
    expect(screen.getByTestId('input-email')).toHaveValue('john@example.com')
    expect(screen.getByTestId('input-message')).toHaveValue('Hello, this is a test')

    // Submit
    fireEvent.click(screen.getByTestId('submit-button'))

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument()
    })

    expect(screen.getByTestId('success-message')).toHaveTextContent('Message sent successfully!')
  })

  /**
   * Test: Validates required fields
   * Verifies form validation prevents empty submissions
   */
  it('should validate required fields', async () => {
    render(<ContactForm />)

    // Try to submit empty form
    fireEvent.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })

    expect(screen.getByTestId('error-message')).toHaveTextContent('Name is required')
  })

  /**
   * Test: Validates email format
   * Verifies email validation works
   */
  it('should validate email format', async () => {
    render(<ContactForm />)

    // Fill with invalid email
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByTestId('input-message'), { target: { value: 'Test message' } })

    fireEvent.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })

    expect(screen.getByTestId('error-message')).toHaveTextContent('Valid email is required')
  })

  /**
   * Test: Disables fields during submission
   * Verifies UI responds to loading state
   */
  it('should disable form during submission', async () => {
    render(<ContactForm />)

    // Fill form
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByTestId('input-message'), { target: { value: 'Test' } })

    // Submit
    fireEvent.click(screen.getByTestId('submit-button'))

    // Check button is disabled during submission
    expect(screen.getByTestId('submit-button')).toBeDisabled()

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument()
    })
  })

  /**
   * Test: Clears form after successful submission
   * Verifies form resets after submission
   */
  it('should clear form after successful submission', async () => {
    render(<ContactForm />)

    // Fill form
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByTestId('input-message'), { target: { value: 'Test message' } })

    // Submit
    fireEvent.click(screen.getByTestId('submit-button'))

    // Wait for success
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument()
    })

    // Verify form is cleared
    expect(screen.getByTestId('input-name')).toHaveValue('')
    expect(screen.getByTestId('input-email')).toHaveValue('')
    expect(screen.getByTestId('input-message')).toHaveValue('')
  })

  /**
   * Test: Can fill form multiple times
   * Verifies form can be reused
   */
  it('should allow multiple submissions', async () => {
    render(<ContactForm />)

    // First submission
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'First User' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'first@example.com' } })
    fireEvent.change(screen.getByTestId('input-message'), { target: { value: 'First message' } })

    fireEvent.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument()
    })

    // Clear success message and errors
    const form = screen.getByTestId('contact-form')
    expect(form).toBeInTheDocument()

    // Second submission
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Second User' } })
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'second@example.com' } })
    fireEvent.change(screen.getByTestId('input-message'), { target: { value: 'Second message' } })

    fireEvent.click(screen.getByTestId('submit-button'))

    // Should show success again
    await waitFor(() => {
      expect(screen.getByTestId('input-name')).toHaveValue('')
    })
  })
})
