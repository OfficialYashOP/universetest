import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CreateOffRecordPost } from "@/components/offrecord/CreateOffRecordPost";
import { OffRecordPostCard } from "@/components/offrecord/OffRecordPostCard";
import { useRealtimePosts } from "@/hooks/useRealtimePosts";
import { EyeOff, Loader2 } from "lucide-react";

const OffRecordPage = () => {
  const { posts, loading, userLikes, refetch } = useRealtimePosts("offrecord");

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <EyeOff className="w-6 h-6 text-primary" />
            OffRecord
          </h1>
          <p className="text-muted-foreground">
            Share your thoughts anonymously • Text only • Edit within 10 minutes
          </p>
        </div>

        {/* Create Post */}
        <CreateOffRecordPost onPostCreated={refetch} />

        {/* Posts */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <EyeOff className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No anonymous posts yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share something anonymously!
              </p>
            </div>
          ) : (
            posts.map(post => (
              <OffRecordPostCard
                key={post.id}
                post={post}
                isLiked={userLikes.has(post.id)}
                onLikeToggle={refetch}
                onPostUpdated={refetch}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OffRecordPage;
