import { useEffect } from 'react';
import { metrics } from '../lib/usabilityMetrics';

export function useInitPageMetrics(pageName = 'app') {
  useEffect(() => {
    metrics.recordPageLoad(pageName);
  }, [pageName]);
}

export function useTaskTimer(taskName) {
  useEffect(() => {
    metrics.startTask(taskName);
    return () => metrics.endTask(taskName);
  }, [taskName]);
}
