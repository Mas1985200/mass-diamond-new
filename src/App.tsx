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
          padding: "32px",
          border: "1px solid var(--md-border)",
          borderRadius: "var(--md-radius-xl)",
          background: "var(--md-surface)",
          boxShadow: "var(--md-shadow-lg)",
          textAlign: "center",
        }}
      >
        <h1
          id="mass-diamond-title"
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 6vw, 4rem)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          Mass Diamond
        </h1>

        <p
          id="mass-diamond-description"
          style={{
            margin: "20px 0 0",
            color: "var(--md-text-secondary)",
            fontSize: "1rem",
            lineHeight: 1.7,
          }}
        >
          One app. Every need. Anywhere in the world.
        </p>
      </section>
    </main>
  );
}

export default App;
