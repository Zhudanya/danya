/**
 * Wave Computation for /parallel-execute
 * Topological sort tasks into parallel waves based on dependencies.
 */

export type Task = {
  id: string
  depends: string[]
  description: string
  files?: string[]
  verify?: string
}

export type Wave = {
  waveNumber: number
  tasks: Task[]
}

export class CyclicDependencyError extends Error {
  constructor(public remainingTasks: string[]) {
    super(`Circular dependency detected among tasks: ${remainingTasks.join(', ')}`)
  }
}

/**
 * Compute execution waves from tasks with dependencies.
 * Tasks with no unmet dependencies form the next wave.
 */
export function computeWaves(tasks: Task[]): Wave[] {
  const remaining = new Set(tasks.map(t => t.id))
  const completed = new Set<string>()
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  const waves: Wave[] = []

  while (remaining.size > 0) {
    const ready: Task[] = []

    for (const id of remaining) {
      const task = taskMap.get(id)!
      const depsAllMet = task.depends.every(dep => completed.has(dep))
      if (depsAllMet) {
        ready.push(task)
      }
    }

    if (ready.length === 0) {
      throw new CyclicDependencyError([...remaining])
    }

    waves.push({
      waveNumber: waves.length + 1,
      tasks: ready,
    })

    for (const t of ready) {
      remaining.delete(t.id)
      completed.add(t.id)
    }
  }

  return waves
}

/**
 * Format wave schedule for display.
 */
export function formatWaveSchedule(waves: Wave[]): string {
  return waves.map(w => {
    const taskIds = w.tasks.map(t => t.id).join(', ')
    return `  Wave ${w.waveNumber}: [${taskIds}] (${w.tasks.length} task${w.tasks.length > 1 ? 's' : ''} in parallel)`
  }).join('\n')
}
