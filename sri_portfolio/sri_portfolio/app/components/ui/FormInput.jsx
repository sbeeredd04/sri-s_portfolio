/**
 * FormInput Component
 * 
 * A reusable form input component with consistent styling
 * and responsive sizing for text inputs.
 * 
 * @component
 * @example
 * <FormInput
 *   name="email"
 *   type="email"
 *   placeholder="Your Email"
 *   required
 * />
 */

export function FormInput({
  name,
  type = "text",
  placeholder = "",
  value = "",
  onChange,
  required = false,
  disabled = false,
  className = "",
}) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full p-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all md:p-4 ${className}`}
    />
  );
}
