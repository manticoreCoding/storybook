'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function BookCard({ story, canEdit = false }) {
  return (
    <div className="book-card group flex flex-col">
      {/* Cover image — tapping opens the reader */}
      <Link href={`/story/${story.id}`} className="block">
        <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden shadow-md mb-3">
          <Image
            src={story.coverImage}
            alt={story.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
          {story.isPublic && (
            <span
              title="Public"
              aria-label="Public story"
              className="absolute bottom-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-white/90 shadow-md text-sm"
            >
              🌐
            </span>
          )}
        </div>
        <h2 className="font-lora text-xl font-bold text-brown-dark text-center leading-snug px-1">
          {story.title}
        </h2>
        {story.description && (
          <p className="font-nunito text-sm text-brown-mid text-center mt-1 px-2 leading-snug line-clamp-2">
            {story.description}
          </p>
        )}
      </Link>

      {/* Edit link */}
      {canEdit && (
        <div className="mt-3 flex justify-center">
          <Link
            href={`/admin/edit/${story.id}`}
            className="font-nunito text-xs text-brown-mid bg-amber-light rounded-full px-3 py-1.5 hover:bg-amber transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ✏️ Edit
          </Link>
        </div>
      )}
    </div>
  );
}
