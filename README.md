# Visual Workflow Editor

A visual workflow editor for building and executing DAG-based workflows with HTTP requests, data transformations, and AI-powered filtering.

## Features

**Visual Editor**: Drag-and-drop interface for creating workflows       
**Node Types**: HTTP Request, Transform, and Filter nodes     
**Persistence**: Workflows are automatically saved to localStorage     
**Execution**: Run workflows and see results in real-time  
**AI-Powered Filtering**: Natural language filtering using LLM (OpenAI)

## Project Structure

```
MinimalAI/
├── frontend/                    # React Frontend Application
│   ├── src/
│   │   ├── App.jsx             # Main application component
│   │   ├── components/         # UI Components
│   │   │   ├── WorkflowToolbar.jsx    # Toolbar for adding nodes
│   │   │   ├── NodeConfigPanel.jsx    # Node configuration UI
│   │   │   └── ResultsPanel.jsx       # Execution results display
│   │   ├── nodes/              # Custom node components
│   │   │   ├── HttpRequestNode.jsx    # HTTP request node UI
│   │   │   ├── TransformNode.jsx   # Transform node UI
│   │   │   ├── FilterNode.jsx         # Filter node UI
│   │   │   └── index.js               # Node type registry
│   │   └── utils/              # Core utilities
│   │       ├── workflowExecutor.js    # DAG execution engine 
│   │       └── storage.js             # localStorage persistence
│   └── vite.config.js          # Vite configuration with proxy
│
├── backend/                     # Node.js Backend Server
│   └── server.js               # Express server with OpenAI integration
│
└── package.json                # Root package for running both services
```

---

## Demo
https://github.com/user-attachments/assets/b7ac8b52-3e60-48f7-aff7-e52468a9f238

## Setup

1. **Install dependencies**:
```bash
npm run install:all
```

2. **Set up OpenAI API key (optional, for advanced filtering)**:
```bash
export OPENAI_API_KEY=your_api_key_here
```

3. **Run the application**:
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

## Usage

### Creating a Workflow

1. Click on node buttons in the toolbar to add nodes to the canvas
2. Click on a node to configure it
3. **Connect nodes by dragging from the output handle (bottom) to the input handle (top) of another node**
4. Your workflow is automatically saved to localStorage

### Node Types

#### HTTP Request Node
- Makes HTTP requests to external APIs
- Configure: Method (GET, POST, PUT, DELETE), URL, Headers
- Example URLs:
  - Weather: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m`
  - Products: `https://fakestoreapi.com/products`
  - Users: `https://jsonplaceholder.typicode.com/users`

#### Transform Node
- Reshapes or computes new data
- Supports JavaScript expressions referencing `data` (input) and upstream nodes
- Example: `data.temperature > 20 ? 'summer' : 'winter'`

#### Filter Node
- Filters arrays or removes fields from objects
- Uses natural language conditions interpreted by LLM
- Example: "Return only clothing items that are appropriate for summer weather"

### Example Workflow: 

1. **HTTP Request Node 1**: Fetch weather data
   - URL: `https://fakestoreapi.com/products?limit=10 `

2. **Transform Node**: Determine season
   - Expression: `data.filter(p => p.category === "men's clothing")
      .map(p => ({
         name: p.title,
         price: p.price,
         rating: p.rating.rate,
         valueScore: (p.rating.rate * 10) / (p.price / 10)
      }))
      .sort((a, b) => b.valueScore - a.valueScore)`
   - Connect from HTTP Request Node 

4. **Filter Node**: 
   - Condition: "Filter top 3 value products"


### Running a Workflow

1. Build your workflow by adding and connecting nodes
2. Configure each node with the necessary settings
3. Click the "Run Workflow" button
4. View results in the results panel

##Details

### Workflow Execution

- Workflows are executed in topological order (respecting DAG dependencies)
- Each node receives data from its upstream nodes
- Results are displayed per node in the results panel

### Filter Node with LLM

- When OpenAI API key is set, filter conditions are interpreted using GPT-3.5-turbo
- Without API key, falls back to simple pattern matching
- Natural language conditions are converted to actual filtering logic

## Development

### Frontend
- React 18 with Vite
- React Flow for DAG visualization
- Axios for HTTP requests

### Backend
- Node.js with Express
- OpenAI SDK for LLM integration
- CORS enabled for frontend communication

## Notes

- Workflows are persisted in browser localStorage
- The filter node requires an OpenAI API key for full functionality
- HTTP requests are made directly from the frontend (CORS permitting)
- Transform expressions are evaluated using JavaScript (be careful with untrusted code)

