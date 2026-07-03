import './Skeleton.css';

export default function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-table-cell" style={{ flex: 1, height: 18 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="skeleton-table-cell"
              style={{ flex: 1, width: `${40 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
