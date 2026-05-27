import { forecastPipeline } from "./model.mjs";

export function buildForecastRollup(accounts, options = {}) {
  const pipeline = forecastPipeline(accounts, options);
  return { ...pipeline, segments: segmentForecasts(pipeline.forecasts, options.segmentBy ?? "stage"), alerts: buildForecastAlerts(pipeline.forecasts, options) };
}

export function segmentForecasts(forecasts, field) {
  const grouped = new Map();
  for (const forecast of forecasts) {
    const key = forecast[field] ?? "unknown";
    const existing = grouped.get(key) ?? { key, count: 0, pipeline: 0, expectedValue: 0 };
    existing.count += 1; existing.pipeline += forecast.amount; existing.expectedValue += forecast.expectedValue; grouped.set(key, existing);
  }
  return [...grouped.values()].sort((a, b) => b.expectedValue - a.expectedValue);
}

export function buildForecastAlerts(forecasts, options = {}) {
  const staleThreshold = options.staleThreshold ?? 0.25;
  const largeDealThreshold = options.largeDealThreshold ?? 50000;
  const alerts = [];
  for (const forecast of forecasts) {
    if (forecast.amount >= largeDealThreshold && forecast.confidence === "low") alerts.push({ accountId: forecast.accountId, type: "large_low_confidence_deal", message: `${forecast.name} is a large deal with low confidence` });
    if (forecast.probability <= staleThreshold && forecast.amount > 0) alerts.push({ accountId: forecast.accountId, type: "stale_pipeline", message: `${forecast.name} may need replay follow-up` });
  }
  return alerts;
}
