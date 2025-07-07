# Contributing to Sri's Portfolio

Thank you for your interest in contributing to Sri's Portfolio! This document provides guidelines for contributing to the project.

## Code of Conduct

Please be respectful and inclusive in all interactions. This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct.

## How to Contribute

### 1. Fork the Repository

Fork the repository to your own GitHub account and clone it locally:

```bash
git clone https://github.com/your-username/sri-s_portfolio.git
cd sri-s_portfolio/sri_portfolio/sri_portfolio
```

### 2. Set Up Development Environment

1. Install Node.js (18+)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

### 3. Make Your Changes

- Create a new branch for your feature/fix:
  ```bash
  git checkout -b feature/your-feature-name
  ```
- Make your changes following the coding standards
- Test your changes thoroughly
- Commit with descriptive messages

### 4. Coding Standards

#### JavaScript/React Guidelines
- Use functional components with hooks
- Follow React best practices
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Use TypeScript when possible

#### CSS/Styling Guidelines
- Use TailwindCSS utility classes
- Follow responsive design principles
- Maintain consistent spacing and typography
- Use CSS variables for theme consistency

#### File Organization
- Components should be in `app/components/`
- Utilities should be in `app/lib/` or `app/utils/`
- Data files should be in `app/json/`
- Keep components focused and reusable

### 5. Testing

- Test your changes across different devices
- Ensure responsive design works correctly
- Test API endpoints if modified
- Verify accessibility features

### 6. Pull Request Process

1. Push your branch to your fork
2. Create a pull request with:
   - Clear title and description
   - Screenshots for UI changes
   - Steps to test your changes
   - Link to any related issues

### 7. Pull Request Guidelines

- **Title**: Use a descriptive title that explains the change
- **Description**: Provide context and motivation for the change
- **Testing**: Describe how to test the changes
- **Screenshots**: Include before/after screenshots for UI changes
- **Documentation**: Update documentation if needed

## Types of Contributions

### Bug Fixes
- Fix broken functionality
- Improve error handling
- Address security vulnerabilities
- Fix responsive design issues

### Features
- Add new components
- Enhance existing functionality
- Improve user experience
- Add new integrations

### Documentation
- Improve README
- Add code comments
- Create tutorials
- Update API documentation

### Performance
- Optimize bundle size
- Improve loading times
- Enhance animations
- Optimize images

## Project Structure

```
sri_portfolio/sri_portfolio/
├── app/
│   ├── api/                    # API routes
│   ├── components/             # React components
│   ├── hooks/                  # Custom hooks
│   ├── json/                   # Data files
│   ├── lib/                    # Utility functions
│   ├── utils/                  # Helper utilities
│   └── globals.css             # Global styles
├── data/                       # Text content
├── public/                     # Static assets
└── package.json               # Dependencies
```

## Common Tasks

### Adding a New Project

1. Add project data to `app/json/projects.json` or `app/json/deployed.json`
2. Add project image to `public/projects/`
3. Update any relevant documentation

### Modifying Styles

1. Use TailwindCSS utility classes
2. Follow existing patterns for consistency
3. Test across different screen sizes

### Adding New Components

1. Create component in `app/components/`
2. Export from the component file
3. Add proper TypeScript types if applicable
4. Document props and usage

### API Changes

1. Update API routes in `app/api/`
2. Update documentation
3. Test all endpoints
4. Handle errors gracefully

## Review Process

1. **Automated Checks**: PRs will be checked for:
   - Build success
   - Code style
   - Basic functionality

2. **Manual Review**: Maintainers will review:
   - Code quality
   - Design consistency
   - Performance impact
   - Documentation completeness

3. **Feedback**: Address any feedback promptly and professionally

## Questions?

If you have questions about contributing, please:
- Open an issue for discussion
- Check existing issues and PRs
- Contact the maintainer: srisubspace@gmail.com

## Recognition

All contributors will be recognized in the project documentation and release notes.

Thank you for contributing to Sri's Portfolio! 🚀