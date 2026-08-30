const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    href: "/",
  },
  {
    id: "regulatory",
    label: "Regulatory Intelligence",
    href: "/regulatory-news",
  },
  {
    id: "studio",
    label: "Expert Studio",
    href: "/expert-studio",
    private: true,
  },
  {
    id: "review",
    label: "Review Queue",
    href: "/expert-review",
    private: true,
  },
  {
    id: "docs",
    label: "Docs",
    href: "/docs",
  },
];

export default function BankRegXNav({
  current = "",
}) {
  return (
    <>
      <header className="brxNav">
        <div className="brxNavInner">
          {/*
           * =================================================
           * BRAND
           * =================================================
           */}

          <a
            href="/"
            className="brxBrand"
          >
            <div className="brxLogo">
              BRX
            </div>

            <div className="brxBrandText">
              <div className="brxBrandName">
                BANKREGX
              </div>

              <div className="brxBrandTagline">
                AI Control Intelligence
                for Banking
              </div>
            </div>
          </a>

          {/*
           * =================================================
           * MAIN NAVIGATION
           * =================================================
           */}

          <nav className="brxLinks">
            {NAV_ITEMS.map(
              (item) => {
                const active =
                  current ===
                  item.id;

                return (
                  <a
                    key={
                      item.id
                    }
                    href={
                      item.href
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`brxLink ${
                      active
                        ? "brxLinkActive"
                        : ""
                    }`}
                  >
                    <span>
                      {
                        item.label
                      }
                    </span>

                    {item.private && (
                      <span className="brxPrivate">
                        PRIVATE
                      </span>
                    )}
                  </a>
                );
              }
            )}
          </nav>

          {/*
           * =================================================
           * EXPERT INTELLIGENCE BADGE
           * =================================================
           */}

          <div className="brxIntelligenceBadge">
            <span className="brxIntelligenceDot" />

            <span>
              EXPERT
              INTELLIGENCE
            </span>
          </div>
        </div>
      </header>

      <style jsx global>{`
        /*
         * ===================================================
         * BANKREGX SHARED DESIGN TOKENS
         * ===================================================
         */

        :root {
          --brx-bg:
            #071014;

          --brx-surface:
            #0a171b;

          --brx-surface-2:
            #0c1b20;

          --brx-border:
            rgba(
              255,
              255,
              255,
              0.075
            );

          --brx-border-strong:
            rgba(
              255,
              255,
              255,
              0.1
            );

          --brx-border-accent:
            rgba(
              143,
              209,
              195,
              0.28
            );

          --brx-text:
            #edf5f3;

          --brx-text-strong:
            #f3f8f7;

          --brx-muted:
            #a4b7b3;

          --brx-muted-2:
            #819994;

          --brx-muted-3:
            #6f8984;

          --brx-accent:
            #9dd6ca;

          --brx-accent-soft:
            #88c5b8;

          --brx-accent-dark:
            #5e9e91;
        }

        html {
          background:
            var(
              --brx-bg
            );
        }

        body {
          background:
            radial-gradient(
              circle
              at top left,
              rgba(
                54,
                132,
                118,
                0.13
              ),
              transparent
                34%
            ),
            var(
              --brx-bg
            );

          color:
            var(
              --brx-text
            );
        }

        ::selection {
          background:
            rgba(
              157,
              214,
              202,
              0.22
            );

          color:
            #f7fbfa;
        }

        /*
         * ===================================================
         * HEADER
         * ===================================================
         */

        .brxNav {
          width:
            100%;

          min-height:
            76px;

          padding:
            0 3.2vw;

          position:
            sticky;

          top:
            0;

          z-index:
            50;

          display:
            flex;

          align-items:
            center;

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
              15,
              19,
              0.95
            );

          backdrop-filter:
            blur(
              18px
            );

          -webkit-backdrop-filter:
            blur(
              18px
            );

          box-shadow:
            0 7px 24px
            rgba(
              0,
              0,
              0,
              0.08
            );
        }

        .brxNavInner {
          width:
            100%;

          display:
            flex;

          align-items:
            center;

          gap:
            26px;
        }

        /*
         * ===================================================
         * BRAND
         * ===================================================
         */

        .brxBrand {
          display:
            flex;

          align-items:
            center;

          gap:
            12px;

          text-decoration:
            none;

          flex-shrink:
            0;
        }

        .brxBrand:hover
          .brxLogo {
          border-color:
            rgba(
              157,
              214,
              202,
              0.52
            );

          background:
            rgba(
              103,
              176,
              161,
              0.12
            );
        }

        .brxLogo {
          width:
            42px;

          height:
            42px;

          border-radius:
            11px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            rgba(
              142,
              207,
              194,
              0.38
            );

          background:
            rgba(
              80,
              147,
              134,
              0.085
            );

          color:
            #b9e2da;

          font-size:
            10px;

          font-weight:
            900;

          letter-spacing:
            0.08em;

          transition:
            150ms ease;
        }

        .brxBrandText {
          min-width:
            0;
        }

        .brxBrandName {
          color:
            #f1f7f5;

          font-weight:
            850;

          font-size:
            14px;

          letter-spacing:
            0.15em;

          line-height:
            1.15;
        }

        .brxBrandTagline {
          margin-top:
            4px;

          color:
            #9aafab;

          font-size:
            9px;

          line-height:
            1.2;

          white-space:
            nowrap;
        }

        /*
         * ===================================================
         * NAVIGATION
         * ===================================================
         */

        .brxLinks {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            4px;

          flex:
            1;

          min-width:
            0;
        }

        .brxLink {
          position:
            relative;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            5px;

          min-height:
            38px;

          padding:
            0 11px;

          border-radius:
            8px;

          text-decoration:
            none;

          color:
            #a4b7b3;

          font-size:
            11px;

          font-weight:
            620;

          line-height:
            1;

          border:
            1px solid
            transparent;

          white-space:
            nowrap;

          transition:
            background
              150ms
              ease,
            color
              150ms
              ease,
            border-color
              150ms
              ease,
            transform
              150ms
              ease;
        }

        .brxLink:hover {
          color:
            #f0f7f5;

          background:
            rgba(
              255,
              255,
              255,
              0.045
            );

          border-color:
            rgba(
              255,
              255,
              255,
              0.04
            );
        }

        .brxLinkActive {
          color:
            #d8eee9;

          border-color:
            rgba(
              137,
              202,
              189,
              0.28
            );

          background:
            linear-gradient(
              145deg,
              rgba(
                86,
                158,
                143,
                0.13
              ),
              rgba(
                255,
                255,
                255,
                0.028
              )
            );
        }

        .brxLinkActive:hover {
          color:
            #eff8f6;

          border-color:
            rgba(
              147,
              214,
              200,
              0.38
            );

          background:
            rgba(
              93,
              164,
              150,
              0.14
            );
        }

        /*
         * ===================================================
         * PRIVATE LABEL
         * ===================================================
         */

        .brxPrivate {
          padding:
            3px 5px;

          border-radius:
            4px;

          color:
            #8da39f;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.045
            );

          background:
            rgba(
              255,
              255,
              255,
              0.035
            );

          font-size:
            6px;

          font-weight:
            850;

          line-height:
            1;

          letter-spacing:
            0.08em;
        }

        .brxLinkActive
          .brxPrivate {
          color:
            #9ec4bc;

          border-color:
            rgba(
              134,
              200,
              187,
              0.13
            );

          background:
            rgba(
              86,
              158,
              143,
              0.09
            );
        }

        /*
         * ===================================================
         * EXPERT INTELLIGENCE BADGE
         * ===================================================
         */

        .brxIntelligenceBadge {
          display:
            flex;

          align-items:
            center;

          gap:
            7px;

          flex-shrink:
            0;

          padding:
            9px 12px;

          border:
            1px solid
            rgba(
              137,
              202,
              189,
              0.28
            );

          border-radius:
            999px;

          color:
            #b8ddd5;

          background:
            rgba(
              86,
              156,
              142,
              0.07
            );

          font-size:
            8px;

          font-weight:
            750;

          line-height:
            1;

          letter-spacing:
            0.1em;

          white-space:
            nowrap;
        }

        .brxIntelligenceDot {
          width:
            6px;

          height:
            6px;

          flex-shrink:
            0;

          border-radius:
            50%;

          background:
            #8bd1c2;

          box-shadow:
            0 0 11px
            rgba(
              131,
              200,
              185,
              0.62
            );
        }

        /*
         * ===================================================
         * SHARED BUTTON IMPROVEMENTS
         * ===================================================
         */

        .primaryButton {
          background:
            var(
              --brx-accent
            ) !important;

          color:
            #061210 !important;

          box-shadow:
            0 8px 26px
            rgba(
              91,
              161,
              147,
              0.13
            );

          transition:
            transform
              150ms
              ease,
            box-shadow
              150ms
              ease,
            opacity
              150ms
              ease;
        }

        .primaryButton:hover:not(
            :disabled
          ) {
          transform:
            translateY(
              -1px
            );

          box-shadow:
            0 10px 30px
            rgba(
              91,
              161,
              147,
              0.2
            );
        }

        /*
         * Slightly improve secondary text contrast
         * across the application.
         */

        .heroText,
        .modeDescription,
        .inputHint {
          color:
            #95aaa6 !important;
        }

        /*
         * ===================================================
         * MEDIUM SCREEN
         * ===================================================
         */

        @media (
          max-width:
            1180px
        ) {
          .brxNav {
            padding:
              0 2vw;
          }

          .brxNavInner {
            gap:
              14px;
          }

          .brxLink {
            padding:
              0 7px;

            font-size:
              10px;
          }

          .brxPrivate {
            display:
              none;
          }

          .brxIntelligenceBadge {
            padding:
              8px 9px;

            font-size:
              7px;
          }
        }

        /*
         * ===================================================
         * TABLET
         * ===================================================
         */

        @media (
          max-width:
            920px
        ) {
          .brxIntelligenceBadge {
            display:
              none;
          }

          .brxLinks {
            justify-content:
              flex-end;
          }
        }

        /*
         * ===================================================
         * MOBILE
         * ===================================================
         */

        @media (
          max-width:
            760px
        ) {
          .brxNav {
            position:
              relative;

            min-height:
              auto;

            padding:
              14px 4vw;
          }

          .brxNavInner {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap:
              13px;
          }

          .brxBrandTagline {
            white-space:
              normal;
          }

          .brxLinks {
            width:
              100%;

            justify-content:
              flex-start;

            overflow-x:
              auto;

            gap:
              4px;

            padding-bottom:
              3px;

            scrollbar-width:
              thin;

            -webkit-overflow-scrolling:
              touch;
          }

          .brxLink {
            flex-shrink:
              0;

            padding:
              0 10px;

            font-size:
              10px;
          }

          .brxPrivate {
            display:
              inline-flex;
          }
        }

        /*
         * ===================================================
         * SMALL MOBILE
         * ===================================================
         */

        @media (
          max-width:
            430px
        ) {
          .brxLogo {
            width:
              39px;

            height:
              39px;
          }

          .brxBrandName {
            font-size:
              13px;
          }

          .brxBrandTagline {
            font-size:
              8px;
          }
        }
      `}</style>
    </>
  );
}