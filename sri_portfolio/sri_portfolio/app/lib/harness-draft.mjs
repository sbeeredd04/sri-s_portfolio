// Local review only. The route refuses this draft in production.
export const harnessDraft = {
  slug: "the-work-around-the-model",
  status: "draft",
  draft: true,
  category: "AI ENGINEERING",
  art: "harness",
  cover: {
    src: "/fieldnotes/harness-studio-1600.webp",
    srcSet:
      "/fieldnotes/harness-studio-768.webp 768w, /fieldnotes/harness-studio-1280.webp 1280w, /fieldnotes/harness-studio-1600.webp 1600w",
    alt: "An illustrated night studio: an open book and a luminous model held in a brass frame on a workbench overlooking San Francisco.",
  },
  title: "The work around\nthe model.",
  summary: "A book, a moving field, and why I’m thinking about the harness.",
  opening:
    "A model can choose the next step. Something still has to make that step work.",
  takeaway:
    "The model brings capability. The harness gives it context, tools, continuity, and a way to check its work.",
  sections: [
    {
      id: "a-moving-target",
      nav: "A moving target",
      title: "I read a book. The field kept moving.",
      blocks: [
        {
          type: "paragraph",
          text: "I recently read Principles of Building AI Agents by Sam Bhagwat, the CEO of Mastra. What stayed with me was how quickly the subject can move underneath a book. Even a reference point from March 2026 already feels some distance away.",
        },
        {
          type: "paragraph",
          text: "That doesn’t make the foundations obsolete. The current contents move from models and prompts into tool calling, memory, workflows, retrieval, tracing, and evals. The model overview is explicitly marked March 2026. It is a useful reminder to separate the principles from the snapshot of the tools.",
          sources: [1],
        },
        {
          type: "paragraph",
          text: "My own way of connecting those pieces now is harness engineering: the engineering around a model that lets an agent keep doing useful work. I’m using that as my interpretation of the foundations, rather than claiming it is the book’s central phrase.",
        },
      ],
    },
    {
      id: "around-the-loop",
      nav: "Around the loop",
      title: "Follow one small task.",
      blocks: [
        {
          type: "paragraph",
          text: "Imagine asking an agent to fix a bug. Getting a plausible patch is only one part of the task. It needs the right files and constraints, a way to run the program, permission to change things, and evidence that the fix actually works. If it gets interrupted, someone—or something—has to remember where it stopped.",
        },
        {
          type: "paragraph",
          text: "I think about that surrounding system in three layers. Context chooses what the model needs to know now. Tools turn a proposed action into a real operation with a clear result. Feedback checks the result, records what happened, and tells the next step what still needs work.",
        },
        {
          type: "harness",
          caption:
            "One way to see the harness. Select a layer to follow what it contributes; the model stays at the centre.",
        },
        {
          type: "paragraph",
          text: "Those layers meet at the agent loop: observe, decide, act, check. A test failure should become useful context. A tool timeout should be distinguishable from a wrong answer. A checkpoint should carry decisions forward without carrying every abandoned attempt. These are interface and systems problems as much as model problems.",
        },
      ],
    },
    {
      id: "what-is-changing",
      nav: "What’s changing",
      title: "The conversation is getting more concrete.",
      blocks: [
        {
          type: "paragraph",
          text: "The harness conversation was already underway by March. OpenAI’s February account describes making repository knowledge navigable for agents, with a short entry point into deeper documentation. Anthropic’s March work explores explicit evaluation criteria and structured handoffs across long tasks. Both put engineering effort into the environment around the model.",
          sources: [2, 3],
        },
        {
          type: "paragraph",
          text: "In June, Sam’s Anatomy of a harness makes the operational questions especially tangible: persistent threads, steering a task while it runs, human approval for tools, and recovery after interruption. Mastra then announced a reusable harness layer. That is a concrete development beyond a March model overview, not evidence that everything in the book needs replacing.",
          sources: [4, 5],
        },
        {
          type: "paragraph",
          text: "By September, Mastra’s Factory beta was applying these ideas across issue triage, planning, implementation, and review. One detail matters more to me than the launch: the team described making each stage’s autonomy configurable after fully automatic runs created too much difficult-to-review work. The harness includes where people step in.",
          sources: [6],
        },
        {
          type: "paragraph",
          text: "The useful trend, to me, is a change in what we inspect. Alongside the model, we inspect the context it received, the actions it could take, the state that survived, and the feedback it was given. A more capable model can change how much scaffolding we need. It doesn’t remove the need to measure the whole system.",
        },
      ],
    },
    {
      id: "the-work",
      nav: "The work ahead",
      title: "That’s the work I want to get better at.",
      blocks: [
        {
          type: "paragraph",
          text: "As a founding engineer working on AI systems, this is where my attention goes: context layers, tool interfaces, and the harness that connects them. I want to understand why an agent succeeds, and where the surrounding system made failure more likely.",
        },
        {
          type: "paragraph",
          text: "For the hypothetical bug fix, I’d start with a small set of representative tasks. Keep the model fixed, change one part of the harness, then compare completion, correctness, cost, and the amount of human intervention. When a model changes, run those tasks again. Keep what helps; remove what no longer earns its place.",
        },
        {
          type: "paragraph",
          text: "The book gave me a starting point. The field will keep moving. The question I want to carry forward is simple: what does this model need around it to do useful work reliably?",
        },
      ],
    },
  ],
  sources: [
    {
      id: 1,
      title: "Principles of Building AI Agents — official contents",
      publisher: "Sam Bhagwat / Mastra",
      href: "https://mastra.ai/books/principles-of-building-ai-agents",
    },
    {
      id: 2,
      title: "Harness engineering",
      publisher: "OpenAI · February 11, 2026",
      href: "https://openai.com/index/harness-engineering/",
    },
    {
      id: 3,
      title: "Harness design for long-running application development",
      publisher: "Anthropic · March 24, 2026",
      href: "https://www.anthropic.com/engineering/harness-design-long-running-apps",
    },
    {
      id: 4,
      title: "Anatomy of a harness",
      publisher: "Sam Bhagwat / Mastra · June 5, 2026",
      href: "https://mastra.ai/blog/anatomy-of-a-coding-agent",
    },
    {
      id: 5,
      title: "Announcing Mastra Harness",
      publisher: "Sam Bhagwat / Mastra · June 18, 2026",
      href: "https://mastra.ai/blog/announcing-agent-harness",
    },
    {
      id: 6,
      title: "Announcing Mastra Factory Beta",
      publisher: "Sam Bhagwat / Mastra · September 8, 2026",
      href: "https://mastra.ai/blog/announcing-mastra-factory-beta",
    },
  ],
  editorialNote:
    "Draft for Sri’s feedback. Book coverage checked against Mastra’s public contents; the full third-edition text and edition date have not been independently verified. The harness framing and hypothetical bug-fix example are interpretation, not quotations from the book. Sources checked October 3, 2026.",
};
