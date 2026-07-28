import { ArrowRight, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { PromptTool } from "../components/PromptTool";

export function HomePage() {
  return (
    <>
      <PromptTool />
      <section className="content-band">
        <div className="content-grid three">
          <article>
            <Sparkles aria-hidden="true" size={22} />
            <h2>From vague idea to clear prompt</h2>
            <p>
              Start with a short phrase like "a robot gardener" and turn it into a prompt with subject, action, setting, medium,
              mood, palette, composition, and a useful constraint.
            </p>
          </article>
          <article>
            <Palette aria-hidden="true" size={22} />
            <h2>Modes for real drawing tasks</h2>
            <p>
              Beginner, kids, challenge, character, and AI image modes keep the same core structure while changing difficulty,
              audience, and output format.
            </p>
          </article>
          <article>
            <ShieldCheck aria-hidden="true" size={22} />
            <h2>Built with safe boundaries</h2>
            <p>
              The generator avoids NSFW, graphic violence, protected characters, brand logos, and requests to imitate living
              artists. Favorites stay in this browser.
            </p>
          </article>
        </div>
      </section>

      <section className="content-band subtle">
        <div className="narrow-copy">
          <h2>Drawing prompt examples</h2>
          <p>
            Use these as quick starts, then refine them with the tool above. They are written as flexible ideas rather than fixed
            templates, so you can change the subject, medium, time limit, or age level.
          </p>
          <div className="example-grid">
            <Example title="Sketch warm-up" text="Draw a teacup-sized boat navigating a puddle, using graphite and three value groups." />
            <Example title="Character design" text="Draw a mapmaker who trades directions for stories, with a strong silhouette and one unusual tool." />
            <Example title="Kids prompt" text="Draw a classroom pet choosing a hat for picture day, using simple shapes and bright accents." />
            <Example title="AI image text" text="Original floating greenhouse above a quiet street, watercolor texture, dusk light, no logos or protected characters." />
          </div>
        </div>
      </section>

      <section className="content-band">
        <div className="narrow-copy">
          <h2>How the prompt is structured</h2>
          <p>
            A useful drawing prompt usually combines a subject, an action, a setting, a medium, a mood, and a constraint. That
            structure helps artists avoid blank-page drift and gives AI image users a cleaner text prompt without asking this site
            to generate images.
          </p>
          <a className="text-link" href="/guide/">
            Read the drawing prompt guide
            <ArrowRight aria-hidden="true" size={17} />
          </a>
        </div>
      </section>
    </>
  );
}

function Example({ title, text }: { title: string; text: string }) {
  return (
    <article className="example-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
