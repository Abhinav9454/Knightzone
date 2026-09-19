import { Shield, Users } from "lucide-react";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "Introduction",
    points: [
      "We are committed to protecting your privacy and handling data transparently.",
      "This policy applies to web app, APIs, and official community channels.",
      "Effective date: March 1, 2026.",
    ],
  },
  {
    title: "Information We Collect",
    points: [
      "Personal: name, email, phone, profile and educational details.",
      "Technical: IP address, browser/device info, cookie identifiers.",
      "Usage: pages visited, feature usage, contest and assessment activity.",
    ],
  },
  {
    title: "How We Use Information",
    points: [
      "Account creation, identity verification, and service delivery.",
      "Security monitoring, fraud prevention, and legal compliance.",
      "Product improvements, personalization, and support communications.",
    ],
  },
  {
    title: "Cookie Policy",
    points: [
      "Essential cookies keep sessions stable and secure.",
      "Optional analytics cookies improve platform experience.",
      "You can update cookie preferences from settings.",
    ],
  },
  {
    title: "Data Sharing",
    points: [
      "Data is shared only with trusted processors and legal authorities when required.",
      "We do not sell personal data.",
      "Business transfers may require controlled data migration.",
    ],
  },
  {
    title: "Data Storage & Security",
    points: [
      "Data is stored with encryption at rest and in transit.",
      "Retention periods align with legal and operational requirements.",
      "Incident response includes breach notification obligations.",
    ],
  },
  {
    title: "Your Rights",
    points: [
      "Request access, correction, deletion, or portability of data.",
      "Opt out from non-essential communications and analytics where available.",
      "Withdraw consent where processing depends on consent.",
    ],
  },
  {
    title: "Children's Privacy",
    points: [
      "For minors, parental/guardian consent may be required by law.",
      "Unauthorized child data discovered is removed promptly.",
    ],
  },
  {
    title: "International Transfers",
    points: [
      "Cross-border processing uses appropriate safeguards and contract controls.",
      "Regional legal requirements are followed where applicable.",
    ],
  },
  {
    title: "GDPR & CCPA",
    points: [
      "GDPR legal basis and user rights are respected for EU users.",
      "California residents can exercise CCPA rights including access and deletion.",
      "DPO and privacy contacts are available for compliance matters.",
    ],
  },
  {
    title: "Updates to Policy",
    points: [
      "Policy updates are communicated via product notice and/or email.",
      "Continued service usage after update indicates acceptance.",
    ],
  },
  {
    title: "Contact Us",
    points: [
      "Privacy Team: privacy@knightsbattlezone.com",
      "DPO: dpo@knightsbattlezone.com",
      "Address: 500 Market Street, San Francisco, CA 94105, USA",
      "Response commitment: within 72 hours.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy",
    dateModified: "2026-03-01",
  };

  return (
    <article className="space-y-6">
      <SeoJsonLd data={schema} />
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Legal</p>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Effective date: March 1, 2026</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card p-5">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Shield size={18} />
          </div>
          <h2 className="text-xl font-semibold">Data Protection Commitment</h2>
          <p className="mt-1 text-sm text-muted-foreground">Security-by-design controls, least-privilege access, and strong encryption practices.</p>
        </div>
        <div className="glass-card p-5">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Users size={18} />
          </div>
          <h2 className="text-xl font-semibold">Your Rights First</h2>
          <p className="mt-1 text-sm text-muted-foreground">You can request data access, correction, deletion, and portability through support channels.</p>
        </div>
      </section>

      <section className="space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="glass-card p-5">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {section.points.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-semibold">Need privacy assistance?</h2>
        <p className="mt-1 text-sm text-muted-foreground">For GDPR, CCPA, or account-data requests, raise a privacy ticket with required identifiers.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button>Contact privacy team</Button>
          <Button variant="outline">Request data export</Button>
          <Button variant="outline">Delete account data</Button>
        </div>
      </section>
    </article>
  );
}
