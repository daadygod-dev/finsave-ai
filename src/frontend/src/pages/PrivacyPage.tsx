import { Mail, ShieldCheck } from 'lucide-react'
import { LegalPageLayout, Term } from '../components/layout/LegalPageLayout'

const sections = [
  { id: 'interpretation-definitions', label: 'Interpretation and Definitions' },
  { id: 'collecting-data', label: 'Collecting and Using Your Personal Information' },
  { id: 'types-of-data', label: 'Types of Data Collected' },
  { id: 'tracking-cookies', label: 'Tracking Technologies and Cookies' },
  { id: 'use-of-data', label: 'Use of Your Personal Data' },
  { id: 'sharing-of-data', label: 'Sharing Your Personal Data' },
  { id: 'sms-notice', label: 'Text Messages Privacy Notice' },
  { id: 'retention', label: 'Retention of Your Personal Data' },
  { id: 'transfer', label: 'Transfer of Your Personal Data' },
  { id: 'delete-data', label: 'Delete Your Personal Data' },
  { id: 'disclosure', label: 'Disclosure of Your Personal Data' },
  { id: 'security', label: 'Security of Your Personal Data' },
  { id: 'childrens-privacy', label: "Children's and Minors' Privacy" },
  { id: 'external-links', label: 'Links to Other Websites' },
  { id: 'policy-changes', label: 'Changes to this Privacy Policy' },
  { id: 'contact-us', label: 'Contact Us' },
]

const linkClass =
  'font-medium text-brand outline-none rounded transition-colors duration-200 hover:text-brand-deep focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white'

