import { UserProfile } from '@/components/UserProfile';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <UserProfile />
    </div>
  );
}