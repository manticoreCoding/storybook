'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import CoverView from './CoverView';
import PageView from './PageView';
import NavControls from './NavControls';

export default function StoryReader({ story }) {
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover
  const touchStartX = useRef(null);

  const total = story.pages.length;
  const page = currentPage === 0 ? null : story.pages[currentPage - 1];

  function goNext() {
    if (currentPage < total) setCurrentPage((p) => p + 1);
  }
  function goPrev() {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 50) goNext();
    else if (delta < -50) goPrev();
    touchStartX.current = null;
  }

  return (
    <div
      className="flex flex-col h-dvh bg-cream px-4 pt-4 pb-4 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <Link
          href="/"
          className="font-nunito text-sm md:text-base text-brown-mid bg-white rounded-full px-4 py-2 shadow-sm active:scale-95 transition-transform"
        >
          ← Library
        </Link>
        <h1 className="font-lora text-lg md:text-2xl font-bold text-brown-dark text-center leading-tight px-2 truncate">
          {story.title}
        </h1>
        <Link
          href={`/admin/edit/${story.id}`}
          className="font-nunito text-sm text-brown-mid bg-amber-light rounded-full px-4 py-2 shadow-sm active:scale-95 transition-transform whitespace-nowrap"
        >
          ✏️ Edit
        </Link>
      </div>

      {/* Page content — fills remaining height */}
      <div className="flex-1 min-h-0">
        {currentPage === 0 ? <CoverView story={story} /> : <PageView page={page} />}
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0">
        <NavControls
          current={currentPage}
          total={total}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    </div>
  );
}
