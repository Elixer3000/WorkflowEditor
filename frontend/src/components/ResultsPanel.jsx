import React from 'react'
import './ResultsPanel.css'

function ResultsPanel({ results, error, onClose, nodes }) {
  // Create a map of nodeId to node for quick lookup
  const nodeMap = React.useMemo(() => {
    const map = new Map()
    if (nodes) {
      nodes.forEach(node => {
        map.set(node.id, node)
      })
    }
    return map
  }, [nodes])

  const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) {
      return text
    }
    // Try to break at word boundary
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...'
  }

  const getNodeDisplayName = (nodeId) => {
    const node = nodeMap.get(nodeId)
    if (node) {
      const config = node.data?.config || {}
      
      // For HTTP request nodes, use the URL
      if (node.type === 'http_request' && config.url) {
        const url = config.url.trim()
        if (url) {
          const method = config.method || 'GET'
          const urlPreview = truncateText(url, 50)
          return `${method} ${urlPreview}`
        }
      }
      
      // For transform nodes, use the expression (main) or condition (fallback)
      if (node.type === 'transform') {
        const expression = config.expression?.trim()
        const condition = config.condition?.trim()
        
        if (expression) {
          const expressionPreview = truncateText(expression, 50)
          return `Transform: ${expressionPreview}`
        } else if (condition) {
          const conditionPreview = truncateText(condition, 50)
          return `Transform: ${conditionPreview}`
        }
      }
      
      // For filter nodes, use part of the condition string
      if (node.type === 'filter' && config.condition) {
        const condition = config.condition.trim()
        if (condition) {
          const conditionPreview = truncateText(condition, 50)
          return `Filter: ${conditionPreview}`
        }
      }
      
      // For other nodes, use the standard label
      const label = node.data?.label || node.type || 'Unknown'
      const type = node.type || 'unknown'
      return `${label} (${type})`
    }
    return nodeId
  }

  return (
    <div className="results-panel">
      <div className="results-panel-header">
        <h3>{error ? 'Error' : 'Execution Results'}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="results-panel-body">
        {error ? (
          <div className="error-message">
            <pre>{error}</pre>
          </div>
        ) : (
          <div className="results-content">
            {results && Object.keys(results).length > 0 ? (
              Object.entries(results).map(([nodeId, data]) => (
                <div key={nodeId} className="result-item">
                  <div className="result-node-header">
                    <div className="result-node-label">{getNodeDisplayName(nodeId)}</div>
                    <div className="result-node-id">{nodeId}</div>
                  </div>
                  <pre className="result-data">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <div className="no-results">No results to display</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultsPanel

