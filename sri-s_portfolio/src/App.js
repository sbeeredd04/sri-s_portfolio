import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '/workspaces/sri-s_portfolio/sri-s_portfolio/src/Home.js';
import AboutMe from '/workspaces/sri-s_portfolio/sri-s_portfolio/src/AboutMe.js';
import Skills from '/workspaces/sri-s_portfolio/sri-s_portfolio/src/skills.js';
import Projects from './projects.js';
import Contact from './contact.js';

function App() {
  return (
    <>
      <header className='header'>
        <a href="/" className="logo">
          <h4>Portfolio</h4>
        </a>
        <nav className='navbar'>
          <ul>
            <a href="/">Home</a>
            <a href="/aboutme">About Me</a>
            <a href="/skills">Skills</a>
            <a href="/projects">Projects</a>
            <a href="/contact">Contact</a>
          </ul>

        </nav>
      </header>

      <Router>

        <div className="App">

          <Routes>

            <Route path="/" element={<Home />} />
            <Route path="/aboutme" element={<AboutMe />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />


          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
