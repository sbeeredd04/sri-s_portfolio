/**
 * Performance Metrics Tracking Module
 * 
 * Tracks bundle size, FCP (First Contentful Paint), and TTI (Time to Interactive)
 * Helps verify the 46% bundle reduction target
 */

export class PerformanceTracker {
  private metrics = {};
  private startTime = Date.now();

  /**
   * Record bundle size metrics
   * @param {string} bundleName - Name of the bundle (e.g., 'main', 'about', '3d-components')
   * @param {number} sizeInKb - Bundle size in kilobytes
   */
  recordBundleSize(bundleName, sizeInKb) {
    if (!this.metrics.bundles) this.metrics.bundles = {};
    this.metrics.bundles[bundleName] = sizeInKb;
  }

  /**
   * Record First Contentful Paint timing
   * @param {number} fcpTime - FCP time in milliseconds
   */
  recordFCP(fcpTime) {
    this.metrics.fcp = fcpTime;
  }

  /**
   * Record Time to Interactive
   * @param {number} ttiTime - TTI time in milliseconds
   */
  recordTTI(ttiTime) {
    this.metrics.tti = ttiTime;
  }

  /**
   * Calculate total bundle size
   * @returns {number} Total size in KB
   */
  getTotalBundleSize() {
    if (!this.metrics.bundles) return 0;
    return Object.values(this.metrics.bundles).reduce((a, b) => a + b, 0);
  }

  /**
   * Get all metrics
   * @returns {Object} All recorded metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalBundleSize: this.getTotalBundleSize(),
      sessionDuration: Date.now() - this.startTime,
    };
  }

  /**
   * Get reduction percentage
   * @param {number} originalSize - Original bundle size in KB
   * @param {number} newSize - New bundle size in KB
   * @returns {number} Reduction percentage
   */
  static calculateReduction(originalSize, newSize) {
    return Math.round((1 - newSize / originalSize) * 100);
  }

  /**
   * Generate performance report
   * @param {number} originalBundleSize - Original bundle size in KB (baseline: 65KB)
   * @param {number} targetSize - Target bundle size in KB (goal: 35KB)
   * @returns {Object} Performance report
   */
  generateReport(originalBundleSize = 65, targetSize = 35) {
    const currentSize = this.getTotalBundleSize();
    const reduction = PerformanceTracker.calculateReduction(originalBundleSize, currentSize);
    const achieved = currentSize <= targetSize;

    return {
      baseline: {
        bundleSize: originalBundleSize + ' KB',
        description: 'Original bundle size before optimization',
      },
      current: {
        bundleSize: currentSize + ' KB',
        fcp: this.metrics.fcp ? this.metrics.fcp + ' ms' : 'Not measured',
        tti: this.metrics.tti ? this.metrics.tti + ' ms' : 'Not measured',
      },
      target: {
        bundleSize: targetSize + ' KB',
        reductionTarget: Math.round((1 - targetSize / originalBundleSize) * 100) + '%',
      },
      results: {
        achieved,
        reductionPercentage: reduction + '%',
        sizeDifference: (originalBundleSize - currentSize) + ' KB',
        withinTarget: currentSize <= targetSize,
      },
      breakdown: this.metrics.bundles || {},
    };
  }
}

/**
 * Hook-friendly performance tracking
 * Call this in your component to start tracking
 */
export function usePerformanceTracking() {
  const tracker = new PerformanceTracker();

  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Track FCP and LCP
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            tracker.recordFCP(Math.round(entry.startTime));
          }
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        }
      });

      observer.observe({
        entryTypes: ['paint', 'largest-contentful-paint'],
        buffered: true,
      });
    } catch (e) {
      console.warn('Performance Observer not supported:', e);
    }

    // Track TTI (Time to Interactive) - approximate using PerformanceTiming
    if ('timing' in performance) {
      const timing = performance.timing;
      const tti = timing.domInteractive - timing.navigationStart;
      if (tti > 0) {
        tracker.recordTTI(tti);
      }
    }
  }

  return tracker;
}

export default PerformanceTracker;
