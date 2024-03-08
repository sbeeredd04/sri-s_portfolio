import './App.css';
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '/workspaces/sri-s_portfolio/sri-s_portfolio/src/Home.js';
import AboutMe from '/workspaces/sri-s_portfolio/sri-s_portfolio/src/AboutMe.js';

function App() {
  return (
    <>
      <nav>
        <ul>
          <li>
            <a href="/">Home</a>
            <a href="/aboutme">About Me</a>
          </li>
        </ul>
      </nav>

    <Router>

      <div className="App">

        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/aboutme" element={<AboutMe />} />

        </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;
