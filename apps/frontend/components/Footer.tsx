"use client";

import Link from "next/link";
import { Package, FileText, Clock, Github } from "lucide-react";

const APP_VERSION = "0.1.0";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Package className="w-4 h-4" />
            <span>Fraude-Ary v{APP_VERSION}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary text-text-muted dark:hover:text-text-muted transition-colors"
            >
              <FileText className="w-4 h-4" />
              Documentation
            </Link>
            <Link
              href="#"
              className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary text-text-muted dark:hover:text-text-muted transition-colors"
            >
              <Clock className="w-4 h-4" />
              Changelog
            </Link>
            <Link
              href="#"
              className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary text-text-muted dark:hover:text-text-muted transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </Link>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-text-muted dark:text-text-tertiary">
          © {new Date().getFullYear()} Fraude-Ary. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
