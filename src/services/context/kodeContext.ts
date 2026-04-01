import { getProjectDocs } from '@context'
import { debug as debugLogger } from '@utils/log/debugLogger'
import { logError } from '@utils/log'

class DanyaContextManager {
  private static instance: DanyaContextManager
  private projectDocsCache = ''
  private cacheInitialized = false
  private initPromise: Promise<void> | null = null

  static getInstance(): DanyaContextManager {
    if (!DanyaContextManager.instance) {
      DanyaContextManager.instance = new DanyaContextManager()
    }
    return DanyaContextManager.instance
  }

  private async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        const projectDocs = await getProjectDocs()
        this.projectDocsCache = projectDocs || ''
        this.cacheInitialized = true
      } catch (error) {
        logError(error)
        debugLogger.warn('DANYA_CONTEXT_LOAD_FAILED', {
          error: error instanceof Error ? error.message : String(error),
        })
        this.projectDocsCache = ''
        this.cacheInitialized = true
      }
    })()

    return this.initPromise
  }

  public getDanyaContext(): string {
    if (!this.cacheInitialized) {
      this.initialize().catch(error => {
        logError(error)
        debugLogger.warn('DANYA_CONTEXT_LOAD_FAILED', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
      return ''
    }
    return this.projectDocsCache
  }

  public async refreshCache(): Promise<void> {
    this.cacheInitialized = false
    this.initPromise = null
    await this.initialize()
  }
}

const danyaContextManager = DanyaContextManager.getInstance()

export const generateDanyaContext = (): string => {
  return danyaContextManager.getDanyaContext()
}

export const refreshDanyaContext = async (): Promise<void> => {
  await danyaContextManager.refreshCache()
}

if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    refreshDanyaContext().catch(() => {})
  }, 0)
}
