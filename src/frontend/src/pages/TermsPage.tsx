import { Link } from 'react-router-dom'
import { Mail, ScrollText } from 'lucide-react'
import { LegalPageLayout, Term } from '../components/layout/LegalPageLayout'

const sections = [
  { id: 'interpretation-definitions', label: 'Interpretation and Definitions' },
  { id: 'acknowledgment', label: 'Acknowledgment' },
  { id: 'external-links', label: 'Links to Other Websites' },
  { id: 'social-media-links', label: 'Links from a Third-Party Social Media Service' },
  { id: 'termination', label: 'Termination' },
  { id: 'limitation-liability', label: 'Limitation of Liability' },
  { id: 'as-is-disclaimer', label: '\u201cAS IS\u201d and \u201cAS AVAILABLE\u201d Disclaimer' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'disputes-resolution', label: 'Disputes Resolution' },
  { id: 'eu-users', label: 'For European Union (EU) Users' },
  { id: 'us-compliance', label: 'United States Legal Compliance' },
  { id: 'severability-waiver', label: 'Severability and Waiver' },
  { id: 'translation-interpretation', label: 'Translation Interpretation' },
  { id: 'changes-terms', label: 'Changes to These Terms and Conditions' },
  { id: 'contact-us', label: 'Contact Us' },
]

