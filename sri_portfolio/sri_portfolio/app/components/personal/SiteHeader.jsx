// One header for every reading page. Rooms change its materials, not its shape.
export default function SiteHeader({ place, worldHref = "/", children }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="site-mark" href="/" aria-label="Sri — enter the world">
          sri.
        </a>
        {place && (
          <span className="site-place">
            <span aria-hidden="true">/</span>
            {place}
          </span>
        )}
        <nav className="site-nav" aria-label="Site">
          <a href="/rooms">All places</a>
          <a href="/resume">Résumé</a>
          <a href={worldHref}>In the world</a>
        </nav>
        {children && <div className="site-tools">{children}</div>}
      </div>
    </header>
  );
}
