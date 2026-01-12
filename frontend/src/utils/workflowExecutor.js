import axios from 'axios'

export async function executeWorkflow(nodes, edges) {
  if (nodes.length === 0) {
    throw new Error('Workflow has no nodes')
  }

  // Build node map for quick lookup
  const nodeMap = new Map()
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
  })

  // Build dependency graph (which nodes depend on which)
  const dependencies = new Map() // nodeId -> [dependency nodeIds]
  const dependents = new Map() // nodeId -> [dependent nodeIds]
  
  nodes.forEach(node => {
    dependencies.set(node.id, [])
    dependents.set(node.id, [])
  })

  edges.forEach(edge => {
    // edge.source -> edge.target means target depends on source
    const targetDeps = dependencies.get(edge.target) || []
    targetDeps.push(edge.source)
    dependencies.set(edge.target, targetDeps)

    const sourceDependents = dependents.get(edge.source) || []
    sourceDependents.push(edge.target)
    dependents.set(edge.source, sourceDependents)
  })

  // Topological sort using Kahn's algorithm
  const executionOrder = topologicalSort(nodes, dependencies)
  
  // Execute nodes in topological order
  const results = {}

  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId)
    if (!node) continue

    try {
      // Get input data from upstream nodes
      const inputData = getInputData(nodeId, edges, results, nodeMap)
      
      // Execute the node
      let output
      switch (node.type) {
        case 'http_request':
          output = await executeHttpRequest(node, inputData)
          break
        case 'transform':
          output = await executeTransform(node, inputData, results, nodeMap)
          break
        case 'filter':
          output = await executeFilter(node, inputData, results, nodeMap)
          break
        default:
          throw new Error(`Unknown node type: ${node.type}`)
      }

      results[nodeId] = output
    } catch (error) {
      throw new Error(`Error executing node ${nodeId} (${node.data.label}): ${error.message}`)
    }
  }

  return results
}

function topologicalSort(nodes, dependencies) {
  // Kahn's algorithm for topological sort
  const inDegree = new Map()
  nodes.forEach(node => {
    inDegree.set(node.id, (dependencies.get(node.id) || []).length)
  })

  const queue = []
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id)
    }
  })

  const result = []

  while (queue.length > 0) {
    const nodeId = queue.shift()
    result.push(nodeId)

    // Find all nodes that depend on this node
    nodes.forEach(node => {
      const deps = dependencies.get(node.id) || []
      if (deps.includes(nodeId)) {
        const newInDegree = inDegree.get(node.id) - 1
        inDegree.set(node.id, newInDegree)
        if (newInDegree === 0) {
          queue.push(node.id)
        }
      }
    })
  }

  // Check for cycles
  if (result.length !== nodes.length) {
    throw new Error('Workflow contains cycles or disconnected nodes')
  }

  return result
}

function getInputData(nodeId, edges, results, nodeMap) {
  // Find incoming edges
  const incomingEdges = edges.filter(edge => edge.target === nodeId)
  
  if (incomingEdges.length === 0) {
    return null
  }

  // For single input, return the data directly
  if (incomingEdges.length === 1) {
    const sourceId = incomingEdges[0].source
    return results[sourceId] !== undefined ? results[sourceId] : null
  }

  // Multiple inputs - return an object with all inputs keyed by node ID
  const inputs = {}
  for (const edge of incomingEdges) {
    const sourceNode = nodeMap.get(edge.source)
    if (sourceNode) {
      // Use a friendly key based on node type and position
      const key = sourceNode.id
      inputs[key] = results[edge.source] !== undefined ? results[edge.source] : null
    }
  }
  return inputs
}

async function executeHttpRequest(node, inputData) {
  const config = node.data.config || {}
  const { method = 'GET', url, headers = {} } = config

  if (!url) {
    throw new Error('URL is required for HTTP request node')
  }

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: method !== 'GET' && method !== 'DELETE' ? inputData : undefined,
    })

    return response.data
  } catch (error) {
    throw new Error(`HTTP request failed: ${error.message}`)
  }
}

async function executeTransform(node, inputData, allResults, nodeMap) {
  const config = node.data.config || {}
  const { expression, condition, trueValue, falseValue } = config

  // Build context with all previous results accessible by node ID
  const context = { data: inputData }
  
  // Add all previous results to context, keyed by node ID
  Object.keys(allResults).forEach(nodeId => {
    const resultNode = nodeMap.get(nodeId)
    if (resultNode) {
      // Use node ID as key, but also try to make it accessible
      context[nodeId] = allResults[nodeId]
      // Also add by type for convenience (e.g., if multiple http_request nodes)
      const typeKey = `${resultNode.type}_${nodeId.split('-').pop()}`
      context[typeKey] = allResults[nodeId]
    }
  })

  if (expression) {
    // Evaluate JavaScript expression
    try {
      // Create a function that receives the context object
      // This approach safely handles arrow functions and complex expressions
      const usedKeys = new Set()
      const varDeclarations = []
      
      // Always make 'data' available (primary input)
      varDeclarations.push('const data = ctx.data;')
      usedKeys.add('data')
      
      // Make other context variables available by their sanitized names
      // Ensure no duplicate variable names
      Object.keys(context).filter(key => key !== 'data').forEach(key => {
        let safeKey = key.replace(/[^a-zA-Z0-9_$]/g, '_')
        // If the sanitized key is already used, append a number to make it unique
        let uniqueKey = safeKey
        let counter = 1
        while (usedKeys.has(uniqueKey)) {
          uniqueKey = `${safeKey}_${counter}`
          counter++
        }
        usedKeys.add(uniqueKey)
        varDeclarations.push(`const ${uniqueKey} = ctx['${key.replace(/'/g, "\\'")}'];`)
      })
      
      const func = new Function('ctx', `
        ${varDeclarations.join('\n        ')}
        
        // Evaluate and return the expression
        return (${expression});
      `)
      return func(context)
    } catch (error) {
      throw new Error(`Transform expression error: ${error.message}`)
    }
  }

  if (condition && trueValue !== undefined && falseValue !== undefined) {
    // Conditional transform
    try {
      const conditionResult = evaluateCondition(condition, context)
      return conditionResult ? trueValue : falseValue
    } catch (error) {
      throw new Error(`Transform condition error: ${error.message}`)
    }
  }

  // If no expression or condition, return input as-is
  return inputData
}

function evaluateCondition(condition, context) {
  try {
    const contextKeys = Object.keys(context)
    const contextValues = Object.values(context)
    const func = new Function(...contextKeys, `return ${condition}`)
    return func(...contextValues)
  } catch (error) {
    throw new Error(`Condition evaluation error: ${error.message}`)
  }
}

async function executeFilter(node, inputData, allResults, nodeMap) {
  const config = node.data.config || {}
  const { type = 'array', condition } = config

  if (!condition) {
    return inputData
  }

  // Build context with all previous results for LLM to use
  const context = { data: inputData }
  Object.keys(allResults).forEach(nodeId => {
    const resultNode = nodeMap.get(nodeId)
    if (resultNode) {
      context[nodeId] = allResults[nodeId]
    }
  })

  // Send to backend for LLM-based filtering
  try {
    const response = await axios.post('/api/filter', {
      type,
      condition,
      data: inputData,
      context, // Pass context so filter can reference other nodes
    })

    return response.data.result
  } catch (error) {
    throw new Error(`Filter execution failed: ${error.message}`)
  }
}

