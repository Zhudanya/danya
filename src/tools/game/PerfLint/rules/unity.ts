import type { PerfRule } from '../types'

export const unityRules: PerfRule[] = [
  {
    id: 'UNITY-PERF-01',
    name: 'GetComponent in Update',
    pattern: /\bGetComponent\s*<[^>]+>\s*\(/,
    hotPaths: ['Update', 'FixedUpdate', 'LateUpdate'],
    message: 'GetComponent<T>() called in Update loop — cache in Awake() or Start()',
    fix: 'private T _cached; void Awake() { _cached = GetComponent<T>(); }',
  },
  {
    id: 'UNITY-PERF-02',
    name: 'Camera.main in Update',
    pattern: /\bCamera\s*\.\s*main\b/,
    hotPaths: ['Update', 'FixedUpdate', 'LateUpdate'],
    message: 'Camera.main is a FindGameObjectWithTag call every frame — cache it',
    fix: 'private Camera _mainCam; void Awake() { _mainCam = Camera.main; }',
  },
  {
    id: 'UNITY-PERF-03',
    name: 'String concatenation in Update',
    pattern: /(?:string\s+\w+\s*=.*\+|"\s*\+\s*\w|\w\s*\+\s*")/,
    hotPaths: ['Update', 'FixedUpdate', 'LateUpdate'],
    message: 'String concatenation in hot path creates garbage — use StringBuilder or interpolation cache',
  },
  {
    id: 'UNITY-PERF-04',
    name: 'Instantiate in Update',
    pattern: /\bInstantiate\s*\(/,
    hotPaths: ['Update', 'FixedUpdate', 'LateUpdate'],
    message: 'Instantiate() in Update loop — use object pooling instead',
  },
  {
    id: 'UNITY-PERF-05',
    name: 'new WaitForSeconds uncached',
    pattern: /new\s+WaitForSeconds\s*\(/,
    hotPaths: null, // Check everywhere in coroutines
    message: 'new WaitForSeconds() allocates each call — cache as static readonly field',
    fix: 'private static readonly WaitForSeconds _wait = new WaitForSeconds(duration);',
  },
  {
    id: 'UNITY-PERF-06',
    name: 'Find/FindObjectOfType in Update',
    pattern: /\b(?:Find|FindObjectOfType|FindGameObjectWithTag|FindObjectsOfType)\s*[<(]/,
    hotPaths: ['Update', 'FixedUpdate', 'LateUpdate'],
    message: 'Find/FindObjectOfType in Update loop is O(n) every frame — cache the result',
  },
  {
    id: 'UNITY-PERF-07',
    name: 'LINQ in hot path',
    pattern: /\.\s*(?:Where|Select|OrderBy|GroupBy|Any|All|First|Last|Count)\s*\(/,
    hotPaths: ['Update', 'FixedUpdate', 'LateUpdate'],
    message: 'LINQ in hot path allocates iterators — use manual loops',
  },
]
