import { DiamondLogo } from "./components/brand";
import { APP_METADATA } from "./config";

function App() {
  return (
    <main
      aria-labelledby="mass-diamond-title"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section
        aria-describedby="mass-diamond-description"
        style={{
          width: "min(100%, 720px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 32px",
          border: "1px solid var(--md-border)",
          borderRadius: "var(--md-radius-xl)",
          background:
            "linear-gradient(180deg, rgba(16, 21, 17, 0.94), rgba(10, 13, 11, 0.96))",
          boxShadow: "var(--md-shadow-lg)",
          textAlign: "center",
        }}
      >
        <DiamondLogo
          size={96}
          glow
          aria-label="Mass Diamond logo"
        />

        <h1
          id="mass-diamond-title"
          style={{
            margin: "28px 0 0",
            fontSize: "clamp(2rem, 7vw, 4rem)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          {APP_METADATA.name}
        </h1>

        <p
          id="mass-diamond-description"
          style={{
            maxWidth: "520px",
            margin: "20px 0 0",
            color: "var(--md-text-secondary)",
            fontSize: "1rem",
            lineHeight: 1.7,
          }}
        >
          {APP_METADATA.tagline}
        </p>
      </section>
    </main>
  );
}

export default App;
