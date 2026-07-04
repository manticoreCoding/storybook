export default function NavControls({ current, total, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between gap-4 pt-3">
      <button
        onClick={onPrev}
        disabled={current === 0}
        className="nav-btn"
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <span className="font-nunito text-brown-mid text-base md:text-lg font-medium whitespace-nowrap">
        {current === 0 ? 'Cover' : `Page ${current} of ${total}`}
      </span>

      <button
        onClick={onNext}
        disabled={current === total}
        className="nav-btn"
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  );
}
