import { Link } from "wouter";

const EFFECTIVE_DATE = "September 3, 2026";

export default function Privacy() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container max-w-4xl">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400">Legal</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white lg:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-sm text-slate-400">Effective {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-8 text-sm leading-7 text-slate-300">
          <p>
            This Privacy Policy explains how Ocasio Collective, LLC d/b/a The OC Group ("OCG," "we," "us," or "our") handles information when you use our websites, applications, and connected services, including OCG MEDIA.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white">Information we collect</h2>
            <p className="mt-2">
              We may collect information you provide directly, such as contact details, messages, property or business information, and content you choose to upload. When you connect a third-party account, we may also receive account identifiers, display names, profile information, authorization scopes, and other data that the third-party provider makes available under the permissions you approve.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">TikTok and other connected accounts</h2>
            <p className="mt-2">
              OCG MEDIA can connect to third-party platforms, including TikTok, using OAuth authorization. For TikTok, OCG MEDIA may request permissions such as <span className="font-mono text-slate-200">user.info.basic</span>, <span className="font-mono text-slate-200">video.upload</span>, and <span className="font-mono text-slate-200">video.publish</span>. These permissions are used only to identify the connected account, prepare or upload user-selected media, and perform posting actions that the authorized user has approved.
            </p>
            <p className="mt-2">
              OCG MEDIA does not independently publish TikTok content without the applicable approval gate. You may disconnect a connected account or revoke access through the applicable provider. Provider credentials and access tokens are treated as confidential authentication data and are not intentionally exposed in the public application interface.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">How we use information</h2>
            <p className="mt-2">
              We use information to operate, secure, maintain, and improve OCG services; provide requested workflows and connected-account functions; prepare and manage user-approved content; respond to inquiries; diagnose errors; prevent misuse; and comply with legal obligations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Service providers and disclosures</h2>
            <p className="mt-2">
              We may use infrastructure, hosting, communications, analytics, artificial-intelligence, storage, and platform providers to operate our services. Information may be shared with those providers only as reasonably necessary to provide the service or comply with law. We do not sell TikTok user data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Security and token handling</h2>
            <p className="mt-2">
              We use reasonable administrative and technical safeguards designed to protect information. Authentication secrets, access tokens, and refresh tokens, when issued, are intended to be stored in protected server-side systems or managed secret stores rather than exposed to public clients. No system can guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Retention and deletion</h2>
            <p className="mt-2">
              We retain information only for as long as reasonably necessary for the purposes described in this policy, to maintain service integrity, or to satisfy legal obligations. If you disconnect a third-party account, we stop using the authorization for future actions. You may request deletion of information associated with your use of OCG services by contacting us through our contact page.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Your choices</h2>
            <p className="mt-2">
              You may choose not to connect third-party accounts, may revoke provider permissions, and may request access, correction, or deletion where applicable. Revoking a provider authorization may disable connected features that depend on that authorization.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Children</h2>
            <p className="mt-2">
              OCG business services are not directed to children under 13, and we do not knowingly collect personal information from children under 13 through these services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Changes to this policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy when our services or legal obligations change. The effective date above identifies the current version.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p className="mt-2">
              For privacy questions, account disconnection, or deletion requests, contact Ocasio Collective, LLC d/b/a The OC Group through our <Link href="/contact" className="text-blue-400 hover:text-blue-300">contact page</Link>. OCG is based in Wichita, Kansas, United States.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
