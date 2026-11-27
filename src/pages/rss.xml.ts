import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, getSite } from '@/lib/content';

export async function GET(context: APIContext) {
  const site = await getSite();
  const posts = await getPosts();
  return rss({
    title: `${site.name}: blog`,
    description: 'Notes on building LLM systems and learning in the open.',
    site: context.site ?? context.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: `/blog/${post.id}`,
      categories: post.data.tags,
    })),
  });
}
