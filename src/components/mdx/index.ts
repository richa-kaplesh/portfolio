import Flow from '../Flow.astro';
import Callout from './Callout.astro';
import Figure from './Figure.astro';
import Mermaid from './Mermaid.astro';
import Metric from './Metric.astro';
import Pre from './Pre.astro';

/** Available in every MDX file without an import. */
export const mdxComponents = { Callout, Figure, Flow, Mermaid, Metric, pre: Pre };
