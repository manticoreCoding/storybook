import BookCard from './BookCard';

export default function LibraryGrid({ stories }) {
  if (!stories.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-6xl mb-4">📚</span>
        <p className="font-lora text-2xl text-brown-dark">No stories yet!</p>
        <p className="font-nunito text-brown-mid mt-2">
          Visit <a href="/admin" className="underline text-rose">Admin</a> to add your first story.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 px-4 md:px-8 py-6">
      {stories.map((story) => (
        <BookCard key={story.id} story={story} />
      ))}
    </div>
  );
}
