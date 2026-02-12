/**
 * BrowserNavButton Component
 * 
 * A button used in the browser toolbar for navigation controls.
 * Used for back/forward/refresh buttons with consistent styling.
 * 
 * @component
 * @example
 * <BrowserNavButton
 *   icon={<IconArrowLeft />}
 *   onClick={handleBack}
 *   disabled={true}
 *   isMobile={true}
 * />
 */

export function BrowserNavButton({
  icon,
  onClick,
  disabled = false,
  isMobile = false,
  title = "",
}) {
  return (
    <button
      className={`flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-white transition-colors
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {isMobile ? icon.props.children : icon}
    </button>
  );
}
