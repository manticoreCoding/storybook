import BookCard from './BookCard';

function canEditStory(story, actor) {
  return (
    !!actor?.isAdmin ||
    story.ownerId === actor?.userId ||
    (story.editorIds || []).includes(actor?.userId)
  );
}

export default function LibraryGrid({ stories, actor = {}, signedOutEmptyText }) {
  if (!stories.length) {
    if (!actor.userId && signedOutEmptyText) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-6xl mb-4">📚</span>
          <p className="font-lora text-2xl text-brown-dark">{signedOutEmptyText}</p>
        </div>
      );
    }
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
        <BookCard key={story.id} story={story} canEdit={canEditStory(story, actor)} />
      ))}
    </div>
  );
}
