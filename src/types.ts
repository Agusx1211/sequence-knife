import { trackers } from '@0xsequence/sessions'

export interface CommonOptions {
  sessions: string
}

export interface Services {
  tracker: trackers.remote.RemoteConfigTracker
} 