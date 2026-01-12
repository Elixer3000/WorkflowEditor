import React from 'react'
import { Handle, Position } from 'reactflow'

function FilterNode({ data }) {
  return (
    <div className="custom-node filter-node">
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <span className="node-icon">🔍</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-content">
        {data.config?.condition && (
          <div className="node-info">
            <span className="node-condition">{data.config.condition.substring(0, 40)}...</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default FilterNode

