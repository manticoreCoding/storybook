import Image from 'next/image';

export default function PageView({ page }) {
  return (
    <div className="flex flex-col h-full">
      <div className="relative w-full flex-shrink-0 rounded-2xl overflow-hidden shadow-md"
           style={{ height: '55%' }}>
        <Image
          src={page.image}
          alt={`Page ${page.pageNumber}`}
          fill
          sizes="100vw"
          className="object-cover"
          priority
          unoptimized
        />
      </div>

      <div className="flex-1 overflow-y-auto mt-4 px-1">
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5 min-h-full">
          <p className="font-nunito text-xl md:text-2xl text-brown-dark leading-relaxed">
            {page.text}
          </p>
        </div>
      </div>
    </div>
  );
}
