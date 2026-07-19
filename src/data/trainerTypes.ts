import type { Timestamp } from "firebase/firestore"

export type SessionStatus = "planned" | "active" | "paused" | "completed"
export type SessionStepState = "pending" | "done" | "skipped"
export type SessionStepType = "warmup" | "working_set" | "rest" | "transition"
export type SessionEventKind =
  | "voice_transcript"
  | "button_press"
  | "coach_message"
  | "system_decision"

export interface UserProfileDocument {
  firstName: string
  role: string
  timezone: string
  preferredUnits: "lb" | "kg"
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ExerciseLibraryDocument {
  name: string
  movementPattern: string
  equipment: string[]
  defaultRepRangeMin: number
  defaultRepRangeMax: number
  injuryContraindications: string[]
  isArchived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface SessionDocument {
  missionTitle: string
  status: SessionStatus
  startedAt: Timestamp
  endedAt?: Timestamp
  currentStepIndex: number
  currentExerciseName: string
  coachPrompt: string
  nextActionType: "lift" | "rest" | "confirm" | "none"
  updatedAt: Timestamp
}

export interface SessionStepDocument {
  id: string
  order: number
  type: SessionStepType
  exerciseName: string
  prompt: string
  target: {
    weight: number
    repsMin: number
    repsMax: number
    setNumber: number
  }
  actual?: {
    reps?: number
    weight?: number
    note?: string
  }
  timerSeconds?: number
  state: SessionStepState
  updatedAt: Timestamp
}

export interface SessionEventDocument {
  ts: Timestamp
  kind: SessionEventKind
  text: string
  parsedIntent: string
  confidence: number
}
