export const site = {
  name: "Drawing Prompt Generator",
  origin: "https://www.drawingpromptgenerator.net",
  description:
    "Turn a rough idea into a specific drawing prompt with medium, mood, difficulty, composition, constraints, and optional AI image prompt formatting.",
  ogImage: "https://www.drawingpromptgenerator.net/og-image.png"
};

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  canonical: string;
}

export const routes: RouteMeta[] = [
  {
    path: "/",
    title: "Drawing Prompt Generator - AI Art Prompts From Rough Ideas",
    description:
      "Use a free drawing prompt generator to refine rough ideas into specific sketch, character, classroom, and AI image prompts.",
    canonical: `${site.origin}/`
  },
  {
    path: "/guide/",
    title: "How to Use Drawing Prompts - Drawing Prompt Generator Guide",
    description:
      "Learn how to build stronger drawing prompts with subject, action, setting, medium, mood, constraint, and review habits.",
    canonical: `${site.origin}/guide/`
  },
  {
    path: "/privacy/",
    title: "Privacy Policy - Drawing Prompt Generator",
    description:
      "Privacy details for the AI drawing prompt generator, including API requests, local favorites, and data minimization.",
    canonical: `${site.origin}/privacy/`
  },
  {
    path: "/terms/",
    title: "Terms of Use - Drawing Prompt Generator",
    description:
      "Terms for using Drawing Prompt Generator, including acceptable use, AI output limits, and intellectual property safety.",
    canonical: `${site.origin}/terms/`
  },
  {
    path: "/404.html",
    title: "Page Not Found - Drawing Prompt Generator",
    description: "The requested page could not be found.",
    canonical: `${site.origin}/404.html`
  }
];

export const normalizePath = (path: string): string => {
  if (path === "/404.html") {
    return path;
  }
  if (!path || path === "/index.html") {
    return "/";
  }
  return path.endsWith("/") ? path : `${path}/`;
};

export const getRoute = (path: string): RouteMeta => {
  const normalized = normalizePath(path);
  return routes.find((route) => route.path === normalized) ?? routes.find((route) => route.path === "/404.html")!;
};

export const webApplicationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: site.name,
  url: site.origin,
  applicationCategory: "DesignApplication",
  operatingSystem: "Any",
  description: site.description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  featureList: [
    "AI drawing prompt refinement",
    "Random drawing prompt fallback",
    "Kids and classroom modes",
    "Character prompt mode",
    "AI image prompt text formatting",
    "Local favorites and recent prompts"
  ]
});

export const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.origin,
  logo: `${site.origin}/favicon.svg`
});
