import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, subjects, topics } from './data.js';

test('practice data exposes five subjects and one seeded algebra topic', () => {
  assert.equal(subjects.length, 5);
  assert.equal(topics.length, 1);
  assert.equal(topics[0].id, 'maths.algebra.linear-equations');
  assert.equal(questions.length, 5);
  assert.equal(questions[0].id, 'maths.algebra.linear-equations.q01');
  assert.equal(questions[0].correctChoiceId, 'b');
});
