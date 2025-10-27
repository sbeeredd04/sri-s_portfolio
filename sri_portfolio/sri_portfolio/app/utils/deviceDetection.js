/**
 * Device Detection Utility
 * Centralized mobile/desktop detection logic
 */

/**
 * Detects if the current device is a mobile device
 * Checks multiple factors:
 * - User agent strings
 * - Touch support
 * - Screen width
 * @returns {boolean} true if mobile device
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering default
  }

  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
  const isMobileUA = mobileRegex.test(userAgent.toLowerCase());

  // Check for touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check screen width (mobile typically < 768px)
  const isSmallScreen = window.innerWidth < 768;

  // Device is mobile if it matches user agent OR (has touch AND small screen)
  return isMobileUA || (hasTouch && isSmallScreen);
}

/**
 * Detects if the device is a tablet specifically
 * @returns {boolean} true if tablet device
 */
export function isTabletDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIPad = /ipad/i.test(userAgent.toLowerCase()) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroidTablet = /android/i.test(userAgent.toLowerCase()) && !/mobile/i.test(userAgent.toLowerCase());
  
  return isIPad || isAndroidTablet;
}

/**
 * Detects if device supports WebGL
 * @returns {boolean} true if WebGL is supported
 */
export function supportsWebGL() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Get device type as string
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export function getDeviceType() {
  if (isMobileDevice() && !isTabletDevice()) {
    return 'mobile';
  } else if (isTabletDevice()) {
    return 'tablet';
  }
  return 'desktop';
}
