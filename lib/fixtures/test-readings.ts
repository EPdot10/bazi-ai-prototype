const melbourne = {
  label: 'Melbourne, Victoria, Australia',
  latitude: -37.8136,
  longitude: 144.9631,
  ianaTimeZone: 'Australia/Melbourne',
};

const sharedAreas = {
  career: {
    headline: 'Work grows through visible responsibility',
    narrative:
      'You tend to gain momentum when a loose problem needs structure. Early progress may feel slower than the effort invested, but consistency makes other people trust your judgement. The important career shift is learning to distinguish meaningful responsibility from work that merely consumes attention.',
    signals: [
      'You are often most useful when the brief is incomplete.',
      'Repeated delivery matters more than loud self-promotion.',
      'A practical speciality can become a source of independence.',
      'Clear limits prevent reliability from becoming overwork.',
    ],
    guidance: 'Choose work where sound judgement is recognised, not merely used.',
    basis: 'Saved test fixture for career layout and locked-content QA.',
    confidence: 'medium',
  },
  relationships: {
    headline: 'Trust is built through consistency',
    narrative:
      'You may take time to feel safe with someone, then show care through attention, memory, and practical follow-through. When disappointed, you are more likely to become self-sufficient than to ask directly for reassurance. That protects dignity, but can create distance at the exact moment a clearer conversation would help.',
    signals: [
      'Reliability carries more weight than dramatic promises.',
      'You notice small changes in another person’s effort.',
      'Space is useful, but silence can become ambiguous.',
      'Mutual respect makes emotional openness easier.',
    ],
    guidance: 'Say what support looks like before distance becomes the message.',
    basis: 'Saved test fixture for Jade Pass and relationship-panel QA.',
    confidence: 'medium',
  },
  timing: {
    headline: 'A phase of selective expansion',
    narrative:
      'The current rhythm favours fewer, better commitments. Opportunities may appear through people or projects already near you rather than through a dramatic reinvention. Momentum improves when unfinished obligations are closed before a new direction is made public.',
    signals: [
      'Consolidation creates room for the next move.',
      'A recurring conversation may finally require a decision.',
      'Smaller experiments reveal more than one irreversible leap.',
      'Protect attention during periods of competing invitations.',
    ],
    guidance: 'Use timing as a prompt to prepare options, not as a promise.',
    basis: 'Saved test fixture for timing-panel and responsive-layout QA.',
    confidence: 'low',
  },
};

