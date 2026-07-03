import './Skeleton.css';

export default function SkeletonCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-card-title" />
          <div className="skeleton-card-text" />
          <div className="skeleton-card-text skeleton-card-text--short" />
        </div>
      ))}
    </>
  );
}
