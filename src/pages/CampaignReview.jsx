import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Check, X, Loader2, ExternalLink, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export default function CampaignReview() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await base44.entities.MarketingCampaign.list("-created_date", 50);
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handlePublish = async (campaign) => {
    setPublishingId(campaign.id);
    try {
      const res = await base44.functions.invoke("marketingAction", {
        action: "publish_all",
        message: campaign.caption,
        image_url: campaign.image_url || undefined,
        video_url: campaign.video_url || undefined,
      });
      if (res.data?.error) {
        toast({
          variant: "destructive",
          title: "Publish failed",
          description: res.data.error,
        });
      } else {
        const fbId = res.data?.results?.facebook?.post_id || "";
        await base44.entities.MarketingCampaign.update(campaign.id, {
          status: "published",
          fb_post_id: fbId,
        });
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaign.id
              ? { ...c, status: "published", fb_post_id: fbId }
              : c
          )
        );
        toast({
          title: res.data?.success ? "Published everywhere!" : "Partially published",
          description: res.data?.message || "Campaign pushed to connected platforms.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Publish failed",
        description: err.message,
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleReject = async (campaign) => {
    try {
      await base44.entities.MarketingCampaign.update(campaign.id, { status: "rejected" });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: "rejected" } : c))
      );
      toast({ title: "Rejected", description: "Campaign marked as rejected." });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    }
  };

  const statusBadge = (status) => {
    const styles = {
      draft: "bg-amber-500/10 text-amber-500",
      published: "bg-green-500/10 text-green-500",
      rejected: "bg-red-500/10 text-red-500",
      approved: "bg-blue-500/10 text-blue-500",
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || styles.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className="flex items-center gap-3 px-6 py-5 border-b border-border"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <Link
          to="/"
          className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-semibold">Campaign Review</h1>
          <p className="text-xs text-muted-foreground">
            Mia's daily Facebook campaigns — review, approve & publish.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <Video className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No campaigns yet. Mia generates 3 new ones every morning at 9am.</p>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(camp.status)}
                      <span className="text-xs text-muted-foreground">
                        {camp.batch_date || new Date(camp.created_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-semibold">{camp.topic}</h3>
                    {camp.companion_name && (
                      <p className="text-xs text-primary mt-0.5">Featuring {camp.companion_name}</p>
                    )}
                  </div>
                </div>

                {camp.video_url ? (
                  <div className="rounded-xl overflow-hidden bg-black/50 mb-3 max-h-[400px] flex items-center">
                    <video
                      src={camp.video_url}
                      controls
                      className="w-full max-h-[400px] object-contain"
                    />
                  </div>
                ) : camp.image_url ? (
                  <div className="rounded-xl overflow-hidden bg-black/50 mb-3">
                    <img
                      src={camp.image_url}
                      alt={camp.companion_name || "Campaign"}
                      className="w-full max-h-[400px] object-cover object-top"
                    />
                  </div>
                ) : null}

                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {camp.caption}
                  </p>
                </div>
              </div>

              {camp.status === "draft" && (
                <div className="flex gap-2 px-5 pb-5">
                  <button
                    onClick={() => handlePublish(camp)}
                    disabled={publishingId === camp.id}
                    className="flex-1 min-h-[44px] rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {publishingId === camp.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publishing to all…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Publish to Facebook + Instagram
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(camp)}
                    className="min-h-[44px] px-6 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {camp.status === "published" && camp.fb_post_id && (
                <div className="px-5 pb-5">
                  <a
                    href={`https://facebook.com/${camp.fb_post_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Facebook
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}