"use client";

import { useState } from "react";
import Link from "next/link";

const APP_VERSION = "0.1.0";

const footerLinks = [
  {
    title: "Plateforme",
    links: [
      { label: "Dashboard", href: "/" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Marchés", href: "/markets" },
      { label: "Actifs", href: "/assets" },
    ],
  },
  {
    title: "Outils",
    links: [
      { label: "Analyse", href: "/analysis" },
      { label: "Simulateur", href: "/simulator" },
      { label: "Diversification", href: "/diversification" },
      { label: "Dividendes", href: "/dividends" },
    ],
  },
  {
    title: "Gestion",
    links: [
      { label: "Transactions", href: "/journal" },
      { label: "Alertes", href: "/alerts" },
      { label: "Notifications", href: "/notifications" },
      { label: "Paramètres", href: "/settings" },
    ],
  },
  {
    title: "À propos",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "GitHub", href: "#" },
      { label: "Licence", href: "#" },
    ],
  },
];

export function Footer() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <>
      <style>{`
        .footer-column-title {
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .footer-link {
          font-family: var(--font-sans);
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.13px;
          color: #FFFFFF;
          display: block;
          margin-bottom: 8px;
          text-decoration: none;
          transition: color 150ms;
        }
        .footer-link:hover {
          color: var(--link-blue);
        }
        .footer-accordion-toggle {
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 0;
        }
        .footer-accordion-toggle.open {
          margin-bottom: 16px;
        }
        .footer-chevron {
          transition: transform 150ms;
          font-size: 10px;
        }
        .footer-chevron.open {
          transform: rotate(180deg);
        }
      `}</style>
      <footer style={{ background: "#303030" }}>
        <div className="max-w-[1920px] mx-auto" style={{ padding: "40px 25px" }}>
          <div style={{ marginBottom: "16px" }}>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              Fraude
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#DA291C",
              }}
            >
              ·
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              Ary
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.6875rem",
                fontWeight: 400,
                color: "var(--text-tertiary)",
                marginLeft: "8px",
              }}
            >
              v{APP_VERSION}
            </span>
          </div>

          <div className="hidden min-[480px]:grid grid-cols-2 md:grid-cols-4 gap-[32px]">
            {footerLinks.map((column) => (
              <div key={column.title}>
                <div className="footer-column-title">{column.title}</div>
                {column.links.map((link) => (
                  <Link key={link.label} href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="block min-[480px]:hidden">
            {footerLinks.map((column) => {
              const isOpen = openSections[column.title] || false;
              return (
                <div key={column.title} style={{ marginBottom: "16px" }}>
                  <button
                    onClick={() => toggleSection(column.title)}
                    className={`footer-accordion-toggle${isOpen ? " open" : ""}`}
                  >
                    {column.title}
                    <span className={`footer-chevron${isOpen ? " open" : ""}`}>
                      ▼
                    </span>
                  </button>
                  {isOpen && (
                    <div>
                      {column.links.map((link) => (
                        <Link key={link.label} href={link.href} className="footer-link">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "24px",
              marginTop: "32px",
              textAlign: "center",
              fontFamily: "var(--font-sans)",
              fontSize: "0.6875rem",
              color: "var(--text-tertiary)",
            }}
          >
            &copy; {new Date().getFullYear()} Fraude-Ary. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
