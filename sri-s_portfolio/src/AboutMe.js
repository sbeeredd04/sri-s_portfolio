import React from 'react';
import killuaImage from '/workspaces/sri-s_portfolio/sri-s_portfolio/src/Images/killua.jpg'; // Make sure to use the correct path to your image
import { Link } from 'react-router-dom';

const AboutMe = () => {
    return (
        <section className="about" id="about">
            <Link to="/" className="back">
                <button className="button-back">
                    <div className="button-box-back">
                        <span className="button-elem">
                            <svg viewBox="0 0 46 40" xmlns="http://www.w3.org/2000/svg">
                                <path d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z" />
                            </svg>
                        </span>
                        <span className="button-elem">
                            <svg viewBox="0 0 46 40">
                                <path d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z" />
                            </svg>
                        </span>
                    </div>
                </button>
            </Link>

            <div className="about-img">
                <img src={killuaImage} alt="About Me" />
            </div>
            <div className="about-text">
                <h2>About <span>Me</span></h2>
                <p>
                    Hey there!<br />
                    I'm a sophomore at Arizona State University,
                    studying Computer Science and working as an undergraduate researcher.
                    Coding is not just a passion but also my favorite pastime.
                    When the weekend rolls in, you'll find me staying active with basketball, volleyball, and badminton.
                    And yes, I'm a big fan of anime and web series too! Whenever I get some downtime,
                    I like to challenge myself with coding problems on HackerRank.
                    That's a little glimpse of who I am: a coding enthusiast, a sports lover, and a devoted anime fan.
                </p>
                {/* Uncomment the next line if you want to include the button */}
                <Link to="/skills" className="aboutmebutton">
                    <button className="learn-more">
                        <span className="circle" ariaHidden="true">
                            <span className="icon arrow"></span>
                        </span>
                        <span className="button-text">My Skills</span>
                    </button>
                </Link>
            </div>
        </section>
    );
}

export default AboutMe;
