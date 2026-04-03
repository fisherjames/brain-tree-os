import { help } from './help.js'
import { start } from './start.js'
import { init } from './init.js'
import { sync } from './sync.js'
import { status } from './status.js'
import { intent } from './intent.js'
import { propose } from './propose.js'
import { shape } from './shape.js'
import { plan } from './plan.js'
import { work } from './work.js'
import { verify } from './verify.js'
import { merge } from './merge.js'
import { end } from './end.js'
import { brief } from './brief.js'
import { decide } from './decide.js'
import { mission } from './mission.js'
import { codex } from './codex.js'
import { doctrineLint } from './doctrine-lint.js'

export interface Command {
  description: string
  run: (args: string[]) => Promise<void>
}

export const commands: Record<string, Command> = {
  help,
  start,
  init,
  sync,
  status,
  intent,
  propose,
  shape,
  plan,
  work,
  verify,
  merge,
  end,
  brief,
  decide,
  mission,
  codex,
  'doctrine-lint': doctrineLint,
}
