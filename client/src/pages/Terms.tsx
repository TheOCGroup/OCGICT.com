import { Link } from "wouter";

const EFFECTIVE_DATE = "September 3, 2026";

export default function Terms() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container max-w-4xl">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-blue-400">Legal</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white lg:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-sm text-slate-400">Effective {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-8 text-sm leading-7 text-slate-300">
          <p>
            These Terms of Service govern your use of websites, applications, and connected services operated by Ocasio Collective, LLC d/b/a The OC Group ("OCG," "we," "us," or "our"), including OCG MEDIA. By using the services, you agree to these Terms.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-white">Use of the services</h2>
            <p className="mt-2">
              You may use OCG services only for lawful purposes and in accordance with these Terms and any applicable third-party platform rules. You are responsible for information, media, instructions, and credentials you provide and for ensuring you have the rights and authority required to use them.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Connected third-party accounts</h2>
            <p className="mt-2">
              Some features allow you to connect accounts from third-party services such as TikTok. Connecting an account authorizes OCG MEDIA to use only the permissions you approve through the provider's authorization process. Availability and behavior of connected features depend on the third-party provider's APIs, policies, review requirements, rate limits, and account status.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Content preparation and publishing</h2>
            <p className="mt-2">
              You retain responsibility for content you submit, create, approve, upload, or publish through OCG services. You represent that you have the necessary rights to use that content and that it does not violate law, intellectual-property rights, privacy rights, or platform rules.
            </p>
            <p className="mt-2">
              OCG MEDIA is designed to use approval controls for public publishing workflows. A connected account alone does not constitute authorization for OCG to publish arbitrary content. Public posting actions must satisfy the applicable user or founder approval gate configured in the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Prohibited use</h2>
            <p className="mt-2">
              You may not use the services to violate law, impersonate others, access accounts without authorization, distribute malicious software, interfere with service operation, bypass security or approval controls, infringe intellectual property, or abuse third-party platform APIs.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Accounts and security</h2>
            <p className="mt-2">
              You are responsible for safeguarding your accounts and for promptly revoking or reporting access you no longer authorize. Do not expose access tokens, client secrets, passwords, or other authentication credentials in public messages or interfaces.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Intellectual property</h2>
            <p className="mt-2">
              OCG and its licensors retain rights in the OCG services, software, branding, interfaces, documentation, and original materials, excluding content owned by users or third parties. No license is granted except the limited right to use the services in accordance with these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Third-party services</h2>
            <p className="mt-2">
              Third-party platforms are governed by their own terms and policies. OCG does not control those platforms and cannot guarantee uninterrupted access, approval, distribution, availability, or continued API functionality.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Disclaimers</h2>
            <p className="mt-2">
              The services are provided on an "as available" basis to the extent permitted by law. OCG does not guarantee that every workflow, provider integration, recommendation, generated output, or third-party API will be error-free or continuously available. You remain responsible for reviewing material decisions and public content before acting on them.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Limitation of liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by applicable law, OCG will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from use of the services, third-party platform actions, lost access, lost profits, or lost data. Any liability that cannot legally be excluded is limited to the extent permitted by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Suspension and termination</h2>
            <p className="mt-2">
              We may suspend or terminate access when reasonably necessary to protect users, comply with law or provider requirements, respond to abuse, or preserve security and service integrity. You may stop using the services and revoke connected-account permissions at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Changes</h2>
            <p className="mt-2">
              We may update these Terms as the services or applicable requirements change. Continued use after an updated version becomes effective constitutes acceptance of the revised Terms where permitted by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Governing law and contact</h2>
            <p className="mt-2">
              These Terms are governed by applicable law in the State of Kansas, without regard to conflict-of-law principles, except where another law must apply. Questions may be submitted to Ocasio Collective, LLC d/b/a The OC Group through our <Link href="/contact" className="text-blue-400 hover:text-blue-300">contact page</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
