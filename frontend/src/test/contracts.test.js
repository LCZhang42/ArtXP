import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const contractsDir = path.resolve(currentDir, '../../../docs/contracts');

function readContract(filename) {
  return JSON.parse(
    fs.readFileSync(path.join(contractsDir, filename), 'utf8'),
  );
}

describe('AI output contracts', () => {
  it.each([
    'art-analysis.schema.json',
    'personalized-exercise.schema.json',
  ])('compiles %s as a strict Draft 2020-12 schema', filename => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    expect(() => ajv.compile(readContract(filename))).not.toThrow();
  });

  it('rejects unspecified fields in personalized exercises', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    const validate = ajv.compile(
      readContract('personalized-exercise.schema.json'),
    );

    const valid = validate({
      schemaVersion: '1.0.0',
      exerciseId: 'exercise-1',
      analysisId: 'analysis-1',
      title: 'Value grouping study',
      rationale: 'Clarify the primary light and shadow groups.',
      skill: 'lighting',
      criterionId: 'lighting.value_grouping',
      durationMinutes: 20,
      difficulty: 'beginner',
      materials: ['Pencil', 'Paper'],
      steps: [
        { order: 1, instruction: 'Reduce the subject to two values.', minutes: 20 },
      ],
      successCriteria: ['The light and shadow families remain distinct.'],
      commonFailureModes: [],
      rubric: [
        { criterionId: 'light', label: 'Light group', description: 'Lights read as one family.', weight: 0.34 },
        { criterionId: 'shadow', label: 'Shadow group', description: 'Shadows read as one family.', weight: 0.33 },
        { criterionId: 'edge', label: 'Boundary', description: 'The boundary supports the form.', weight: 0.33 }
      ],
      variants: {
        easier: 'Use a sphere as the subject.',
        harder: 'Use a portrait with cast shadows.'
      },
      citations: [
        { citationId: 'chunk-1', supportedClaim: 'Group values before rendering detail.' }
      ],
      warnings: [],
      inventedField: true
    });

    expect(valid).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'additionalProperties' }),
      ]),
    );
  });
});
