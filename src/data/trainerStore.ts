import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore"
import { firestoreDb } from "../firebase"
import type { SessionDocument, SessionStepDocument } from "./trainerTypes"

interface SessionPayload {
  missionTitle: string
  status: "active"
  startedAt: ReturnType<typeof serverTimestamp>
  currentStepIndex: number
  currentExerciseName: string
  coachPrompt: string
  nextActionType: "lift" | "rest" | "confirm"
  updatedAt: ReturnType<typeof serverTimestamp>
}

interface StepPayload {
  order: number
  type: "warmup" | "working_set" | "rest" | "transition"
  exerciseName: string
  prompt: string
  target: {
    weight: number
    repsMin: number
    repsMax: number
    setNumber: number
  }
  timerSeconds?: number
  state: "pending" | "done" | "skipped"
  updatedAt: ReturnType<typeof serverTimestamp>
}

const starterSteps: Omit<StepPayload, "updatedAt">[] = [
  {
    order: 0,
    type: "warmup",
    exerciseName: "Bench Press",
    prompt: "Warm up with 95 pounds for 10 reps.",
    target: { weight: 95, repsMin: 10, repsMax: 10, setNumber: 1 },
    state: "pending",
  },
  {
    order: 1,
    type: "working_set",
    exerciseName: "Bench Press",
    prompt: "Set 1: 185 pounds for 6 to 8 reps.",
    target: { weight: 185, repsMin: 6, repsMax: 8, setNumber: 1 },
    state: "pending",
  },
  {
    order: 2,
    type: "rest",
    exerciseName: "Bench Press",
    prompt: "Rest for 90 seconds.",
    target: { weight: 0, repsMin: 0, repsMax: 0, setNumber: 0 },
    timerSeconds: 90,
    state: "pending",
  },
  {
    order: 3,
    type: "working_set",
    exerciseName: "Bench Press",
    prompt: "Set 2: 185 pounds for 6 to 8 reps.",
    target: { weight: 185, repsMin: 6, repsMax: 8, setNumber: 2 },
    state: "pending",
  },
]

function sessionsCollection(uid: string) {
  return collection(firestoreDb, "users", uid, "sessions")
}

function sessionStepsCollection(uid: string, sessionId: string) {
  return collection(firestoreDb, "users", uid, "sessions", sessionId, "steps")
}

function sessionEventsCollection(uid: string, sessionId: string) {
  return collection(firestoreDb, "users", uid, "sessions", sessionId, "events")
}

export async function createStarterSession(uid: string) {
  const sessionRef = doc(sessionsCollection(uid))
  const batch = writeBatch(firestoreDb)

  const sessionPayload: SessionPayload = {
    missionTitle: "Push Day",
    status: "active",
    startedAt: serverTimestamp(),
    currentStepIndex: 0,
    currentExerciseName: starterSteps[0].exerciseName,
    coachPrompt:
      "Today's mission is Push Day. Warm up with 95 pounds for 10 reps.",
    nextActionType: "lift",
    updatedAt: serverTimestamp(),
  }

  batch.set(sessionRef, sessionPayload)

  starterSteps.forEach((step) => {
    const stepRef = doc(sessionStepsCollection(uid, sessionRef.id))

    batch.set(stepRef, {
      ...step,
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
  return sessionRef.id
}

export function subscribeToActiveSession(
  uid: string,
  onSession: (session: (SessionDocument & { id: string }) | null) => void,
): Unsubscribe {
  const activeSessionQuery = query(
    sessionsCollection(uid),
    where("status", "==", "active"),
    limit(1),
  )

  return onSnapshot(activeSessionQuery, (snapshot) => {
    if (snapshot.empty) {
      onSession(null)
      return
    }

    const activeSessionDoc = snapshot.docs[0]

    onSession({
      id: activeSessionDoc.id,
      ...(activeSessionDoc.data() as SessionDocument),
    })
  })
}

export function subscribeToSessionSteps(
  uid: string,
  sessionId: string,
  onSteps: (steps: SessionStepDocument[]) => void,
): Unsubscribe {
  const orderedStepsQuery = query(
    sessionStepsCollection(uid, sessionId),
    orderBy("order", "asc"),
  )

  return onSnapshot(orderedStepsQuery, (snapshot) => {
    const steps = snapshot.docs.map((stepDoc) => ({
      id: stepDoc.id,
      ...(stepDoc.data() as Omit<SessionStepDocument, "id">),
    }))

    onSteps(steps)
  })
}

export async function completeCurrentStep(
  uid: string,
  sessionId: string,
  currentStepIndex: number,
  steps: SessionStepDocument[],
  reps: number,
) {
  const currentStep = steps.find((step) => step.order === currentStepIndex)

  if (!currentStep || currentStep.state === "done") {
    return
  }

  const nextStep = steps.find((step) => step.order === currentStep.order + 1)
  const sessionRef = doc(firestoreDb, "users", uid, "sessions", sessionId)
  const stepRef = doc(
    firestoreDb,
    "users",
    uid,
    "sessions",
    sessionId,
    "steps",
    currentStep.id,
  )

  const batch = writeBatch(firestoreDb)

  batch.update(stepRef, {
    state: "done",
    actual: {
      reps,
      weight: currentStep.target.weight,
      note: "Logged from quick action",
    },
    updatedAt: serverTimestamp(),
  })

  batch.set(doc(sessionEventsCollection(uid, sessionId)), {
    ts: serverTimestamp(),
    kind: "button_press",
    text: `Done. ${reps} reps.`,
    parsedIntent: "set_complete",
    confidence: 1,
  })

  if (nextStep) {
    batch.update(sessionRef, {
      currentStepIndex: nextStep.order,
      currentExerciseName: nextStep.exerciseName,
      coachPrompt: nextStep.prompt,
      nextActionType: nextStep.type === "rest" ? "rest" : "lift",
      updatedAt: serverTimestamp(),
    })
  } else {
    batch.update(sessionRef, {
      status: "completed",
      endedAt: serverTimestamp(),
      coachPrompt: "Excellent work. Session complete.",
      nextActionType: "none",
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}

export async function skipCurrentStep(
  uid: string,
  sessionId: string,
  currentStepIndex: number,
  steps: SessionStepDocument[],
) {
  const currentStep = steps.find((step) => step.order === currentStepIndex)

  if (!currentStep || currentStep.state === "done") {
    return
  }

  const nextStep = steps.find((step) => step.order === currentStep.order + 1)
  const sessionRef = doc(firestoreDb, "users", uid, "sessions", sessionId)
  const stepRef = doc(
    firestoreDb,
    "users",
    uid,
    "sessions",
    sessionId,
    "steps",
    currentStep.id,
  )

  const batch = writeBatch(firestoreDb)

  batch.update(stepRef, {
    state: "skipped",
    updatedAt: serverTimestamp(),
  })

  batch.set(doc(sessionEventsCollection(uid, sessionId)), {
    ts: serverTimestamp(),
    kind: "button_press",
    text: `Skipped step: ${currentStep.prompt}`,
    parsedIntent: "skip_exercise",
    confidence: 1,
  })

  if (nextStep) {
    batch.update(sessionRef, {
      currentStepIndex: nextStep.order,
      currentExerciseName: nextStep.exerciseName,
      coachPrompt: nextStep.prompt,
      nextActionType: nextStep.type === "rest" ? "rest" : "lift",
      updatedAt: serverTimestamp(),
    })
  } else {
    batch.update(sessionRef, {
      status: "completed",
      endedAt: serverTimestamp(),
      coachPrompt: "Session complete after skip.",
      nextActionType: "none",
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}
