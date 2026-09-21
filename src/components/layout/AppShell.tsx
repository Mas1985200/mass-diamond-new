import type { ReactNode } from "react";

import { DiamondLogo } from "../brand";

export interface AppShellProps {
  readonly children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="md-app-shell">
      <header className="md-app-header">
        <div className="md-app-header__content">
          <div className="md-app-brand">
            <DiamondLogo
              size={34}
              glow
              decorative
            />

            <span className="md-app-brand__name">
              Mass Diamond
            </span>
          </div>
        </div>
      </header>

      <main className="md-app-main">
        <div className="md-app-main__content">
          {children}
        </div>
      </main>

      <nav
        className="md-app-navigation"
        aria-label="Primary navigation"
      >
        <div className="md-app-navigation__content" />
      </nav>
    </div>
  );
}

export default AppShell;
