"use client";

import Link from "next/link";

/**
 * ContactSection Component
 * Displays contact form and social links
 * 
 * @param {Object} props
 * @param {Function} props.handleSubmit - Form submission handler
 * @returns {JSX.Element}
 */
export default function ContactSection({ handleSubmit }) {
  return (
    <section className="w-full h-full">
      <div className="w-full bg-neutral-800/20 backdrop-blur-xl rounded-2xl p-4 md:p-8">
        <h2 className="text-xl font-bold text-center mb-4 md:text-4xl md:mb-6">Contact Me</h2>
        <div className="mt-4 md:mt-8 text-center">
          <p className="text-sm mb-4 md:text-lg md:mb-6">Feel free to reach out for collaborations or inquiries.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 max-w-2xl mx-auto md:mt-6 md:space-y-4">
            <input 
              type="text" 
              name="from_name"
              placeholder="Your Name" 
              required
              className="w-full p-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all md:p-4" 
            />
            <input 
              type="email" 
              name="from_email"
              placeholder="Your Email" 
              required
              className="w-full p-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all md:p-4" 
            />
            <input 
              type="hidden" 
              name="subject"
              value="WEBSITE CONTACT"
            />
            <textarea 
              name="message"
              placeholder="Your Message" 
              required
              className="w-full p-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all h-28 md:h-40 md:p-4"
            ></textarea>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-black hover:from-blue-500 hover:to-green-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 md:px-6 md:py-3"
            >
              Send Message
            </button>
          </form>
          <div className="mt-4 flex flex-col items-center justify-center space-y-2 md:mt-6 md:space-y-4">
            <div className="text-xs text-gray-500 md:text-sm">or connect with me on</div>
            <div className="flex space-x-3 md:space-x-4">
              <a 
                href="https://www.linkedin.com/in/sriujjwal/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-xs md:text-sm"
              >
                LinkedIn
              </a>
              <span className="text-gray-500">•</span>
              <a 
                href="https://github.com/sbeeredd04" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-400 text-xs md:text-sm"
              >
                GitHub
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 md:mt-4 md:text-sm">
            Or email me directly at{' '}
            <a 
              href="mailto:srisubspace@gmail.com?subject=WEBSITE CONTACT" 
              className="text-blue-500 hover:text-blue-600 underline"
            >
              srisubspace@gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
