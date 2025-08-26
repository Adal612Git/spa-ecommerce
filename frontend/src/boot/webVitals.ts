import { onCLS, onFID, onLCP, type Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  try {
    navigator.sendBeacon(
      '/api/metrics',
      JSON.stringify({ name: metric.name, value: metric.value, id: metric.id })
    );
  } catch {
    // ignore errors
  }
}

export default () => {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
};
