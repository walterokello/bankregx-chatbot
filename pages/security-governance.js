import Link from "next/link";

export default function SecurityGovernance() {
  return (
    <>
      <main className="page">
        <header className="header">
          <div className="headerInner">
            <Link href="/" className="brand">
              <div className="brandBadge">
                BRX
              </div>

              <div>
                <div className="brandName">
                  BANKREGX
                </div>

                <div className="brandSub">
                  AI Control Intelligence for Banking
                </div>
              </div>
            </Link>

            <nav className="nav">
              <Link
                href="/"
                className="navLink"
              >
                Home
              </Link>

              <Link
                href="/regulatory-news"
                className="navLink"
              >
                Regulatory Intelligence
              </Link>

              <Link
                href="/docs"
                className="navLink"
              >
                Docs
              </Link>

              <Link
                href="/security-governance"
                className="navLink active"
              >
                Security &amp; Governance
              </Link>
            </nav>

            <Link
              href="/admin"
              className="adminLink"
            >
              <span>
                Governance Admin
              </span>

              <span className="privateTag">
                PRIVATE
              </span>
            </Link>
          </div>
        </header>

        <section className="hero">
          <div className="eyebrow">
            SECURITY · PRIVACY · AI GOVERNANCE
          </div>

          <h1>
            Security &amp; Governance
          </h1>

          <p className="heroText">
            Information about the approach BankRegX
            takes to security, data handling, AI
            governance and service resilience.
          </p>

          <p className="heroSecondary">
            BankRegX is an independent AI control
            intelligence project designed to support
            auditors, compliance professionals and
            control teams. Responsible use, evidence
            discipline and transparent professional
            judgement are central to the way the
            service is developed.
          </p>

          <div className="heroActions">
            <a
              href="#security"
              className="primaryButton"
            >
              Security approach
            </a>

            <a
              href="#ai-governance"
              className="secondaryButton"
            >
              AI governance
            </a>
          </div>
        </section>

        <section className="principles">
          <div className="principle">
            <div className="principleIcon">
              01
            </div>

            <div>
              <h3>
                Evidence-led
              </h3>

              <p>
                BankRegX aims to distinguish
                established information from
                assumptions and professional
                judgement.
              </p>
            </div>
          </div>

          <div className="principle">
            <div className="principleIcon">
              02
            </div>

            <div>
              <h3>
                Governed methodology
              </h3>

              <p>
                Expert methodology is managed
                through a controlled review and
                approval process.
              </p>
            </div>
          </div>

          <div className="principle">
            <div className="principleIcon">
              03
            </div>

            <div>
              <h3>
                Traceable assessments
              </h3>

              <p>
                Assessment records can retain
                information about methodology and
                sources used.
              </p>
            </div>
          </div>
        </section>

        <section
          id="security"
          className="section"
        >
          <div className="sectionHeading">
            <div className="sectionNumber">
              01
            </div>

            <div>
              <div className="sectionEyebrow">
                SECURITY
              </div>

              <h2>
                Security approach
              </h2>

              <p>
                BankRegX is designed with
                separation between public
                functionality and private
                administrative capabilities.
              </p>
            </div>
          </div>

          <div className="cardGrid">
            <InfoCard
              title="Administrative access"
              text="Private methodology and review functions are separated from the normal public user experience and protected through authenticated administrative access."
            />

            <InfoCard
              title="Server-side credentials"
              text="Sensitive service credentials and application secrets are handled through server-side environment configuration rather than being intentionally exposed in the public user interface."
            />

            <InfoCard
              title="Restricted operations"
              text="Sensitive database and administrative operations are performed through server-side application services rather than direct public access."
            />

            <InfoCard
              title="Change governance"
              text="Changes to BankRegX expert methodology follow a governed workflow rather than allowing user feedback to directly alter approved methodology."
            />
          </div>
        </section>

        <section
          id="data"
          className="section"
        >
          <div className="sectionHeading">
            <div className="sectionNumber">
              02
            </div>

            <div>
              <div className="sectionEyebrow">
                DATA &amp; PRIVACY
              </div>

              <h2>
                Data handling
              </h2>

              <p>
                BankRegX processes information needed
                to provide assessments, maintain
                service functionality and improve the
                quality of its control intelligence.
              </p>
            </div>
          </div>

          <div className="wideCard">
            <div className="dataColumns">
              <DataItem
                title="User queries"
                text="Questions submitted to BankRegX may be retained together with the resulting assessment and relevant service metadata."
              />

              <DataItem
                title="Assessment information"
                text="Assessment records may include methodology references, source information and technical metadata used to support traceability."
              />

              <DataItem
                title="Purpose"
                text="Retained information may support service operation, quality review, methodology evaluation and understanding how the service is used."
              />

              <DataItem
                title="Sensitive information"
                text="Users should avoid submitting unnecessary personal, confidential or highly sensitive information unless an appropriate arrangement has been established."
              />
            </div>

            <div className="notice">
              <div className="noticeTitle">
                Data minimisation
              </div>

              <p>
                BankRegX is intended to support
                professional analysis. Users remain
                responsible for determining whether
                information is appropriate to submit
                to the service.
              </p>
            </div>
          </div>
        </section>

        <section
          id="ai-governance"
          className="section"
        >
          <div className="sectionHeading">
            <div className="sectionNumber">
              03
            </div>

            <div>
              <div className="sectionEyebrow">
                RESPONSIBLE AI
              </div>

              <h2>
                AI governance
              </h2>

              <p>
                BankRegX is designed to support
                professional judgement rather than
                replace accountable decision-making.
              </p>
            </div>
          </div>

          <div className="governanceLayout">
            <div className="governanceMain">
              <GovernanceRow
                number="01"
                title="Facts and judgement"
                text="The BankRegX methodology seeks to distinguish known information, information not provided, assumptions and professional judgement."
              />

              <GovernanceRow
                number="02"
                title="Risk-based assessment"
                text="Control assessments consider whether a control mechanism is capable of mitigating the relevant risk rather than relying only on checklist completion."
              />

              <GovernanceRow
                number="03"
                title="Approved methodology"
                text="Professional guidance can be reviewed, versioned and approved before becoming part of the methodology used by BankRegX."
              />

              <GovernanceRow
                number="04"
                title="Human review"
                text="Feedback and proposed methodology changes are subject to review rather than automatically becoming approved intelligence."
              />

              <GovernanceRow
                number="05"
                title="Traceability"
                text="BankRegX can retain the methodology references associated with an assessment so that the basis of the analysis can be understood later."
              />
            </div>

            <aside className="governanceAside">
              <div className="asideLabel">
                CORE PRINCIPLE
              </div>

              <h3>
                AI should support better
                professional judgement.
              </h3>

              <p>
                BankRegX is designed to help
                professionals understand evidence,
                risk, control design and regulatory
                developments while keeping human
                judgement and accountability central.
              </p>

              <div className="rule" />

              <p className="smallText">
                AI-generated assessments can contain
                errors. Important conclusions should
                be independently reviewed and
                validated.
              </p>
            </aside>
          </div>
        </section>

        <section
          id="regulatory"
          className="section"
        >
          <div className="sectionHeading">
            <div className="sectionNumber">
              04
            </div>

            <div>
              <div className="sectionEyebrow">
                REGULATORY INTELLIGENCE
              </div>

              <h2>
                Source discipline
              </h2>

              <p>
                Regulatory analysis should distinguish
                what an authoritative source actually
                says from the judgement applied to
                that information.
              </p>
            </div>
          </div>

          <div className="sourceFlow">
            <FlowStep
              label="SOURCE"
              title="Regulatory publication"
              text="BankRegX links regulatory developments back to their original published source where available."
            />

            <div className="flowArrow">
              →
            </div>

            <FlowStep
              label="ANALYSIS"
              title="Structured assessment"
              text="The service analyses potential relevance, affected risks and possible control implications."
            />

            <div className="flowArrow">
              →
            </div>

            <FlowStep
              label="JUDGEMENT"
              title="Professional interpretation"
              text="BankRegX judgement and recommendations are distinguished from the regulatory source itself."
            />
          </div>
        </section>

        <section
          id="resilience"
          className="section"
        >
          <div className="sectionHeading">
            <div className="sectionNumber">
              05
            </div>

            <div>
              <div className="sectionEyebrow">
                SERVICE GOVERNANCE
              </div>

              <h2>
                Technology &amp; resilience
              </h2>

              <p>
                BankRegX uses established cloud
                technology services to deliver the
                application and its AI-assisted
                functionality.
              </p>
            </div>
          </div>

          <div className="cardGrid">
            <InfoCard
              title="Cloud application"
              text="BankRegX is delivered as a web-based service using cloud application infrastructure."
            />

            <InfoCard
              title="Data services"
              text="Cloud database services support application data, assessment records and methodology information."
            />

            <InfoCard
              title="AI services"
              text="Third-party AI technology is used as part of the BankRegX analysis process, with BankRegX methodology applied around the assessment workflow."
            />

            <InfoCard
              title="External sources"
              text="Regulatory intelligence may use regulator feeds, regulator websites and search services to identify and analyse external information."
            />
          </div>

          <div className="providerNote">
            <strong>
              Material technology providers
            </strong>

            <span>
              Current technology dependencies include
              services provided by Vercel, Google
              Firebase, OpenAI and Brave Search.
              These dependencies may change as
              BankRegX develops.
            </span>
          </div>
        </section>

        <section
          id="assurance"
          className="section"
        >
          <div className="sectionHeading">
            <div className="sectionNumber">
              06
            </div>

            <div>
              <div className="sectionEyebrow">
                ASSURANCE
              </div>

              <h2>
                Current assurance position
              </h2>

              <p>
                BankRegX aims to describe its assurance
                position accurately and does not claim
                certifications that it does not hold.
              </p>
            </div>
          </div>

          <div className="assuranceCard">
            <AssuranceRow
              title="ISO 27001"
              status="Not currently certified"
            />

            <AssuranceRow
              title="SOC 2"
              status="No current attestation"
            />

            <AssuranceRow
              title="BankRegX AI methodology"
              status="Governed internally"
              positive
            />

            <AssuranceRow
              title="Methodology version trace"
              status="Supported"
              positive
            />

            <AssuranceRow
              title="Administrative access"
              status="Authenticated"
              positive
            />
          </div>

          <div className="assuranceFootnote">
            Additional assurance measures may be
            introduced as the service develops and the
            requirements of users evolve.
          </div>
        </section>

        <section className="contactSection">
          <div>
            <div className="sectionEyebrow">
              QUESTIONS
            </div>

            <h2>
              Further information
            </h2>

            <p>
              Questions about BankRegX security,
              privacy, data handling or governance
              can be sent to the BankRegX team.
            </p>
          </div>

          <a
            href="mailto:contact@bankregx.com"
            className="contactButton"
          >
            contact@bankregx.com
          </a>
        </section>

        <div className="siteFooter">
          <div>
            <strong>
              BankRegX
            </strong>

            <span>
              AI Control Intelligence for Banking
            </span>
          </div>

          <div className="footerLinks">
            <Link href="/">
              Home
            </Link>

            <Link href="/regulatory-news">
              Regulatory Intelligence
            </Link>

            <Link href="/docs">
              Docs
            </Link>

            <Link href="/security-governance">
              Security &amp; Governance
            </Link>

            <Link href="/admin">
              Governance Admin · Private
            </Link>
          </div>

          <div className="footerDisclaimer">
            BankRegX provides AI-assisted
            professional analysis. Outputs should
            not be treated as legal advice or as a
            substitute for professional judgement.
          </div>
        </div>
      </main>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(html) {
          scroll-behavior: smooth;
          background: #0a1a1c;
        }

        :global(body) {
          margin: 0;

          background: #0a1a1c;

          color: #f4fbfa;

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        :global(a) {
          color: inherit;
          text-decoration: none !important;
        }

        .page {
          min-height: 100vh;

          background:
            radial-gradient(
              circle at 20% 0%,
              rgba(20, 184, 166, 0.14),
              transparent 36%
            ),
            linear-gradient(
              180deg,
              #0a1a1c 0%,
              #0d2022 52%,
              #091719 100%
            );
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 20;

          border-bottom:
            1px solid
            rgba(255, 255, 255, 0.10);

          background:
            rgba(10, 26, 28, 0.92);

          backdrop-filter:
            blur(16px);
        }

        .headerInner {
          max-width: 1240px;
          margin: 0 auto;

          min-height: 76px;

          padding:
            0 28px;

          display: flex;
          align-items: center;

          gap: 28px;
        }

        .brand {
          display: flex;
          align-items: center;

          gap: 11px;

          flex-shrink: 0;

          text-decoration:
            none !important;
        }

        .brandBadge {
          width: 38px;
          height: 38px;

          border-radius: 9px;

          display: grid;
          place-items: center;

          border:
            1px solid
            rgba(45, 212, 191, 0.62);

          background:
            rgba(20, 184, 166, 0.13);

          color: #6ee7d3;

          font-size: 12px;
          font-weight: 800;

          letter-spacing:
            0.06em;
        }

        .brandName {
          color: #f7fcfb;

          font-weight: 800;

          letter-spacing:
            0.08em;

          font-size: 14px;
        }

        .brandSub {
          margin-top: 2px;

          color: #91aaa6;

          font-size: 10px;

          white-space: nowrap;
        }

        .nav {
          flex: 1;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 25px;
        }

        .navLink {
          color: #bdd0cc;

          font-size: 13px;

          white-space: nowrap;

          text-decoration:
            none !important;

          transition:
            color 0.2s ease;
        }

        .navLink:hover {
          color: #f1f8f7;
        }

        .navLink.active {
          color: #64dfcb;
        }

        .adminLink {
          flex-shrink: 0;

          display: inline-flex;

          align-items: center;

          gap: 8px;

          min-height: 34px;

          padding:
            0 10px;

          border:
            1px solid
            rgba(45, 212, 191, 0.33);

          border-radius: 7px;

          background:
            rgba(20, 184, 166, 0.08);

          color: #c4d7d3;

          font-size: 10px;

          font-weight: 700;

          text-decoration:
            none !important;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            color 0.2s ease;
        }

        .adminLink:hover {
          color: #f2faf8;

          border-color:
            rgba(45, 212, 191, 0.52);

          background:
            rgba(20, 184, 166, 0.13);
        }

        .privateTag {
          padding:
            4px 6px;

          border-radius: 5px;

          background:
            rgba(20, 184, 166, 0.16);

          color: #65e2cf;

          font-size: 8px;

          font-weight: 800;

          letter-spacing:
            0.11em;
        }

        .hero {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            105px 28px 72px;
        }

        .eyebrow,
        .sectionEyebrow {
          color: #55dbc6;

          font-size: 11px;

          letter-spacing:
            0.18em;

          font-weight: 800;
        }

        .hero h1 {
          margin:
            17px 0 20px;

          max-width: 850px;

          color: #f8fcfb;

          font-size:
            clamp(
              42px,
              7vw,
              74px
            );

          line-height: 0.98;

          letter-spacing:
            -0.045em;
        }

        .heroText {
          max-width: 790px;

          margin: 0;

          color: #d9e6e3;

          font-size: 22px;

          line-height: 1.55;
        }

        .heroSecondary {
          max-width: 760px;

          margin:
            22px 0 0;

          color: #a4bab6;

          font-size: 15px;

          line-height: 1.75;
        }

        .heroActions {
          display: flex;

          flex-wrap: wrap;

          gap: 12px;

          margin-top: 32px;
        }

        .primaryButton,
        .secondaryButton,
        .contactButton {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          min-height: 44px;

          padding:
            0 19px;

          border-radius: 8px;

          text-decoration:
            none !important;

          font-size: 13px;

          font-weight: 700;
        }

        .primaryButton {
          background: #35d1ba;

          color: #041514;
        }

        .primaryButton:hover {
          background: #4cddc8;
        }

        .secondaryButton {
          border:
            1px solid
            rgba(255, 255, 255, 0.15);

          color: #d8e5e2;

          background:
            rgba(255, 255, 255, 0.035);
        }

        .secondaryButton:hover {
          background:
            rgba(255, 255, 255, 0.055);

          border-color:
            rgba(255, 255, 255, 0.22);
        }

        .principles {
          max-width: 1120px;

          margin:
            0 auto 80px;

          padding:
            0 28px;

          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 14px;
        }

        .principle {
          min-height: 150px;

          display: flex;

          gap: 16px;

          padding: 24px;

          border:
            1px solid
            rgba(255, 255, 255, 0.10);

          border-radius: 13px;

          background:
            rgba(255, 255, 255, 0.032);
        }

        .principleIcon {
          flex:
            0 0 auto;

          width: 39px;
          height: 39px;

          display: grid;
          place-items: center;

          border-radius: 9px;

          background:
            rgba(20, 184, 166, 0.13);

          color: #68e1cf;

          font-size: 10px;

          font-weight: 800;
        }

        .principle h3 {
          margin:
            2px 0 8px;

          color: #eef7f5;

          font-size: 15px;
        }

        .principle p {
          margin: 0;

          color: #a3b8b4;

          font-size: 13px;

          line-height: 1.65;
        }

        .section {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            80px 28px;

          border-top:
            1px solid
            rgba(255, 255, 255, 0.08);
        }

        .sectionHeading {
          display: grid;

          grid-template-columns:
            48px minmax(0, 650px);

          gap: 20px;

          margin-bottom: 35px;
        }

        .sectionNumber {
          color: #53d7c2;

          font-size: 12px;

          font-weight: 800;

          padding-top: 3px;
        }

        .section h2,
        .contactSection h2 {
          margin:
            8px 0 10px;

          color: #f7fcfb;

          font-size: 30px;

          letter-spacing:
            -0.025em;
        }

        .sectionHeading p,
        .contactSection p {
          margin: 0;

          color: #a2b7b3;

          line-height: 1.7;

          font-size: 14px;
        }

        .cardGrid {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 14px;
        }

        .wideCard,
        .assuranceCard,
        .governanceMain,
        .governanceAside {
          border:
            1px solid
            rgba(255, 255, 255, 0.10);

          background:
            rgba(255, 255, 255, 0.030);

          border-radius: 13px;
        }

        .dataColumns {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);
        }

        .notice {
          margin:
            0 24px 24px;

          padding:
            18px 20px;

          border-radius: 10px;

          border:
            1px solid
            rgba(45, 212, 191, 0.22);

          background:
            rgba(20, 184, 166, 0.07);
        }

        .noticeTitle {
          color: #68dfcd;

          font-size: 12px;

          font-weight: 800;

          margin-bottom: 6px;
        }

        .notice p {
          margin: 0;

          color: #a9bdb9;

          font-size: 13px;

          line-height: 1.65;
        }

        .governanceLayout {
          display: grid;

          grid-template-columns:
            minmax(0, 1.5fr)
            minmax(280px, 0.7fr);

          gap: 14px;
        }

        .governanceMain {
          overflow: hidden;
        }

        .governanceAside {
          padding: 28px;

          background:
            linear-gradient(
              145deg,
              rgba(20, 184, 166, 0.12),
              rgba(255, 255, 255, 0.028)
            );
        }

        .asideLabel {
          color: #60dfcb;

          font-size: 10px;

          letter-spacing:
            0.16em;

          font-weight: 800;
        }

        .governanceAside h3 {
          margin:
            14px 0 15px;

          color: #f4faf9;

          font-size: 24px;

          line-height: 1.3;

          letter-spacing:
            -0.025em;
        }

        .governanceAside p {
          color: #a6bab6;

          font-size: 13px;

          line-height: 1.7;
        }

        .governanceAside .smallText {
          color: #91aaa6;

          font-size: 12px;
        }

        .rule {
          height: 1px;

          margin:
            24px 0;

          background:
            rgba(255, 255, 255, 0.10);
        }

        .sourceFlow {
          display: grid;

          grid-template-columns:
            1fr auto
            1fr auto
            1fr;

          align-items: stretch;

          gap: 12px;
        }

        .flowArrow {
          align-self: center;

          color: #5d8b84;

          font-size: 20px;
        }

        .providerNote {
          margin-top: 14px;

          display: flex;

          gap: 18px;

          align-items:
            flex-start;

          padding:
            18px 20px;

          border-radius: 10px;

          border:
            1px solid
            rgba(255, 255, 255, 0.09);

          background:
            rgba(255, 255, 255, 0.027);
        }

        .providerNote strong {
          flex:
            0 0 190px;

          color: #d3e0dd;

          font-size: 12px;
        }

        .providerNote span {
          color: #9eb3af;

          font-size: 12px;

          line-height: 1.6;
        }

        .assuranceCard {
          overflow: hidden;
        }

        .assuranceFootnote {
          margin-top: 14px;

          color: #91a9a5;

          font-size: 12px;

          line-height: 1.6;
        }

        .contactSection {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            80px 28px;

          border-top:
            1px solid
            rgba(255, 255, 255, 0.08);

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 40px;
        }

        .contactSection > div {
          max-width: 620px;
        }

        .contactButton {
          flex-shrink: 0;

          border:
            1px solid
            rgba(45, 212, 191, 0.35);

          background:
            rgba(20, 184, 166, 0.10);

          color: #68e1cf;
        }

        .contactButton:hover {
          background:
            rgba(20, 184, 166, 0.15);

          border-color:
            rgba(45, 212, 191, 0.50);
        }

        .siteFooter {
          max-width: 1120px;

          margin: 0 auto;

          padding:
            38px 28px 50px;

          border-top:
            1px solid
            rgba(255, 255, 255, 0.08);

          display: grid;

          grid-template-columns:
            1fr 1fr 1.4fr;

          gap: 35px;

          background:
            transparent;

          color: #8fa7a3;

          font-size: 11px;

          line-height: 1.65;
        }

        .siteFooter strong {
          display: block;

          margin-bottom: 3px;

          color: #c3d4d1;

          font-size: 12px;
        }

        .siteFooter span {
          display: block;
        }

        .footerLinks {
          display: flex;

          flex-direction: column;

          gap: 5px;
        }

        .footerLinks a {
          color: #a6bbb7;

          text-decoration:
            none !important;
        }

        .footerLinks a:hover {
          color: #65e0cd;
        }

        .footerDisclaimer {
          color: #8ea5a1;

          line-height: 1.65;
        }

        @media (max-width: 1100px) {
          .headerInner {
            gap: 18px;
          }

          .nav {
            gap: 17px;
          }

          .navLink {
            font-size: 12px;
          }
        }

        @media (max-width: 1000px) {
          .nav {
            justify-content:
              flex-end;
          }

          .adminLink {
            font-size: 9px;
          }
        }

        @media (max-width: 850px) {
          .headerInner {
            min-height: auto;

            padding-top: 16px;
            padding-bottom: 14px;

            flex-wrap: wrap;
          }

          .brand {
            flex: 1;
          }

          .adminLink {
            margin-left: auto;
          }

          .nav {
            order: 3;

            width: 100%;

            flex:
              0 0 100%;

            justify-content:
              flex-start;

            overflow-x: auto;

            padding-bottom: 2px;
          }

          .hero {
            padding-top: 72px;
          }

          .principles {
            grid-template-columns: 1fr;
          }

          .cardGrid,
          .dataColumns {
            grid-template-columns: 1fr;
          }

          .sourceFlow {
            grid-template-columns: 1fr;
          }

          .flowArrow {
            transform:
              rotate(90deg);

            justify-self: center;
          }

          .contactSection {
            align-items:
              flex-start;

            flex-direction: column;
          }

          .siteFooter {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .headerInner,
          .hero,
          .principles,
          .section,
          .contactSection,
          .siteFooter {
            padding-left: 18px;
            padding-right: 18px;
          }

          .brandSub {
            display: none;
          }

          .adminLink > span:first-child {
            display: none;
          }

          .adminLink {
            padding:
              0 8px;
          }

          .hero h1 {
            font-size: 45px;
          }

          .heroText {
            font-size: 18px;
          }

          .sectionHeading {
            grid-template-columns: 1fr;

            gap: 7px;
          }

          .providerNote {
            flex-direction: column;

            gap: 8px;
          }

          .providerNote strong {
            flex: auto;
          }
        }
      `}</style>
    </>
  );
}

function InfoCard({
  title,
  text,
}) {
  return (
    <>
      <div className="infoCard">
        <div className="infoMarker" />

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>
      </div>

      <style jsx>{`
        .infoCard {
          min-height: 170px;

          padding: 25px;

          border:
            1px solid
            rgba(255, 255, 255, 0.10);

          border-radius: 13px;

          background:
            rgba(255, 255, 255, 0.030);
        }

        .infoMarker {
          width: 24px;
          height: 2px;

          margin-bottom: 19px;

          background: #44d4bd;
        }

        h3 {
          margin:
            0 0 10px;

          color: #e3efec;

          font-size: 15px;
        }

        p {
          margin: 0;

          color: #a3b8b4;

          font-size: 13px;

          line-height: 1.7;
        }
      `}</style>
    </>
  );
}

function DataItem({
  title,
  text,
}) {
  return (
    <>
      <div className="dataItem">
        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>
      </div>

      <style jsx>{`
        .dataItem {
          min-height: 165px;

          padding: 25px;

          border-bottom:
            1px solid
            rgba(255, 255, 255, 0.08);
        }

        .dataItem:nth-child(odd) {
          border-right:
            1px solid
            rgba(255, 255, 255, 0.08);
        }

        h3 {
          margin:
            0 0 10px;

          color: #dce9e7;

          font-size: 14px;
        }

        p {
          margin: 0;

          color: #a2b7b3;

          line-height: 1.7;

          font-size: 13px;
        }

        @media (max-width: 800px) {
          .dataItem:nth-child(odd) {
            border-right: none;
          }
        }
      `}</style>
    </>
  );
}

function GovernanceRow({
  number,
  title,
  text,
}) {
  return (
    <>
      <div className="row">
        <div className="number">
          {number}
        </div>

        <div>
          <h3>
            {title}
          </h3>

          <p>
            {text}
          </p>
        </div>
      </div>

      <style jsx>{`
        .row {
          display: grid;

          grid-template-columns:
            42px 1fr;

          gap: 14px;

          padding:
            22px 24px;

          border-bottom:
            1px solid
            rgba(255, 255, 255, 0.08);
        }

        .row:last-child {
          border-bottom: none;
        }

        .number {
          color: #4fd6c0;

          font-size: 10px;

          font-weight: 800;

          padding-top: 3px;
        }

        h3 {
          margin:
            0 0 6px;

          color: #e0ece9;

          font-size: 14px;
        }

        p {
          margin: 0;

          color: #a1b6b2;

          font-size: 12.5px;

          line-height: 1.65;
        }
      `}</style>
    </>
  );
}

function FlowStep({
  label,
  title,
  text,
}) {
  return (
    <>
      <div className="flowStep">
        <div className="label">
          {label}
        </div>

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>
      </div>

      <style jsx>{`
        .flowStep {
          min-height: 180px;

          padding: 24px;

          border:
            1px solid
            rgba(255, 255, 255, 0.10);

          border-radius: 13px;

          background:
            rgba(255, 255, 255, 0.030);
        }

        .label {
          margin-bottom: 18px;

          color: #50d7c1;

          font-size: 9px;

          letter-spacing:
            0.16em;

          font-weight: 800;
        }

        h3 {
          margin:
            0 0 9px;

          color: #e1ecea;

          font-size: 15px;
        }

        p {
          margin: 0;

          color: #a3b8b4;

          font-size: 12.5px;

          line-height: 1.7;
        }
      `}</style>
    </>
  );
}

function AssuranceRow({
  title,
  status,
  positive = false,
}) {
  return (
    <>
      <div className="assuranceRow">
        <span className="title">
          {title}
        </span>

        <span
          className={
            positive
              ? "status positive"
              : "status"
          }
        >
          {status}
        </span>
      </div>

      <style jsx>{`
        .assuranceRow {
          min-height: 58px;

          padding:
            0 22px;

          display: flex;

          justify-content:
            space-between;

          align-items: center;

          gap: 20px;

          border-bottom:
            1px solid
            rgba(255, 255, 255, 0.08);
        }

        .assuranceRow:last-child {
          border-bottom: none;
        }

        .title {
          color: #c9dad6;

          font-size: 13px;
        }

        .status {
          padding:
            6px 9px;

          border-radius: 6px;

          background:
            rgba(255, 255, 255, 0.055);

          color: #a5bab6;

          font-size: 10px;

          font-weight: 700;
        }

        .status.positive {
          color: #68dfcc;

          background:
            rgba(20, 184, 166, 0.11);
        }
      `}</style>
    </>
  );
}