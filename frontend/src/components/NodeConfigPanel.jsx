import React, { useState, useEffect } from 'react'
import './NodeConfigPanel.css'

function NodeConfigPanel({ node, onUpdate, onClose }) {
  const [config, setConfig] = useState(node.data.config || {})

  useEffect(() => {
    setConfig(node.data.config || {})
  }, [node])

  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    onUpdate(node.id, newConfig)
  }

  const renderConfigFields = () => {
    switch (node.type) {
      case 'http_request':
        return (
          <>
            <div className="config-field">
              <label>Method</label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => handleChange('method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="config-field">
              <label>URL</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com/data"
              />
            </div>
            <div className="config-field">
              <label>Headers (JSON)</label>
              <textarea
                value={config.headersJson || '{}'}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value)
                    handleChange('headers', headers)
                    handleChange('headersJson', e.target.value)
                  } catch {
                    handleChange('headersJson', e.target.value)
                  }
                }}
                placeholder='{"Content-Type": "application/json"}'
                rows={3}
              />
            </div>
          </>
        )

      case 'transform':
        return (
          <>
            <div className="config-field">
              <label>Expression (JavaScript)</label>
              <textarea
                value={config.expression || ''}
                onChange={(e) => handleChange('expression', e.target.value)}
                placeholder="data.current.temperature_2m > 20 ? 'summer' : 'winter'"
                rows={3}
              />
              <small>Use 'data' to reference input from connected node. Example: data.current.temperature_2m > 20 ? 'summer' : 'winter'</small>
            </div>
            <div className="config-field">
              <label>Condition (optional)</label>
              <input
                type="text"
                value={config.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                placeholder="data.temperature > 20"
              />
            </div>
            <div className="config-field">
              <label>True Value</label>
              <input
                type="text"
                value={config.trueValue || ''}
                onChange={(e) => handleChange('trueValue', e.target.value)}
                placeholder="summer"
              />
            </div>
            <div className="config-field">
              <label>False Value</label>
              <input
                type="text"
                value={config.falseValue || ''}
                onChange={(e) => handleChange('falseValue', e.target.value)}
                placeholder="winter"
              />
            </div>
          </>
        )

      case 'filter':
        return (
          <>
            <div className="config-field">
              <label>Filter Type</label>
              <select
                value={config.type || 'array'}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <option value="array">Array Filter</option>
                <option value="object">Object Field Removal</option>
              </select>
            </div>
            <div className="config-field">
              <label>Condition (Natural Language)</label>
              <textarea
                value={config.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                placeholder="Return only clothing items that are appropriate for summer weather"
                rows={3}
              />
              <small>Describe what to filter. An LLM will interpret this condition.</small>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="config-panel">
      <div className="config-panel-header">
        <h3>{node.data.label}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="config-panel-body">
        {renderConfigFields()}
      </div>
    </div>
  )
}

export default NodeConfigPanel

