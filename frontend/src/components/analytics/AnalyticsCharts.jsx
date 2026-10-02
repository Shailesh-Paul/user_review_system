/**
 * Phase 17 — restrained, dependency-free analytics charts.
 *
 * The project has no chart library installed and the brief asks not to add a
 * heavy dependency. These lightweight SVG/CSS charts answer specific business
 * questions without turning the dashboard into a wall of colour.
 */

import { formatPeriod } from '../../lib/analytics';

export const TrendLineChart = ({ data, valueKey, caption }) => {
  if (!Array.isArray(data) || data.length < 2) {
    return <div className="analytics-empty">Not enough data yet</div>;
  }

  const values = data.map((entry) => Number(entry[valueKey] ?? 0));
  const max = Math.max(...values, 1);
  const width = 100;
  const height = 40;
  const step = width / (data.length - 1);
  const points = values.map((value, index) => [index * step, height - (value / max) * height]);
  const linePoints = points.map((point) => `${point[0].toFixed(2)},${point[1].toFixed(2)}`).join(' ');
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;

  const labels = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]];

  return (
    <figure className="analytics-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={caption || 'Trend chart'}>
        <polygon points={areaPoints} className="analytics-chart-area" />
        <polyline points={linePoints} className="analytics-chart-line" />
      </svg>
      <div className="analytics-chart-axis">
        {labels.map((entry, index) => (
          <span key={`${entry.period}-${index}`}>{formatPeriod(entry.period)}</span>
        ))}
      </div>
      {caption && <figcaption className="analytics-chart-caption">{caption}</figcaption>}
    </figure>
  );
};

export const SimpleBarList = ({ items, valueSuffix = '' }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="analytics-empty">Not enough data yet</div>;
  }

  const max = Math.max(...items.map((item) => Number(item.value ?? 0)), 1);

  return (
    <ul className="analytics-bar-list">
      {items.map((item) => {
        const value = Number(item.value ?? 0);
        const percent = Math.max((value / max) * 100, value > 0 ? 6 : 0);
        return (
          <li key={item.label} className="analytics-bar-row">
            <span className="analytics-bar-label">{item.label}</span>
            <span className="analytics-bar-track">
              <span className="analytics-bar-fill" style={{ width: `${percent}%` }} />
            </span>
            <span className="analytics-bar-value">{value}{valueSuffix}</span>
          </li>
        );
      })}
    </ul>
  );
};
