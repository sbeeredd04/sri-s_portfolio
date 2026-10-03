import ExperienceShell from "./components/personal/ExperienceShell";
export default function Home() {
  const identity = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.sriujjwalreddy.com/#website",
        name: "Sri Ujjwal Reddy",
        alternateName: "Sri",
        url: "https://www.sriujjwalreddy.com/",
        author: { "@id": "https://www.sriujjwalreddy.com/#person" },
      },
      {
        "@type": "Person",
        "@id": "https://www.sriujjwalreddy.com/#person",
        name: "Sri Ujjwal Reddy",
        url: "https://www.sriujjwalreddy.com/",
        jobTitle: "Founding Engineer, AI Engineering",
        worksFor: { "@type": "Organization", name: "Offseason" },
        sameAs: [
          "https://github.com/sbeeredd04",
          "https://linkedin.com/in/sriujjwal",
        ],
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(identity).replace(/</g, "\\u003c"),
        }}
      />
      <ExperienceShell />
    </>
  );
}