const fixtures = {
  '1000-01-01': {
    resolvedPlace: melbourne,
    chart: {
      pillars: { year: '己亥', month: '丙子', day: '乙巳', hour: '壬午' },
      dayMaster: '乙',
      elementBalance: { wood: 1, fire: 2, earth: 1, metal: 0, water: 2 },
      birthTimeConfidence: 'exact',
      calculationNotes: [
        'This is a saved interface-test chart; it is not recalculated.',
        'No geocoding service or language-model request was used.',
      ],
      timeAdjustment: {
        minutes: 18,
        adjustedLocalTime: '12:18',
        method: 'longitude-and-equation-of-time',
      },
    },
    interpretation: {
      summary:
        'You combine a flexible outer manner with a surprisingly firm internal standard. Your strongest progress tends to follow periods when you stop adapting to every demand and choose one direction deliberately.',
      pastOverview: {
        characterSentence:
          'You read the atmosphere quickly, but prefer to make important choices on your own terms.',
        trajectorySentence:
          'Your path alternates between accommodating others and making a clean break toward greater independence.',
      },
      pastPatterns: [
        {
          period: 'Around ages 7–9',
          headline: 'A change in the familiar environment',
          narrative:
            'A shift involving school, home, or a close friendship may have disturbed a previously predictable routine. Even if the event looked ordinary to adults, it may have made you more alert to changing moods and expectations.',
          possibilities: [
            'A move, classroom change, or friendship separation altered daily life.',
            'You learned to observe first and react later.',
          ],
          principle: '亥–巳 tension is used here as the saved fixture’s movement signal.',
          basis: 'Static fixture signal A1.',
          confidence: 'medium',
        },
        {
          period: 'Around ages 15–17',
          headline: 'Identity became harder to negotiate',
          narrative:
            'Expectations from family, study, or peers may have conflicted with the person you were becoming. This period is framed as a test of belonging: keeping connection without letting other people define every choice.',
          possibilities: [
            'A study decision or disagreement sharpened your independence.',
            'One friendship became especially influential or ended abruptly.',
          ],
          principle: 'Water and fire are presented as competing pressures in this fixture.',
          basis: 'Static fixture signal A2.',
          confidence: 'medium',
        },
        {
          period: 'Around ages 22–24',
          headline: 'Responsibility arrived before certainty',
          narrative:
            'You may have taken on work, study, financial, or family responsibility before feeling fully prepared. The lasting effect was a stronger belief that competence is built through action rather than waiting for complete confidence.',
          possibilities: [
            'A role demanded faster maturity than expected.',
            'A practical decision narrowed several possible paths into one.',
          ],
          principle: 'The saved pattern treats resource pressure as a maturity marker.',
          basis: 'Static fixture signal A3.',
          confidence: 'medium',
        },
      ],
      insights: [
        {
          title: 'Flexible presentation, firm centre',
          interpretation:
            'The interface fixture presents 乙 wood as adaptive without equating adaptability with indecision.',
          basis: 'Saved Day Master 乙.',
          confidence: 'high',
        },
      ],
      lifeAreas: {
        character: {
          headline: 'Sensitivity becomes discernment',
          narrative:
            'You may notice context, tone, and unspoken expectations earlier than most people around you. That sensitivity is useful when it becomes discernment rather than automatic accommodation. You work best when there is enough freedom to adjust the route without losing sight of the destination.',
          signals: [
            'You notice subtle shifts before they are openly discussed.',
            'You can adapt quickly without abandoning the larger goal.',
            'Ambiguous expectations can consume unnecessary attention.',
            'A private standard often guides apparently flexible choices.',
          ],
          guidance: 'Let sensitivity inform the decision without making it for you.',
          basis: 'Saved fixture character copy for visual QA.',
          confidence: 'medium',
        },
        ...sharedAreas,
      },
      reflectionQuestions: [
        'Where are you adapting from wisdom, and where from habit?',
        'Which unfinished obligation is occupying the most attention?',
      ],
      limitations:
        'TEST FIXTURE: this result is stored in the codebase for interface testing and must not be treated as a real BaZi calculation or prediction.',
    },
    interpretationSource: 'fixture',
    modelNotice:
      'Saved test fixture 1000-01-01. No external place lookup or AI request was made.',
  },
  '1000-01-02': {
    resolvedPlace: melbourne,
    chart: {
      pillars: { year: '己亥', month: '丙子', day: '丙午' },
      dayMaster: '丙',
      elementBalance: { wood: 0, fire: 2, earth: 1, metal: 0, water: 2 },
      birthTimeConfidence: 'unknown',
      calculationNotes: [
        'This is the alternate saved interface-test chart.',
        'Its missing hour is intentional for unknown-time state testing.',
        'No geocoding service or language-model request was used.',
      ],
    },
    interpretation: {
      summary:
        'You can appear direct and energetic while privately carrying more uncertainty than others notice. Your strongest turning points tend to occur when enthusiasm is given a practical structure instead of being spread across too many possibilities.',
      pastOverview: {
        characterSentence:
          'You bring visible energy to a situation, yet protect the more uncertain parts of your thinking.',
        trajectorySentence:
          'Your rhythm shows bursts of decisive movement followed by quieter phases of reassessment and rebuilding.',
      },
      pastPatterns: [
        {
          period: 'Around ages 9–11',
          headline: 'Visibility brought new expectations',
          narrative:
            'A talent, result, or strong opinion may have made you more visible within school or family life. Praise and pressure may have arrived together, creating an early link between being capable and being expected to carry more.',
          possibilities: [
            'A teacher or family member placed unusual confidence in you.',
            'Recognition also increased the fear of disappointing people.',
          ],
          principle: 'The saved 午 fire pattern is used as a visibility signal.',
          basis: 'Static fixture signal B1.',
          confidence: 'medium',
        },
        {
          period: 'Around ages 18–20',
          headline: 'A fast decision changed the direction',
          narrative:
            'A decision around study, work, location, or a close relationship may have been made under time pressure. It may not have been perfect, but it revealed what you valued when keeping every option was no longer possible.',
          possibilities: [
            'A move or new environment expanded the social world.',
            'One plan was abandoned so another could become real.',
          ],
          principle: '子–午 opposition is the fixture’s shorthand for redirection.',
          basis: 'Static fixture signal B2.',
          confidence: 'medium',
        },
        {
          period: 'Around ages 25–27',
          headline: 'Energy needed a narrower target',
          narrative:
            'Several attractive possibilities may have competed at once, producing activity without the expected sense of progress. This period becomes more productive when a single skill, project, or relationship receives sustained attention.',
          possibilities: [
            'A promising project demanded more patience than expected.',
            'Reducing commitments created more momentum, not less.',
          ],
          principle: 'The fixture reads repeated fire as intensity needing containment.',
          basis: 'Static fixture signal B3.',
          confidence: 'low',
        },
      ],
      insights: [
        {
          title: 'Energy needs a direction',
          interpretation:
            'The alternate fixture uses 丙 fire to test a more outward, active reading voice.',
          basis: 'Saved Day Master 丙.',
          confidence: 'high',
        },
      ],
      lifeAreas: {
        character: {
          headline: 'Warmth with a private pressure system',
          narrative:
            'You may naturally animate a group, idea, or project, especially when the purpose feels immediate. Others can mistake visible confidence for endless capacity. The deeper skill is pacing: deciding which responsibilities deserve your energy and allowing uncertainty to exist without hiding it behind more activity.',
          signals: [
            'You create momentum when a group becomes hesitant.',
            'Visible confidence can conceal private overthinking.',
            'Meaningful work restores energy more than simple busyness.',
            'Rest works best before exhaustion makes the decision.',
          ],
          guidance: 'Direct your energy before other people assign it for you.',
          basis: 'Saved alternate character copy for visual QA.',
          confidence: 'medium',
        },
        ...sharedAreas,
      },
      reflectionQuestions: [
        'Which commitment deserves sustained energy rather than another new start?',
        'Where would admitting uncertainty create a better decision?',
      ],
      limitations:
        'TEST FIXTURE: this result is stored in the codebase for interface testing and must not be treated as a real BaZi calculation or prediction.',
    },
    interpretationSource: 'fixture',
    modelNotice:
      'Saved test fixture 1000-01-02. No external place lookup or AI request was made.',
  },
} as const;

export const TEST_READING_DATES = new Set(Object.keys(fixtures));

export function getTestReading(birthDate: string) {
  return fixtures[birthDate as keyof typeof fixtures] ?? null;
}
