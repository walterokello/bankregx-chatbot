import Link from "next/link";

export default function AdminHub() {
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
                  AI Control Intelligence
                </div>
              </div>
            </Link>

            <div className="privateBadge">
              PRIVATE WORKSPACE
            </div>
          </div>
        </header>

        <section className="hero">
          <div className="eyebrow">
            BANKREGX · INTERNAL
          </div>

          <h1>
            BankRegX Governance Workspace
          </h1>

          <p>
            Private workspace for expert methodology,
            professional review and controlled learning
            within BankRegX.
          </p>
        </section>

        <section className="workspace">
          <Link
            href="/expert-studio"
            className="workspaceCard"
          >
            <div className="cardTop">
              <div className="icon">
                ES
              </div>

              <div className="arrow">
                →
              </div>
            </div>

            <div className="cardLabel">
              METHODOLOGY
            </div>

            <h2>
              Expert Studio
            </h2>

            <p>
              Manage, review, approve and version the
              expert methodology that informs BankRegX
              assessments.
            </p>

            <div className="cardFooter">
              Open Expert Studio
            </div>
          </Link>

          <Link
            href="/expert-review"
            className="workspaceCard"
          >
            <div className="cardTop">
              <div className="icon">
                RQ
              </div>

              <div className="arrow">
                →
              </div>
            </div>

            <div className="cardLabel">
              EXPERT REVIEW
            </div>

            <h2>
              Review Queue
            </h2>

            <p>
              Review corrections, rejected assessments
              and potential lessons before they influence
              BankRegX methodology.
            </p>

            <div className="cardFooter">
              Open Review Queue
            </div>
          </Link>
        </section>

        <section className="governance">
          <div className="governanceHeader">
            <div className="eyebrow">
              GOVERNED LEARNING
            </div>

            <h2>
              Human judgement remains in control.
            </h2>

            <p>
              User feedback does not directly alter
              approved BankRegX methodology.
            </p>
          </div>

          <div className="flow">
            <FlowItem
              number="01"
              title="Assessment"
              text="BankRegX produces an assessment using approved methodology."
            />

            <div className="connector">
              →
            </div>

            <FlowItem
              number="02"
              title="Feedback"
              text="A correction or rejection can create an expert review item."
            />

            <div className="connector">
              →
            </div>

            <FlowItem
              number="03"
              title="Review"
              text="The proposed lesson is reviewed before becoming methodology."
            />

            <div className="connector">
              →
            </div>

            <FlowItem
              number="04"
              title="Approval"
              text="Only approved guidance informs future assessments."
            />
          </div>
        </section>

        <section className="linksSection">
          <div>
            <div className="eyebrow">
              PUBLIC SITE
            </div>

            <h2>
              Return to BankRegX
            </h2>
          </div>

          <div className="publicLinks">
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
          </div>
        </section>

        <footer className="footer">
          <div>
            <strong>
              BankRegX
            </strong>

            <span>
              Private Intelligence Governance Workspace
            </span>
          </div>

          <div className="footerNote">
            Administrative functions are intended for
            authorised BankRegX administrators only.
          </div>
        </footer>
      </main>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(html) {
          background: #061314;
        }

        :global(body) {
          margin: 0;

          background: #061314;

          color: #f2f7f6;

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

          background-color: #061314;

          background:
            radial-gradient(
              circle at 18% 0%,
              rgba(20, 184, 166, 0.09),
              transparent 35%
            ),
            linear-gradient(
              180deg,
              #061314 0%,
              #071718 55%,
              #061314 100%
            );
        }

        .header {
          border-bottom:
            1px solid
            rgba(255, 255, 255, 0.06);

          background:
            rgba(5, 17, 18, 0.94);
        }

        .headerInner {
          max-width: 1120px;

          min-height: 74px;

          margin: auto;

          padding:
            0 28px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;
        }

        .brand {
          display: flex;

          align-items: center;

          gap: 11px;

          text-decoration:
            none !important;
        }

        .brandBadge {
          width: 38px;
          height: 38px;

          display: grid;

          place-items: center;

          border:
            1px solid
            rgba(45, 212, 191, 0.5);

          border-radius: 9px;

          background:
            rgba(20, 184, 166, 0.08);

          color: #5eead4;

          font-size: 11px;

          font-weight: 800;
        }

        .brandName {
          color: #f1f7f6;

          font-size: 14px;

          font-weight: 800;

          letter-spacing:
            0.08em;
        }

        .brandSub {
          margin-top: 2px;

          color: #66817c;

          font-size: 10px;
        }

        .privateBadge {
          padding:
            7px 10px;

          border:
            1px solid
            rgba(45, 212, 191, 0.22);

          border-radius: 7px;

          color: #49cfbb;

          background:
            rgba(20, 184, 166, 0.05);

          font-size: 9px;

          font-weight: 800;

          letter-spacing:
            0.13em;
        }

        .hero {
          max-width: 1120px;

          margin: auto;

          padding:
            95px 28px 55px;
        }

        .eyebrow {
          color: #40cdb8;

          font-size: 10px;

          font-weight: 800;

          letter-spacing:
            0.18em;
        }

        .hero h1 {
          margin:
            15px 0 15px;

          color: #f5fbfa;

          font-size:
            clamp(
              42px,
              6vw,
              67px
            );

          line-height: 1;

          letter-spacing:
            -0.045em;
        }

        .hero p {
          max-width: 680px;

          margin: 0;

          color: #829c97;

          font-size: 16px;

          line-height: 1.7;
        }

        .workspace {
          max-width: 1120px;

          margin: auto;

          padding:
            10px 28px 85px;

          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap: 16px;
        }

        .workspaceCard {
          min-height: 330px;

          padding: 30px;

          display: flex;

          flex-direction: column;

          border:
            1px solid
            rgba(255, 255, 255, 0.07);

          border-radius: 15px;

          background:
            rgba(255, 255, 255, 0.018);

          text-decoration:
            none !important;

          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .workspaceCard:hover {
          transform:
            translateY(-3px);

          border-color:
            rgba(45, 212, 191, 0.25);

          background:
            rgba(20, 184, 166, 0.035);
        }

        .cardTop {
          margin-bottom: 36px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;
        }

        .icon {
          width: 46px;
          height: 46px;

          display: grid;

          place-items: center;

          border-radius: 10px;

          background:
            rgba(20, 184, 166, 0.08);

          border:
            1px solid
            rgba(45, 212, 191, 0.16);

          color: #59dbc6;

          font-size: 11px;

          font-weight: 800;
        }

        .arrow {
          color: #476f69;

          font-size: 22px;
        }

        .cardLabel {
          margin-bottom: 8px;

          color: #39c8b3;

          font-size: 9px;

          font-weight: 800;

          letter-spacing:
            0.16em;
        }

        .workspaceCard h2 {
          margin:
            0 0 12px;

          color: #edf6f4;

          font-size: 25px;

          letter-spacing:
            -0.025em;
        }

        .workspaceCard p {
          margin: 0;

          color: #78928d;

          font-size: 13px;

          line-height: 1.7;
        }

        .cardFooter {
          margin-top: auto;

          padding-top: 28px;

          color: #59d9c5;

          font-size: 12px;

          font-weight: 700;
        }

        .governance {
          max-width: 1120px;

          margin: auto;

          padding:
            80px 28px;

          border-top:
            1px solid
            rgba(255, 255, 255, 0.055);
        }

        .governanceHeader {
          max-width: 650px;

          margin-bottom: 36px;
        }

        .governanceHeader h2,
        .linksSection h2 {
          margin:
            9px 0 10px;

          color: #eff7f5;

          font-size: 29px;

          letter-spacing:
            -0.025em;
        }

        .governanceHeader p {
          margin: 0;

          color: #76908b;

          font-size: 13px;

          line-height: 1.65;
        }

        .flow {
          display: grid;

          grid-template-columns:
            1fr auto
            1fr auto
            1fr auto
            1fr;

          gap: 9px;

          align-items: stretch;
        }

        .connector {
          align-self: center;

          color: #345c56;

          font-size: 17px;
        }

        .linksSection {
          max-width: 1120px;

          margin: auto;

          padding:
            70px 28px;

          border-top:
            1px solid
            rgba(255, 255, 255, 0.055);

          display: flex;

          justify-content:
            space-between;

          gap: 40px;

          align-items: center;
        }

        .publicLinks {
          display: flex;

          flex-wrap: wrap;

          justify-content:
            flex-end;

          gap: 9px;
        }

        .publicLinks a {
          padding:
            9px 12px;

          border:
            1px solid
            rgba(255, 255, 255, 0.07);

          border-radius: 7px;

          color: #7d9792;

          font-size: 11px;

          text-decoration:
            none !important;
        }

        .publicLinks a:hover {
          color: #54d8c3;

          border-color:
            rgba(45, 212, 191, 0.2);
        }

        /*
         * Explicit footer styling prevents
         * any global BankRegX footer style
         * from introducing a blue background.
         */
        .footer {
          max-width: 1120px;

          margin:
            0 auto;

          padding:
            34px 28px 45px;

          border-top:
            1px solid
            rgba(255, 255, 255, 0.055);

          display: flex;

          justify-content:
            space-between;

          gap: 30px;

          background:
            transparent !important;

          background-color:
            transparent !important;

          background-image:
            none !important;

          box-shadow:
            none !important;

          color: #596f6b;

          font-size: 10px;

          line-height: 1.6;
        }

        .footer strong {
          display: block;

          margin-bottom: 3px;

          color: #91aaa5;

          font-size: 11px;
        }

        .footer span {
          display: block;
        }

        .footerNote {
          max-width: 390px;

          text-align: right;

          color: #596f6b;
        }

        @media (
          max-width: 850px
        ) {
          .workspace {
            grid-template-columns:
              1fr;
          }

          .flow {
            grid-template-columns:
              1fr;
          }

          .connector {
            justify-self: center;

            transform:
              rotate(90deg);
          }

          .linksSection {
            flex-direction:
              column;

            align-items:
              flex-start;
          }

          .publicLinks {
            justify-content:
              flex-start;
          }
        }

        @media (
          max-width: 550px
        ) {
          .headerInner,
          .hero,
          .workspace,
          .governance,
          .linksSection,
          .footer {
            padding-left:
              18px;

            padding-right:
              18px;
          }

          .brandSub {
            display: none;
          }

          .hero {
            padding-top:
              67px;
          }

          .hero h1 {
            font-size:
              43px;
          }

          .workspaceCard {
            min-height:
              300px;
          }

          .footer {
            flex-direction:
              column;
          }

          .footerNote {
            text-align:
              left;
          }
        }
      `}</style>
    </>
  );
}

function FlowItem({
  number,
  title,
  text,
}) {
  return (
    <>
      <div className="flowItem">
        <div className="number">
          {number}
        </div>

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>
      </div>

      <style jsx>{`
        .flowItem {
          min-height: 165px;

          padding: 20px;

          border:
            1px solid
            rgba(255, 255, 255, 0.065);

          border-radius: 11px;

          background:
            rgba(255, 255, 255, 0.015);
        }

        .number {
          margin-bottom: 24px;

          color: #38c8b2;

          font-size: 9px;

          font-weight: 800;
        }

        h3 {
          margin:
            0 0 8px;

          color: #d8e7e4;

          font-size: 14px;
        }

        p {
          margin: 0;

          color: #6f8884;

          font-size: 11.5px;

          line-height: 1.65;
        }
      `}</style>
    </>
  );
}