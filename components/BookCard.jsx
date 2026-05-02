'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function BookCard({ story }) {
  return (
    <Link href={`/story/${story.id}`} className="book-card group block">
      <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-md mb-3">
        <Image
          src={story.coverImage}
          alt={story.title}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
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
  );
}
