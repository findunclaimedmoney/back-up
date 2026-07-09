import { useState, useEffect, useCallback, useRef } from "react";
import {
  useCreateCompanionCheckout,
  useCreateCompanionPortal,
  useVerifyCompanionCheckout,
  useGetCompanionSubscribeStatus,
  type CompanionSubscribeStatusResponseTier,
} from "@workspace/api-client-react";

const EMAIL_KEY = "companion_email";

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

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>(() => {
    const email = localStorage.getItem(EMAIL_KEY);
    return email ? { ...DEFAULT_STATUS, email } : DEFAULT_STATUS;
  });
  const [loading, setLoading] = useState(true);
  const verifiedRef = useRef(false);

  const statusMutation = useGetCompanionSubscribeStatus();
  const checkoutMutation = useCreateCompanionCheckout();
  const portalMutation = useCreateCompanionPortal();
  const verifyMutation = useVerifyCompanionCheckout();

  const refresh = useCallback(async () => {
    const email = localStorage.getItem(EMAIL_KEY);
    if (!email) {
      setStatus(DEFAULT_STATUS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await statusMutation.mutateAsync({ data: { email } });
      setStatus({ email, ...result });
    } catch {
      setStatus({ ...DEFAULT_STATUS, email });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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
        .then((result) => {
          localStorage.setItem(EMAIL_KEY, result.email);
          setStatus((prev) => ({ ...prev, email: result.email, tier: result.tier, active: result.tier !== "free" }));
          params.delete("session_id");
          const next = params.toString();
          window.history.replaceState({}, "", window.location.pathname + (next ? `?${next}` : ""));
        })
        .catch(() => {
          // ignore — checkout may still be processing via webhook
        })
        .finally(() => refresh());
    } else {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activate = useCallback(async (email: string) => {
    const result = await statusMutation.mutateAsync({ data: { email } });
    if (!result.active) {
      throw new Error("No active subscription found for that email");
    }
    localStorage.setItem(EMAIL_KEY, email);
    setStatus({ email, ...result });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkout = useCallback(async (tier: "spark" | "flame") => {
    const email = localStorage.getItem(EMAIL_KEY) ?? undefined;
    const result = await checkoutMutation.mutateAsync({ data: { tier, email } });
    window.location.href = result.checkoutUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPortal = useCallback(async () => {
    const email = localStorage.getItem(EMAIL_KEY);
    if (!email) return;
    const result = await portalMutation.mutateAsync({ data: { email } });
    window.location.href = result.portalUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(EMAIL_KEY);
    setStatus(DEFAULT_STATUS);
  }, []);

  const canUseVoice = status.active && (status.voiceRemaining === null || status.voiceRemaining > 0);
  const canUseCustomPersona = status.active && (status.tier === "spark" || status.tier === "flame");
  const canUseVideoCall = status.active && status.tier === "flame";

  return {
    status,
    loading,
    canUseVoice,
    canUseCustomPersona,
    canUseVideoCall,
    refresh,
    activate,
    checkout,
    openPortal,
    signOut,
  };
}
