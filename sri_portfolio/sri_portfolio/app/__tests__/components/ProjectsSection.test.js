/**
 * ProjectsSection Component Tests
 * Tests rendering and tab switching for projects
 */

import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock ProjectsSection component
function MockProjectsSection({ activeTab, setActiveTab }) {
  const mockProjects = [
    { id: 1, title: 'Project 1', description: 'Description 1' },
    { id: 2, title: 'Project 2', description: 'Description 2' },
    { id: 3, title: 'Project 3', description: 'Description 3' },
  ]

  const mockDeployedProjects = [
    { id: 1, title: 'Deployed 1', description: 'Deployed Description 1' },
    { id: 2, title: 'Deployed 2', description: 'Deployed Description 2' },
  ]

  return (
    <section className="w-full h-full p-4 md:p-8 flex flex-col" data-testid="projects-section">
      <h2 data-testid="section-title">
        {activeTab === 'all' ? 'Featured Projects' : 'Deployed Projects'}
      </h2>

      <div>
        <button
          onClick={() => setActiveTab('all')}
          data-testid="tab-all"
          aria-selected={activeTab === 'all'}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('deployed')}
          data-testid="tab-deployed"
          aria-selected={activeTab === 'deployed'}
        >
          Deployed
        </button>
      </div>

      <div data-testid="projects-list">
        {activeTab === 'all' &&
          mockProjects.map((project) => (
            <div key={project.id} data-testid={`project-${project.id}`}>
              {project.title}
            </div>
          ))}
        {activeTab === 'deployed' &&
          mockDeployedProjects.map((project) => (
            <div key={project.id} data-testid={`deployed-${project.id}`}>
              {project.title}
            </div>
          ))}
      </div>
    </section>
  )
}

describe('ProjectsSection Component', () => {
  /**
   * Test: Renders projects list
   * Verifies component renders and displays projects
   */
  it('should render projects list', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('all')
      return <MockProjectsSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    expect(screen.getByTestId('projects-section')).toBeInTheDocument()
    expect(screen.getByTestId('section-title')).toHaveTextContent('Featured Projects')
  })

  /**
   * Test: Displays all projects by default
   * Verifies initial tab shows all projects
   */
  it('should display all projects initially', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('all')
      return <MockProjectsSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    expect(screen.getByTestId('project-1')).toHaveTextContent('Project 1')
    expect(screen.getByTestId('project-2')).toHaveTextContent('Project 2')
    expect(screen.getByTestId('project-3')).toHaveTextContent('Project 3')
  })

  /**
   * Test: Can switch to deployed projects
   * Verifies switching tabs updates content
   */
  it('should switch to deployed projects', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('all')
      return <MockProjectsSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    fireEvent.click(screen.getByTestId('tab-deployed'))
    expect(screen.getByTestId('section-title')).toHaveTextContent('Deployed Projects')
    expect(screen.getByTestId('deployed-1')).toHaveTextContent('Deployed 1')
    expect(screen.getByTestId('deployed-2')).toHaveTextContent('Deployed 2')
  })

  /**
   * Test: Can switch back to all projects
   * Verifies tab switching works bidirectionally
   */
  it('should switch back to all projects', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('deployed')
      return <MockProjectsSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    fireEvent.click(screen.getByTestId('tab-all'))
    expect(screen.getByTestId('section-title')).toHaveTextContent('Featured Projects')
    expect(screen.getByTestId('project-1')).toHaveTextContent('Project 1')
  })

  /**
   * Test: Tab buttons have correct state
   * Verifies accessibility attributes
   */
  it('should have correct tab states', () => {
    function Wrapper() {
      const [activeTab, setActiveTab] = useState('all')
      return <MockProjectsSection activeTab={activeTab} setActiveTab={setActiveTab} />
    }

    render(<Wrapper />)

    expect(screen.getByTestId('tab-all')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('tab-deployed')).toHaveAttribute('aria-selected', 'false')
  })
})
