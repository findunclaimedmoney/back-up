import { Car, Home, Banknote, CheckCircle2, ExternalLink, Phone, Shield, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Finance() {
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center rounded-full border border-border bg-secondary/50 px-4 py-1.5 mb-8">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5 text-primary" /> FINANCE PARTNER
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-heading tracking-wider mb-6 text-white leading-none">
                SMART <span className="text-primary">FINANCE</span> OPTIONS
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Found your missing cash? Put it to work. Our trusted finance partner Stratton Finance can help you secure a competitive loan — whether it's for a car, home, or investment.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Car Loans", "Personal Loans", "Commercial Finance", "Asset Finance"].map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground font-medium">
                    {tag}
                  </span>
                ))}
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
                  "Australia's #1 rated car finance broker",
                  "Access to 40+ lenders for best rates",
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

              <a
                href="https://www.strattonfinance.com.au/wanneroo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider h-12 rounded-xl shadow-[0_4px_14px_rgba(245,185,66,0.25)] gap-2" data-testid="button-stratton-direct">
                  Get a Quote Now <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Loan types */}
      <section className="py-20 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading tracking-wider mb-4 text-white">WHAT CAN STRATTON HELP WITH?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Car className="w-8 h-8 text-primary" />, title: "Car Finance", desc: "New, used, or prestige — Stratton finds you the best car loan rate from 40+ lenders. Simple online process with fast approval." },
              { icon: <Banknote className="w-8 h-8 text-primary" />, title: "Personal Loans", desc: "Need cash for a renovation, holiday, or debt consolidation? Get a competitive personal loan with flexible terms." },
              { icon: <Home className="w-8 h-8 text-primary" />, title: "Commercial Finance", desc: "Business equipment, vehicles, and asset finance solutions for sole traders through to large enterprises." },
            ].map((item, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/40 transition-colors text-center p-6">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <CardTitle className="text-white mb-3">{item.title}</CardTitle>
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry form — Option 1: webform stays on site */}
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
              { icon: <Star className="w-8 h-8" />, title: "Top Rated", sub: "Australia's #1 car finance" },
              { icon: <Shield className="w-8 h-8" />, title: "ACL Licensed", sub: "ACL 364340" },
              { icon: <CheckCircle2 className="w-8 h-8" />, title: "AFCA Member", sub: "Dispute resolution" },
              { icon: <Banknote className="w-8 h-8" />, title: "40+ Lenders", sub: "Best rate guaranteed" },
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