const linkClass =
  'font-medium text-brand outline-none rounded transition-colors duration-200 hover:text-brand-deep focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white'

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      lastUpdated="Last updated: August 10, 2026"
      icon={ScrollText}
      sections={sections}
      intro={
        <p>Please read these terms and conditions carefully before using Our Service.</p>
      }
    >
      {/* Interpretation and Definitions */}
      <section id="interpretation-definitions" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Interpretation and Definitions
        </h2>

        <h3 className="mt-6 text-base font-semibold tracking-tight">Interpretation</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The words whose initial letters are capitalized have meanings defined under the following
          conditions. The following definitions shall have the same meaning regardless of whether
          they appear in singular or in plural.
        </p>

        <h3 className="mt-6 text-base font-semibold tracking-tight">Definitions</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          For the purposes of these Terms and Conditions:
        </p>
        <ul className="mt-3 flex flex-col gap-4">
          <Term name="Affiliate">
            means an entity that controls, is controlled by, or is under common control with a
            party, where &ldquo;control&rdquo; means ownership of 50% or more of the shares, equity
            interest or other securities entitled to vote for election of directors or other
            managing authority.
          </Term>
          <Term name="Country/State">refers to: Rwanda</Term>
          <Term name="Company">
            (referred to as either &ldquo;the Company&rdquo;, &ldquo;We&rdquo;, &ldquo;Us&rdquo; or
            &ldquo;Our&rdquo; in these Terms and Conditions) refers to finsave ai.
          </Term>
          <Term name="Device">
            means any device that can access the Service such as a computer, a cell phone or a
            digital tablet.
          </Term>
          <Term name="Service">refers to the Website.</Term>
          <Term name="Terms and Conditions">
            (also referred to as &ldquo;Terms&rdquo;) means these Terms and Conditions, including
            any documents expressly incorporated by reference, which govern Your access to and use
            of the Service and form the entire agreement between You and the Company regarding the
            Service. These Terms and Conditions have been created with the help of the Terms and
            Conditions Generator.
          </Term>
          <Term name="Third-Party Social Media Service">
            means any services or content (including data, information, products or services)
            provided by a third party that is displayed, included, made available, or linked to
            through the Service.
          </Term>
          <Term name="Website">
            refers to finsave ai, accessible from{' '}
            <a href="https://finsave.aitoolshq.space" className={linkClass}>
              https://finsave.aitoolshq.space
            </a>
          </Term>
          <Term name="You">
            means the individual accessing or using the Service, or the company, or other legal
            entity on behalf of which such individual is accessing or using the Service, as
            applicable.
          </Term>
        </ul>
      </section>

      {/* Acknowledgment */}
      <section id="acknowledgment" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Acknowledgment</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          These are the Terms and Conditions governing the use of this Service and the agreement
          between You and the Company. These Terms and Conditions set out the rights and obligations
          of all users regarding the use of the Service.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Your access to and use of the Service is conditioned on Your acceptance of and compliance
          with these Terms and Conditions. These Terms and Conditions apply to all visitors, users
          and others who access or use the Service.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          By accessing or using the Service You agree to be bound by these Terms and Conditions. If
          You disagree with any part of these Terms and Conditions then You may not access the
          Service.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          You represent that you are over the age of 18. The Company does not permit those under 18
          to use the Service.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Your access to and use of the Service is also subject to Our Privacy Policy, which
          describes how We collect, use, and disclose personal information. Please read Our{' '}
          <Link to="/privacy" className={linkClass}>
            Privacy Policy
          </Link>{' '}
          carefully before using Our Service.
        </p>
      </section>

      {/* Links to Other Websites */}
      <section id="external-links" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Links to Other Websites
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Our Service may contain links to third-party websites or services that are not owned or
          controlled by the Company.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          The Company has no control over, and assumes no responsibility for, the content, privacy
          policies, or practices of any third-party websites or services. You further acknowledge
          and agree that the Company shall not be responsible or liable, directly or indirectly, for
          any damage or loss caused or alleged to be caused by or in connection with the use of or
          reliance on any such content, goods or services available on or through any such websites
          or services.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          We strongly advise You to read the terms and conditions and privacy policies of any
          third-party websites or services that You visit.
        </p>
      </section>

      {/* Links from a Third-Party Social Media Service */}
      <section id="social-media-links" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Links from a Third-Party Social Media Service
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The Service may display, include, make available, or link to content or services provided
          by a Third-Party Social Media Service. A Third-Party Social Media Service is not owned or
          controlled by the Company, and the Company does not endorse or assume responsibility for
          any Third-Party Social Media Service.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          You acknowledge and agree that the Company shall not be responsible or liable, directly or
          indirectly, for any damage or loss caused or alleged to be caused by or in connection with
          Your access to or use of any Third-Party Social Media Service, including any content,
          goods, or services made available through them. Your use of any Third-Party Social Media
          Service is governed by that Third-Party Social Media Service's terms and privacy policies.
        </p>
      </section>

      {/* Termination */}
      <section id="termination" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Termination</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          We may terminate or suspend Your access immediately, without prior notice or liability,
          for any reason whatsoever, including without limitation if You breach these Terms and
          Conditions.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Upon termination, Your right to use the Service will cease immediately.
        </p>
      </section>

      {/* Limitation of Liability */}
      <section id="limitation-liability" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Limitation of Liability
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Notwithstanding any damages that You might incur, the entire liability of the Company and
          any of its suppliers under any provision of these Terms and Your exclusive remedy for all
          of the foregoing shall be limited to the amount actually paid by You through the Service
          or 100 USD if You haven't purchased anything through the Service.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          To the maximum extent permitted by applicable law, in no event shall the Company or its
          suppliers be liable for any special, incidental, indirect, or consequential damages
          whatsoever (including, but not limited to, damages for loss of profits, loss of data or
          other information, for business interruption, for personal injury, loss of privacy arising
          out of or in any way related to the use of or inability to use the Service, third-party
          software and/or third-party hardware used with the Service, or otherwise in connection
          with any provision of these Terms), even if the Company or any supplier has been advised
          of the possibility of such damages and even if the remedy fails of its essential purpose.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Some states do not allow the exclusion of implied warranties or limitation of liability
          for incidental or consequential damages, which means that some of the above limitations
          may not apply. In these states, each party's liability will be limited to the greatest
          extent permitted by law.
        </p>
      </section>

      {/* "AS IS" and "AS AVAILABLE" Disclaimer */}
      <section id="as-is-disclaimer" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; Disclaimer
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The Service is provided to You &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; and with
          all faults and defects without warranty of any kind. To the maximum extent permitted under
          applicable law, the Company, on its own behalf and on behalf of its Affiliates and its and
          their respective licensors and service providers, expressly disclaims all warranties,
          whether express, implied, statutory or otherwise, with respect to the Service, including
          all implied warranties of merchantability, fitness for a particular purpose, title and
          non-infringement, and warranties that may arise out of course of dealing, course of
          performance, usage or trade practice. Without limitation to the foregoing, the Company
          provides no warranty or undertaking, and makes no representation of any kind that the
          Service will meet Your requirements, achieve any intended results, be compatible or work
          with any other software, applications, systems or services, operate without interruption,
          meet any performance or reliability standards or be error free or that any errors or
          defects can or will be corrected.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Without limiting the foregoing, neither the Company nor any of the company's provider
          makes any representation or warranty of any kind, express or implied: (i) as to the
          operation or availability of the Service, or the information, content, and materials or
          products included thereon; (ii) that the Service will be uninterrupted or error-free;
          (iii) as to the accuracy, reliability, or currency of any information or content provided
          through the Service; or (iv) that the Service, its servers, the content, or e-mails sent
          from or on behalf of the Company are free of viruses, scripts, trojan horses, worms,
          malware, timebombs or other harmful components.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Some jurisdictions do not allow the exclusion of certain types of warranties or
          limitations on applicable statutory rights of a consumer, so some or all of the above
          exclusions and limitations may not apply to You. But in such a case the exclusions and
          limitations set forth in this section shall be applied to the greatest extent enforceable
          under applicable law.
        </p>
      </section>

      {/* Governing Law */}
      <section id="governing-law" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Governing Law</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The laws of the Country/State, excluding its conflicts of law rules, shall govern these
          Terms and Your use of the Service. Your use of the Application may also be subject to
          other local, state, national, or international laws.
        </p>
      </section>

      {/* Disputes Resolution */}
      <section id="disputes-resolution" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Disputes Resolution</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          If You have any concern or dispute about the Service, You agree to first try to resolve
          the dispute informally by contacting the Company.
        </p>
      </section>

      {/* For European Union (EU) Users */}
      <section id="eu-users" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          For European Union (EU) Users
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          If You are a European Union consumer, you will benefit from any mandatory provisions of
          the law of the country in which You are resident.
        </p>
      </section>

      {/* United States Legal Compliance */}
      <section id="us-compliance" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          United States Legal Compliance
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          You represent and warrant that (i) You are not located in a country that is subject to the
          United States government embargo, or that has been designated by the United States
          government as a &ldquo;terrorist supporting&rdquo; country, and (ii) You are not listed on
          any United States government list of prohibited or restricted parties.
        </p>
      </section>

      {/* Severability and Waiver */}
      <section id="severability-waiver" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Severability and Waiver
        </h2>

        <h3 className="mt-6 text-base font-semibold tracking-tight">Severability</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          If any provision of these Terms is held to be unenforceable or invalid, such provision
          will be changed and interpreted to accomplish the objectives of such provision to the
          greatest extent possible under applicable law and the remaining provisions will continue
          in full force and effect.
        </p>

        <h3 className="mt-6 text-base font-semibold tracking-tight">Waiver</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Except as provided herein, the failure to exercise a right or to require performance of an
          obligation under these Terms shall not affect a party's ability to exercise such right or
          require such performance at any time thereafter nor shall the waiver of a breach
          constitute a waiver of any subsequent breach.
        </p>
      </section>

      {/* Translation Interpretation */}
      <section id="translation-interpretation" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Translation Interpretation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          These Terms and Conditions may have been translated if We have made them available to You
          on our Service. You agree that the original English text shall prevail in the case of a
          dispute.
        </p>
      </section>

      {/* Changes to These Terms and Conditions */}
      <section id="changes-terms" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Changes to These Terms and Conditions
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          We reserve the right, at Our sole discretion, to modify or replace these Terms at any
          time. If a revision is material We will make reasonable efforts to provide at least 30
          days' notice prior to any new terms taking effect. What constitutes a material change will
          be determined at Our sole discretion.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          By continuing to access or use Our Service after those revisions become effective, You
          agree to be bound by the revised terms. If You do not agree to the new terms, in whole or
          in part, please stop using the Service.
        </p>
      </section>

      {/* Contact Us */}
      <section id="contact-us" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Contact Us</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          If you have any questions about these Terms and Conditions, You can contact us:
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm leading-relaxed text-ink/70">
          <Mail size={15} aria-hidden="true" className="shrink-0 text-brand" />
          <span>
            By email:{' '}
            <a href="mailto:no-reply@aitoolshq.space" className={linkClass}>
              no-reply@aitoolshq.space
            </a>
          </span>
        </p>
      </section>
    </LegalPageLayout>
  )
}
