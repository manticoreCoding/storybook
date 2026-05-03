import StoryForm from '@/components/StoryForm';

export const metadata = {
  title: 'Add a New Story',
};

export default function AdminPage() {
  return <StoryForm mode="create" />;
}
