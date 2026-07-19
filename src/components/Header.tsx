import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { signInWithPopup, onAuthStateChanged } from "firebase/auth"
import { firebaseAuth, googleAuthProvider } from "../firebase"
import "./Header.css"

function getFirstName(user: User) {
  const displayName = user.displayName?.trim()

  if (displayName) {
    const [firstName] = displayName.split(/\s+/)
    return firstName
  }

  const emailName = user.email?.split("@")[0]?.trim()

  if (emailName) {
    return emailName.charAt(0).toUpperCase() + emailName.slice(1)
  }

  return "User"
}

export function Header() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (user) => {
        setCurrentUser(user)
        setIsAuthReady(true)
      }),
    [],
  )

  async function handleGoogleLogin() {
    await signInWithPopup(firebaseAuth, googleAuthProvider)
  }

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <header className="site-header">
      <a className="site-brand" href="/" aria-label="Fire TPS home">
        Fire TPS 🔥
      </a>

      <div className="header-actions">
        {isAuthReady && currentUser ? (
          <span
            className="user-chip"
            aria-label={`Signed in as ${getFirstName(currentUser)}`}
          >
            {getFirstName(currentUser)}
          </span>
        ) : (
          <button
            type="button"
            className="login-button"
            onClick={handleGoogleLogin}
          >
            Continue with Google
          </button>
        )}

        <div className="menu-wrapper">
          <button
            type="button"
            className="menu-button"
            aria-label="Open navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="site-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          {isMenuOpen ? (
            <nav id="site-menu" className="menu-panel" aria-label="Main menu">
              <a href="#exercises" onClick={closeMenu}>
                Exercises
              </a>
              <a href="#about" onClick={closeMenu}>
                About
              </a>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  )
}
