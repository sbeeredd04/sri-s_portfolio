// Next merges metadata shallowly, so a page that sets openGraph or twitter
// replaces the root objects and loses the file-based share image. Every page
// builds both through here to keep its own title, description, url and image.
export const siteName = "Sri Ujjwal Reddy";

export const shareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Sri Ujjwal Reddy. A little world of my own.",
};

export function pageMetadata({ title, description, path, openGraph = {} }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName,
      locale: "en_US",
      type: "website",
      images: [shareImage],
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}
