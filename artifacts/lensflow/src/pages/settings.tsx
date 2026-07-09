import { useAuth } from "@workspace/replit-auth-web";
import { LogOut, User, Mail, Shield, Film, Key, Copy, Check, Webhook, Link as LinkIcon, Bot, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetAvatarSettings, useUpdateAvatarSettings } from "@workspace/api-client-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const [keyCopied, setKeyCopied] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user?.email ?? "Agent";

  const initials = user?.firstName
    ? (user.firstName[0] + (user.lastName?.[0] ?? "")).toUpperCase()
    : (user?.email?.[0] ?? "?").toUpperCase();

  const mockApiKey = user?.id
    ? `lf_live_${user.id.replace(/-/g, "").slice(0, 24)}`
    : "lf_live_••••••••••••••••••••••••";

  function copyKey() {
    navigator.clipboard.writeText(mockApiKey).then(() => {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  }

  // Digital twin avatar settings
  const { data: avatarData, isLoading: avatarLoading } = useGetAvatarSettings();
  const updateAvatar = useUpdateAvatarSettings();
  const [heygenAvatarId, setHeygenAvatarId] = useState("");
  const [heygenAvatarName, setHeygenAvatarName] = useState("");
  const [heygenVoiceId, setHeygenVoiceId] = useState("");
  const [avatarSaved, setAvatarSaved] = useState(false);

  useEffect(() => {
    if (avatarData) {
      setHeygenAvatarId(avatarData.heygenAvatarId ?? "");
      setHeygenAvatarName(avatarData.heygenAvatarName ?? "");
      setHeygenVoiceId(avatarData.heygenVoiceId ?? "");
    }
  }, [avatarData]);

  async function saveAvatarSettings() {
    await updateAvatar.mutateAsync({
      data: {
        heygenAvatarId: heygenAvatarId.trim() || undefined,
        heygenAvatarName: heygenAvatarName.trim() || undefined,
        heygenVoiceId: heygenVoiceId.trim() || undefined,
      },
    });
    setAvatarSaved(true);
    setTimeout(() => setAvatarSaved(false), 2500);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & Settings</h1>
        <p className="text-muted-foreground">Your agent account details and integrations.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={displayName}
                className="w-16 h-16 rounded-full border-4 border-card object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-card bg-secondary flex items-center justify-center text-2xl font-bold font-mono text-primary">
                {initials}
              </div>
            )}
          </div>
        </div>
        <div className="pt-12 pb-6 px-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-sm text-muted-foreground font-mono">{user?.email ?? "—"}</p>
          </div>
          <div className="grid gap-3">
            <InfoRow icon={User} label="Full Name" value={displayName} />
            <InfoRow icon={Mail} label="Email" value={user?.email ?? "—"} />
            <InfoRow icon={Film} label="Account Type" value="LensFlow Agent" />
            <InfoRow icon={Shield} label="Session" value="Active · 7-day token" />
          </div>
        </div>
      </div>

      {/* Digital Twin Avatar */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Bot className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">My Digital Twin</h3>
          <span className="ml-auto text-[10px] font-mono text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded">AI AVATAR</span>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create a Digital Twin using <strong className="text-foreground">HeyGen Avatar V</strong> at app.heygen.com, then paste the avatar ID here.
            It will be used automatically on all your AI Presenter videos instead of the default presenters.
          </p>
          {avatarLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">HeyGen Avatar ID</label>
                <input
                  type="text"
                  value={heygenAvatarId}
                  onChange={(e) => setHeygenAvatarId(e.target.value)}
                  placeholder="e.g. d6009ad7f6234aa1b98565649f5ffd55"
                  className="w-full h-10 bg-background border border-border rounded px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Display Name <span className="normal-case tracking-normal opacity-50">(optional)</span></label>
                <input
                  type="text"
                  value={heygenAvatarName}
                  onChange={(e) => setHeygenAvatarName(e.target.value)}
                  placeholder="e.g. Sarah — Your Twin"
                  className="w-full h-10 bg-background border border-border rounded px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">HeyGen Voice ID <span className="normal-case tracking-normal opacity-50">(optional)</span></label>
                <input
                  type="text"
                  value={heygenVoiceId}
                  onChange={(e) => setHeygenVoiceId(e.target.value)}
                  placeholder="Leave blank to use ElevenLabs voice"
                  className="w-full h-10 bg-background border border-border rounded px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                />
              </div>
              <button
                onClick={saveAvatarSettings}
                disabled={updateAvatar.isPending}
                className="flex items-center gap-1.5 text-[10px] font-mono border border-border hover:border-primary/40 hover:text-primary text-muted-foreground px-3 py-2 rounded transition-colors disabled:opacity-50"
              >
                {avatarSaved ? (
                  <><Check className="w-3 h-3 text-primary" /> Saved!</>
                ) : updateAvatar.isPending ? (
                  <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><Save className="w-3 h-3" /> Save Avatar Settings</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* API Access */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Key className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">API Access</h3>
          <span className="ml-auto text-[10px] font-mono text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded">LIVE KEY</span>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use this key to authenticate API requests and webhook integrations with the LensFlow pipeline.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xs bg-background border border-border rounded px-3 py-2 text-foreground/70 select-all truncate">
              {mockApiKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono border border-border hover:border-primary/40 hover:text-primary text-muted-foreground px-3 py-2 rounded transition-colors"
            >
              {keyCopied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
              {keyCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Include as <code className="bg-secondary px-1 rounded">Authorization: Bearer {"{key}"}</code> header on all API requests.
          </p>
        </div>
      </div>

      {/* Webhooks Shortcut */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Webhook className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Webhook Integrations</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Receive real-time HTTP notifications when your pipeline jobs change state (queued, complete, failed).
            Integrate with CRMs, Slack, or any automation platform.
          </p>
          <Link
            href="/webhooks"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary/40 hover:text-primary text-muted-foreground rounded text-xs font-mono transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" /> Manage Webhooks
          </Link>
        </div>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Security</h3>
          <span className="ml-auto text-[10px] font-mono text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded">ACCOUNT</span>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage your password and two-factor authentication settings.
          </p>
          <div className="grid gap-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-[10px] font-mono text-muted-foreground">Last changed —</p>
                </div>
              </div>
              <button disabled className="text-[10px] font-mono border border-border px-3 py-1.5 rounded opacity-50 cursor-not-allowed">
                Change (coming soon)
              </button>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Two-Factor Auth</p>
                  <p className="text-[10px] font-mono text-muted-foreground">Not enabled</p>
                </div>
              </div>
              <button disabled className="text-[10px] font-mono border border-border px-3 py-1.5 rounded opacity-50 cursor-not-allowed">
                Enable (coming soon)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Sign Out</h3>
          <p className="text-sm text-muted-foreground">End your current session on this device.</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-sm font-mono font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-xs font-mono text-muted-foreground w-24 shrink-0 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}
