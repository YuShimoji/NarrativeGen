import { describe, it, expect } from 'vitest'
import { loadModel } from '../src/index.js'

function createValidKnowledgeModel(): Record<string, any> {
  return {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    entities: {
      receipt_fragment: {
        id: 'receipt_fragment',
        name: 'Receipt fragment',
        properties: {
          credibility: { key: 'credibility', type: 'number', defaultValue: 72 },
        },
      },
    },
    characters: {
      mira: {
        id: 'mira',
        name: 'Mira',
        knowledgeProfiles: [
          { domain: 'archive_records', accuracy: 0.9, tolerance: 0.1 },
        ],
      },
    },
    knowledgeRules: {
      receipt_rule: {
        character: 'mira',
        entity: 'receipt_fragment',
        domain: 'archive_records',
        expectations: { credibility: 50 },
      },
    },
    nodes: {
      start: {
        id: 'start',
        text: 'Start',
        choices: [
          {
            id: 'follow',
            text: 'Follow',
            target: 'end',
            conditions: [
              { type: 'knowledgeRule', rule: 'receipt_rule', result: 'noticed' },
            ],
          },
        ],
      },
      end: { id: 'end', text: 'End', choices: [] },
    },
  }
}

describe('Model Validation Enhancement', () => {
  describe('Duplicate ID Detection', () => {
    it('should detect duplicate node IDs', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: { id: 'start', text: 'Start', choices: [] },
          duplicate: { id: 'start', text: 'Duplicate ID', choices: [] }, // Same ID as 'start'
        },
      }

      expect(() => loadModel(invalidModel)).toThrow(/DUPLICATE_ID.*Duplicate node ID 'start'/)
    })

    it('should detect duplicate choice IDs within a node', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [
              { id: 'c1', text: 'Choice 1', target: 'end' },
              { id: 'c1', text: 'Duplicate Choice', target: 'end' },
            ],
          },
          end: { id: 'end', text: 'End', choices: [] },
        },
      }

      expect(() => loadModel(invalidModel)).toThrow(/DUPLICATE_ID.*Duplicate choice ID 'c1'/)
    })

    it('should allow same choice ID in different nodes', () => {
      const validModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [{ id: 'next', text: 'Next', target: 'mid' }],
          },
          mid: {
            id: 'mid',
            text: 'Middle',
            choices: [{ id: 'next', text: 'Next', target: 'end' }],
          },
          end: { id: 'end', text: 'End', choices: [] },
        },
      }

      expect(() => loadModel(validModel)).not.toThrow()
    })
  })

  describe('Reference Integrity Checks', () => {
    it('should detect missing startNode', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'nonexistent',
        nodes: {
          start: { id: 'start', text: 'Start', choices: [] },
        },
      }

      expect(() => loadModel(invalidModel)).toThrow(
        /MISSING_REFERENCE.*startNode 'nonexistent' does not exist/,
      )
    })

    it('should detect missing choice target', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [{ id: 'c1', text: 'Go', target: 'missing' }],
          },
        },
      }

      expect(() => loadModel(invalidModel)).toThrow(
        /MISSING_REFERENCE.*targets non-existent node 'missing'/,
      )
    })

    it('should detect missing goto effect target', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [
              {
                id: 'c1',
                text: 'Jump',
                target: 'end',
                effects: [{ type: 'goto', target: 'nonexistent' }],
              },
            ],
          },
          end: { id: 'end', text: 'End', choices: [] },
        },
      }

      expect(() => loadModel(invalidModel)).toThrow(
        /MISSING_REFERENCE.*goto effect targeting non-existent node 'nonexistent'/,
      )
    })

    it('should detect choice without target', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [{ id: 'c1', text: 'Broken', target: '' }],
          },
        },
      }

      expect(() => loadModel(invalidModel)).toThrow(/MISSING_REFERENCE.*is missing target/)
    })
  })

  describe('Circular Reference Detection', () => {
    it('should allow circular references by default (backward compatibility)', () => {
      const modelWithCircular = {
        modelType: 'adventure-playthrough',
        startNode: 'a',
        nodes: {
          a: {
            id: 'a',
            text: 'Node A',
            choices: [{ id: 'c1', text: 'To B', target: 'b' }],
          },
          b: {
            id: 'b',
            text: 'Node B',
            choices: [{ id: 'c2', text: 'Back to A', target: 'a' }],
          },
        },
      }

      // Should NOT throw by default
      expect(() => loadModel(modelWithCircular)).not.toThrow()
    })

    it('should detect simple circular reference when explicitly disabled (A -> B -> A)', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'a',
        nodes: {
          a: {
            id: 'a',
            text: 'Node A',
            choices: [{ id: 'c1', text: 'To B', target: 'b' }],
          },
          b: {
            id: 'b',
            text: 'Node B',
            choices: [{ id: 'c2', text: 'Back to A', target: 'a' }],
          },
        },
      }

      expect(() => loadModel(invalidModel, { allowCircularReferences: false })).toThrow(
        /CIRCULAR_REFERENCE.*a → b → a/,
      )
    })

    it('should detect complex circular reference when disabled (A -> B -> C -> B)', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'a',
        nodes: {
          a: {
            id: 'a',
            text: 'Node A',
            choices: [{ id: 'c1', text: 'To B', target: 'b' }],
          },
          b: {
            id: 'b',
            text: 'Node B',
            choices: [{ id: 'c2', text: 'To C', target: 'c' }],
          },
          c: {
            id: 'c',
            text: 'Node C',
            choices: [{ id: 'c3', text: 'Back to B', target: 'b' }],
          },
        },
      }

      expect(() => loadModel(invalidModel, { allowCircularReferences: false })).toThrow(
        /CIRCULAR_REFERENCE.*b → c → b/,
      )
    })

    it('should detect self-referencing node when disabled', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [{ id: 'c1', text: 'Loop', target: 'start' }],
          },
        },
      }

      expect(() => loadModel(invalidModel, { allowCircularReferences: false })).toThrow(
        /CIRCULAR_REFERENCE.*start → start/,
      )
    })

    it('should detect circular reference via goto effect when disabled', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'a',
        nodes: {
          a: {
            id: 'a',
            text: 'Node A',
            choices: [
              {
                id: 'c1',
                text: 'To B',
                target: 'b',
                effects: [{ type: 'goto', target: 'b' }],
              },
            ],
          },
          b: {
            id: 'b',
            text: 'Node B',
            choices: [
              {
                id: 'c2',
                text: 'Jump to A',
                target: 'end',
                effects: [{ type: 'goto', target: 'a' }],
              },
            ],
          },
          end: { id: 'end', text: 'End', choices: [] },
        },
      }

      expect(() => loadModel(invalidModel, { allowCircularReferences: false })).toThrow(
        /CIRCULAR_REFERENCE/,
      )
    })

    it('should allow valid branching without circular references', () => {
      const validModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [
              { id: 'c1', text: 'Path A', target: 'a' },
              { id: 'c2', text: 'Path B', target: 'b' },
            ],
          },
          a: {
            id: 'a',
            text: 'Path A',
            choices: [{ id: 'c3', text: 'End', target: 'end' }],
          },
          b: {
            id: 'b',
            text: 'Path B',
            choices: [{ id: 'c4', text: 'End', target: 'end' }],
          },
          end: { id: 'end', text: 'End', choices: [] },
        },
      }

      expect(() => loadModel(validModel)).not.toThrow()
    })

    it('should allow convergent paths (diamond pattern)', () => {
      const validModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [
              { id: 'c1', text: 'Left', target: 'left' },
              { id: 'c2', text: 'Right', target: 'right' },
            ],
          },
          left: {
            id: 'left',
            text: 'Left Path',
            choices: [{ id: 'c3', text: 'Converge', target: 'merge' }],
          },
          right: {
            id: 'right',
            text: 'Right Path',
            choices: [{ id: 'c4', text: 'Converge', target: 'merge' }],
          },
          merge: {
            id: 'merge',
            text: 'Merged',
            choices: [{ id: 'c5', text: 'End', target: 'end' }],
          },
          end: { id: 'end', text: 'End', choices: [] },
        },
      }

      expect(() => loadModel(validModel)).not.toThrow()
    })
  })

  describe('Error Message Quality', () => {
    it('should provide detailed error with node and choice IDs', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [{ id: 'broken_choice', text: 'Go', target: 'missing_node' }],
          },
        },
      }

      try {
        loadModel(invalidModel)
        expect.fail('Should have thrown an error')
      } catch (error) {
        const message = (error as Error).message
        expect(message).toContain('broken_choice')
        expect(message).toContain('missing_node')
        expect(message).toContain('node: start')
        expect(message).toContain('choice: broken_choice')
      }
    })

    it('should report multiple errors at once', () => {
      const invalidModel = {
        modelType: 'adventure-playthrough',
        startNode: 'nonexistent',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [
              { id: 'c1', text: 'Missing', target: 'missing1' },
              { id: 'c2', text: 'Also Missing', target: 'missing2' },
            ],
          },
        },
      }

      try {
        loadModel(invalidModel)
        expect.fail('Should have thrown an error')
      } catch (error) {
        const message = (error as Error).message
        expect(message).toContain('nonexistent')
        expect(message).toContain('missing1')
        expect(message).toContain('missing2')
      }
    })
  })

  describe('Knowledge Rule Schema and Integrity', () => {
    it('accepts the approved reusable rule and condition shape', () => {
      expect(() => loadModel(createValidKnowledgeModel())).not.toThrow()
    })

    it('rejects a malformed knowledgeRule condition shape', () => {
      const model = createValidKnowledgeModel()
      model.nodes.start.choices[0].conditions[0].result = 'ignored'

      expect(() => loadModel(model)).toThrow(/Model validation failed/)
    })

    it('rejects a knowledge rule with empty expectations', () => {
      const model = createValidKnowledgeModel()
      model.knowledgeRules.receipt_rule.expectations = {}

      expect(() => loadModel(model)).toThrow(/Model validation failed/)
    })

    it('rejects a condition that references a missing knowledge rule', () => {
      const model = createValidKnowledgeModel()
      model.nodes.start.choices[0].conditions[0].rule = 'missing_rule'

      expect(() => loadModel(model)).toThrow(
        /MISSING_REFERENCE: knowledgeRule condition.*choice 'follow'.*missing_rule/,
      )
    })

    it('does not accept an inherited object key as a knowledge rule reference', () => {
      const model = createValidKnowledgeModel()
      model.nodes.start.choices[0].conditions[0].rule = 'toString'

      expect(() => loadModel(model)).toThrow(
        /MISSING_REFERENCE: knowledgeRule condition.*choice 'follow'.*toString/,
      )
    })

    it('rejects a knowledge rule that references a missing character', () => {
      const model = createValidKnowledgeModel()
      model.knowledgeRules.receipt_rule.character = 'missing_character'

      expect(() => loadModel(model)).toThrow(
        /MISSING_REFERENCE: knowledge rule 'receipt_rule'.*character 'missing_character'/,
      )
    })

    it('rejects a knowledge rule that references a missing entity', () => {
      const model = createValidKnowledgeModel()
      model.knowledgeRules.receipt_rule.entity = 'missing_entity'

      expect(() => loadModel(model)).toThrow(
        /MISSING_REFERENCE: knowledge rule 'receipt_rule'.*entity 'missing_entity'/,
      )
    })

    it('does not accept inherited object keys as character or entity references', () => {
      const model = createValidKnowledgeModel()
      model.knowledgeRules.receipt_rule.character = 'constructor'
      model.knowledgeRules.receipt_rule.entity = 'toString'

      expect(() => loadModel(model)).toThrow(
        /MISSING_REFERENCE: knowledge rule 'receipt_rule'.*character 'constructor'[\s\S]*entity 'toString'/,
      )
    })

    it('finds a missing rule inside nested not/or/and conditions', () => {
      const model = createValidKnowledgeModel()
      model.nodes.start.choices[0].conditions = [
        {
          type: 'not',
          condition: {
            type: 'or',
            conditions: [
              { type: 'flag', key: 'skip', value: true },
              {
                type: 'and',
                conditions: [
                  {
                    type: 'knowledgeRule',
                    rule: 'deep_missing_rule',
                    result: 'noticed',
                  },
                ],
              },
            ],
          },
        },
      ]

      expect(() => loadModel(model)).toThrow(
        /MISSING_REFERENCE: knowledgeRule condition.*choice 'follow'.*deep_missing_rule/,
      )
    })

    it('validates nested knowledge-rule references in conversation templates', () => {
      const model = createValidKnowledgeModel()
      model.conversationTemplates = [
        {
          id: 'knowledge_template',
          trigger: {
            sessionConditions: [
              {
                type: 'and',
                conditions: [
                  {
                    type: 'knowledgeRule',
                    rule: 'template_missing_rule',
                    result: 'noticed',
                  },
                ],
              },
            ],
          },
          text: 'Template',
        },
      ]

      expect(() => loadModel(model)).toThrow(
        /MISSING_REFERENCE: knowledgeRule condition.*conversation template 'knowledge_template'.*template_missing_rule/,
      )
    })
  })

  describe('Backward Compatibility', () => {
    it('should still validate basic models correctly', () => {
      const basicModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [{ id: 'c1', text: 'Next', target: 'end' }],
          },
          end: { id: 'end', text: 'End', choices: [] },
        },
      }

      expect(() => loadModel(basicModel)).not.toThrow()
    })

    it('should handle models with no choices', () => {
      const noChoicesModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: { id: 'start', text: 'The End', choices: [] },
        },
      }

      expect(() => loadModel(noChoicesModel)).not.toThrow()
    })

    it('should handle models with effects but no goto', () => {
      const effectsModel = {
        modelType: 'adventure-playthrough',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            text: 'Start',
            choices: [
              {
                id: 'c1',
                text: 'Get gold',
                target: 'end',
                effects: [
                  { type: 'setFlag', key: 'hasGold', value: true },
                  { type: 'addResource', key: 'gold', delta: 10 },
                ],
              },
            ],
          },
          end: { id: 'end', text: 'End', choices: [] },
        },
      }

      expect(() => loadModel(effectsModel)).not.toThrow()
    })
  })
})
