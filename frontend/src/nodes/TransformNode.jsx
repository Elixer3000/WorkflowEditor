import React from 'react'
import { Handle, Position } from 'reactflow'

function TransformNode({ data }) {
  return (
    <div className="custom-node transform-node">
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🔄</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        {data.config?.expression && (
          <div className="node-info">
            <span className="node-expression">{data.config.expression.substring(0, 40)}...</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default TransformNode

