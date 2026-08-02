import { HomePage } from "./pages/HomePage";
import { GuidePage } from "./pages/GuidePage";
import { NotFoundPage, PrivacyPage, TermsPage } from "./pages/StaticPages";
import { getRoute, normalizePath } from "./lib/site";

export function App({ path = "/" }: { path?: string }) {
  const route = getRoute(path);
  const normalized = normalizePath(path);

  return (
    <div className="site-shell">
      <Header currentPath={route.path} />
      {normalized === "/" ? <HomePage /> : null}
      {normalized === "/guide/" ? <GuidePage /> : null}
      {normalized === "/privacy/" ? <PrivacyPage /> : null}
      {normalized === "/terms/" ? <TermsPage /> : null}
      {route.path === "/404.html" && normalized !== "/" && normalized !== "/guide/" && normalized !== "/privacy/" && normalized !== "/terms/" ? (
        <NotFoundPage />
      ) : null}
      <Footer />
    </div>
  );
}

function Header({ currentPath }: { currentPath: string }) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Drawing Prompt Generator home">
        <span className="brand-mark">DPG</span>
        <span>Drawing Prompt Generator</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="/" aria-current={currentPath === "/" ? "page" : undefined}>
          Generator
        </a>
        <a href="/guide/" aria-current={currentPath === "/guide/" ? "page" : undefined}>
          Guide
        </a>
        <a href="/blog/" aria-current={currentPath === "/blog/" ? "page" : undefined}>
          Blog
        </a>
        <a href="/privacy/" aria-current={currentPath === "/privacy/" ? "page" : undefined}>
          Privacy
        </a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>Original drawing prompts, AI text refinement, and local browser saves.</p>
      <nav aria-label="Footer navigation">
        <a href="/guide/">Guide</a>
        <a href="/blog/">Blog</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
      </nav>
    </footer>
  );
}
