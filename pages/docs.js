import {
  useState,
} from "react";

import Link from "next/link";

export default function Docs() {
  const [
    openSections,
    setOpenSections,
  ] = useState({
    overview: true,
    methodology: true,
    traceability: true,
    regulatory: false,
    using: false,
    technical: false,
  });

  function toggle(section) {
    setOpenSections(
      (current) => ({
        ...current,
        [section]:
          !current[section],
      })
    );
  }

  return (
    <>
      <main className="docsPage">
        <SiteHeader />

        <div className="docsMain">
          <section className="docsHero">
            <div className="docsEyebrow">
              PRODUCT DOCUMENTATION
            </div>

            <h1>
              BankRegX Docs
            </h1>

            <p>
              Understand how BankRegX
              applies AI, approved expert
              methodology, regulatory
              intelligence and governed
              human review to support
              professional control
              judgement.
            </p>
          </section>

          <section className="docsModel">
            <ModelCard
              number="01"
              title="Ask"
              copy="Interrogate controls, audit, risk and regulatory questions."
            />

            <ModelCard
              number="02"
              title="Assess"
              copy="Apply governed methodology to control and professional judgement."
            />

            <ModelCard
              number="03"
              title="Monitor"
              copy="Connect regulatory developments to relevant risks and controls."
            />

            <ModelCard
              number="04"
              title="Learn"
              copy="Capture expert review through a controlled human-governance process."
            />
          </section>

          <div className="docsLayout">
            <aside className="docsSidebar">
              <div className="docsSideLabel">
                CONTENTS
              </div>

              <a href="#overview">
                How BankRegX works
              </a>

              <a href="#methodology">
                Assessment methodology
              </a>

              <a href="#traceability">
                Assessment traceability
              </a>

              <a href="#regulatory">
                Regulatory Intelligence
              </a>

              <a href="#using">
                Using BankRegX
              </a>

              <a href="#technical">
                Technical overview
              </a>

              <div className="docsTrustCard">
                <div className="docsSideLabel">
                  TRUST &amp; GOVERNANCE
                </div>

                <strong>
                  Security, privacy and
                  AI governance
                </strong>

                <p>
                  Information about data
                  handling, service
                  governance, technology
                  dependencies and
                  assurance is available
                  separately.
                </p>

                <Link href="/security-governance">
                  View Security &amp;
                  Governance →
                </Link>
              </div>

              <div className="docsPrivateNote">
                <strong>
                  Private governance
                </strong>

                BankRegX includes a
                controlled internal
                workspace for methodology
                management and expert
                review.

                <Link href="/admin">
                  Governance Admin →
                </Link>
              </div>
            </aside>

            <section className="docsContent">
              <DocSection
                id="overview"
                eyebrow="PRODUCT MODEL"
                title="How BankRegX works"
                open={
                  openSections.overview
                }
                onToggle={() =>
                  toggle("overview")
                }
              >
                <p>
                  BankRegX combines AI
                  analysis, regulatory
                  information and approved
                  expert methodology to
                  support controls, audit,
                  risk and compliance
                  judgement.
                </p>

                <div className="docsFlow">
                  <FlowBox
                    label="INPUT"
                    value="Professional question"
                  />

                  <FlowArrow />

                  <FlowBox
                    label="RETRIEVAL"
                    value="Relevant approved methodology"
                  />

                  <FlowArrow />

                  <FlowBox
                    label="EVIDENCE"
                    value="Facts, sources and context"
                  />

                  <FlowArrow />

                  <FlowBox
                    label="ASSESSMENT"
                    value="BankRegX judgement"
                  />

                  <FlowArrow />

                  <FlowBox
                    label="GOVERNANCE"
                    value="Human expert review"
                  />
                </div>

                <div className="docsCallout">
                  Only approved methodology
                  is intended to influence
                  BankRegX assessments.
                  Draft, deprecated and
                  unreviewed guidance is
                  excluded from the active
                  intelligence layer.
                </div>

                <div className="docsPrinciples">
                  <PrincipleCard
                    title="Evidence-led"
                    text="BankRegX seeks to distinguish information that is actually known from assumptions and professional judgement."
                  />

                  <PrincipleCard
                    title="Risk-based"
                    text="A control is assessed against the risk it is intended to mitigate rather than simply against a checklist."
                  />

                  <PrincipleCard
                    title="Human-governed"
                    text="Feedback and proposed methodology changes are reviewed before they can influence future assessments."
                  />
                </div>
              </DocSection>

              <DocSection
                id="methodology"
                eyebrow="ASSESSMENT DISCIPLINE"
                title="Assessment methodology"
                open={
                  openSections.methodology
                }
                onToggle={() =>
                  toggle(
                    "methodology"
                  )
                }
              >
                <p>
                  BankRegX is designed to
                  support defensible
                  professional judgement.
                  It does not treat
                  completeness of a
                  description as evidence
                  that a control is
                  effective.
                </p>

                <div className="methodologyList">
                  <MethodologyRow
                    number="01"
                    title="Establish the facts"
                    text="Identify what the user or source actually states before drawing conclusions."
                  />

                  <MethodologyRow
                    number="02"
                    title="Identify material unknowns"
                    text="Separate missing information from evidence that is genuinely required to reach the assessment."
                  />

                  <MethodologyRow
                    number="03"
                    title="Understand the underlying risk"
                    text="Assess what could go wrong and the point at which the relevant harm may occur."
                  />

                  <MethodologyRow
                    number="04"
                    title="Assess risk-to-control alignment"
                    text="Consider whether the control mechanism is capable of mitigating the stated risk with appropriate timing, scope, precision and response."
                  />

                  <MethodologyRow
                    number="05"
                    title="Separate design from operation"
                    text="Do not require operating-effectiveness evidence in order to reach a control-design conclusion."
                  />

                  <MethodologyRow
                    number="06"
                    title="Reach a qualified judgement"
                    text="Provide the clearest supported conclusion while being transparent about material uncertainty."
                  />
                </div>

                <div className="docsQuote">
                  <span>
                    CENTRAL QUESTION
                  </span>

                  <strong>
                    Is this control, as
                    designed, actually
                    capable of mitigating
                    the stated risk?
                  </strong>
                </div>
              </DocSection>

              <DocSection
                id="traceability"
                eyebrow="GOVERNED INTELLIGENCE"
                title="Assessment traceability"
                open={
                  openSections.traceability
                }
                onToggle={() =>
                  toggle(
                    "traceability"
                  )
                }
              >
                <p>
                  BankRegX assessment
                  records can retain
                  information about the
                  methodology and external
                  sources associated with
                  an assessment. This
                  supports later review of
                  the basis on which the
                  AI-assisted judgement was
                  produced.
                </p>

                <div className="traceGrid">
                  <TraceCard
                    label="ASSESSMENT"
                    title="Response record"
                    text="A successful assessment can be associated with a unique response identifier."
                  />

                  <TraceCard
                    label="METHODOLOGY"
                    title="Guidance identity"
                    text="Relevant approved expert principles can be recorded against the assessment."
                  />

                  <TraceCard
                    label="VERSION"
                    title="Methodology version"
                    text="The version of methodology used can be retained with the original assessment."
                  />

                  <TraceCard
                    label="SOURCES"
                    title="External evidence"
                    text="Where live research is used, the browsed source information can be retained for traceability."
                  />
                </div>

                <h3>
                  Illustrative assessment
                  record
                </h3>

                <CodeBlock>
{`{
  "responseId": "ASSESSMENT_DOCUMENT_ID",

  "methodologyTraceSchemaVersion": 1,

  "methodologyTrace": [
    {
      "guidanceId": "BRX-G-XXXXXXXX",
      "documentId": "GUIDANCE_DOCUMENT_ID",
      "version": 1,
      "title": "Expert methodology principle",
      "category": "control_design",
      "subcategory": "risk_control_alignment",
      "priority": "critical"
    }
  ],

  "browsedPages": [
    {
      "title": "Authoritative source",
      "url": "https://..."
    }
  ]
}`}
                </CodeBlock>

                <div className="docsCallout">
                  Historical records created
                  before methodology-version
                  tracing was introduced may
                  not contain an exact
                  version. BankRegX should
                  not infer a historical
                  methodology version where
                  it was not recorded.
                </div>
              </DocSection>

              <DocSection
                id="regulatory"
                eyebrow="MONITOR"
                title="Regulatory Intelligence"
                open={
                  openSections.regulatory
                }
                onToggle={() =>
                  toggle(
                    "regulatory"
                  )
                }
              >
                <p>
                  The Regulatory
                  Intelligence workspace
                  brings together regulatory
                  developments and allows an
                  individual publication to
                  be assessed for potential
                  control impact.
                </p>

                <div className="regulatoryFlow">
                  <FlowBox
                    label="SOURCE"
                    value="Regulatory publication"
                  />

                  <FlowArrow />

                  <FlowBox
                    label="CONTENT"
                    value="Feed or source-page information"
                  />

                  <FlowArrow />

                  <FlowBox
                    label="ANALYSIS"
                    value="Potential business and risk impact"
                  />

                  <FlowArrow />

                  <FlowBox
                    label="CONTROL"
                    value="Control implications"
                  />
                </div>

                <div className="docsPrinciples">
                  <PrincipleCard
                    title="Regulatory fact"
                    text="Start with what the regulator or authoritative source actually states."
                  />

                  <PrincipleCard
                    title="BankRegX judgement"
                    text="Professional interpretation is distinguished from the regulatory source itself."
                  />

                  <PrincipleCard
                    title="Proportionate action"
                    text="A new publication does not automatically mean that a new control is required."
                  />
                </div>

                <h3>
                  Regulatory feed record
                </h3>

                <CodeBlock>
{`{
  "source": "ECB",
  "name": "ECB",
  "feedUrl": "https://...",

  "items": [
    {
      "title": "Regulatory development",
      "link": "https://...",
      "pubDate": "...",
      "summary": "Development-specific source text...",
      "summarySource": "source_page",
      "enrichedFromSourcePage": true
    }
  ]
}`}
                </CodeBlock>

                <div className="docsCallout">
                  Where a feed does not
                  provide a useful
                  development-specific
                  summary, BankRegX may
                  attempt to retrieve
                  substantive information
                  from the regulator&apos;s
                  source page.
                </div>
              </DocSection>

              <DocSection
                id="using"
                eyebrow="WORKFLOWS"
                title="Using BankRegX"
                open={
                  openSections.using
                }
                onToggle={() =>
                  toggle("using")
                }
              >
                <p>
                  The BankRegX homepage
                  presents four practical
                  assessment modes. Each
                  mode applies the same
                  underlying evidence and
                  judgement discipline in a
                  different professional
                  context.
                </p>

                <div className="useGrid">
                  <UseCard
                    number="01"
                    title="Ask anything"
                    example="What control weaknesses should I consider in this process?"
                    text="General questions across controls, audit, risk and regulation."
                  />

                  <UseCard
                    number="02"
                    title="Assess a control"
                    example="Assess whether this monthly exception review is well designed."
                    text="Evaluate whether a stated control is capable of mitigating the underlying risk."
                  />

                  <UseCard
                    number="03"
                    title="Analyse regulatory impact"
                    example="What could this FCA publication mean for our controls?"
                    text="Translate a regulatory development into proportionate risk and control questions."
                  />

                  <UseCard
                    number="04"
                    title="Review a finding"
                    example="Does the evidence support this audit finding and rating?"
                    text="Challenge the logic, evidence and significance of an audit or controls finding."
                  />
                </div>
              </DocSection>

              <DocSection
                id="technical"
                eyebrow="TECHNICAL OVERVIEW"
                title="Application interfaces"
                open={
                  openSections.technical
                }
                onToggle={() =>
                  toggle(
                    "technical"
                  )
                }
              >
                <p>
                  BankRegX is currently
                  delivered primarily as a
                  web application. The
                  application uses
                  server-side interfaces to
                  perform assessments,
                  retrieve regulatory
                  intelligence and capture
                  feedback.
                </p>

                <EndpointRow
                  method="POST"
                  path="/api/ask"
                  description="Submit a BankRegX assessment request and return the assessment, methodology trace and source information where available."
                />

                <EndpointRow
                  method="GET"
                  path="/api/regulatory-news"
                  description="Retrieve normalized regulatory developments used by the Regulatory Intelligence workspace."
                />

                <EndpointRow
                  method="POST"
                  path="/api/feedback"
                  description="Capture assessment feedback for quality review and governed expert learning."
                />

                <div className="docsWarning">
                  Private administrative
                  authentication, session
                  management and governance
                  interfaces are
                  intentionally not
                  documented publicly.
                  Administrative operations
                  remain within the
                  authenticated BankRegX
                  governance environment.
                </div>

                <div className="technicalLink">
                  <div>
                    <div className="docsSectionEyebrow">
                      SECURITY &amp; GOVERNANCE
                    </div>

                    <strong>
                      Looking for security,
                      privacy or assurance
                      information?
                    </strong>

                    <p>
                      Review the separate
                      Security &amp;
                      Governance page for
                      information about
                      data handling,
                      infrastructure,
                      AI governance and
                      assurance.
                    </p>
                  </div>

                  <Link href="/security-governance">
                    View Security &amp;
                    Governance →
                  </Link>
                </div>
              </DocSection>
            </section>
          </div>
        </div>

        <SiteFooter />
      </main>

      <style jsx global>{`
        * {
          box-sizing:
            border-box;
        }

        html {
          scroll-behavior:
            smooth;

          background:
            #0a1a1c;
        }

        body {
          margin: 0;

          min-height:
            100%;

          background:
            #0a1a1c;

          color:
            #f4fbfa;

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        a {
          color:
            inherit;

          text-decoration:
            none !important;
        }

        button {
          font:
            inherit;

          cursor:
            pointer;
        }

        code,
        pre {
          font-family:
            "SFMono-Regular",
            Consolas,
            "Liberation Mono",
            Menlo,
            monospace;
        }

        .docsPage {
          min-height:
            100vh;

          background:
            radial-gradient(
              circle at 18% 0%,
              rgba(
                20,
                184,
                166,
                0.14
              ),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              #0a1a1c 0%,
              #0d2022 52%,
              #091719 100%
            );
        }

        .docsMain {
          width:
            min(
              1120px,
              calc(
                100% -
                56px
              )
            );

          margin:
            0 auto;
        }

        .docsHero {
          padding:
            92px 0 42px;
        }

        .docsEyebrow,
        .docsSectionEyebrow {
          color:
            #55dbc6;

          font-size:
            10px;

          font-weight:
            800;

          letter-spacing:
            0.18em;
        }

        .docsHero h1 {
          margin:
            15px 0 16px;

          color:
            #f8fcfb;

          font-size:
            clamp(
              44px,
              6vw,
              68px
            );

          line-height:
            1;

          letter-spacing:
            -0.045em;
        }

        .docsHero p {
          max-width:
            760px;

          margin:
            0;

          color:
            #d1dfdc;

          font-size:
            18px;

          line-height:
            1.65;
        }

        .docsModel {
          display:
            grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );

          gap:
            11px;

          margin-bottom:
            68px;
        }

        .docsModelCard {
          min-height:
            170px;

          padding:
            20px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius:
            12px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );
        }

        .docsModelCard
          > span {
          color:
            #55dbc6;

          font-size:
            9px;

          font-weight:
            800;
        }

        .docsModelCard h3 {
          margin:
            28px 0 8px;

          color:
            #edf6f4;

          font-size:
            15px;
        }

        .docsModelCard p {
          margin:
            0;

          color:
            #a2b7b3;

          font-size:
            11.5px;

          line-height:
            1.65;
        }

        .docsLayout {
          display:
            grid;

          grid-template-columns:
            220px
            minmax(
              0,
              1fr
            );

          gap:
            25px;

          padding:
            74px 0 80px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .docsSidebar {
          position:
            sticky;

          top:
            100px;

          align-self:
            start;

          padding:
            18px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius:
            12px;

          background:
            rgba(
              255,
              255,
              255,
              0.028
            );
        }

        .docsSideLabel {
          margin-bottom:
            10px;

          color:
            #6bdcca;

          font-size:
            8px;

          font-weight:
            800;

          letter-spacing:
            0.14em;
        }

        .docsSidebar
          > a {
          display:
            block;

          padding:
            9px 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );

          color:
            #b6c9c5;

          font-size:
            10.5px;
        }

        .docsSidebar
          > a:hover {
          color:
            #62dfcc;
        }

        .docsTrustCard,
        .docsPrivateNote {
          margin-top:
            17px;

          padding:
            13px;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.16
            );

          border-radius:
            9px;

          background:
            rgba(
              20,
              184,
              166,
              0.05
            );
        }

        .docsTrustCard strong,
        .docsPrivateNote strong {
          display:
            block;

          color:
            #d9e8e5;

          font-size:
            10.5px;

          line-height:
            1.5;
        }

        .docsTrustCard p {
          margin:
            7px 0 9px;

          color:
            #96aca8;

          font-size:
            9px;

          line-height:
            1.55;
        }

        .docsTrustCard a,
        .docsPrivateNote a {
          display:
            block;

          margin-top:
            8px;

          color:
            #5edcc8;

          font-size:
            9px;

          font-weight:
            700;
        }

        .docsPrivateNote {
          color:
            #96aca8;

          font-size:
            9px;

          line-height:
            1.55;
        }

        .docsContent {
          display:
            grid;

          gap:
            12px;
        }

        .docsSection {
          overflow:
            hidden;

          scroll-margin-top:
            100px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius:
            14px;

          background:
            rgba(
              255,
              255,
              255,
              0.03
            );
        }

        .docsSectionHeader {
          width:
            100%;

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            center;

          gap:
            20px;

          padding:
            23px;

          border:
            0;

          background:
            transparent;

          color:
            inherit;

          text-align:
            left;
        }

        .docsSectionHeader:hover {
          background:
            rgba(
              255,
              255,
              255,
              0.025
            );
        }

        .docsSectionHeader h2 {
          margin:
            7px 0 0;

          color:
            #f1f8f6;

          font-size:
            21px;

          letter-spacing:
            -0.02em;
        }

        .docsChevron {
          color:
            #65d9c7;

          font-size:
            18px;
        }

        .docsSectionBody {
          padding:
            2px 23px 26px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
        }

        .docsSectionBody
          > p {
          color:
            #a7bbb7;

          font-size:
            12.5px;

          line-height:
            1.75;
        }

        .docsSectionBody h3 {
          margin:
            27px 0 9px;

          color:
            #e3eeeb;

          font-size:
            13px;
        }

        .docsFlow,
        .regulatoryFlow {
          display:
            grid;

          grid-template-columns:
            1fr auto
            1fr auto
            1fr auto
            1fr auto
            1fr;

          align-items:
            center;

          gap:
            8px;

          margin:
            24px 0;
        }

        .regulatoryFlow {
          grid-template-columns:
            1fr auto
            1fr auto
            1fr auto
            1fr;
        }

        .flowBox {
          min-height:
            92px;

          padding:
            13px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.09
            );

          border-radius:
            9px;

          background:
            rgba(
              5,
              19,
              20,
              0.34
            );
        }

        .flowBox span {
          display:
            block;

          color:
            #60d9c6;

          font-size:
            7.5px;

          font-weight:
            800;

          letter-spacing:
            0.11em;
        }

        .flowBox strong {
          display:
            block;

          margin-top:
            10px;

          color:
            #cddbd8;

          font-size:
            10px;

          line-height:
            1.45;
        }

        .flowArrow {
          color:
            #5b8881;

          font-size:
            16px;
        }

        .docsCallout,
        .docsWarning {
          margin-top:
            20px;

          padding:
            14px 15px;

          border-left:
            2px solid
            rgba(
              45,
              212,
              191,
              0.4
            );

          background:
            rgba(
              20,
              184,
              166,
              0.06
            );

          color:
            #a9bdb9;

          font-size:
            10.5px;

          line-height:
            1.65;
        }

        .docsWarning {
          border-left-color:
            rgba(
              214,
              170,
              92,
              0.55
            );

          background:
            rgba(
              172,
              126,
              57,
              0.07
            );

          color:
            #c3b48b;
        }

        .docsPrinciples,
        .traceGrid,
        .useGrid {
          display:
            grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap:
            10px;

          margin-top:
            22px;
        }

        .traceGrid {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        .useGrid {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        .principleCard,
        .traceCard,
        .useCard {
          padding:
            16px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.09
            );

          border-radius:
            10px;

          background:
            rgba(
              5,
              19,
              20,
              0.32
            );
        }

        .principleCard h4,
        .traceCard h4,
        .useCard h4 {
          margin:
            0 0 7px;

          color:
            #dfeae7;

          font-size:
            11px;
        }

        .principleCard p,
        .traceCard p,
        .useCard p {
          margin:
            0;

          color:
            #9eb3af;

          font-size:
            9.5px;

          line-height:
            1.6;
        }

        .traceCard > span,
        .useCard > span {
          display:
            block;

          margin-bottom:
            10px;

          color:
            #58d9c5;

          font-size:
            7.5px;

          font-weight:
            800;

          letter-spacing:
            0.11em;
        }

        .useExample {
          margin-top:
            12px;

          padding-top:
            10px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );

          color:
            #b9cbc7;

          font-size:
            9px;

          font-style:
            italic;

          line-height:
            1.55;
        }

        .methodologyList {
          margin-top:
            20px;

          overflow:
            hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.09
            );

          border-radius:
            10px;
        }

        .methodologyRow {
          display:
            grid;

          grid-template-columns:
            42px 190px 1fr;

          gap:
            13px;

          padding:
            15px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );

          background:
            rgba(
              5,
              19,
              20,
              0.25
            );
        }

        .methodologyRow:last-child {
          border-bottom:
            none;
        }

        .methodologyNumber {
          color:
            #56d7c3;

          font-size:
            8px;

          font-weight:
            800;
        }

        .methodologyTitle {
          color:
            #dbe8e5;

          font-size:
            10.5px;

          font-weight:
            700;
        }

        .methodologyText {
          color:
            #9eb3af;

          font-size:
            10px;

          line-height:
            1.55;
        }

        .docsQuote {
          margin-top:
            22px;

          padding:
            18px;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.2
            );

          border-radius:
            10px;

          background:
            rgba(
              20,
              184,
              166,
              0.06
            );
        }

        .docsQuote span {
          display:
            block;

          margin-bottom:
            8px;

          color:
            #5ddac7;

          font-size:
            8px;

          font-weight:
            800;

          letter-spacing:
            0.13em;
        }

        .docsQuote strong {
          color:
            #e7f2ef;

          font-size:
            14px;

          line-height:
            1.5;
        }

        .docsCode {
          margin:
            10px 0 20px;

          padding:
            17px;

          overflow-x:
            auto;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          border-radius:
            9px;

          background:
            #071719;

          color:
            #c7d9d5;

          font-size:
            10px;

          line-height:
            1.65;
        }

        .docsEndpoint {
          display:
            grid;

          grid-template-columns:
            80px 190px 1fr;

          gap:
            14px;

          padding:
            15px 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .docsEndpointMethod {
          color:
            #68dfcc;

          font-family:
            ui-monospace,
            monospace;

          font-size:
            9px;
        }

        .docsEndpointPath {
          color:
            #c5d6d2;

          font-family:
            ui-monospace,
            monospace;

          font-size:
            9px;
        }

        .docsEndpointDescription {
          color:
            #9eb3af;

          font-size:
            10px;

          line-height:
            1.55;
        }

        .technicalLink {
          margin-top:
            24px;

          padding:
            17px;

          display:
            flex;

          justify-content:
            space-between;

          align-items:
            center;

          gap:
            25px;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.18
            );

          border-radius:
            10px;

          background:
            rgba(
              20,
              184,
              166,
              0.05
            );
        }

        .technicalLink strong {
          display:
            block;

          margin-top:
            7px;

          color:
            #dceae7;

          font-size:
            11px;
        }

        .technicalLink p {
          max-width:
            520px;

          margin:
            6px 0 0;

          color:
            #9eb3af;

          font-size:
            9.5px;

          line-height:
            1.6;
        }

        .technicalLink a {
          flex-shrink:
            0;

          padding:
            9px 11px;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.24
            );

          border-radius:
            7px;

          color:
            #66dfcc;

          font-size:
            9px;

          font-weight:
            700;
        }

        @media (
          max-width:
            950px
        ) {
          .docsModel {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .docsLayout {
            grid-template-columns:
              1fr;
          }

          .docsSidebar {
            position:
              relative;

            top:
              auto;
          }

          .docsFlow,
          .regulatoryFlow {
            grid-template-columns:
              1fr;
          }

          .flowArrow {
            justify-self:
              center;

            transform:
              rotate(
                90deg
              );
          }

          .methodologyRow {
            grid-template-columns:
              35px 1fr;
          }

          .methodologyText {
            grid-column:
              2;
          }
        }

        @media (
          max-width:
            650px
        ) {
          .docsMain {
            width:
              calc(
                100% -
                36px
              );
          }

          .docsHero {
            padding-top:
              66px;
          }

          .docsHero h1 {
            font-size:
              43px;
          }

          .docsHero p {
            font-size:
              16px;
          }

          .docsModel,
          .docsPrinciples,
          .traceGrid,
          .useGrid {
            grid-template-columns:
              1fr;
          }

          .technicalLink {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .docsEndpoint {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>
    </>
  );
}

function SiteHeader() {
  return (
    <>
      <div className="siteHeader">
        <div className="siteHeaderInner">
          <Link
            href="/"
            className="brand"
          >
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
              className="navLink active"
            >
              Docs
            </Link>

            <Link
              href="/security-governance"
              className="navLink"
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
      </div>

      <style jsx>{`
        .siteHeader {
          position:
            sticky;

          top:
            0;

          z-index:
            50;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );

          background:
            rgba(
              10,
              26,
              28,
              0.92
            );

          backdrop-filter:
            blur(16px);
        }

        .siteHeaderInner {
          max-width:
            1240px;

          min-height:
            76px;

          margin:
            0 auto;

          padding:
            0 28px;

          display:
            flex;

          align-items:
            center;

          gap:
            28px;
        }

        .brand {
          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          flex-shrink:
            0;
        }

        .brandBadge {
          width:
            38px;

          height:
            38px;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.62
            );

          border-radius:
            9px;

          background:
            rgba(
              20,
              184,
              166,
              0.13
            );

          color:
            #6ee7d3;

          font-size:
            12px;

          font-weight:
            800;

          letter-spacing:
            0.06em;
        }

        .brandName {
          color:
            #f7fcfb;

          font-size:
            14px;

          font-weight:
            800;

          letter-spacing:
            0.08em;
        }

        .brandSub {
          margin-top:
            2px;

          color:
            #91aaa6;

          font-size:
            10px;

          white-space:
            nowrap;
        }

        .nav {
          flex:
            1;

          display:
            flex;

          justify-content:
            center;

          align-items:
            center;

          gap:
            25px;
        }

        .navLink {
          color:
            #bdd0cc;

          font-size:
            13px;

          white-space:
            nowrap;
        }

        .navLink:hover {
          color:
            #f1f8f7;
        }

        .navLink.active {
          color:
            #64dfcb;
        }

        .adminLink {
          flex-shrink:
            0;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          min-height:
            34px;

          padding:
            0 10px;

          border:
            1px solid
            rgba(
              45,
              212,
              191,
              0.33
            );

          border-radius:
            7px;

          background:
            rgba(
              20,
              184,
              166,
              0.08
            );

          color:
            #c4d7d3;

          font-size:
            10px;

          font-weight:
            700;
        }

        .privateTag {
          padding:
            4px 6px;

          border-radius:
            5px;

          background:
            rgba(
              20,
              184,
              166,
              0.16
            );

          color:
            #65e2cf;

          font-size:
            8px;

          font-weight:
            800;

          letter-spacing:
            0.11em;
        }

        @media (
          max-width:
            1100px
        ) {
          .siteHeaderInner {
            gap:
              18px;
          }

          .nav {
            gap:
              16px;
          }

          .navLink {
            font-size:
              12px;
          }
        }

        @media (
          max-width:
            850px
        ) {
          .siteHeaderInner {
            min-height:
              auto;

            padding-top:
              15px;

            padding-bottom:
              13px;

            flex-wrap:
              wrap;
          }

          .brand {
            flex:
              1;
          }

          .adminLink {
            margin-left:
              auto;
          }

          .nav {
            order:
              3;

            flex:
              0 0 100%;

            width:
              100%;

            justify-content:
              flex-start;

            overflow-x:
              auto;
          }
        }

        @media (
          max-width:
            560px
        ) {
          .siteHeaderInner {
            padding-left:
              18px;

            padding-right:
              18px;
          }

          .brandSub {
            display:
              none;
          }

          .adminLink
            > span:first-child {
            display:
              none;
          }
        }
      `}</style>
    </>
  );
}

function ModelCard({
  number,
  title,
  copy,
}) {
  return (
    <div className="docsModelCard">
      <span>
        {number}
      </span>

      <h3>
        {title}
      </h3>

      <p>
        {copy}
      </p>
    </div>
  );
}

function DocSection({
  id,
  eyebrow,
  title,
  open,
  onToggle,
  children,
}) {
  return (
    <article
      className="docsSection"
      id={id}
    >
      <button
        type="button"
        className="docsSectionHeader"
        onClick={onToggle}
      >
        <div>
          <div className="docsSectionEyebrow">
            {eyebrow}
          </div>

          <h2>
            {title}
          </h2>
        </div>

        <span className="docsChevron">
          {open
            ? "−"
            : "+"}
        </span>
      </button>

      {open ? (
        <div className="docsSectionBody">
          {children}
        </div>
      ) : null}
    </article>
  );
}

function FlowBox({
  label,
  value,
}) {
  return (
    <div className="flowBox">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flowArrow">
      →
    </div>
  );
}

function PrincipleCard({
  title,
  text,
}) {
  return (
    <div className="principleCard">
      <h4>
        {title}
      </h4>

      <p>
        {text}
      </p>
    </div>
  );
}

function MethodologyRow({
  number,
  title,
  text,
}) {
  return (
    <div className="methodologyRow">
      <div className="methodologyNumber">
        {number}
      </div>

      <div className="methodologyTitle">
        {title}
      </div>

      <div className="methodologyText">
        {text}
      </div>
    </div>
  );
}

function TraceCard({
  label,
  title,
  text,
}) {
  return (
    <div className="traceCard">
      <span>
        {label}
      </span>

      <h4>
        {title}
      </h4>

      <p>
        {text}
      </p>
    </div>
  );
}

function UseCard({
  number,
  title,
  example,
  text,
}) {
  return (
    <div className="useCard">
      <span>
        {number}
      </span>

      <h4>
        {title}
      </h4>

      <p>
        {text}
      </p>

      <div className="useExample">
        “{example}”
      </div>
    </div>
  );
}

function CodeBlock({
  children,
}) {
  return (
    <pre className="docsCode">
      <code>
        {children}
      </code>
    </pre>
  );
}

function EndpointRow({
  method,
  path,
  description,
}) {
  return (
    <div className="docsEndpoint">
      <div className="docsEndpointMethod">
        {method}
      </div>

      <div className="docsEndpointPath">
        {path}
      </div>

      <div className="docsEndpointDescription">
        {description}
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <>
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

        <div className="footerNote">
          BankRegX provides
          AI-assisted professional
          analysis. Important
          conclusions should be
          independently reviewed and
          validated.
        </div>
      </div>

      <style jsx>{`
        .siteFooter {
          max-width:
            1120px;

          margin:
            0 auto;

          padding:
            38px 28px 50px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );

          display:
            grid;

          grid-template-columns:
            1fr 1fr 1.4fr;

          gap:
            35px;

          color:
            #8fa7a3;

          font-size:
            11px;

          line-height:
            1.65;
        }

        strong {
          display:
            block;

          margin-bottom:
            3px;

          color:
            #c3d4d1;

          font-size:
            12px;
        }

        span {
          display:
            block;
        }

        .footerLinks {
          display:
            flex;

          flex-direction:
            column;

          gap:
            5px;
        }

        .footerLinks
          :global(a) {
          color:
            #a6bbb7;
        }

        .footerLinks
          :global(a:hover) {
          color:
            #65e0cd;
        }

        .footerNote {
          color:
            #8ea5a1;
        }

        @media (
          max-width:
            850px
        ) {
          .siteFooter {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width:
            560px
        ) {
          .siteFooter {
            padding-left:
              18px;

            padding-right:
              18px;
          }
        }
      `}</style>
    </>
  );
}