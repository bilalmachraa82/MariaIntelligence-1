import { memo, useMemo, useCallback, ComponentType } from 'react';

// Performance optimization utilities for React Feature-Based Architecture

/**
 * Enhanced memo with display name preservation
 */
export function memoComponent<T>(
  Component: ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) {
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Debounced value hook for performance optimization
 */
export function useStableMemo<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Stable callback hook
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Performance metrics collection
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): void {
    performance.mark(`${label}-start`);
  }

  endTiming(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label, 'measure')[0];
    const duration = measure.duration;

    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    // Clean up marks and measures
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);

    return duration;
  }

  getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    this.metrics.forEach((times, label) => {
      result[label] = {
        average: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length,
      };
    });

    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Performance measurement decorator for components
 */
export function withPerformanceMonitor<P extends object>(
  Component: ComponentType<P>,
  label?: string
) {
  const componentName = label || Component.displayName || Component.name;
  const monitor = PerformanceMonitor.getInstance();

  const PerformanceWrappedComponent: ComponentType<P> = (props) => {
    monitor.startTiming(`render-${componentName}`);

    const result = Component(props);

    // Use setTimeout to measure after render completion
    setTimeout(() => {
      monitor.endTiming(`render-${componentName}`);
    }, 0);

    return result;
  };

  PerformanceWrappedComponent.displayName = `WithPerformance(${componentName})`;
  return PerformanceWrappedComponent;
}

/**
 * Bundle splitting utilities
 */
export const loadFeature = (featureName: string) => {
  return import(`@/features/${featureName}`);
};

export const preloadFeature = (featureName: string) => {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = `/src/features/${featureName}/index.ts`;
  document.head.appendChild(link);
};

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  static getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  static logMemoryUsage(label: string): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(`Memory Usage (${label}):`, {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
      });
    }
  }
}

/**
 * React DevTools Profiler integration
 */
export function onRenderProfiler(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Profiler Data:', {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    });
  }
}