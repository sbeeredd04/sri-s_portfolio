import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faC, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { faPython, faSquareJs, faJava, faHtml5, faCss3Alt } from '@fortawesome/free-brands-svg-icons'; // Import the Python icon from FontAwesome's free brands icons


const Card = () => {
    return (
        <div className="card">
            <div className="content">
                <div className="back-card">
                    <div className="img">
                        <div className="circle"></div>
                        <div className="circle" id="right"></div>
                        <div className="circle" id="bottom"></div>
                    </div>
                    <div className="back-card-content">
                        <div className="img">
                            <div className="circle"></div>
                            <div className="circle" id="right"></div>
                            <div className="circle" id="bottom"></div>
                        </div>
                        <FontAwesomeIcon icon={faCode} color="#ffffff" size="lg" />
                        <strong>Skills</strong>
                        {/* Here, you could add more details or a different message if you want */}
                    </div>
                </div>
                <div className="front">
                    <div className="img">
                        <div className="circle"></div>
                        <div className="circle" id="right"></div>
                        <div className="circle" id="bottom"></div>
                    </div>
                    <div className="front-content">
                        <small className="badge">Languages Learned</small>
                        <div className="description">
                            <ul>
                                <li>Python <FontAwesomeIcon icon={faPython} /></li>
                                <li>C/C++ <strong><FontAwesomeIcon icon={faC} /></strong> </li>
                                <li>JavaScript <FontAwesomeIcon icon={faSquareJs} /></li>
                                <li>Java <FontAwesomeIcon icon={faJava} /></li>
                                <li>HTML <FontAwesomeIcon icon={faHtml5} /> </li>
                                <li>CSS <FontAwesomeIcon icon={faCss3Alt} /></li>
                                <li>SQL <FontAwesomeIcon icon={faDatabase} /></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



export default Card;