export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="Last updated: August 10, 2026"
      icon={ShieldCheck}
      sections={sections}
      intro={
        <>
          <p>
            This Privacy Policy describes Our policies and procedures on the collection, use and
            disclosure of Your information when You use the Service and tells You about Your privacy
            rights and how the law protects You.
          </p>
          <p>
            We use Your Personal Data to provide and improve the Service. We collect, use, and
            disclose Your information as described in this Privacy Policy and, where required by
            applicable law, only where We have a valid legal basis to do so, including Your consent
            (where consent is required). This Privacy Policy has been created with the help of the
            Privacy Policy Generator.
          </p>
        </>
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
          For the purposes of this Privacy Policy:
        </p>
        <ul className="mt-3 flex flex-col gap-4">
          <Term name="Account">
            means a unique account created for You to access Our Service or parts of Our Service.
          </Term>
          <Term name="Affiliate">
            means an entity that controls, is controlled by, or is under common control with a
            party, where &ldquo;control&rdquo; means ownership of 50% or more of the shares, equity
            interest or other securities entitled to vote for election of directors or other
            managing authority.
          </Term>
          <Term name="Company">
            (referred to as either &ldquo;the Company&rdquo;, &ldquo;We&rdquo;, &ldquo;Us&rdquo; or
            &ldquo;Our&rdquo; in this Privacy Policy) refers to finsave ai.
          </Term>
          <Term name="Cookies">
            are small files that are placed on Your computer, mobile device or any other device by a
            website, containing the details of Your browsing history on that website, among its many
            uses.
          </Term>
          <Term name="Country/State">refers to: Rwanda.</Term>
          <Term name="Device">
            means any device that can access the Service, such as a computer, a cell phone or a
            digital tablet.
          </Term>
          <Term name="Personal Data">
            (or &ldquo;Personal Information&rdquo;) is any information that relates to an identified
            or identifiable individual. We use &ldquo;Personal Data&rdquo; and &ldquo;Personal
            Information&rdquo; interchangeably unless a law uses a specific term.
          </Term>
          <Term name="Service">refers to the Website.</Term>
          <Term name="Service Provider">
            means any natural or legal person who processes the data on behalf of the Company. It
            refers to third-party companies or individuals employed by the Company to facilitate the
            Service, to provide the Service on behalf of the Company, to perform services related to
            the Service or to assist the Company in analyzing how the Service is used.
          </Term>
          <Term name="Usage Data">
            refers to data collected automatically, either generated by the use of the Service or
            from the Service infrastructure itself (for example, the duration of a page visit).
          </Term>
          <Term name="User">means any individual who accesses or uses the Service.</Term>
          <Term name="Website">
            refers to finsave ai, accessible from{' '}
            <a href="https://finsave.aitoolshq.space" className={linkClass}>
              https://finsave.aitoolshq.space
            </a>
            .
          </Term>
          <Term name="You">
            means the individual accessing or using the Service, or the company, or other legal
            entity on behalf of which such individual is accessing or using the Service, as
            applicable.
          </Term>
        </ul>
      </section>

      {/* Collecting and Using Your Personal Information */}
      <section id="collecting-data" className="scroll-mt-8">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Collecting and Using Your Personal Information
        </h2>

        <h3 id="types-of-data" className="mt-6 text-base font-semibold tracking-tight">
          Types of Data Collected
        </h3>

        <h4 className="mt-5 text-sm font-semibold tracking-tight">Personal Data</h4>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          While using Our Service, We may ask You to provide Us with certain personally identifiable
          information that can be used to contact or identify You. Personally identifiable
          information may include, but is not limited to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/70">
          <li>Email address</li>
          <li>First name and last name</li>
          <li>Phone number</li>
          <li>Address, State, Province, ZIP/Postal code, City</li>
        </ul>

        <h4 className="mt-6 text-sm font-semibold tracking-tight">Usage Data</h4>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Usage Data is collected automatically when using the Service.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP
          address), browser type, browser version, the pages of Our Service that You visit, the time
          and date of Your visit, the time spent on those pages, unique device identifiers and other
          diagnostic data.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          When You access the Service by or through a mobile device, We may collect certain
          information automatically, including, but not limited to, the type of mobile device You
          use, Your mobile device's unique ID, the IP address of Your mobile device, Your mobile
          operating system, the type of mobile Internet browser You use, unique device identifiers
          and other diagnostic data.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          We may also collect information that Your browser sends whenever You visit Our Service or
          when You access the Service by or through a mobile device.
        </p>

        <h3 id="tracking-cookies" className="mt-8 text-base font-semibold tracking-tight">
          Tracking Technologies and Cookies
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          We use tracking technologies (such as cookies) to track the activity and to improve Our
          Service. The technologies We use may include:
        </p>
        <ul className="mt-2 flex flex-col gap-4">
          <Term name="Cookies or Browser Cookies">
            A cookie is a small file placed on Your Device. You can instruct Your browser to refuse
            all Cookies or to indicate when a Cookie is being sent. However, if You do not accept
            Cookies, You may not be able to use some parts of Our Service.
          </Term>
          <Term name="Web Beacons">
            Certain sections of Our Service may contain small electronic files known as web beacons
            (also referred to as clear gifs, pixel tags, and single-pixel gifs) that permit the
            Company, for example, to count users who have visited those pages and for other related
            website statistics (for example, recording the popularity of a certain section and
            verifying system and server integrity).
          </Term>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">
          Cookies can be &ldquo;Persistent&rdquo; or &ldquo;Session&rdquo; Cookies. Persistent
          Cookies remain on Your personal computer or mobile device when You go offline, while
          Session Cookies are deleted as soon as You close Your web browser.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Where required by law, We use non-essential cookies (that is, Cookies other than the
          Necessary / Essential Cookies described below) only with Your consent. You can withdraw or
          change Your consent at any time using Our cookie preferences tool (if available) or
          through Your browser/device settings. Withdrawing consent does not affect the lawfulness
          of processing based on consent before its withdrawal.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          We use both Session and Persistent Cookies for the purposes set out below:
        </p>
        <ul className="mt-3 flex flex-col gap-4">
          <li className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <span className="font-semibold text-ink">Necessary / Essential Cookies</span>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Type:</span> Session Cookies
            </p>
            <p className="text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Administered by:</span> Us
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Purpose:</span> These Cookies are essential
              to provide You with services available through the Website and to enable You to use
              some of its features. They help to authenticate users and prevent fraudulent use of
              user accounts. Without these Cookies, the services that You have asked for cannot be
              provided, and We only use these Cookies to provide You with those services.
            </p>
          </li>
          <li className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <span className="font-semibold text-ink">Cookies Policy / Notice Acceptance Cookies</span>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Type:</span> Persistent Cookies
            </p>
            <p className="text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Administered by:</span> Us
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Purpose:</span> These Cookies identify
              whether users have accepted the use of cookies on the Website and record the consent
              choices You have made, so that We can honor those choices on future visits.
            </p>
          </li>
          <li className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <span className="font-semibold text-ink">Functionality Cookies</span>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Type:</span> Persistent Cookies
            </p>
            <p className="text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Administered by:</span> Us
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              <span className="font-medium text-ink/80">Purpose:</span> These Cookies allow Us to
              remember choices You make when You use the Website, such as remembering Your Account
              login details or language preference. The purpose of these Cookies is to provide You
              with a more personal experience and to avoid You having to re-enter Your preferences
              every time You use the Website.
            </p>
          </li>
        </ul>

        <h3 id="use-of-data" className="mt-8 text-base font-semibold tracking-tight">
          Use of Your Personal Data
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The Company may use Personal Data for the following purposes:
        </p>
        <ul className="mt-2 flex flex-col gap-3">
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">To provide and maintain Our Service</span>,
            including to monitor the usage of Our Service.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">To manage Your Account:</span> to manage Your
            registration as a user of the Service. The Personal Data You provide can give You access
            to different functionalities of the Service that are available to You as a registered
            user.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">For the performance of a contract:</span> the
            development, compliance and undertaking of the purchase contract for the products, items
            or services You have purchased or of any other contract with Us through the Service.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">To contact You:</span> To contact You by email,
            telephone calls, SMS, or other equivalent forms of electronic communication, such as a
            mobile application's push notifications regarding updates or informative communications
            related to the functionalities, products or contracted services, including the security
            updates, when necessary or reasonable for their implementation.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">
              To provide You with news, special offers, and general information
            </span>{' '}
            about other goods, services and events which We offer that are similar to those that You
            have already purchased or inquired about. We send such marketing communications only
            where permitted by applicable law: where prior consent is required (for example, under
            the laws applicable in the EEA and the UK), We will send them only with Your consent;
            otherwise, We may send them until You opt out. You may opt out or withdraw Your consent
            at any time by using the unsubscribe link in any marketing email We send or by
            contacting Us.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">To manage Your requests:</span> To attend and
            manage Your requests to Us.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">For business transfers:</span> We may use Your
            Personal Data to evaluate or conduct a merger, divestiture, restructuring, reorganization,
            dissolution, or other sale or transfer of some or all of Our assets, whether as a going
            concern or as part of bankruptcy, liquidation, or similar proceeding, in which Personal
            Data held by Us about Our Service users is among the assets transferred.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">For other purposes:</span> We may use Your
            information for other purposes, such as data analysis, identifying usage trends,
            determining the effectiveness of Our promotional campaigns, and evaluating and improving
            Our Service, products, services, marketing and Your experience.
          </li>
        </ul>

        <h3 id="sharing-of-data" className="mt-8 text-base font-semibold tracking-tight">
          Sharing Your Personal Data
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          We may share Your Personal Data in the following situations:
        </p>
        <ul className="mt-2 flex flex-col gap-3">
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">With Service Providers:</span> We may share
            Your Personal Data with Service Providers to monitor and analyze the use of Our Service,
            and to contact You.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">For business transfers:</span> We may share or
            transfer Your Personal Data in connection with, or during negotiations of, any merger,
            sale of Company assets, financing, or acquisition of all or a portion of Our business to
            another company.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">With Affiliates:</span> We may share Your
            Personal Data with Our affiliates, in which case We will require those affiliates to
            honor this Privacy Policy. Affiliates include Our parent company and any other
            subsidiaries, joint venture partners or other companies that We control or that are
            under common control with Us.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">With other users:</span> If Our Service offers
            public areas, when You share Personal Data or otherwise interact in the public areas
            with other users, such information may be viewed by all users and may be publicly
            distributed outside the Service.
          </li>
          <li className="text-sm leading-relaxed text-ink/70">
            <span className="font-medium text-ink/80">With Your consent:</span> We may disclose Your
            Personal Data for any other purpose with Your consent.
          </li>
        </ul>

        <h3 id="sms-notice" className="mt-8 text-base font-semibold tracking-tight">
          Text Messages Privacy Notice
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          You have the option to receive text (SMS) messages from Us. If You opt in to text messages,
          We will send You updates, notifications, and other communications as described below. When
          You opt in, We will collect and store the information You provide in connection with text
          messaging, such as Your phone number, the date and method of Your consent, and message
          delivery and read information.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          No mobile information will be shared with or sold to third parties or affiliates for
          marketing or promotional purposes. The phone numbers and consent records We collect for
          texting are never shared with anyone for any purpose, except the Service Providers that
          technically have to handle them to deliver the texts.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Consent to receive text messages is not a condition of any purchase or use of Our Service.
          If You consent to receive SMS from Us, You agree to receive text messages from Us related
          to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/70">
          <li>Customer care and support</li>
          <li>Account notifications, such as activity, status, or renewal reminders</li>
          <li>Delivery notifications and updates on the status of a delivery</li>
          <li>Authentication messages, such as one-time passwords (OTP) and passcodes</li>
          <li>Security alerts, such as suspicious login attempts or unusual account activity</li>
          <li>Marketing and promotional offers, discounts, and other promotional content</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Reply STOP to opt-out. Reply HELP for support. Message &amp; data rates may apply.
          Messaging frequency may vary. Carriers are not liable for delayed or undelivered messages.
        </p>

        <h3 id="retention" className="mt-8 text-base font-semibold tracking-tight">
          Retention of Your Personal Data
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The Company will retain Your Personal Data only for as long as is necessary for the
          purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the
          extent necessary to comply with Our legal obligations (for example, if We are required to
          retain Your data to comply with applicable laws), resolve disputes, and enforce Our legal
          agreements and policies.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Where possible, We apply shorter retention periods and/or reduce identifiability by
          deleting, aggregating, or anonymizing data. Unless otherwise stated, the retention periods
          below are maximum periods (&ldquo;up to&rdquo;) and We may delete or anonymize data sooner
          when it is no longer needed for the relevant purpose. We apply different retention periods
          to different categories of Personal Data based on the purpose of processing and legal
          obligations:
        </p>
        <ul className="mt-3 flex flex-col gap-4">
          <li className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <span className="font-semibold text-ink">Account Information</span>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              User Accounts: retained for the duration of Your Account relationship plus up to 24
              months after account closure to handle any post-termination issues or resolve disputes.
            </p>
          </li>
          <li className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <span className="font-semibold text-ink">Customer Support Data</span>
            <ul className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-ink/70">
              <li>
                Support tickets and correspondence: up to 24 months from the date of ticket closure
                to resolve follow-up inquiries, track service quality, and defend against potential
                legal claims.
              </li>
              <li>
                Chat transcripts: up to 24 months for quality assurance and staff training purposes.
              </li>
            </ul>
          </li>
          <li className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <span className="font-semibold text-ink">Usage Data</span>
            <ul className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-ink/70">
              <li>
                Website analytics data (cookies, IP addresses, device identifiers): up to 24 months
                from the date of collection, which allows us to analyze trends while respecting
                privacy principles.
              </li>
              <li>
                Server logs (IP addresses, access times): up to 24 months for security monitoring and
                troubleshooting purposes.
              </li>
            </ul>
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">
          Usage Data is retained in accordance with the retention periods described above, and may be
          retained longer only where necessary for security, fraud prevention, or legal compliance.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          We may retain Personal Data beyond the periods stated above for different reasons:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/70">
          <li>
            <span className="font-medium text-ink/80">Legal obligation:</span> We are required by law
            to retain specific data (e.g., financial records for tax authorities).
          </li>
          <li>
            <span className="font-medium text-ink/80">Legal claims:</span> Data is necessary to
            establish, exercise, or defend legal claims.
          </li>
          <li>
            <span className="font-medium text-ink/80">Your explicit request:</span> You ask Us to
            retain specific information.
          </li>
          <li>
            <span className="font-medium text-ink/80">Technical limitations:</span> Data exists in
            backup systems that are scheduled for routine deletion.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          You may request information about how long We will retain Your Personal Data by contacting
          Us.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          When retention periods expire, We securely delete or anonymize Personal Data according to
          the following procedures:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/70">
          <li>
            <span className="font-medium text-ink/80">Deletion:</span> Personal Data is removed from
            Our systems and no longer actively processed.
          </li>
          <li>
            <span className="font-medium text-ink/80">Backup retention:</span> Residual copies may
            remain in encrypted backups for a limited period consistent with Our backup retention
            schedule and are not restored except where necessary for security, disaster recovery, or
            legal compliance.
          </li>
          <li>
            <span className="font-medium text-ink/80">Anonymization:</span> In some cases, We convert
            Personal Data into anonymous statistical data that cannot be linked back to You. This
            anonymized data may be retained indefinitely for research and analytics.
          </li>
        </ul>

        <h3 id="transfer" className="mt-8 text-base font-semibold tracking-tight">
          Transfer of Your Personal Data
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Your information, including Personal Data, is processed at the Company's operating offices
          and in any other places where the parties involved in the processing are located. This
          means that this information may be transferred to — and maintained on — computers located
          outside of Your state, province, country or other governmental jurisdiction where the data
          protection laws may differ from those of Your jurisdiction.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Where required by applicable law, We will ensure that international transfers of Your
          Personal Data are subject to appropriate safeguards and, where relevant, supplementary
          measures. The Company will take all steps reasonably necessary to ensure that Your data is
          treated securely and in accordance with this Privacy Policy and no transfer of Your
          Personal Data will take place to an organization or a country unless there are adequate
          controls in place, including the security of Your data and other personal information.
        </p>

        <h3 id="delete-data" className="mt-8 text-base font-semibold tracking-tight">
          Delete Your Personal Data
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          You have the right to delete or request that We assist in deleting the Personal Data that
          We have collected about You.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Our Service may give You the ability to delete certain information about You from within
          the Service.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          You may update, amend, or delete Your information at any time by signing in to Your
          Account, if You have one, and visiting the account settings section that allows You to
          manage Your personal information. You may also contact Us to request access to, correct, or
          delete any Personal Data that You have provided to Us.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Please note, however, that We may need to retain certain information when We have a legal
          obligation or lawful basis to do so.
        </p>

        <h3 id="disclosure" className="mt-8 text-base font-semibold tracking-tight">
          Disclosure of Your Personal Data
        </h3>
        <h4 className="mt-5 text-sm font-semibold tracking-tight">Business Transactions</h4>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may
          be transferred. We will provide notice before Your Personal Data is transferred and becomes
          subject to a different Privacy Policy.
        </p>
        <h4 className="mt-5 text-sm font-semibold tracking-tight">Law Enforcement</h4>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Under certain circumstances, the Company may disclose Your Personal Data if required to do
          so by law or in response to valid requests by public authorities (e.g. a court or a
          government agency).
        </p>
        <h4 className="mt-5 text-sm font-semibold tracking-tight">Other Legal Requirements</h4>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The Company may disclose Your Personal Data in the good-faith belief that such action is
          necessary to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/70">
          <li>Comply with a legal obligation</li>
          <li>Protect and defend the rights or property of the Company</li>
          <li>Prevent or investigate possible wrongdoing in connection with the Service</li>
          <li>Protect the personal safety of Users of the Service or the public</li>
          <li>Protect against legal liability</li>
        </ul>

        <h3 id="security" className="mt-8 text-base font-semibold tracking-tight">
          Security of Your Personal Data
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The security of Your Personal Data is important to Us, but remember that no method of
          transmission over the Internet, or method of electronic storage, is 100% secure. While We
          strive to use commercially reasonable means to protect Your Personal Data, We cannot
          guarantee its absolute security.
        </p>

        <h3 id="childrens-privacy" className="mt-8 text-base font-semibold tracking-tight">
          Children's and Minors' Privacy
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          The Service is not directed to, and We do not knowingly collect Personal Information from,
          anyone under the age of 16.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          If You are a parent or guardian and You believe Your child has provided Us with Personal
          Information, please contact Us. If We become aware that We have collected Personal
          Information from anyone under the age of 16, We will take steps to remove that information
          from Our servers as soon as reasonably possible.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Some countries and states set a higher age at which an individual can consent to the
          processing of their own Personal Information. Where We rely on consent as a legal basis and
          the law applicable to a User sets an age higher than 16, We may require the consent of that
          User's parent or guardian before We collect and use their Personal Information.
        </p>

        <h3 id="external-links" className="mt-8 text-base font-semibold tracking-tight">
          Links to Other Websites
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Our Service may contain links to other websites that are not operated by Us. If You click
          on a third-party link, You will be directed to that third party's site. We strongly advise
          You to review the Privacy Policy of every site You visit.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          We have no control over and assume no responsibility for the content, privacy policies or
          practices of any third-party sites or services.
        </p>

        <h3 id="policy-changes" className="mt-8 text-base font-semibold tracking-tight">
          Changes to this Privacy Policy
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          We may update Our Privacy Policy from time to time. We will notify You of any changes by
          posting the new Privacy Policy on this page.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          We will let You know via email and/or a prominent notice on Our Service, prior to the
          change becoming effective and update the &ldquo;Last updated&rdquo; date at the top of this
          Privacy Policy.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          You are advised to review this Privacy Policy periodically for any changes. Changes to this
          Privacy Policy are effective when they are posted on this page.
        </p>

        <h3 id="contact-us" className="mt-8 text-base font-semibold tracking-tight">
          Contact Us
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          If You have any questions about this Privacy Policy, You can contact Us:
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
