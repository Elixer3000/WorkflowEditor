import React from 'react'
import { Handle, Position } from 'reactflow'

function HttpRequestNode({ data }) {
  return (
    <div className="custom-node http-request-node">
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🌐</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        <div className="node-info">
          <span className="node-method">{data.config?.method || 'GET'}</span>
          <span className="node-url">{data.config?.url || 'No URL'}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default HttpRequestNode

