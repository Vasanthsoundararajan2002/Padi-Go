export const languages = [
  { id: 'ta-Latn', label: 'Thanglish' },
  { id: 'en', label: 'English' },
  { id: 'ta', label: 'தமிழ்' },
];

export function getText(value, lang = 'ta-Latn') {
  if (typeof value === 'string') return value;
  return value?.[lang] ?? value?.['ta-Latn'] ?? value?.en ?? '';
}

export const subjects = [
  { id: 'tamil', color: '#ecb764', name: { 'ta-Latn': 'Tamil', en: 'Tamil', ta: 'தமிழ்' } },
  { id: 'english', color: '#a9b9ee', name: { 'ta-Latn': 'English', en: 'English', ta: 'ஆங்கிலம்' } },
  { id: 'maths', color: '#ed9687', name: { 'ta-Latn': 'Kanakku', en: 'Maths', ta: 'கணிதம்' } },
  { id: 'science', color: '#9bcdb5', name: { 'ta-Latn': 'Ariviyal', en: 'Science', ta: 'அறிவியல்' } },
  { id: 'social', color: '#91bdd1', name: { 'ta-Latn': 'Samuga ariviyal', en: 'Social Science', ta: 'சமூக அறிவியல்' } },
];

const topicId = 'maths.algebra.linear-equations';

export const topics = [{
  id: topicId,
  subjectId: 'maths',
  name: { 'ta-Latn': 'Neriyal samanpaadugal', en: 'Linear equations', ta: 'நேரியல் சமன்பாடுகள்' },
  lesson: {
    prompt: { 'ta-Latn': '2x + 4 = 10. x enna?', en: '2x + 4 = 10. What is x?', ta: '2x + 4 = 10. x என்ன?' },
    steps: [
      { 'ta-Latn': 'Rendu pakkamum 4-ai kazhikkalaam: 2x = 6.', en: 'Subtract 4 from both sides: 2x = 6.', ta: 'இரு பக்கமும் 4-ஐக் கழிக்கலாம்: 2x = 6.' },
      { 'ta-Latn': 'Rendu pakkamum 2-aal vagukkalaam: x = 3.', en: 'Divide both sides by 2: x = 3.', ta: 'இரு பக்கமும் 2-ஆல் வகுக்கலாம்: x = 3.' },
      { 'ta-Latn': 'Check pannalaam: 2 × 3 + 4 = 10. Sari!', en: 'Check: 2 × 3 + 4 = 10. It works!', ta: 'சரிபார்: 2 × 3 + 4 = 10. சரி!' },
    ],
  },
}];

const localized = (thanglish, english, tamil) => ({ 'ta-Latn': thanglish, en: english, ta: tamil });
const choice = (id, label) => ({ id, label: localized(label, label, label) });

export const questions = [
  {
    id: `${topicId}.q01`, subjectId: 'maths', topicId,
    prompt: localized('2x + 4 = 10. x enna?', '2x + 4 = 10. What is x?', '2x + 4 = 10. x என்ன?'),
    choices: [choice('a', '2'), choice('b', '3'), choice('c', '7')], correctChoiceId: 'b',
    hint: localized('Mudhalil 4-ai kazhi.', 'Subtract 4 first.', 'முதலில் 4-ஐக் கழி.'),
    explanation: localized('x = 3; substitute panni check sei.', 'x = 3; substitute it to check.', 'x = 3; பதிலிட்டுச் சரிபார்.'),
  },
  {
    id: `${topicId}.q02`, subjectId: 'maths', topicId,
    prompt: localized('x + 5 = 9. x enna?', 'x + 5 = 9. What is x?', 'x + 5 = 9. x என்ன?'),
    choices: [choice('a', '4'), choice('b', '5'), choice('c', '14')], correctChoiceId: 'a',
    hint: localized('Rendu pakkamum 5-ai kazhi.', 'Subtract 5 from both sides.', 'இரு பக்கமும் 5-ஐக் கழி.'),
    explanation: localized('9 − 5 = 4, adhanaal x = 4.', '9 − 5 = 4, so x = 4.', '9 − 5 = 4, ஆகவே x = 4.'),
  },
  {
    id: `${topicId}.q03`, subjectId: 'maths', topicId,
    prompt: localized('3x = 18. x enna?', '3x = 18. What is x?', '3x = 18. x என்ன?'),
    choices: [choice('a', '3'), choice('b', '5'), choice('c', '6')], correctChoiceId: 'c',
    hint: localized('18-ai 3-aal vagu.', 'Divide 18 by 3.', '18-ஐ 3-ஆல் வகு.'),
    explanation: localized('18 ÷ 3 = 6, adhanaal x = 6.', '18 ÷ 3 = 6, so x = 6.', '18 ÷ 3 = 6, ஆகவே x = 6.'),
  },
  {
    id: `${topicId}.q04`, subjectId: 'maths', topicId,
    prompt: localized('4x − 8 = 12. x enna?', '4x − 8 = 12. What is x?', '4x − 8 = 12. x என்ன?'),
    choices: [choice('a', '4'), choice('b', '5'), choice('c', '8')], correctChoiceId: 'b',
    hint: localized('Mudhalil 8-ai serthu, appuram 4-aal vagu.', 'Add 8 first, then divide by 4.', 'முதலில் 8-ஐக் கூட்டி, பிறகு 4-ஆல் வகு.'),
    explanation: localized('4x = 20; adhanaal x = 5.', '4x = 20, so x = 5.', '4x = 20; ஆகவே x = 5.'),
  },
  {
    id: `${topicId}.q05`, subjectId: 'maths', topicId,
    prompt: localized('2x + 1 = 11. x enna?', '2x + 1 = 11. What is x?', '2x + 1 = 11. x என்ன?'),
    choices: [choice('a', '5'), choice('b', '6'), choice('c', '10')], correctChoiceId: 'a',
    hint: localized('Mudhalil 1-ai kazhi, appuram 2-aal vagu.', 'Subtract 1 first, then divide by 2.', 'முதலில் 1-ஐக் கழித்து, பிறகு 2-ஆல் வகு.'),
    explanation: localized('2x = 10; adhanaal x = 5.', '2x = 10, so x = 5.', '2x = 10; ஆகவே x = 5.'),
  },
];

export const mockTests = [{
  id: 'maths.sample-01',
  subjectId: 'maths',
  title: localized('Kanakku sample test 01', 'Maths sample test 01', 'கணித மாதிரித் தேர்வு 01'),
  durationMinutes: 5,
  questionIds: questions.map(({ id }) => id),
}];
