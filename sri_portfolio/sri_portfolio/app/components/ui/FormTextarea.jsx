/**
 * FormTextarea Component
 * 
 * A reusable textarea form component with consistent styling
 * and responsive sizing for multi-line text inputs.
 * 
 * @component
 * @example
 * <FormTextarea
 *   name="message"
 *   placeholder="Your Message"
 *   required
 * />
 */

export function FormTextarea({
  name,
  placeholder = "",
  value = "",
  onChange,
  required = false,
  disabled = false,
  rows = 5,
  className = "",
}) {
  return (
    <textarea
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      rows={rows}
      className={`w-full p-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all md:p-4 resize-none ${className}`}
    />
  );
}
