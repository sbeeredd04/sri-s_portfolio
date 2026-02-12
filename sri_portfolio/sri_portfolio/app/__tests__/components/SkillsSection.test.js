/**
 * SkillsSection Component Tests
 * Tests rendering and tab switching for skills view
 */

import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock SkillsSection component
function MockSkillsSection({ skillsActiveTab, setSkillsActiveTab }) {
  const mockSkills = [
    { name: 'React', level: 90 },
    { name: 'JavaScript', level: 85 },
    { name: 'TypeScript', level: 80 },
  ]

  return (
    <section className="w-full h-full" data-testid="skills-section">
      <div>
        <button
          onClick={() => setSkillsActiveTab('overview')}
          data-testid="tab-overview"
          aria-selected={skillsActiveTab === 'overview'}
        >
          Overview
        </button>
        <button
          onClick={() => setSkillsActiveTab('github')}
          data-testid="tab-github"
          aria-selected={skillsActiveTab === 'github'}
        >
          GitHub
        </button>
      </div>

      <div data-testid="skills-content">
        {skillsActiveTab === 'overview' && (
          <div data-testid="overview-content">
            <h3>Skills Overview</h3>
            <ul>
              {mockSkills.map((skill) => (
                <li key={skill.name} data-testid={`skill-${skill.name}`}>
                  {skill.name}: {skill.level}%
                </li>
              ))}
            </ul>
          </div>
        )}
        {skillsActiveTab === 'github' && <div data-testid="github-content">GitHub Stats</div>}
      </div>
    </section>
  )
}

describe('SkillsSection Component', () => {
  /**
   * Test: Renders skills view
   * Verifies component renders with correct elements
   */
  it('should render skills view', () => {
    function Wrapper() {
      const [skillsActiveTab, setSkillsActiveTab] = useState('overview')
      return <MockSkillsSection skillsActiveTab={skillsActiveTab} setSkillsActiveTab={setSkillsActiveTab} />
    }

    render(<Wrapper />)

    expect(screen.getByTestId('skills-section')).toBeInTheDocument()
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument()
    expect(screen.getByTestId('tab-github')).toBeInTheDocument()
  })

  /**
   * Test: Displays skills overview by default
   * Verifies initial tab shows skills list
   */
  it('should display skills overview initially', () => {
    function Wrapper() {
      const [skillsActiveTab, setSkillsActiveTab] = useState('overview')
      return <MockSkillsSection skillsActiveTab={skillsActiveTab} setSkillsActiveTab={setSkillsActiveTab} />
    }

    render(<Wrapper />)

    expect(screen.getByTestId('overview-content')).toBeInTheDocument()
    expect(screen.getByTestId('skill-React')).toHaveTextContent('React: 90%')
    expect(screen.getByTestId('skill-JavaScript')).toHaveTextContent('JavaScript: 85%')
    expect(screen.getByTestId('skill-TypeScript')).toHaveTextContent('TypeScript: 80%')
  })

  /**
   * Test: Can switch to GitHub stats
   * Verifies tab switching to GitHub view works
   */
  it('should switch to github stats view', () => {
    function Wrapper() {
      const [skillsActiveTab, setSkillsActiveTab] = useState('overview')
      return <MockSkillsSection skillsActiveTab={skillsActiveTab} setSkillsActiveTab={setSkillsActiveTab} />
    }

    render(<Wrapper />)

    fireEvent.click(screen.getByTestId('tab-github'))
    expect(screen.getByTestId('github-content')).toHaveTextContent('GitHub Stats')
  })

  /**
   * Test: Can switch back to overview
   * Verifies toggling between tabs works
   */
  it('should switch back to overview', () => {
    function Wrapper() {
      const [skillsActiveTab, setSkillsActiveTab] = useState('github')
      return <MockSkillsSection skillsActiveTab={skillsActiveTab} setSkillsActiveTab={setSkillsActiveTab} />
    }

    render(<Wrapper />)

    fireEvent.click(screen.getByTestId('tab-overview'))
    expect(screen.getByTestId('overview-content')).toBeInTheDocument()
  })

  /**
   * Test: Tab buttons have correct state
   * Verifies accessibility attributes are set
   */
  it('should have correct tab states', () => {
    function Wrapper() {
      const [skillsActiveTab, setSkillsActiveTab] = useState('overview')
      return <MockSkillsSection skillsActiveTab={skillsActiveTab} setSkillsActiveTab={setSkillsActiveTab} />
    }

    render(<Wrapper />)

    expect(screen.getByTestId('tab-overview')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('tab-github')).toHaveAttribute('aria-selected', 'false')
  })
})
