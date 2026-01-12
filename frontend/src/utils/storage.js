const STORAGE_KEY = 'workflow-editor-state'

export function saveWorkflow(workflow) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow))
  } catch (error) {
    console.error('Failed to save workflow:', error)
  }
}

export function loadWorkflow() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load workflow:', error)
  }
  return null
}

export function clearWorkflow() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear workflow:', error)
  }
}

