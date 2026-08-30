import {
  useState,
} from "react";

import BankRegXNav from "../components/BankRegXNav";

export default function Docs() {
  const [
    openSections,
    setOpenSections,
  ] = useState({
    overview: true,
    ask: true,
    feedback: false,
    regulatory: false,
    governance: false,
  });

  function toggle(
    section
  ) {
    setOpenSections(
      (current) => ({
        ...current,

        [section]:
          !current[
            section
          ],
      })
    );
  }

  return (
    <>
      <div className="docsPage">
        <BankRegXNav
          current="docs"
        />

        <main className="docsMain">
          {/*
           * =================================================
           * HERO
           * =================================================
           */}

          <section className="docsHero">
            <div className="docsEyebrow">
              PRODUCT &
              DEVELOPER
              REFERENCE
            </div>

            <h1>
              BankRegX Docs
            </h1>

            <p>
              A concise reference
              for the BankRegX
              control intelligence
              model, assessment
              APIs and governed
              expert-learning
              architecture.
            </p>
          </section>

          {/*
           * =================================================
           * PRODUCT MODEL
           * =================================================
           */}

          <section className="docsModel">
            <ModelCard
              number="01"
              title="Ask"
              copy="Interrogate controls, audit, risk and regulatory questions."
            />

            <ModelCard
              number="02"
              title="Assess"
              copy="Apply AI and approved expert methodology to professional judgement."
            />

            <ModelCard
              number="03"
              title="Monitor"
              copy="Connect regulatory developments to relevant risks and controls."
            />

            <ModelCard
              number="04"
              title="Learn"
              copy="Capture expert corrections through a governed human-review process."
            />
          </section>

          <div className="docsLayout">
            {/*
             * ===============================================
             * SIDEBAR
             * ===============================================
             */}

            <aside className="docsSidebar">
              <div className="docsSideLabel">
                CONTENTS
              </div>

              <a href="#overview">
                Overview
              </a>

              <a href="#ask">
                Ask API
              </a>

              <a href="#feedback">
                Feedback API
              </a>

              <a href="#regulatory">
                Regulatory
                Intelligence
              </a>

              <a href="#governance">
                Governance
                APIs
              </a>

              <div className="docsPrivateNote">
                <strong>
                  Private
                  governance
                </strong>

                Expert Studio and
                Review Queue
                administrative
                endpoints require
                an authenticated
                admin session.
              </div>
            </aside>

            {/*
             * ===============================================
             * CONTENT
             * ===============================================
             */}

            <section className="docsContent">
              {/*
               * =============================================
               * OVERVIEW
               * =============================================
               */}

              <DocSection
                id="overview"
                eyebrow="ARCHITECTURE"
                title="How BankRegX works"
                open={
                  openSections.overview
                }
                onToggle={() =>
                  toggle(
                    "overview"
                  )
                }
              >
                <p>
                  BankRegX combines
                  AI reasoning,
                  regulatory
                  information and
                  approved expert
                  methodology to
                  support banking
                  controls, audit
                  and risk
                  assessment.
                </p>

                <div className="docsFlow">
                  <div>
                    <span>
                      INPUT
                    </span>

                    <strong>
                      User
                      question
                    </strong>
                  </div>

                  <b>
                    →
                  </b>

                  <div>
                    <span>
                      RETRIEVAL
                    </span>

                    <strong>
                      Relevant
                      methodology
                    </strong>
                  </div>

                  <b>
                    →
                  </b>

                  <div>
                    <span>
                      REASONING
                    </span>

                    <strong>
                      BankRegX
                      assessment
                    </strong>
                  </div>

                  <b>
                    →
                  </b>

                  <div>
                    <span>
                      GOVERNANCE
                    </span>

                    <strong>
                      Expert
                      review
                    </strong>
                  </div>
                </div>

                <div className="docsCallout">
                  Approved
                  methodology may
                  inform BankRegX
                  assessments.
                  Draft and
                  deprecated
                  methodology is
                  excluded from the
                  active
                  intelligence
                  layer.
                </div>
              </DocSection>

              {/*
               * =============================================
               * ASK API
               * =============================================
               */}

              <DocSection
                id="ask"
                eyebrow="ASSESSMENT API"
                title="POST /api/ask"
                open={
                  openSections.ask
                }
                onToggle={() =>
                  toggle(
                    "ask"
                  )
                }
              >
                <p>
                  Submit a controls,
                  audit, risk or
                  regulatory
                  question to
                  BankRegX.
                </p>

                <MethodBar
                  method="POST"
                  path="/api/ask"
                  access="Application"
                />

                <h3>
                  Request
                </h3>

                <CodeBlock>
{`{
  "userId": "demo-user",
  "query": "Assess this control: The Finance Manager reviews a monthly exception report and investigates exceptions."
}`}
                </CodeBlock>

                <h3>
                  Response
                </h3>

                <CodeBlock>
{`{
  "answer": "### Preliminary conclusion\\n...",
  "responseId": "ASSESSMENT_DOCUMENT_ID",
  "expertGuidance": [
    {
      "guidanceId": "BRX-G-XXXXXXXX",
      "title": "Expert principle",
      "category": "control_design",
      "priority": "critical"
    }
  ],
  "detectedCategories": [
    "control_design"
  ]
}`}
                </CodeBlock>

                <div className="docsCallout">
                  The
                  <code>
                    responseId
                  </code>
                  {" "}
                  links subsequent
                  expert feedback
                  to the original
                  BankRegX
                  assessment.
                </div>
              </DocSection>

              {/*
               * =============================================
               * FEEDBACK
               * =============================================
               */}

              <DocSection
                id="feedback"
                eyebrow="EXPERT FEEDBACK"
                title="POST /api/feedback"
                open={
                  openSections.feedback
                }
                onToggle={() =>
                  toggle(
                    "feedback"
                  )
                }
              >
                <p>
                  Record an expert
                  approval,
                  correction or
                  rejection of a
                  BankRegX
                  assessment.
                </p>

                <MethodBar
                  method="POST"
                  path="/api/feedback"
                  access="Application"
                />

                <h3>
                  Approve an
                  assessment
                </h3>

                <CodeBlock>
{`{
  "responseId": "ASSESSMENT_DOCUMENT_ID",
  "userId": "expert-user",
  "question": "Is this control well designed?",
  "aiResponse": "BankRegX assessment...",
  "feedbackType": "approve",
  "category": "control_design"
}`}
                </CodeBlock>

                <h3>
                  Correct an
                  assessment
                </h3>

                <CodeBlock>
{`{
  "responseId": "ASSESSMENT_DOCUMENT_ID",
  "userId": "expert-user",
  "question": "Is this control well designed?",
  "aiResponse": "BankRegX assessment...",
  "feedbackType": "correct",
  "correctedAnswer": "The professionally appropriate assessment is...",
  "rationale": "The original assessment conflated design effectiveness with operating effectiveness.",
  "category": "control_design"
}`}
                </CodeBlock>

                <div className="docsCallout">
                  A correction does
                  not automatically
                  change global
                  BankRegX
                  methodology. It
                  enters the Expert
                  Review Queue for
                  human governance.
                </div>
              </DocSection>

              {/*
               * =============================================
               * REGULATORY
               * =============================================
               */}

              <DocSection
                id="regulatory"
                eyebrow="MONITOR"
                title="GET /api/regulatory-news"
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
                  Retrieve the
                  regulatory feeds
                  used by the
                  BankRegX
                  Regulatory
                  Intelligence
                  workspace.
                </p>

                <MethodBar
                  method="GET"
                  path="/api/regulatory-news"
                  access="Application"
                />

                <CodeBlock>
{`[
  {
    "name": "Regulatory source",
    "items": [
      {
        "title": "Regulatory development",
        "link": "https://...",
        "pubDate": "..."
      }
    ]
  }
]`}
                </CodeBlock>

                <p>
                  The Regulatory
                  Intelligence
                  workspace can
                  submit an
                  individual
                  development to
                  BankRegX for
                  control-impact
                  analysis.
                </p>
              </DocSection>

              {/*
               * =============================================
               * GOVERNANCE
               * =============================================
               */}

              <DocSection
                id="governance"
                eyebrow="PRIVATE GOVERNANCE"
                title="Expert Intelligence APIs"
                open={
                  openSections.governance
                }
                onToggle={() =>
                  toggle(
                    "governance"
                  )
                }
              >
                <p>
                  These endpoints
                  support the
                  private Expert
                  Studio and Expert
                  Review Queue.
                  They are not
                  ordinary
                  end-user
                  interfaces.
                </p>

                <EndpointRow
                  method="GET / POST / PATCH"
                  path="/api/admin/guidance"
                  description="Create, edit, approve, draft and deprecate governed methodology."
                />

                <EndpointRow
                  method="GET"
                  path="/api/admin/guidance-history"
                  description="Retrieve current and archived versions of an expert methodology principle."
                />

                <EndpointRow
                  method="GET / PATCH"
                  path="/api/admin/reviews"
                  description="Review expert corrections and link reusable lessons to draft methodology."
                />

                <EndpointRow
                  method="GET"
                  path="/api/admin/session"
                  description="Read the current secure Expert Studio session state."
                />

                <EndpointRow
                  method="POST"
                  path="/api/admin/login"
                  description="Establish a secure administrative session."
                />

                <EndpointRow
                  method="POST"
                  path="/api/admin/logout"
                  description="End the current administrative session."
                />

                <div className="docsGovernanceFlow">
                  <span>
                    ASSESSMENT
                  </span>

                  <b>
                    →
                  </b>

                  <span>
                    CORRECTION
                  </span>

                  <b>
                    →
                  </b>

                  <span>
                    REVIEW
                  </span>

                  <b>
                    →
                  </b>

                  <span>
                    DRAFT
                  </span>

                  <b>
                    →
                  </b>

                  <span>
                    APPROVAL
                  </span>

                  <b>
                    →
                  </b>

                  <span>
                    ACTIVE
                    METHODOLOGY
                  </span>
                </div>

                <div className="docsWarning">
                  Administrative
                  credentials and
                  private
                  environment
                  variables should
                  never be exposed
                  in client-side
                  code,
                  documentation or
                  demonstrations.
                </div>
              </DocSection>
            </section>
          </div>
        </main>

        <footer className="docsFooter">
          <strong>
            BANKREGX
          </strong>

          <span>
            PRODUCT &
            DEVELOPER
            REFERENCE
          </span>
        </footer>
      </div>

      <style jsx global>{`
        * {
          box-sizing:
            border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
          background:
            #071014;
          color:
            #edf5f3;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        body {
          background:
            radial-gradient(
              circle at top left,
              rgba(
                63,
                139,
                125,
                0.12
              ),
              transparent 34%
            ),
            #071014;
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
        }

        .docsMain {
          width:
            min(
              1180px,
              90vw
            );
          margin:
            0 auto;
        }

        /*
         * HERO
         */

        .docsHero {
          padding:
            72px 0 32px;
        }

        .docsEyebrow,
        .docsSectionEyebrow {
          color:
            #87c3b7;
          font-size:
            9px;
          font-weight:
            800;
          letter-spacing:
            0.17em;
        }

        .docsHero h1 {
          margin:
            12px 0 14px;
          font-size:
            clamp(
              44px,
              5vw,
              66px
            );
          line-height:
            1;
          letter-spacing:
            -0.045em;
          color:
            #f1f6f5;
        }

        .docsHero p {
          max-width:
            730px;
          color:
            #9eb2ae;
          line-height:
            1.7;
          font-size:
            14px;
        }

        /*
         * PRODUCT MODEL
         */

        .docsModel {
          display:
            grid;
          grid-template-columns:
            repeat(
              4,
              1fr
            );
          gap:
            1px;
          margin:
            18px 0 36px;
          overflow:
            hidden;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );
          border-radius:
            13px;
          background:
            rgba(
              255,
              255,
              255,
              0.06
            );
        }

        .docsModelCard {
          padding:
            20px;
          background:
            #091519;
        }

        .docsModelCard
          > span {
          color:
            #708b84;
          font-family:
            ui-monospace,
            monospace;
          font-size:
            8px;
        }

        .docsModelCard h3 {
          margin:
            10px 0 6px;
          font-size:
            15px;
        }

        .docsModelCard p {
          margin:
            0;
          color:
            #849c97;
          line-height:
            1.55;
          font-size:
            10px;
        }

        /*
         * LAYOUT
         */

        .docsLayout {
          display:
            grid;
          grid-template-columns:
            210px
            minmax(
              0,
              1fr
            );
          gap:
            25px;
          margin-bottom:
            80px;
        }

        /*
         * SIDEBAR
         */

        .docsSidebar {
          position:
            sticky;
          top:
            105px;
          align-self:
            start;
          padding:
            17px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.07
            );
          border-radius:
            12px;
          background:
            rgba(
              10,
              23,
              28,
              0.65
            );
        }

        .docsSideLabel {
          margin-bottom:
            11px;
          color:
            #718c85;
          font-size:
            8px;
          font-weight:
            800;
          letter-spacing:
            0.13em;
        }

        .docsSidebar
          > a {
          display:
            block;
          padding:
            8px 0;
          color:
            #9db0ac;
          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.045
            );
          text-decoration:
            none;
          font-size:
            10px;
        }

        .docsSidebar
          > a:hover {
          color:
            #e4eeeb;
        }

        .docsPrivateNote {
          margin-top:
            16px;
          padding:
            12px;
          border-left:
            2px solid
            rgba(
              134,
              200,
              187,
              0.3
            );
          background:
            rgba(
              90,
              154,
              141,
              0.05
            );
          color:
            #78928c;
          font-size:
            9px;
          line-height:
            1.55;
        }

        .docsPrivateNote
          strong {
          display:
            block;
          margin-bottom:
            5px;
          color:
            #9ebdb6;
        }

        /*
         * SECTIONS
         */

        .docsContent {
          display:
            grid;
          gap:
            12px;
        }

        .docsSection {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.075
            );
          border-radius:
            14px;
          background:
            rgba(
              10,
              23,
              28,
              0.76
            );
          overflow:
            hidden;
          scroll-margin-top:
            100px;
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
            22px;
          border:
            0;
          background:
            transparent;
          text-align:
            left;
          color:
            inherit;
        }

        .docsSectionHeader:hover {
          background:
            rgba(
              255,
              255,
              255,
              0.018
            );
        }

        .docsSectionHeader h2 {
          margin:
            6px 0 0;
          font-size:
            20px;
        }

        .docsChevron {
          color:
            #809a94;
          font-size:
            17px;
        }

        .docsSectionBody {
          padding:
            0 22px
            24px;
          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.05
            );
        }

        .docsSectionBody
          > p {
          color:
            #a0b3af;
          line-height:
            1.7;
          font-size:
            12px;
        }

        .docsSectionBody h3 {
          margin:
            24px 0 8px;
          color:
            #dce7e4;
          font-size:
            13px;
        }

        /*
         * FLOW
         */

        .docsFlow,
        .docsGovernanceFlow {
          display:
            flex;
          align-items:
            center;
          gap:
            8px;
          margin:
            22px 0;
        }

        .docsFlow > div {
          flex:
            1;
          min-height:
            80px;
          padding:
            13px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          border-radius:
            8px;
          background:
            rgba(
              0,
              0,
              0,
              0.11
            );
        }

        .docsFlow
          > div
          span {
          display:
            block;
          color:
            #6f8882;
          font-size:
            7px;
          letter-spacing:
            0.1em;
        }

        .docsFlow
          > div
          strong {
          display:
            block;
          margin-top:
            8px;
          color:
            #b7c8c4;
          font-size:
            10px;
        }

        .docsFlow > b,
        .docsGovernanceFlow
          > b {
          color:
            #607972;
          font-weight:
            400;
        }

        /*
         * METHOD BAR
         */

        .docsMethodBar {
          display:
            flex;
          align-items:
            center;
          gap:
            9px;
          margin:
            18px 0;
          padding:
            11px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          border-radius:
            8px;
          background:
            rgba(
              0,
              0,
              0,
              0.12
            );
        }

        .docsMethod {
          padding:
            5px 7px;
          border-radius:
            5px;
          background:
            rgba(
              103,
              181,
              153,
              0.09
            );
          color:
            #acd7c2;
          font-size:
            8px;
          font-weight:
            800;
        }

        .docsMethodBar
          code {
          flex:
            1;
          color:
            #b4c8c3;
          font-size:
            10px;
        }

        .docsAccess {
          color:
            #718b85;
          font-size:
            8px;
          text-transform:
            uppercase;
        }

        /*
         * CODE
         */

        .docsCode {
          margin:
            9px 0 20px;
          padding:
            16px;
          overflow-x:
            auto;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.065
            );
          border-radius:
            9px;
          background:
            #061115;
          color:
            #b9cbc6;
          line-height:
            1.6;
          font-size:
            10px;
        }

        /*
         * CALLOUTS
         */

        .docsCallout,
        .docsWarning {
          margin-top:
            18px;
          padding:
            13px;
          border-left:
            2px solid
            rgba(
              132,
              200,
              186,
              0.36
            );
          background:
            rgba(
              78,
              142,
              129,
              0.055
            );
          color:
            #8ea6a0;
          line-height:
            1.6;
          font-size:
            10px;
        }

        .docsCallout
          code {
          color:
            #bfd6d0;
        }

        .docsWarning {
          border-left-color:
            rgba(
              207,
              164,
              91,
              0.4
            );
          background:
            rgba(
              172,
              126,
              57,
              0.045
            );
          color:
            #b6a77e;
        }

        /*
         * ENDPOINT ROW
         */

        .docsEndpoint {
          display:
            grid;
          grid-template-columns:
            150px
            230px
            1fr;
          gap:
            14px;
          padding:
            14px 0;
          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              0.05
            );
        }

        .docsEndpointMethod {
          color:
            #9fcbb7;
          font-family:
            ui-monospace,
            monospace;
          font-size:
            9px;
        }

        .docsEndpointPath {
          color:
            #b4c6c2;
          font-family:
            ui-monospace,
            monospace;
          font-size:
            9px;
        }

        .docsEndpointDescription {
          color:
            #889f9a;
          line-height:
            1.5;
          font-size:
            10px;
        }

        /*
         * GOVERNANCE FLOW
         */

        .docsGovernanceFlow {
          flex-wrap:
            wrap;
          margin-top:
            25px;
        }

        .docsGovernanceFlow
          span {
          padding:
            8px 9px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          border-radius:
            6px;
          background:
            rgba(
              255,
              255,
              255,
              0.025
            );
          color:
            #879f99;
          font-size:
            7px;
          letter-spacing:
            0.08em;
        }

        /*
         * FOOTER
         */

        .docsFooter {
          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              0.06
            );
          padding:
            25px 5vw;
          display:
            flex;
          justify-content:
            center;
          align-items:
            center;
          gap:
            10px;
          color:
            #637b76;
          font-size:
            9px;
          letter-spacing:
            0.12em;
        }

        .docsFooter strong {
          color:
            #819b95;
        }

        /*
         * RESPONSIVE
         */

        @media (
          max-width:
            850px
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

          .docsEndpoint {
            grid-template-columns:
              1fr;
          }

          .docsFlow {
            align-items:
              stretch;
            flex-direction:
              column;
          }

          .docsFlow > b {
            transform:
              rotate(
                90deg
              );
            align-self:
              center;
          }
        }

        @media (
          max-width:
            500px
        ) {
          .docsMain {
            width:
              92vw;
          }

          .docsModel {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>
    </>
  );
}

/*
 * =========================================================
 * REUSABLE DOC COMPONENTS
 * =========================================================
 */

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
        onClick={
          onToggle
        }
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

      {open && (
        <div className="docsSectionBody">
          {children}
        </div>
      )}
    </article>
  );
}

function MethodBar({
  method,
  path,
  access,
}) {
  return (
    <div className="docsMethodBar">
      <span className="docsMethod">
        {method}
      </span>

      <code>
        {path}
      </code>

      <span className="docsAccess">
        {access}
      </span>
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