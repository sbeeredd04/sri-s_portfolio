"use client";

import { Card, ExCarousel } from "../components/ExpandableCard";
import blogs from "../json/blogs.json";

/**
 * BlogSection Component
 * Displays blog posts in an expandable carousel
 * 
 * @returns {JSX.Element}
 */
export default function BlogSection() {
  const blogPosts = blogs;

  return (
    <section className="w-full h-full">
      <div className="flex-1 w-full overflow-hidden">
        <div className="w-full h-full relative px-2 md:px-4">
          <ExCarousel
            items={blogPosts.map((post, index) => (
              <Card
                key={index}
                index={index}
                card={{
                  title: post.title,
                  content: post.content,
                  category: post.category,
                  src: post.image || `/blog/${index + 1}.jpg`, 
                }}
                className="max-w-[90%] mx-auto"
              />
            ))}
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}
