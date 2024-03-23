import React from 'react';
import Card from '/workspaces/sri-s_portfolio/sri-s_portfolio/src/card.js'

export default function Skills() { 
    return (
        <div className="main-skills">

            <div className="main-skills-container">
                <Card
                    title="Spaghetti Bolognese"
                    duration="30 Mins"
                    servings="1 Serving"
                    badgeText="Pasta"
                />
            </div>
        </div>
    );
}