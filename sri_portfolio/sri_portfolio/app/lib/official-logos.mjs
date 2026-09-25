// Official marks, unmodified, from each owner's brand page or official
// repository. Sources, hashes and terms: docs/research/official-logos-2026-09-24.json.
// A name with no entry here has no openly offered official mark, and is
// shown as plain type rather than an improvised icon.
const dir = "/official/logos/";

export const toolkitLogos = {
  React: `${dir}react-logo-light.svg`,
  "Next.js": `${dir}nextjs-icon-dark-background.svg`,
  TypeScript: `${dir}ts-logo-512.svg`,
  "Three.js": `${dir}threejs-icon.svg`,
  Python: `${dir}python-logo-only.svg`,
  PyTorch: `${dir}pytorch-icon-fullcolor.webp`,
  "Hugging Face": `${dir}hf-logo.svg`,
  "Node.js": `${dir}nodejs-hex.svg`,
  Flask: `${dir}flask-icon.svg`,
  Django: `${dir}django-logo-positive.svg`,
  PostgreSQL: `${dir}postgresql-logo-3colors.svg`,
  Git: `${dir}git-icon-1788c.svg`,
  Docker: `${dir}docker-mark-ocean-blue.svg`,
  // HTML and CSS share a tag, so it carries both marks.
  "HTML & CSS": [`${dir}html5-badge.svg`, `${dir}css-logo.svg`],
  "Tailwind CSS": `${dir}tailwindcss-mark.svg`,
  TensorFlow: `${dir}tensorflow-fullcolor-icon.svg`,
  "scikit-learn": `${dir}scikit-learn-logo-without-subtitle.svg`,
  OpenCV: `${dir}opencv-logo.webp`,
  NumPy: `${dir}numpy-logomark.svg`,
  pandas: `${dir}pandas-mark.svg`,
  LangChain: `${dir}langchain-lockup-black.svg`,
  FastAPI: `${dir}fastapi-favicon.webp`,
  Express: `${dir}express-logo-white.svg`,
  MongoDB: `${dir}mongodb-horizontal-default-slate-blue.svg`,
  Redis: `${dir}redis-icon.webp`,
  "C / C++": `${dir}cpp-logo.svg`,
  Jupyter: `${dir}jupyter-logomark-orangebody-greyplanets.svg`,
  Selenium: `${dir}selenium-logo-mark-green.svg`,
};
// Wordmarks and lockups take a wider chip: Django's only mark is its
// wordmark, LangChain asks for the symbol with its name, and scikit-learn
// and MongoDB offer no compact mark at a legible size.
export const wideLogos = new Set([
  "Django",
  "LangChain",
  "scikit-learn",
  "MongoDB",
]);

// Pylon faces are dark: each tool uses the variant its owner offers for
// dark backgrounds. A lockup already carries the name; a mark does not.
export const pylonLogos = {
  notion: { src: `${dir}notion-logo-block-main.svg`, lockup: false },
  obsidian: { src: `${dir}obsidian-logo-text-white-purple.svg`, lockup: true },
  cursor: { src: `${dir}cursor-lockup-horizontal-2d-dark.svg`, lockup: true },
  claude: { src: `${dir}claude-logo-ivory.svg`, lockup: true },
};

// Organisation logos as each publishes it: LinkedIn company pages, and the
// ASU logo from asu.edu itself. Keyed by the names in personal.js history.
const org = "/official/logos/org/";
export const companyLogos = {
  Offseason: { src: `${org}offseason.webp` },
  "Arizona State University": { src: `${org}asu.webp`, wide: true },
  "Geometric Media Lab": { src: `${org}geometric-media-lab.webp` },
  "Software Developers Association": { src: `${org}soda.webp` },
  "Mesa Historical Museum": { src: `${org}mesa-historical-museum.webp` },
  "ASU Biodesign Institute": { src: `${org}asu-biodesign.webp` },
};

export const logoCredit =
  "Logos are trademarks of their owners, shown to name the tools I use. No endorsement is implied. Redis is a registered trademark of Redis Ltd.; any rights therein are reserved to Redis Ltd. Git logo by Jason Long, CC BY 3.0. HTML5 logo by W3C, CC BY 3.0.";
