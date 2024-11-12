import React from 'react';
import Image from 'next/image';
import { Timeline } from './components/timeline';

export function TimelineDemo({ theme }) {
  const data = [
    {
      title: "Lead Software Engineer",
      content: (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-4">Mesa Interactive Exhibit</h2>
          <p className="text-xs md:text-sm font-normal mb-8">
            As the Lead Software Engineer, I led a team in creating software for interactive museum exhibits, 
            enhancing user engagement through innovative design and development. Integrated <strong>Three.js</strong> for 3D interactions, 
            and implemented a <strong>scalable database</strong> for content management.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/ex (1).webp"
              alt="Lead Software Engineer"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Machine Learning Intern",
      content: (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-4">Geometric Media Lab</h2>
          <p className="text-xs md:text-sm font-normal mb-8">
            Increased gunshot detection accuracy from 10% to 80% by implementing unsupervised machine learning models on limited data. 
            Leveraged <strong>Generative AI</strong> techniques to optimize multimedia analysis.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/ex (4).webp"
              alt="Machine Learning Intern"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Software Developer at SoDA",
      content: (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-4">Software Developers Association</h2>
          <p className="text-xs md:text-sm font-normal mb-8">
            Starting as an intern and progressing to a Software Developer, I created <strong>automation tools</strong> 
            for process optimization, improving engagement and supporting club operations effectively.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/ex (3).webp"
              alt="SoDA Internship"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Data Research Analyst",
      content: (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-4">BIONICS Lab</h2>
          <p className="text-xs md:text-sm font-normal mb-8">
            Reduced imaging error rates by 40% by automating analysis protocols for DNA-PAINT Images. Cut processing time 
            from 4 hours to 10 minutes for analyzing over 2000 entities in a single image, using <strong>Python</strong> and <strong>OpenCV</strong>.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Image
              src="/ex (2).webp"
              alt="Research Lab Experience"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-md"
            />
          </div>
        </div>
      ),
    },
  ];
  

  return (
    <div className="w-full">
      <Timeline data={data} theme={theme} />
    </div>
  );
}
