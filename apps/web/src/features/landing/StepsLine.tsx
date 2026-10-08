'use client';

const STEPS = ['Create a room', 'Share the link', 'Listen in sync'];

/** How-it-works, as a semantic ordered list. One row on >=480px (arrows between
 * steps), stacked with a down arrow on phones. Arrows are decorative. */
export function StepsLine() {
  return (
    <ol
      data-testid="steps"
      className="l-muted ember-rise relative z-10 mx-auto flex max-w-[760px] flex-col items-center gap-sm pb-xl pt-base font-sans text-caption-uppercase uppercase tracking-[0.14em] min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:justify-center min-[480px]:gap-base"
    >
      {STEPS.map((step, i) => (
        <li
          key={step}
          className="flex flex-col items-center gap-sm min-[480px]:flex-row min-[480px]:gap-base"
        >
          {i > 0 && (
            <span aria-hidden="true" className="rotate-90 opacity-60 min-[480px]:rotate-0">
              &rarr;
            </span>
          )}
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
