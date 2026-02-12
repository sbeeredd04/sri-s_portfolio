/**
 * TabButton Component
 * 
 * A reusable tab button component that handles active/inactive states
 * with consistent styling across the application.
 * 
 * @component
 * @example
 * <TabButton 
 *   label="Profile"
 *   isActive={activeTab === "profile"}
 *   onClick={() => setActiveTab("profile")}
 *   size="md"
 * />
 */

export function TabButton({ 
  label, 
  isActive = false, 
  onClick, 
  size = "md",
  className = ""
}) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs md:px-4 md:py-1.5 md:text-sm",
    md: "px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap md:px-6 md:py-1.5 md:text-lg",
    lg: "px-6 py-2 text-base md:px-8 md:py-3 md:text-xl"
  };

  const activeClasses = isActive
    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
    : "bg-neutral-700/20 text-neutral-400 hover:bg-neutral-600/20 hover:text-white border border-white/5";

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} ${activeClasses} rounded-lg transition-all ${className}`}
    >
      {label}
    </button>
  );
}
