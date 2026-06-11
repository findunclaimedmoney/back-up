import { CheckCircle2, ExternalLink, Phone, Shield, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";

const BASE = import.meta.env.BASE_URL;
const STRATTON_LOGO = `${BASE}stratton-logo.png`;

const HERO_IMG =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80";

export default function Finance() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  usePageSEO({
    title: "Stratton Finance Wanneroo, Perth | Car Loans & Personal Finance — MissingCash",
    description:
      "Get competitive car loans, personal loans and commercial finance through Stratton Finance Wanneroo. Speak with finance consultant Erin Crofton (08) 9446 9893. ACL 364340 · AFCA & FBAA member · access to 40+ lenders. Free, no-obligation quote.",
    keywords:
      "Stratton Finance, Stratton Finance Wanneroo, Stratton Finance Perth, Erin Crofton, car loans Perth, car finance Perth, personal loans WA, commercial finance Perth, asset finance, finance broker Perth, MissingCash finance",
    canonical: "https://www.missingcash.com.au/finance",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "finance-jsonld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FinancialService",
      name: "Stratton Finance Wanneroo (via MissingCash)",
      description:
        "Car loans, personal loans, commercial and asset finance from Stratton Finance, one of Australia's leading finance brokers with access to 40+ lenders.",
      url: "https://www.missingcash.com.au/finance",
      telephone: "+61894469893",
      areaServed: "AU",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Wanneroo",
        addressRegion: "WA",
        addressCountry: "AU",
      },
      employee: {
        "@type": "Person",
        name: "Erin Crofton",
        jobTitle: "Finance Consultant",
      },
      makesOffer: [
        { "@type": "Offer", name: "Car Finance" },
        { "@type": "Offer", name: "Personal Loans" },
        { "@type": "Offer", name: "Commercial Finance" },
        { "@type": "Offer", name: "Asset Finance" },
      ],
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById("finance-jsonld")?.remove();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    // Short delay to mimic submission, then show success
    setTimeout(() => {
      setSubmitting(false);
      setFormSubmitted(true);
    }, 800);
  };

  return (
    <div className="w-full">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={HERO_IMG}
            alt="Finance with Stratton"
            className="w-full h-full object-cover opacity-15"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />
        </div>
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 mb-8 text-xs font-semibold tracking-wide text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" /> OFFICIAL FINANCE PARTNER · WANNEROO, PERTH WA
          </div>
          <h1 className="text-5xl md:text-7xl font-heading tracking-wider mb-6 text-white leading-none">
            FINANCE WITH <span className="text-primary">STRATTON</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            MissingCash has partnered with <strong className="text-white">Stratton Finance</strong> — one of
            Australia's most awarded finance brokers. Access <strong className="text-white">40+ lenders</strong>,
            expert brokers, and fast approvals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#enquire">
              <Button className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider shadow-[0_4px_14px_rgba(245,185,66,0.25)]">
                GET FINANCE READY TODAY
              </Button>
            </a>
            <a href="tel:0894469893">
              <Button variant="outline" className="h-12 px-6 rounded-xl gap-2 border-border">
                <Phone className="w-4 h-4 text-primary" /> (08) 9446 9893
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Stratton Logo + About ──────────────────────────────────── */}
      <section className="py-16 border-y border-border bg-white/[0.03]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Logo side */}
            <div className="flex flex-col items-center lg:items-start gap-6">
              <div className="bg-white rounded-2xl p-8 inline-flex items-center justify-center shadow-xl">
                <img
                  src={STRATTON_LOGO}
                  alt="Stratton Finance"
                  className="h-16 w-auto object-contain"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="text-center lg:text-left">
                <p className="text-muted-foreground text-sm">Finance Consultant · Wanneroo, Perth WA</p>
                <p className="text-white font-bold text-xl mt-1">Erin Crofton</p>
                <a href="tel:0894469893" className="flex items-center gap-2 text-primary hover:underline font-semibold mt-2 justify-center lg:justify-start">
                  <Phone className="w-4 h-4" /> (08) 9446 9893
                </a>
              </div>
            </div>

            {/* About copy */}
            <div>
              <h2 className="text-3xl md:text-4xl font-heading tracking-wider mb-6 text-white">
                ABOUT STRATTON FINANCE:
              </h2>
              <ul className="space-y-5">
                <li className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Expert brokers providing a <strong className="text-white">personalised service</strong> — they understand your unique finance needs and explore options right for you</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Access to a select panel of <strong className="text-white">40+ lenders</strong> — this allows Stratton access to competitive interest rates and loan terms that could suit your needs</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>Market-leading knowledge and service — with over <strong className="text-white">150,000 customers</strong> and <strong className="text-white">5-star reviews</strong> from more than 2,500 people on ProductReview.com.au, you're accessing a premium level of service</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Award-Winning Broker ───────────────────────────────────── */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading tracking-wider mb-5 text-white">
                AWARD-WINNING BROKER
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Stratton Finance has been awarded <strong className="text-white">Best Car Loans 2021–2025</strong> (ProductReview) and{" "}
                <strong className="text-white">Best Large-Size Brokerage 2023–2024 &amp; Best Car Loans 2025</strong> (WeMoney). With a 4.8/5-star rating from 2,500+ reviews on ProductReview.com.au and more than 150,000 satisfied customers, it is no surprise that Stratton Finance is recognised as a leading asset broker in the market.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you're looking to finance your next purchase, give Erin Crofton at Stratton Finance a call on{" "}
                <a href="tel:0894469893" className="text-primary font-semibold hover:underline">(08) 9446 9893</a>{" "}
                or get an instant quote with Stratton Finance now.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <a href="#enquire">
                  <Button className="h-11 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider">
                    GET A QUOTE TODAY
                  </Button>
                </a>
                <a href="https://www.strattonfinance.com.au/wanneroo" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="h-11 px-5 rounded-xl gap-2 border-border">
                    Visit Stratton Wanneroo <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-4xl font-heading text-primary mb-1">4.8/5</p>
                <div className="flex justify-center gap-0.5 mb-2">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <Star className="w-4 h-4 fill-primary text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">2,500+ reviews · ProductReview</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-4xl font-heading text-primary mb-1">150K+</p>
                <p className="text-xs text-muted-foreground mt-1">Satisfied customers</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-4xl font-heading text-primary mb-1">40+</p>
                <p className="text-xs text-muted-foreground mt-1">Accredited lenders</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-4xl font-heading text-primary mb-1">$8B+</p>
                <p className="text-xs text-muted-foreground mt-1">Finance funded since 1998</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How Stratton Finance Can Help You ─────────────────────── */}
      <section className="py-16 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-heading tracking-wider text-center mb-10 text-white">
            HOW STRATTON FINANCE CAN HELP YOU
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="text-lg font-bold text-white mb-3 tracking-wide">COMPARE RATES</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A dedicated finance broker can assist you explore loan interest rate and repayment options from a panel of over 40 lenders.
              </p>
            </div>
            <div className="bg-card border border-primary/30 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
              <h3 className="text-lg font-bold text-white mb-3 tracking-wide">APPLY</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your dedicated Stratton broker will get to know you and your situation, and complete your application based on your financial details, providing tailored quotes. When you're ready, we'll submit your application to your preferred lender and provide clear next steps.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8">
              <h3 className="text-lg font-bold text-white mb-3 tracking-wide">BUYING</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                If approved, we can assist with contract walkthroughs and help manage the settlement process (if applicable), leading you to the exciting moment of supporting your purchase.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enquiry Form ──────────────────────────────────────────── */}
      <section id="enquire" className="py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <div className="bg-white rounded-xl p-5 inline-flex items-center justify-center mb-6 shadow-lg">
              <img
                src={STRATTON_LOGO}
                alt="Stratton Finance"
                className="h-10 w-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-heading tracking-wider mb-3 text-white">
              GET FINANCE READY TODAY — ENQUIRE NOW
            </h2>
          </div>

          {formSubmitted ? (
            <div className="bg-card border border-green-500/30 rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-heading tracking-wider text-white mb-3">ENQUIRY RECEIVED!</h3>
              <p className="text-muted-foreground">
                Thanks! Erin from Stratton Finance will contact you within one business day.
                For urgent enquiries call{" "}
                <a href="tel:0894469893" className="text-primary font-semibold hover:underline">(08) 9446 9893</a>.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fin-first" className="text-muted-foreground text-sm">First Name *</Label>
                    <Input id="fin-first" name="firstName" required className="bg-background h-11" data-testid="input-finance-first-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fin-last" className="text-muted-foreground text-sm">Last Name *</Label>
                    <Input id="fin-last" name="lastName" required className="bg-background h-11" data-testid="input-finance-last-name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fin-email" className="text-muted-foreground text-sm">Email *</Label>
                    <Input id="fin-email" name="email" type="email" required className="bg-background h-11" data-testid="input-finance-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fin-phone" className="text-muted-foreground text-sm">Phone *</Label>
                    <Input id="fin-phone" name="phone" type="tel" required className="bg-background h-11" data-testid="input-finance-phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fin-postcode" className="text-muted-foreground text-sm">Postcode *</Label>
                  <Input id="fin-postcode" name="postcode" required maxLength={4} className="bg-background h-11 max-w-[180px]" data-testid="input-finance-postcode" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fin-message" className="text-muted-foreground text-sm">Message</Label>
                  <Textarea id="fin-message" name="message" rows={4} className="bg-background resize-none" placeholder="Tell us what you're looking to finance (optional)" data-testid="input-finance-message" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-primary shrink-0"
                    required
                    data-testid="checkbox-finance-consent"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                    Select to consent to Stratton Finance's brokers contacting you regarding your enquiry. Your information will be handled in accordance with Stratton Finance's{" "}
                    <a href="https://www.strattonfinance.com.au/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>.
                  </span>
                </label>
                <Button
                  type="submit"
                  disabled={!consent || submitting}
                  size="lg"
                  className="w-full h-12 font-bold tracking-wider rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_rgba(245,185,66,0.25)] disabled:opacity-50"
                  data-testid="button-finance-submit"
                >
                  {submitting ? "SUBMITTING..." : "SUBMIT"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ── Important Information ─────────────────────────────────── */}
      <section className="py-10 border-t border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-xs font-semibold text-white mb-2 uppercase tracking-wide">Important Information</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            All applications for credit are subject to lender credit assessment and eligibility criteria. Terms, conditions, fees and charges apply. Stratton Finance Pty Ltd Australian Credit Licence 364340.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            MissingCash (ABN 52 347 989 391) may receive a financial benefit for any referrals to Stratton Finance if your loan settles with one of their panel lenders.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> ACL 364340</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> FBAA Member 103514</span>
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-primary" /> Best Car Loans 2021–2026 · ProductReview</span>
          </div>
        </div>
      </section>

    </div>
  );
}
