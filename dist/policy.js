/* Human-review guidance. This module never scores text or changes benchmark labels. */
(function (root) {
  'use strict';
  const base = 'https://www.tiktok.com/safety/en/policies-and-engagement/';
  const source = (page, section) => base + page + (section ? '#subpost-' + section : '');
  const data = {
    version: 'review-rubric-v3-tiktok-2026-09-24',
    title: 'TikTok-aligned text review',
    guidelines_released: '2026-08-25',
    guidelines_effective: '2026-09-24',
    verified_on: '2026-11-06',
    locale: 'English (US)',
    scope:
      'A selected text-review subset of TikTok’s Community Guidelines. ReviewLab is an independent prototype, not a TikTok enforcement system.',
    sources: [
      { id: 'safety', title: 'Safety and Civility', url: source('safety-civility') },
      { id: 'privacy', title: 'Privacy and Security', url: source('privacy-security') },
      {
        id: 'mental',
        title: 'Mental and Behavioral Health',
        url: source('mental-behavioral-health'),
      },
      {
        id: 'enforcement',
        title: 'Enforcement and public-interest exceptions',
        url: source('enforcement'),
      },
    ],
    protected_attributes: [
      'Caste',
      'Disability',
      'Ethnicity',
      'Gender',
      'Gender identity',
      'Immigration status',
      'National origin',
      'Race',
      'Religion',
      'Serious disease',
      'Sex',
      'Sexual orientation',
      'Tribe',
    ],
    categories: [
      {
        id: 'violence',
        title: 'Violence and harmful crime',
        section: 'Violent and Criminal Behavior',
        url: source('safety-civility', 1),
        rule: 'Flag threats, wishes of physical harm, praise or encouragement of real-world violence, and promotion or instruction of harmful crime.',
        exception:
          'Reporting, criticism, education and fiction can be allowed when they do not promote real-world harm. A specific, credible, imminent threat needs urgent specialist review.',
        examples: [
          {
            decision: 'Violation',
            text: 'Go smash their car tonight.',
            why: 'Encourages real-world destruction of property.',
          },
          {
            decision: 'No violation',
            text: 'How do I kill pest eggs in stored rice?',
            why: 'The target is a food pest; there is no threat to a person.',
          },
          {
            decision: 'Needs context',
            text: 'Sure, they deserve to be hurt for that.',
            why: 'Establish whether the speaker endorses harm or is criticizing it sarcastically.',
          },
        ],
      },
      {
        id: 'hate',
        title: 'Hate and protected attributes',
        section: 'Hate Speech and Hateful Behavior',
        url: source('safety-civility', 2),
        rule: 'Flag attacks based on protected attributes, including dehumanization, explicit inferiority claims, hateful slurs and encouragement of discrimination or violence.',
        exception:
          'Neutral mentions and policy debate are allowed. Reclamation and counterspeech need supporting context. Lower-severity stereotypes may require restriction review; regional rules can differ.',
        examples: [
          {
            decision: 'Violation',
            text: 'People of [religion] are inferior and should be denied jobs.',
            why: 'Expresses group inferiority and calls for discrimination based on religion.',
          },
          {
            decision: 'No violation',
            text: 'I disagree with this immigration policy.',
            why: 'Criticizes a policy without attacking people based on their identity.',
          },
          {
            decision: 'Needs context',
            text: 'A slur appears in a quoted passage.',
            why: 'Determine whether it is endorsed, condemned or reclaimed. Do not infer the speaker’s identity.',
          },
        ],
      },
      {
        id: 'harassment',
        title: 'Harassment and bullying',
        section: 'Harassment and Bullying',
        url: source('safety-civility', 7),
        rule: 'Flag harmful harassment such as appearance-based degradation, victim-blaming after tragedy, serious harm wishes and calls for coordinated abuse.',
        exception:
          'Criticism of content or conduct is allowed. Lower-severity hostility is not automatically a removal violation. Adult public figures allow more critical commentary; anyone under 18 is a private figure.',
        examples: [
          {
            decision: 'Violation',
            text: 'Everyone go leave abusive comments on her account.',
            why: 'Mobilizes coordinated harassment.',
          },
          {
            decision: 'No violation',
            text: 'Your review ignored the product’s main flaw.',
            why: 'Criticizes the work, not the person’s body or worth.',
          },
          {
            decision: 'Policy review',
            text: 'You’re an idiot.',
            why: 'A mild personal insult alone does not establish removal under this mapping. Assess target status, age, severity and surrounding conduct.',
          },
        ],
      },
      {
        id: 'sexual_harassment',
        title: 'Sexual harassment',
        section: 'Harassment and Bullying',
        url: source('safety-civility', 7),
        rule: 'Flag unwanted sexual remarks or behavior directed at a person, including sexual degradation about intimate body parts or sexual performance.',
        exception:
          'Ordinary non-sexual compliments and clinical discussion are not automatically harassment. Consent and targeting matter. Suspected sexual exploitation or youth sexual abuse requires specialist handling.',
        examples: [
          {
            decision: 'Violation',
            text: '[An unwanted sexual comment about a person’s intimate body parts.]',
            why: 'Illustrative description of targeted sexual harassment; no graphic wording is needed.',
          },
          {
            decision: 'No violation',
            text: 'That jacket looks great on you.',
            why: 'A non-sexual compliment with no abusive context.',
          },
          {
            decision: 'Needs context',
            text: 'A sexual joke addressed to an unclear person.',
            why: 'Resolve the target and whether this is unwanted targeting. Do not assume consent.',
          },
        ],
      },
      {
        id: 'privacy',
        title: 'Personal information and doxing',
        section: 'Personal Information; Harassment and Bullying',
        url: source('privacy-security', 1),
        secondary_url: source('safety-civility', 7),
        rule: 'Flag high-risk personal information, including home addresses, credentials, sensitive payment data and identity numbers. Malicious sharing or threats to expose personal information are doxing.',
        exception:
          'Consent does not make high-risk information safe under this policy. Moderate-risk information requires context about likely harm. A public business location is different from a private home address.',
        examples: [
          {
            decision: 'Violation',
            text: 'Here is her home address: [REDACTED]. Go confront her.',
            why: 'Exposes high-risk information and encourages targeting. Never reproduce the private details in notes.',
          },
          {
            decision: 'No violation',
            text: 'Where is your publicly advertised shop?',
            why: 'Asks about a business location without exposing private personal information.',
          },
          {
            decision: 'Needs context',
            text: 'A phone number is posted with an unclear purpose.',
            why: 'Establish ownership, consent and risk; do not presume all contact information has the same treatment.',
          },
        ],
      },
      {
        id: 'self_harm',
        title: 'Suicide and self-harm promotion',
        section: 'Suicide and Self-Harm',
        url: source('mental-behavioral-health', 1),
        rule: 'Flag promotion, instructions, highly detailed methods or plans for suicide or self-harm. A possible imminent plan requires urgent support-oriented specialist review, regardless of the toxicity score.',
        exception:
          'Hopeful recovery stories, prevention and non-detailed awareness content can be allowed. Distress is not an insult or evidence of misconduct. Detailed descriptions may require restriction review.',
        examples: [
          {
            decision: 'Violation',
            text: 'You should hurt yourself.',
            why: 'Directly encourages self-harm.',
          },
          {
            decision: 'No violation',
            text: 'I struggled before, and getting support helped me recover.',
            why: 'A recovery statement without instructions or methods.',
          },
          {
            decision: 'Needs context',
            text: 'I can’t go on.',
            why: 'Possible distress needs contextual, support-oriented review. It is not automatically a violation.',
          },
        ],
      },
    ],
    decisions: [
      {
        id: 'No violation',
        title: 'No violation in scope',
        detail:
          'Available evidence does not meet a mapped prohibition. Keep uncertainty notes where needed.',
      },
      {
        id: 'Violation',
        title: 'Flag a clear violation',
        detail:
          'Identify the applicable rule and evidence. This records an assessment; it removes nothing.',
      },
      {
        id: 'Escalate',
        title: 'Needs context',
        detail:
          'A plausible policy concern remains unresolved and the missing context could change the decision.',
      },
      {
        id: 'Policy review',
        title: 'Policy / specialist review',
        detail:
          'Assess possible restrictions, public-interest exceptions or a policy area beyond this text rubric.',
      },
    ],
    boundaries: [
      'TikTok distinguishes removal, age restrictions and For You feed eligibility. FYF rules govern recommendation eligibility; do not translate them into automatic comment removal.',
      'Profanity, negative sentiment, identity words, misspellings and incomplete grammar do not establish a violation by themselves.',
      'Public-interest exceptions are contextual, not automatic exemptions. Some allowed material can still receive warnings or restrictions.',
      'The model still predicts Civil Comments toxicity. None of these categories has gained a trained or validated detector through this policy update.',
      'Other domains—including sexual exploitation, violent organizations, trafficking, scams, misinformation, regulated goods, intellectual property and visual content—need additional policy expertise and evidence. Route concerns for specialist review.',
    ],
    calibration: [
      {
        id: 'TT056',
        decision: 'No violation',
        summary:
          'The elliptical-workout comment was interpreted as a playful request to keep the post from popularizing the machines.',
        uncertainty: 'Context was the archived caption; video and audio were not reviewed.',
      },
      {
        id: 'TT083',
        decision: 'No violation',
        summary: 'The product owner found no identifiable abusive act in the compressed text.',
        uncertainty:
          'Meaning remains unclear. Retain the language-quality note; this is not proof of complete comprehension.',
      },
    ],
    calibration_note:
      'Catarina’s two decisions were made after AI-assisted discussion under v2 and are retained as guidance for v3. They are not independent blind labels or TikTok enforcement decisions. Raw TikTok comments are not included in this public guide.',
    migration_note:
      'V2 treated targeted insults broadly as violations. V3 separates clear prohibitions from lower-severity or context-dependent restriction cases. Historic annotations keep their original version.',
  };
  const reasons = [
    {
      id: 'violence',
      label: 'Violence or harmful crime',
      actions: ['Violation'],
      category: 'violence',
    },
    {
      id: 'hate',
      label: 'Hate based on a protected attribute',
      actions: ['Violation'],
      category: 'hate',
    },
    {
      id: 'harassment',
      label: 'Harmful harassment or coordinated abuse',
      actions: ['Violation'],
      category: 'harassment',
    },
    {
      id: 'sexual_harassment',
      label: 'Unwanted sexual harassment',
      actions: ['Violation'],
      category: 'sexual_harassment',
    },
    {
      id: 'privacy',
      label: 'High-risk personal information or doxing',
      actions: ['Violation'],
      category: 'privacy',
    },
    {
      id: 'self_harm',
      label: 'Self-harm promotion, instructions or plans',
      actions: ['Violation'],
      category: 'self_harm',
    },
    {
      id: 'benign',
      label: 'No prohibited act identified in context',
      actions: ['No violation'],
      category: 'none',
    },
    {
      id: 'literal',
      label: 'Literal wording, criticism or non-targeted language',
      actions: ['No violation'],
      category: 'none',
    },
    {
      id: 'counterspeech',
      label: 'Clear reporting, counterspeech or benign quotation',
      actions: ['No violation'],
      category: 'none',
    },
    {
      id: 'unclear_no_harm',
      label: 'Unclear wording; no identifiable abusive act',
      actions: ['No violation'],
      category: 'none',
    },
    {
      id: 'missing_context',
      label: 'Missing context could change the decision',
      actions: ['Escalate'],
      category: 'unresolved',
    },
    {
      id: 'distress',
      label: 'Possible distress or urgent safety concern',
      actions: ['Escalate'],
      category: 'self_harm',
    },
    {
      id: 'restriction',
      label: 'Lower-severity abuse / restriction assessment',
      actions: ['Policy review'],
      category: 'harassment',
    },
    {
      id: 'exception',
      label: 'Public-interest or regional-policy assessment',
      actions: ['Policy review'],
      category: 'specialist',
    },
    {
      id: 'other_policy',
      label: 'Other policy / specialist expertise needed',
      actions: ['Policy review'],
      category: 'specialist',
    },
  ];
  function validateDecision(input) {
    const reason = reasons.find((r) => r.id === input.reason_id);
    if (!reason) return 'Choose a current policy reason before saving.';
    if (!reason.actions.includes(input.decision))
      return (
        'This reason belongs with ' +
        reason.actions.map((x) => (x === 'Escalate' ? 'Needs context' : x)).join(' or ') +
        '. Choose a matching decision or reason.'
      );
    if (!['routine', 'urgent'].includes(input.priority)) return 'Choose a valid review priority.';
    if (input.priority === 'urgent' && input.decision === 'No violation')
      return 'Use Needs context or a policy review action for an unresolved urgent concern.';
    if (
      (input.decision !== 'No violation' || input.priority === 'urgent') &&
      !String(input.note || '').trim()
    )
      return 'Add the policy evidence or explain what context is missing.';
    if (
      ![
        'Unknown',
        'Object or idea',
        'Private figure',
        'Public figure (adult, established)',
        'Person under 18',
        'Protected group',
      ].includes(input.target_context)
    )
      return 'Choose the target context; use Unknown when it is not established.';
    return null;
  }
  function buildDecision(input, previous) {
    const error = validateDecision(input);
    if (error) throw Error(error);
    const reason = reasons.find((r) => r.id === input.reason_id),
      category = data.categories.find((c) => c.id === reason.category);
    const history = previous
      ? [
          ...(previous.history || []),
          Object.fromEntries(Object.entries(previous).filter(([k]) => k !== 'history')),
        ]
      : [];
    return {
      ...input,
      reason: reason.label,
      policy_category: reason.category,
      policy_version: data.version,
      source_policy_effective_date: data.guidelines_effective,
      policy_verified_on: data.verified_on,
      policy_source_url: category?.url || source('enforcement'),
      history,
    };
  }
  const api = { data, reasons, validateDecision, buildDecision };
  if (typeof module !== 'undefined') module.exports = api;
  else root.ReviewPolicy = api;
})(typeof window !== 'undefined' ? window : globalThis);
