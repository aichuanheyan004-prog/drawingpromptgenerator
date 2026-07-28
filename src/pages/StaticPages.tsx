export function PrivacyPage() {
  return (
    <main className="static-page">
      <div className="narrow-copy">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy Policy</h1>
        <p>Last updated: July 28, 2026.</p>
        <h2>What the tool sends</h2>
        <p>
          When AI generation is enabled, the rough idea and selected prompt controls are sent to this site's `/api/generate`
          endpoint and then to the configured AI provider to return a text prompt. Do not enter personal, confidential, or sensitive
          information.
        </p>
        <h2>What the site stores</h2>
        <p>
          The site does not require an account, database, cookies, uploads, or analytics in v1. Favorites, recent prompts, and an
          anonymous session id are stored only in your browser's localStorage so the tool can save prompts and apply basic rate
          limiting. You can clear saved prompts in the tool or through your browser.
        </p>
        <h2>Server logs and limits</h2>
        <p>
          Hosting and API providers may process standard security logs such as IP address, user agent, time, and request status.
          The site does not intentionally log prompt text beyond the transient request needed to generate a response.
        </p>
        <h2>Contact</h2>
        <p>For privacy questions, contact the site owner through the repository or hosting account connected to this domain.</p>
      </div>
    </main>
  );
}

export function TermsPage() {
  return (
    <main className="static-page">
      <div className="narrow-copy">
        <p className="eyebrow">Terms</p>
        <h1>Terms of Use</h1>
        <p>Last updated: July 28, 2026.</p>
        <h2>Use of the tool</h2>
        <p>
          Drawing Prompt Generator provides text prompts for creative practice. Outputs may be imperfect, repetitive, or unsuitable
          for a specific class, project, commercial use, or publishing context. Review prompts before using them.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not use the site to request NSFW content, graphic violence, hate, illegal activity, self-harm content, protected
          characters, brand logos, or imitation of living artists. Do not automate requests, bypass rate limits, or overload the AI
          endpoint.
        </p>
        <h2>AI limits</h2>
        <p>
          AI image prompt mode formats text only. The site does not create images. Free AI usage may be rate limited, paused, or
          replaced with local generation to control cost and abuse.
        </p>
        <h2>Rights</h2>
        <p>
          You are responsible for checking whether your final artwork is original and appropriate for your intended use. The site
          does not grant rights to third-party characters, brands, logos, or artist styles.
        </p>
      </div>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="static-page not-found">
      <div className="narrow-copy">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page you requested does not exist. The drawing prompt generator and guide are still available.</p>
        <p>
          <a className="text-link" href="/">
            Open the generator
          </a>
        </p>
      </div>
    </main>
  );
}
