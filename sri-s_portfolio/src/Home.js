import React, { useEffect } from 'react';
import Typed from 'typed.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedinIn, faGithub, faInstagram, faDiscord, faSpotify } from '@fortawesome/free-brands-svg-icons';
import logo from '/workspaces/sri-s_portfolio/sri-s_portfolio/src/Images/logo.jpg';

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
        <div className="home-container">
            <section className="home" id="home">

                <div className="home-content">
                    <h3>Hello, it's me</h3>
                    <h1>Sri Ujjwal Reddy</h1>
                    <h3>And I'm a <span className="text"></span></h3>
                    <p>I'm a sophomore at Arizona State University<br />currently pursuing my Bachelors in Computer Science.</p>
                    <div className="home-sci">

                        <a href="https://www.linkedin.com/in/sri-ujjwal-reddy-8a52b42b9/" target="blank" title="LinkedIn" className="linkedinCircle" style={{ '--i': 7,color:'#00a0dc', borderColor: '#00a0dc', backgroundColor: '00a0dc' }}>
                            <FontAwesomeIcon icon={faLinkedinIn} />
                        </a>

                        <a href="https://github.com/sbeeredd04" target="blank" title="GitHub" className="githubCircle" style={{ '--i': 8, color: '#fafafa', borderColor: '#fafafa',  backgroundColor: '#000' }}>
                            <FontAwesomeIcon className='github' icon={faGithub} />
                        </a>

                        <a href="https://www.instagram.com/b.sriujjwal/?theme=dark" target="blank" title="Instagram" className ="InstagramCircle" style={{ '--i': 9, color:'#dd2a7b', borderColor: '#dd2a7b', backgroundColor:'#000' }}>
                            <FontAwesomeIcon className='instagram' icon={faInstagram} />
                        </a>

                        <a href="https://discord.com/users/ace_vortx" target="blank " title="Discord" className = "discordCircle" style={{ '--i': 10, color:'#7289da', borderColor:'#7289da', backgroundColor:'#000' }}>
                            <FontAwesomeIcon className='discord' icon={faDiscord} />
                        </a>

                        <a href="https://open.spotify.com/user/31qr3j45nvoqp4lfh6vuabmlwguq?si=7236606e83ca497d" target="blank " title="Spotify" className = 'spotifyCircle' style={{ '--i': 11, color:'#1ed760', borderColor:'#1ed760', backgroundColor:'#000'}}>
                            <FontAwesomeIcon className='spotify' icon={faSpotify} />
                        </a>
                    </div>
                </div>

                {/*image */}
                <div className="home-img">
                    <img src={logo} alt="Logo" className='Logo' />
                </div>

            </section>
        </div>
    );
}
