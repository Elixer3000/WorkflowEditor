import express from 'express'
import cors from 'cors'
import axios from 'axios'
import OpenAI from 'openai'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

let openai = null
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
} catch (error) {
  console.warn('OpenAI not configured. Filter node will use simple pattern matching.')
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Filter endpoint - uses LLM to interpret natural language conditions
app.post('/api/filter', async (req, res) => {
  try {
    const { type, condition, data, context } = req.body

    if (!condition) {
      return res.json({ result: data })
    }

    let result

    if (type === 'array') {
      result = await filterArray(data, condition, context)
    } else if (type === 'object') {
      result = await filterObject(data, condition, context)
    } else {
      return res.status(400).json({ error: 'Invalid filter type' })
    }

    res.json({ result })
  } catch (error) {
    console.error('Filter error:', error)
    res.status(500).json({ error: error.message })
  }
})

async function filterArray(array, condition, context = {}) {
  if (!Array.isArray(array)) {
    throw new Error('Input data is not an array')
  }

  // If OpenAI is available, use it for natural language filtering
  if (openai && typeof openai.chat !== 'undefined') {
    try {
      const contextStr = Object.keys(context).length > 0 
        ? `\n\nAdditional context from other workflow nodes:\n${JSON.stringify(context, null, 2)}`
        : ''

      const prompt = `You are a data filtering assistant. Given an array of items and a natural language condition, return only the items that match the condition.

Condition: ${condition}

Array of items to filter:
${JSON.stringify(array, null, 2)}${contextStr}

Return a JSON array containing only the items that match the condition. Do not include any explanation, only return the filtered array.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that filters arrays based on natural language conditions. Always return valid JSON arrays only. You can reference data from the context when evaluating the condition.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const responseText = completion.choices[0].message.content.trim()
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return JSON.parse(responseText)
    } catch (error) {
      console.error('OpenAI filter error:', error)
      // Fall through to simple pattern matching
    }
  }

  // Fallback: Simple pattern-based filtering
  return simpleArrayFilter(array, condition, context)
}

async function filterObject(obj, condition, context = {}) {
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Input data is not an object')
  }

  // If OpenAI is available, use it
  if (openai && typeof openai.chat !== 'undefined') {
    try {
      const contextStr = Object.keys(context).length > 0 
        ? `\n\nAdditional context from other workflow nodes:\n${JSON.stringify(context, null, 2)}`
        : ''

      const prompt = `You are a data filtering assistant. Given an object and a natural language condition describing which fields to remove, return the object with those fields removed.

Condition: ${condition}

Object:
${JSON.stringify(obj, null, 2)}${contextStr}

Return the object as JSON with the specified fields removed. Do not include any explanation, only return the modified object.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that removes fields from objects based on natural language conditions. Always return valid JSON objects only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const responseText = completion.choices[0].message.content.trim()
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return JSON.parse(responseText)
    } catch (error) {
      console.error('OpenAI filter error:', error)
      // Fall through to simple pattern matching
    }
  }

  // Fallback: Return object as-is (could implement field removal logic)
  return obj
}

// Simple keyword-based filtering as fallback for AI Failure.
function simpleArrayFilter(array, condition, context = {}) {
  
  const lowerCondition = condition.toLowerCase()

  // Check for common patterns
  if (lowerCondition.includes('summer') || lowerCondition.includes('warm')) {
    return array.filter(item => {
      const itemStr = JSON.stringify(item).toLowerCase()
      return itemStr.includes('summer') || 
             itemStr.includes('warm') || 
             itemStr.includes('short') ||
             itemStr.includes('t-shirt') ||
             itemStr.includes('dress')
    })
  }

  if (lowerCondition.includes('winter') || lowerCondition.includes('cold')) {
    return array.filter(item => {
      const itemStr = JSON.stringify(item).toLowerCase()
      return itemStr.includes('winter') || 
             itemStr.includes('cold') || 
             itemStr.includes('jacket') ||
             itemStr.includes('sweater') ||
             itemStr.includes('coat')
    })
  }

  // Default: return all items if no pattern matches
  console.warn('Could not interpret filter condition, returning all items')
  return array
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  if (!openai || typeof openai.chat === 'undefined') {
    console.warn('OpenAI API key not set. Filter node will use simple pattern matching.')
    console.warn('Set OPENAI_API_KEY environment variable for full LLM-based filtering.')
  } else {
    console.log('OpenAI configured. Filter node will use LLM-based filtering.')
  }
})

