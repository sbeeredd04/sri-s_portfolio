/**
 * ResponsiveImage Component
 * 
 * A lightweight reusable image component with responsive sizing
 * and consistent loading behavior.
 * 
 * @component
 * @example
 * <ResponsiveImage
 *   src="/logos/asulogo.png"
 *   alt="ASU Logo"
 *   className="w-10 h-10 md:w-16 md:h-16"
 * />
 */

export function ResponsiveImage({
  src,
  alt = "Image",
  className = "w-full h-auto",
  width,
  height,
  priority = false,
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
