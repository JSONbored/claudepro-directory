/**
 * Form Test Helpers
 *
 * Reusable utilities for testing form interactions and validation.
 * Provides type-safe helpers for common form testing scenarios.
 *
 * **Features:**
 * - Form submission helpers
 * - Validation error testing
 * - Multi-step form navigation
 * - File upload testing
 * - Form state management
 *
 * @module tests/utils/form-helpers
 */

import type { RenderResult } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

// =============================================================================
// Form Filling Helpers
// =============================================================================

/**
 * Fill text input by label
 *
 * Finds input by label text (most accessible) and fills it with value.
 *
 * @param container - Render result from @testing-library/react
 * @param labelText - Label text to find input
 * @param value - Value to fill
 *
 * @example
 * ```tsx
 * const { container } = render(<Form />)
 * await fillInputByLabel(container, 'Email', 'test@example.com')
 * ```
 */
export async function fillInputByLabel(
  container: RenderResult | HTMLElement,
  labelText: string,
  value: string
): Promise<void> {
  const user = userEvent.setup();
  const renderResult = 'getByLabelText' in container ? container : null;

  if (!renderResult) {
    throw new Error('fillInputByLabel requires RenderResult from @testing-library/react');
  }

  const input = renderResult.getByLabelText(labelText);
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Fill text input by placeholder
 *
 * @param container - Render result
 * @param placeholder - Placeholder text
 * @param value - Value to fill
 */
export async function fillInputByPlaceholder(
  container: RenderResult,
  placeholder: string,
  value: string
): Promise<void> {
  const user = userEvent.setup();
  const input = container.getByPlaceholderText(placeholder);
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Fill text input by test ID
 *
 * @param container - Render result
 * @param testId - Data-testid attribute value
 * @param value - Value to fill
 */
export async function fillInputByTestId(
  container: RenderResult,
  testId: string,
  value: string
): Promise<void> {
  const user = userEvent.setup();
  const input = container.getByTestId(testId);
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Fill multiple form fields at once
 *
 * @param container - Render result
 * @param fields - Object mapping label text to values
 *
 * @example
 * ```tsx
 * await fillFormFields(container, {
 *   'Email': 'test@example.com',
 *   'Password': 'secure123',
 *   'Name': 'John Doe'
 * })
 * ```
 */
export async function fillFormFields(
  container: RenderResult,
  fields: Record<string, string>
): Promise<void> {
  for (const [label, value] of Object.entries(fields)) {
    await fillInputByLabel(container, label, value);
  }
}

// =============================================================================
// Form Interaction Helpers
// =============================================================================

/**
 * Select option from dropdown by label
 *
 * @param container - Render result
 * @param labelText - Label text for select element
 * @param optionText - Option text to select
 */
export async function selectOptionByLabel(
  container: RenderResult,
  labelText: string,
  optionText: string
): Promise<void> {
  const user = userEvent.setup();
  const select = container.getByLabelText(labelText);
  await user.selectOptions(select, optionText);
}

/**
 * Check checkbox by label
 *
 * @param container - Render result
 * @param labelText - Label text for checkbox
 */
export async function checkCheckboxByLabel(
  container: RenderResult,
  labelText: string
): Promise<void> {
  const user = userEvent.setup();
  const checkbox = container.getByLabelText(labelText);
  await user.click(checkbox);
}

/**
 * Uncheck checkbox by label
 *
 * @param container - Render result
 * @param labelText - Label text for checkbox
 */
export async function uncheckCheckboxByLabel(
  container: RenderResult,
  labelText: string
): Promise<void> {
  const user = userEvent.setup();
  const checkbox = container.getByLabelText(labelText);

  // Only click if currently checked
  if ((checkbox as HTMLInputElement).checked) {
    await user.click(checkbox);
  }
}

/**
 * Select radio button by label
 *
 * @param container - Render result
 * @param labelText - Label text for radio button
 */
export async function selectRadioByLabel(
  container: RenderResult,
  labelText: string
): Promise<void> {
  const user = userEvent.setup();
  const radio = container.getByLabelText(labelText);
  await user.click(radio);
}

/**
 * Upload file to file input
 *
 * @param container - Render result
 * @param labelText - Label text for file input
 * @param file - File to upload (can be created with new File())
 *
 * @example
 * ```tsx
 * const file = new File(['content'], 'test.txt', { type: 'text/plain' })
 * await uploadFile(container, 'Upload File', file)
 * ```
 */
export async function uploadFile(
  container: RenderResult,
  labelText: string,
  file: File
): Promise<void> {
  const user = userEvent.setup();
  const input = container.getByLabelText(labelText);
  await user.upload(input, file);
}

// =============================================================================
// Form Submission Helpers
// =============================================================================

/**
 * Submit form by clicking submit button
 *
 * @param container - Render result
 * @param buttonText - Submit button text (defaults to 'Submit')
 *
 * @example
 * ```tsx
 * await submitFormByButton(container, 'Create Account')
 * ```
 */
export async function submitFormByButton(
  container: RenderResult,
  buttonText = 'Submit'
): Promise<void> {
  const user = userEvent.setup();
  const submitButton = container.getByRole('button', { name: buttonText });
  await user.click(submitButton);
}

/**
 * Submit form by pressing Enter key
 *
 * @param container - Render result
 * @param inputLabel - Label of input to press Enter in
 */
export async function submitFormByEnter(
  container: RenderResult,
  inputLabel: string
): Promise<void> {
  const user = userEvent.setup();
  const input = container.getByLabelText(inputLabel);
  await user.type(input, '{Enter}');
}

/**
 * Fill and submit form in one action
 *
 * @param container - Render result
 * @param fields - Form fields to fill
 * @param buttonText - Submit button text
 *
 * @example
 * ```tsx
 * await fillAndSubmitForm(container, {
 *   'Email': 'test@example.com',
 *   'Password': 'secure123'
 * }, 'Sign In')
 * ```
 */
export async function fillAndSubmitForm(
  container: RenderResult,
  fields: Record<string, string>,
  buttonText = 'Submit'
): Promise<void> {
  await fillFormFields(container, fields);
  await submitFormByButton(container, buttonText);
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Expect validation error message to be displayed
 *
 * @param container - Render result
 * @param errorText - Expected error message text
 *
 * @example
 * ```tsx
 * await expectValidationError(container, 'Email is required')
 * ```
 */
export async function expectValidationError(
  container: RenderResult,
  errorText: string | RegExp
): Promise<void> {
  const error = await container.findByText(errorText);
  expect(error).toBeInTheDocument();
  expect(error).toHaveAttribute('role', 'alert') || expect(error).toHaveClass(/error|invalid/i);
}

/**
 * Expect no validation errors
 *
 * @param container - Render result
 */
export function expectNoValidationErrors(container: RenderResult): void {
  const errors = container.queryAllByRole('alert');
  expect(errors).toHaveLength(0);
}

/**
 * Expect field to have ARIA invalid state
 *
 * @param container - Render result
 * @param labelText - Label text for field
 */
export function expectFieldInvalid(container: RenderResult, labelText: string): void {
  const field = container.getByLabelText(labelText);
  expect(field).toHaveAttribute('aria-invalid', 'true');
}

/**
 * Expect field to be valid (no ARIA invalid state)
 *
 * @param container - Render result
 * @param labelText - Label text for field
 */
export function expectFieldValid(container: RenderResult, labelText: string): void {
  const field = container.getByLabelText(labelText);
  expect(field).not.toHaveAttribute('aria-invalid', 'true');
}

// =============================================================================
// Form State Helpers
// =============================================================================

/**
 * Expect form to be disabled (all inputs disabled)
 *
 * @param container - Render result
 */
export function expectFormDisabled(container: RenderResult): void {
  const form = container.container.querySelector('form');
  if (!form) throw new Error('Form not found');

  const inputs = form.querySelectorAll('input, select, textarea, button');
  for (const input of inputs) {
    expect(input).toBeDisabled();
  }
}

/**
 * Expect submit button to be disabled
 *
 * @param container - Render result
 * @param buttonText - Submit button text
 */
export function expectSubmitDisabled(container: RenderResult, buttonText = 'Submit'): void {
  const button = container.getByRole('button', { name: buttonText });
  expect(button).toBeDisabled();
}

/**
 * Expect submit button to be enabled
 *
 * @param container - Render result
 * @param buttonText - Submit button text
 */
export function expectSubmitEnabled(container: RenderResult, buttonText = 'Submit'): void {
  const button = container.getByRole('button', { name: buttonText });
  expect(button).toBeEnabled();
}

/**
 * Expect form to be in loading state
 *
 * @param container - Render result
 */
export async function expectFormLoading(container: RenderResult): Promise<void> {
  const loading = await container.findByText(/loading|submitting|processing/i);
  expect(loading).toBeInTheDocument();
}

// =============================================================================
// Multi-Step Form Helpers
// =============================================================================

/**
 * Navigate to next step in multi-step form
 *
 * @param container - Render result
 * @param buttonText - Next button text (defaults to 'Next')
 */
export async function goToNextStep(container: RenderResult, buttonText = 'Next'): Promise<void> {
  const user = userEvent.setup();
  const nextButton = container.getByRole('button', { name: buttonText });
  await user.click(nextButton);
}

/**
 * Navigate to previous step in multi-step form
 *
 * @param container - Render result
 * @param buttonText - Back button text (defaults to 'Back')
 */
export async function goToPreviousStep(
  container: RenderResult,
  buttonText = 'Back'
): Promise<void> {
  const user = userEvent.setup();
  const backButton = container.getByRole('button', { name: buttonText });
  await user.click(backButton);
}

/**
 * Expect to be on specific step
 *
 * @param container - Render result
 * @param stepNumber - Expected step number (1-indexed)
 */
export function expectOnStep(container: RenderResult, stepNumber: number): void {
  const stepIndicator = container.getByText(new RegExp(`step ${stepNumber}`, 'i'));
  expect(stepIndicator).toBeInTheDocument();
}

// =============================================================================
// Form Data Helpers
// =============================================================================

/**
 * Create mock file for file upload testing
 *
 * @param name - File name
 * @param content - File content (string or Blob)
 * @param type - MIME type
 * @returns File object
 *
 * @example
 * ```tsx
 * const image = createMockFile('avatar.png', 'fake-image-data', 'image/png')
 * await uploadFile(container, 'Upload Avatar', image)
 * ```
 */
export function createMockFile(
  name: string,
  content: string | Blob = '',
  type = 'text/plain'
): File {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  return new File([blob], name, { type });
}

/**
 * Create mock image file for testing
 *
 * @param name - File name (defaults to 'test-image.png')
 * @returns File object with image MIME type
 */
export function createMockImage(name = 'test-image.png'): File {
  // Create a 1x1 transparent PNG
  const pngData =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const binary = atob(pngData);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return createMockFile(name, new Blob([array]), 'image/png');
}

/**
 * Get form data as object
 *
 * Useful for verifying form submission data
 *
 * @param form - HTML form element
 * @returns Object with form field names and values
 */
export function getFormData(form: HTMLFormElement): Record<string, unknown> {
  const formData = new FormData(form);
  const data: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  return data;
}

/**
 * Expect form data to match expected values
 *
 * @param form - HTML form element
 * @param expected - Expected form data
 */
export function expectFormData(form: HTMLFormElement, expected: Record<string, unknown>): void {
  const actual = getFormData(form);

  for (const [key, value] of Object.entries(expected)) {
    expect(actual[key]).toBe(value);
  }
}
