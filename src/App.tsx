import { Header } from "./components/Header"
import "./App.css"

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <section className="hero-panel" aria-labelledby="hero-title">
          <p className="eyebrow">Firebase-ready</p>
          <h1 id="hero-title">Welcome to Fire TPS</h1>
          <p className="hero-copy">
            A responsive starter layout with a top header and mobile-friendly
            navigation affordance.
          </p>
        </section>

        <section className="info-grid">
          <article id="exercises" className="info-card">
            <p className="eyebrow">Exercises</p>
            <h2>Practice drills and flow work</h2>
            <p>
              This area is ready for exercise content, guided drills, or
              progress tracking.
            </p>
          </article>

          <article id="about" className="info-card">
            <p className="eyebrow">About</p>
            <h2>What Fire TPS is for</h2>
            <p>
              Add your project summary here so visitors can quickly understand
              the purpose of the app.
            </p>
          </article>
        </section>
      </main>
    </div>
  )
}
