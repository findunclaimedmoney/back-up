import { Car, Banknote, Building2, CheckCircle2, ExternalLink, Phone, Shield, Star, MapPin, Clock, TrendingDown, Users } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";

const HERO_IMG =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80";
const ERIN_IMG =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80";
const CAR_IMG =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80";
const PERSONAL_IMG =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80";
const COMMERCIAL_IMG =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80";

export default function Finance() {
  const [formSubmitted, setFormSubmitted] = useState(false);

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
    setFormSubmitted(true);
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={HERO_IMG}
            alt="Stratton Finance car loans and personal finance in Perth"
            className="w-full h-full object-cover opacity-20"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center rounded-full border border-border bg-secondary/50 px-4 py-1.5 mb-8">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5 text-primary" /> OFFICIAL FINANCE PARTNER · STRATTON FINANCE
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-heading tracking-wider mb-6 text-white leading-none">
                FINANCE WITH <span className="text-primary">STRATTON</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                MissingCash has partnered with <strong className="text-white">Stratton Finance</strong> — one of
                Australia's most awarded finance brokers. Whether you've just found your missing cash or simply need a
                great rate, get matched from <strong className="text-white">40+ lenders</strong> and approved fast.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {["Car Loans", "Personal Loans", "Commercial Finance", "Asset Finance"].map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Wanneroo, Perth WA</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Same-day approvals</span>
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> ACL 364340</span>
              </div>
            </div>

            {/* Stratton card */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/20 border border-primary/30 rounded-xl p-3">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Stratton Finance</h2>
                  <p className="text-sm text-muted-foreground">ACL 364340 · AFCA Member · FBAA Member</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  "One of Australia's leading car finance brokers",
                  "Access to 40+ lenders for the best rates",
                  "Fast approval — same day in most cases",
                  "Expert broker: Erin Crofton, Finance Consultant",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {point}
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-5 mb-5">
                <p className="text-sm text-muted-foreground mb-1">Finance Consultant</p>
                <p className="font-bold text-white text-lg">Erin Crofton</p>
                <a href="tel:0894469893" className="flex items-center gap-2 text-primary hover:underline font-semibold mt-1">
                  <Phone className="w-4 h-4" /> (08) 9446 9893
                </a>
              </div>

              <a href="https://www.strattonfinance.com.au/wanneroo" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider h-12 rounded-xl shadow-[0_4px_14px_rgba(245,185,66,0.25)] gap-2" data-testid="button-stratton-direct">
                  Get a Quote Now <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { icon: <Users className="w-6 h-6 text-primary" />, stat: "40+", label: "Lenders compared" },
              { icon: <TrendingDown className="w-6 h-6 text-primary" />, stat: "Low", label: "Competitive rates" },
              { icon: <Clock className="w-6 h-6 text-primary" />, stat: "Same day", label: "Approvals" },
              { icon: <Star className="w-6 h-6 text-primary" />, stat: "Top rated", label: "Finance broker" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 py-8 px-2 text-center">
                {item.icon}
                <p className="text-2xl md:text-3xl font-heading tracking-wider text-white">{item.stat}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Erin / Stratton Wanneroo */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
              <img
                src={ERIN_IMG}
                alt="Erin Crofton, Stratton Finance Consultant in Wanneroo, Perth"
                className="w-full h-full object-cover aspect-[4/3]"
                loading="lazy"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/95 to-transparent p-6">
                <p className="text-white font-bold text-lg">Erin Crofton</p>
                <p className="text-sm text-primary">Finance Consultant · Stratton Finance Wanneroo</p>
              </div>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-heading tracking-wider mb-5 text-white">
                YOUR LOCAL <span className="text-primary">STRATTON</span> EXPERT
              </h2>
              <p className="text-muted-foreground mb-5 leading-relaxed">
                Based in Wanneroo, Perth, <strong className="text-white">Erin Crofton</strong> is your dedicated Stratton
                Finance consultant. She does the legwork — comparing 40+ lenders to secure a sharp rate, handling the
                paperwork, and guiding you from enquiry to approval, often on the same day.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Personalised service from a real, local broker",
                  "Honest advice with no obligation to proceed",
                  "Finance for any budget — from $5,000 to $100,000+",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> {point}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <a href="tel:0894469893">
                  <Button variant="outline" className="h-12 rounded-xl gap-2 border-border" data-testid="button-call-erin">
                    <Phone className="w-4 h-4 text-primary" /> Call Erin: (08) 9446 9893
                  </Button>
                </a>
                <a href="https://www.strattonfinance.com.au/wanneroo" target="_blank" rel="noopener noreferrer">
                  <Button className="h-12 rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                    Visit Stratton Wanneroo <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loan types with imagery */}
      <section className="py-20 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading tracking-wider mb-4 text-white">WHAT CAN STRATTON HELP WITH?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">From your next car to growing your business — Stratton Finance has a loan for it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { img: CAR_IMG, icon: <Car className="w-6 h-6 text-primary" />, title: "Car Finance", desc: "New, used, or prestige — Stratton finds you the best car loan rate from 40+ lenders, with a simple online process and fast approval." },
              { img: PERSONAL_IMG, icon: <Banknote className="w-6 h-6 text-primary" />, title: "Personal Loans", desc: "Cash for a renovation, holiday, wedding, or debt consolidation — a competitive personal loan with flexible terms." },
              { img: COMMERCIAL_IMG, icon: <Building2 className="w-6 h-6 text-primary" />, title: "Commercial & Asset Finance", desc: "Business equipment, vehicles and asset finance for sole traders through to large enterprises." },
            ].map((item, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/40 transition-colors overflow-hidden p-0">
                <div className="relative h-44 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 bg-primary/20 border border-primary/30 rounded-lg p-2 backdrop-blur-sm">
                    {item.icon}
                  </div>
                </div>
                <CardContent className="p-6">
                  <CardTitle className="text-white mb-3">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry form */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-heading tracking-wider mb-4 text-white">GET A FREE FINANCE QUOTE</h2>
            <p className="text-muted-foreground">Fill in the form below and Erin from Stratton Finance will be in touch within one business day.</p>
          </div>

          {formSubmitted ? (
            <div className="bg-card border border-green-500/30 rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-heading tracking-wider text-white mb-3">ENQUIRY RECEIVED!</h3>
              <p className="text-muted-foreground">
                Thanks! Erin from Stratton Finance will contact you within one business day.
                For urgent enquiries call <a href="tel:0894469893" className="text-primary font-semibold hover:underline">(08) 9446 9893</a>.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fin-first" className="text-muted-foreground">First Name *</Label>
                    <Input id="fin-first" name="firstName" placeholder="John" required className="bg-background h-12" data-testid="input-finance-first-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fin-last" className="text-muted-foreground">Last Name *</Label>
                    <Input id="fin-last" name="lastName" placeholder="Smith" required className="bg-background h-12" data-testid="input-finance-last-name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fin-phone" className="text-muted-foreground">Phone Number *</Label>
                    <Input id="fin-phone" name="phone" type="tel" placeholder="04xx xxx xxx" required className="bg-background h-12" data-testid="input-finance-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fin-email" className="text-muted-foreground">Email Address *</Label>
                    <Input id="fin-email" name="email" type="email" placeholder="john@example.com" required className="bg-background h-12" data-testid="input-finance-email" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fin-type" className="text-muted-foreground">Finance Type *</Label>
                    <Select name="financeType" required>
                      <SelectTrigger id="fin-type" className="bg-background h-12">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="car">Car Finance</SelectItem>
                        <SelectItem value="personal">Personal Loan</SelectItem>
                        <SelectItem value="commercial">Commercial / Business</SelectItem>
                        <SelectItem value="asset">Asset Finance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fin-amount" className="text-muted-foreground">Loan Amount (approx) *</Label>
                    <Select name="loanAmount" required>
                      <SelectTrigger id="fin-amount" className="bg-background h-12">
                        <SelectValue placeholder="Select amount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5-10k">$5,000 – $10,000</SelectItem>
                        <SelectItem value="10-25k">$10,000 – $25,000</SelectItem>
                        <SelectItem value="25-50k">$25,000 – $50,000</SelectItem>
                        <SelectItem value="50-100k">$50,000 – $100,000</SelectItem>
                        <SelectItem value="100k+">$100,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold tracking-wider rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_rgba(245,185,66,0.25)] transition-all hover:-translate-y-0.5" data-testid="button-finance-submit">
                  SUBMIT ENQUIRY — FREE, NO OBLIGATION
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Your details are passed securely to Stratton Finance (ACL 364340). By submitting you agree to be contacted regarding your finance enquiry.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Star className="w-8 h-8" />, title: "Top Rated", sub: "Leading finance broker" },
              { icon: <Shield className="w-8 h-8" />, title: "ACL Licensed", sub: "ACL 364340" },
              { icon: <CheckCircle2 className="w-8 h-8" />, title: "AFCA Member", sub: "Dispute resolution" },
              { icon: <Banknote className="w-8 h-8" />, title: "40+ Lenders", sub: "Sharp rates" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                {item.icon}
                <p className="font-bold">{item.title}</p>
                <p className="text-sm opacity-80">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
