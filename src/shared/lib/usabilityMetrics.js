// Simple local usability metrics recorder
const STORAGE_KEY = 'usability_metrics_v1';

export const metrics = {
  _startTimes: {},

  _save(entry) {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      arr.push(entry);
      // keep last 200 records
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-200)));
    } catch (e) {
      console.warn('Could not save usability metric', e);
    }
  },

  record(entry) {
    const payload = { ...entry, ts: Date.now() };
    // easy runtime inspection
    console.info('[UsabilityMetric]', payload);
    this._save(payload);
  },

  recordPageLoad(page = 'unknown') {
    try {
      const navStart = performance?.timeOrigin || performance?.timing?.navigationStart || Date.now();
      const loadTime = Date.now() - navStart;
      this.record({ type: 'page_load', page, loadTime });
    } catch (e) {
      this.record({ type: 'page_load', page, loadTime: null, error: String(e) });
    }
  },

  startTask(key) {
    this._startTimes[key] = Date.now();
  },

  endTask(key, extra = {}) {
    const start = this._startTimes[key];
    if (!start) return;
    const duration = Date.now() - start;
    delete this._startTimes[key];
    this.record({ type: 'task', task: key, duration, ...extra });
  },

  error(key, info) {
    this.record({ type: 'error', key, info });
  }
};

export default metrics;
