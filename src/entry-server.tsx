import React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { getRoute, organizationJsonLd, webApplicationJsonLd } from "./lib/site";
import "./styles/main.css";

export function renderPage(path: string) {
  const route = getRoute(path);
  const html = renderToString(<App path={path} />);
  const jsonLd = route.path === "/" ? [webApplicationJsonLd(), organizationJsonLd()] : organizationJsonLd();
  return { html, route, jsonLd };
}
