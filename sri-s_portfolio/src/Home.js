import React, { useEffect } from 'react';
import Typed from 'typed.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedinIn, faGithub } from '@fortawesome/free-brands-svg-icons';

export default function Home() {
    useEffect(() => {
        // Initialize Typed.js inside the useEffect hook
        var typed = new Typed(".text", {
            strings: [
                "Student",
                "Undergraduate Researcher",
                "Software Developer",
                "Web Developer",
                "Programmer",
                "Learner",
            ],
            typeSpeed: 100,
            backSpeed: 100,
            backDelay: 1000,
            loop: true,
        });

        // Cleanup function to destroy Typed instance when component unmounts
        return () => {
            typed.destroy();
        };
    }, []); // Empty dependency array ensures the effect runs only once after initial render

    return (
        <section className="home" id="home">
            <div className="home-content">
                <h3>Hello, it's me</h3>
                <h1>Sri Ujjwal Reddy</h1>
                <h3>And I'm a <span className="text"></span></h3>
                <p>I'm a sophomore at Arizona State University<br />currently pursuing my Bachelors in Computer Science.</p>
                <div className="home-sci">
                    {/* adding logo for social media that leads to media profiles */}
                    <a href="https://www.linkedin.com/in/sri-ujjwal-reddy-8a52b42b9/" target="blank" title="LinkedIn">
                        <FontAwesomeIcon className='linkedInIcon' icon={faLinkedinIn} />
                    </a>

                    <a href="https://github.com/sbeeredd04" target="blank" title="GitHub">
                        <FontAwesomeIcon icon={faGithub} />
                    </a>

                    
                </div>
            </div>
        </section>
    );
}
