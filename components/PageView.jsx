import Image from 'next/image';

export default function PageView({ page }) {
  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      <div className="relative w-full flex-shrink-0 rounded-2xl overflow-hidden shadow-md aspect-[8/5]">
        <Image
          src={page.image}
          alt={`Page ${page.pageNumber}`}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
          priority
          unoptimized
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mt-4 px-1">
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="font-nunito text-xl md:text-2xl text-brown-dark leading-relaxed">
            {page.text}
          </p>
        </div>
      </div>
    </div>
  );
}
