import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { Header } from "./components/Header"
import { firebaseAuth } from "./firebase"
import {
  completeCurrentStep,
  createStarterSession,
  skipCurrentStep,
  subscribeToActiveSession,
  subscribeToSessionSteps,
} from "./data/trainerStore"
import type { SessionDocument, SessionStepDocument } from "./data/trainerTypes"
import "./App.css"

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [isCompletingStep, setIsCompletingStep] = useState(false)
  const [uiError, setUiError] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<
    (SessionDocument & { id: string }) | null
  >(null)
  const [sessionSteps, setSessionSteps] = useState<SessionStepDocument[]>([])

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => {
        setCurrentUser(user)
        setIsAuthReady(true)
      }),
    [],
  )

  useEffect(() => {
    if (!currentUser) {
      return
    }

    return subscribeToActiveSession(currentUser.uid, setActiveSession)
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !activeSession) {
      return
    }

    return subscribeToSessionSteps(
      currentUser.uid,
      activeSession.id,
      setSessionSteps,
    )
  }, [activeSession, currentUser])

  const currentStep = useMemo(() => {
    if (!activeSession) {
      return null
    }

    return (
      sessionSteps.find(
        (step) => step.order === activeSession.currentStepIndex,
      ) ?? null
    )
  }, [activeSession, sessionSteps])

  async function handleStartSession() {
    if (!currentUser) {
      return
    }

    setUiError(null)
    setIsStartingSession(true)

    try {
      await createStarterSession(currentUser.uid)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start session right now."

      setUiError(message)
    } finally {
      setIsStartingSession(false)
    }
  }

  async function handleLogSet(reps: number) {
    if (!currentUser || !activeSession || !currentStep) {
      return
    }

    setUiError(null)
    setIsCompletingStep(true)

    try {
      await completeCurrentStep(
        currentUser.uid,
        activeSession.id,
        activeSession.currentStepIndex,
        sessionSteps,
        reps,
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not log this step."

      setUiError(message)
    } finally {
      setIsCompletingStep(false)
    }
  }

  async function handleSkipStep() {
    if (!currentUser || !activeSession || !currentStep) {
      return
    }

    setUiError(null)
    setIsCompletingStep(true)

    try {
      await skipCurrentStep(
        currentUser.uid,
        activeSession.id,
        activeSession.currentStepIndex,
        sessionSteps,
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not skip this step."

      setUiError(message)
    } finally {
      setIsCompletingStep(false)
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <section className="trainer-panel" aria-labelledby="trainer-title">
          <p className="eyebrow">Coach Mode</p>
          <h2 id="trainer-title">Mission Control</h2>

          {!isAuthReady ? <p>Checking sign-in state...</p> : null}

          {isAuthReady && !currentUser ? (
            <p>Sign in with Google to start your guided training session.</p>
          ) : null}

          {currentUser && !activeSession ? (
            <div className="trainer-actions">
              <p>
                Tap Let&apos;s Go and the app will start driving your workout.
              </p>
              <button
                type="button"
                className="primary-action"
                onClick={handleStartSession}
                disabled={isStartingSession}
              >
                {isStartingSession ? "Starting..." : "Let's Go"}
              </button>
            </div>
          ) : null}

          {currentUser && activeSession ? (
            <div className="trainer-flow">
              <p className="coach-prompt">{activeSession.coachPrompt}</p>

              {currentStep ? (
                <>
                  <p className="step-detail">
                    {currentStep.exerciseName} · Set{" "}
                    {Math.max(currentStep.target.setNumber, 1)}
                    {currentStep.target.weight > 0
                      ? ` · ${currentStep.target.weight} lb`
                      : ""}
                    {currentStep.target.repsMax > 0
                      ? ` · ${currentStep.target.repsMin}-${currentStep.target.repsMax} reps`
                      : ""}
                  </p>

                  <div className="trainer-actions">
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() =>
                        handleLogSet(currentStep.target.repsMax || 8)
                      }
                      disabled={isCompletingStep}
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={handleSkipStep}
                      disabled={isCompletingStep}
                    >
                      Skip
                    </button>
                  </div>
                </>
              ) : (
                <p>Loading your next step...</p>
              )}
            </div>
          ) : null}

          {uiError ? <p className="error-text">{uiError}</p> : null}
        </section>

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
