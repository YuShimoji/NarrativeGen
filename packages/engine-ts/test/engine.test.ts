import { describe, it, expect } from 'vitest'
import { loadModel, startSession, getAvailableChoices, applyChoice } from '../src/index.js'

describe('NarrativeGen Engine', () => {
  const linearModel = {
    modelType: 'adventure-playthrough' as const,
    startNode: 'start',
    nodes: {
      start: {
        id: 'start',
        text: 'You wake up.',
        choices: [
          { id: 'c1', text: 'Get up', target: 'scene1' }
        ]
      },
      scene1: {
        id: 'scene1',
        text: 'You see the door.',
        choices: [
          { id: 'c2', text: 'Open door', target: 'end' }
        ]
      },
      end: {
        id: 'end',
        text: 'The end.',
        choices: []
      }
    }
  }

  it('should load model successfully', () => {
    const model = loadModel(linearModel)
    expect(model).toBeDefined()
    expect(model.startNode).toBe('start')
    expect(model.nodes.start.text).toBe('You wake up.')
  })

  it('should start session', () => {
    const model = loadModel(linearModel)
    const session = startSession(model)
    expect(session).toBeDefined()
    expect(session.nodeId).toBe('start')
    expect(session.time).toBe(0)
    expect(session.variables).toEqual({})
  })

  it('should get available choices at start', () => {
    const model = loadModel(linearModel)
    const session = startSession(model)
    const choices = getAvailableChoices(session, model)
    expect(choices).toHaveLength(1)
    expect(choices[0].id).toBe('c1')
    expect(choices[0].text).toBe('Get up')
  })

  it('should apply choice and transition to next node', () => {
    const model = loadModel(linearModel)
    let session = startSession(model)

    // Apply first choice
    session = applyChoice(session, model, 'c1')
    expect(session.nodeId).toBe('scene1')

    // Check choices at scene1
    const choices = getAvailableChoices(session, model)
    expect(choices).toHaveLength(1)
    expect(choices[0].id).toBe('c2')

    // Apply second choice
    session = applyChoice(session, model, 'c2')
    expect(session.nodeId).toBe('end')

    // Check end node has no choices
    const endChoices = getAvailableChoices(session, model)
    expect(endChoices).toHaveLength(0)
  })

  it('should handle invalid choice gracefully', () => {
    const model = loadModel(linearModel)
    const session = startSession(model)

    expect(() => {
      applyChoice(session, model, 'invalid')
    }).toThrow()
  })
})
