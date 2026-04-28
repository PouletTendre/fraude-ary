"use client";

import Link from "next/link";
import { Package, FileText, Clock, Github } from "lucide-react";

const APP_VERSION = "0.1.0";

export function Footer() {
  return (
    <>
      <style>{`
        .footer-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 150ms;
        }
        .footer-link:hover {
          color: var(--link-blue);
        }
      `}</style>
      <footer className="mt-auto" style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
              <Package className="w-4 h-4" />
              <span>Fraude-Ary v{APP_VERSION}</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="footer-link">
                <FileText className="w-4 h-4" />
                Documentation
              </Link>
              <Link href="#" className="footer-link">
                <Clock className="w-4 h-4" />
                Changelog
              </Link>
              <Link href="#" className="footer-link">
                <Github className="w-4 h-4" />
                GitHub
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} Fraude-Ary. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
