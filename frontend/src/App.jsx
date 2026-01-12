import React, { useState, useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import WorkflowToolbar from './components/WorkflowToolbar'
import NodeConfigPanel from './components/NodeConfigPanel'
import ResultsPanel from './components/ResultsPanel'
import { nodeTypes } from './nodes'
import { saveWorkflow, loadWorkflow } from './utils/storage'
import { executeWorkflow } from './utils/workflowExecutor'
import './App.css'
import './nodes/NodeStyles.css'

const initialNodes = []
const initialEdges = []

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // Load workflow on mount
  useEffect(() => {
    const saved = loadWorkflow()
    if (saved && saved.nodes && saved.edges) {
      setNodes(saved.nodes)
      setEdges(saved.edges)
    }
  }, [setNodes, setEdges])


  const isInitialMount = useRef(true)

  // Save workflow whenever it changes (including when empty to persist deletions)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return // Don't save on initial mount
    }
    
    // Always save, even when empty, to persist deletions
    saveWorkflow({ nodes, edges })
  }, [nodes, edges])

  const onConnect = useCallback(
    (params) => {
      const newEdges = addEdge(
        { ...params, markerEnd: { type: MarkerType.ArrowClosed } },
        edges
      )
      setEdges(newEdges)
    },
    [edges, setEdges]
  )

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const addNode = useCallback(
    (type, label) => {
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label,
          config: getDefaultConfig(type),
        },
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const updateNodeConfig = useCallback(
    (nodeId, config) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, config } } : node
        )
      )
    },
    [setNodes]
  )

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      const result = await executeWorkflow(nodes, edges)
      setResults(result)
    } catch (err) {
      setError(err.message || 'Failed to execute workflow')
      console.error('Workflow execution error:', err)
    } finally {
      setIsRunning(false)
    }
  }, [nodes, edges])

  return (
    <div className="app">
      <WorkflowToolbar onAddNode={addNode} onRun={handleRun} isRunning={isRunning} />
      <div className="workflow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={updateNodeConfig}
            onClose={() => setSelectedNode(null)}
          />
        )}
        {(results || error) && (
          <ResultsPanel
            results={results}
            error={error}
            nodes={nodes}
            onClose={() => {
              setResults(null)
              setError(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function getDefaultConfig(type) {
  switch (type) {
    case 'http_request':
      return {
        method: 'GET',
        url: '',
        headers: {},
      }
    case 'transform':
      return {
        expression: '',
        condition: '',
        trueValue: '',
        falseValue: '',
      }
    case 'filter':
      return {
        type: 'array', // 'array' or 'object'
        condition: '',
      }
    default:
      return {}
  }
}

export default App

