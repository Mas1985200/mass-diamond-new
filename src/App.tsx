import { DiamondLogo } from "./components/brand";
import AppShell from "./components/layout/AppShell";
import { APP_METADATA } from "./config";

function App() {
  return (
    <AppShell>
      <section
        aria-labelledby="mass-diamond-title"
        className="md-welcome"
      >
        <DiamondLogo
          size={112}
          glow
          decorative
        />

        <h1
          id="mass-diamond-title"
          className="md-welcome__title"
        >
          {APP_METADATA.name}
        </h1>

        <p className="md-welcome__tagline">
          {APP_METADATA.tagline}
        </p>
      </section>
    </AppShell>
  );
}

export default App;
