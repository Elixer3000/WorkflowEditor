import React from 'react'
import './WorkflowToolbar.css'

const NODE_TYPES = [
  { type: 'http_request', label: 'HTTP Request', icon: '🌐' },
  { type: 'transform', label: 'Transform', icon: '🔄' },
  { type: 'filter', label: 'Filter', icon: '🔍' },
]

function WorkflowToolbar({ onAddNode, onRun, isRunning }) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Add Node</h3>
        <div className="node-buttons">
          {NODE_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              className="node-button"
              onClick={() => onAddNode(type, label)}
              title={label}
            >
              <span className="node-icon">{icon}</span>
              <span className="node-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar-section">
        <button
          className="run-button"
          onClick={onRun}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running...' : '▶️ Run Workflow'}
        </button>
      </div>
    </div>
  )
}

export default WorkflowToolbar

