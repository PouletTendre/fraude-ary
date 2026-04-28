const APP_VERSION = "0.1.0";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border-subtle)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          fontWeight: 510,
          color: "var(--text-muted)",
        }}
      >
        Fraude-Ary v{APP_VERSION} &copy; {new Date().getFullYear()}
      </span>
    </footer>
  );
}
