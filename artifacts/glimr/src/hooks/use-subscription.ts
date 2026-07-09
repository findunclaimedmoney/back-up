import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useCreateCompanionCheckout,
  useCreateCompanionPortal,
  useVerifyCompanionCheckout,
  useGetCompanionSubscribeStatus,
  type CompanionSubscribeStatusResponseTier,
} from "@workspace/api-client-react";

export interface SubscriptionStatus {
  email: string | null;
  tier: CompanionSubscribeStatusResponseTier;
  active: boolean;
  voiceLimit: number | null;
  voiceRemaining: number | null;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  email: null,
  tier: "free",
  active: false,
  voiceLimit: 0,
  voiceRemaining: 0,
};

/**
 * Subscription/billing state for the signed-in user. Identity always comes from
 * the authenticated session (`useAuth`) — there is no client-supplied-email path
 * anymore, since that was a takeover vector on /status and /portal. Anonymous
 * visitors always see the free-tier default; a guest can still start Stripe
 * Checkout, and if they later sign in with the same email the subscriber row is
 * auto-linked to their account server-side.
 */
export function useSubscription() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const verifiedRef = useRef(false);

  const statusMutation = useGetCompanionSubscribeStatus();
  const checkoutMutation = useCreateCompanionCheckout();
  const portalMutation = useCreateCompanionPortal();
  const verifyMutation = useVerifyCompanionCheckout();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus(DEFAULT_STATUS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await statusMutation.mutateAsync({ data: {} });
      setStatus({ email: user?.email ?? null, ...result });
    } catch {
      setStatus({ ...DEFAULT_STATUS, email: user?.email ?? null });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (authLoading) return;

    if (verifiedRef.current) {
      refresh();
      return;
    }
    verifiedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const checkoutSessionId = params.get("session_id");

    if (checkoutSessionId) {
      verifyMutation
        .mutateAsync({ data: { sessionId: checkoutSessionId } })
        .catch(() => {
          // ignore — checkout may still be processing via webhook
        })
        .finally(() => {
          params.delete("session_id");
          const next = params.toString();
          window.history.replaceState({}, "", window.location.pathname + (next ? `?${next}` : ""));
          refresh();
        });
    } else {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const checkout = useCallback(async (tier: "spark" | "flame") => {
    const result = await checkoutMutation.mutateAsync({ data: { tier } });
    window.location.href = result.checkoutUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPortal = useCallback(async () => {
    const result = await portalMutation.mutateAsync({ data: {} });
    window.location.href = result.portalUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canUseVoice = status.active && (status.voiceRemaining === null || status.voiceRemaining > 0);
  const canUseCustomPersona = status.active && (status.tier === "spark" || status.tier === "flame");
  const canUseVideoCall = status.active && status.tier === "flame";

  return {
    status,
    loading: loading || authLoading,
    isAuthenticated,
    canUseVoice,
    canUseCustomPersona,
    canUseVideoCall,
    refresh,
    checkout,
    openPortal,
  };
}
