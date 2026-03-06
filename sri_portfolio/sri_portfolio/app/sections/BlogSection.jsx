"use client";

import blogs from "../json/blogs.json";
import { Card, ExCarousel } from "../components/ExpandableCard";

export default function BlogSection() {
    return (
        <section className="w-full h-full">
            <div className="flex-1 w-full overflow-hidden">
                <div className="w-full h-full relative px-2 md:px-4">
                    <ExCarousel
                        items={blogs.map((post, index) => (
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
