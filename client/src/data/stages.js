/**
 * Cold Call Stages Configuration
 *
 * Evidence-based examples and stage outcomes extracted from analysis of
 * 100 actual cold-call transcripts (T001-T100).
 */

export const STAGES = [
  {
    number: 1,
    name: 'Opening',
    purpose: 'Reach the right person and say who you are. The prospect decides in the first ten seconds whether this call is worth a minute.',
    tendsToHappen: [
      'A switchboard or an assistant answers and asks what it is about',
      'The person answers but is somewhere else: driving, in a meeting, at lunch',
      'The number belongs to somebody who left the company a year ago'
    ],
    prospectExamples: [
      '"Yes, who\'s this?"',
      '"I\'m driving, but I can speak to you. No problem."',
      '"I am not in Fairline anymore. I left last year."',
      '"Who is calling from?"'
    ],
    oneTapOutcomes: [
      { id: 'target_reached', label: 'Target reached', sentiment: 'positive' },
      { id: 'busy_driving_meeting', label: 'Busy / in meeting', sentiment: 'neutral' },
      { id: 'assistant_gatekeeper', label: 'Assistant / gatekeeper', sentiment: 'neutral' },
      { id: 'left_company_wrong_num', label: 'Left company / wrong person', sentiment: 'negative' }
    ]
  },
  {
    number: 2,
    name: 'Purpose',
    purpose: 'Say in one or two sentences why you called, in words the prospect can repeat to a colleague. A purpose they cannot repeat is a purpose they did not hear.',
    tendsToHappen: [
      'They ask what the company does, often twice, because the first answer was a label',
      'They ask where you got their number',
      'They guess it is a sales call and say so'
    ],
    prospectExamples: [
      '"What is this regarding?"',
      '"What is Meridian? What does your company do?"',
      '"Where did you get my contact from?"',
      '"Is this a sales call?"'
    ],
    oneTapOutcomes: [
      { id: 'asked_what_we_do', label: 'Asked what we do', sentiment: 'neutral' },
      { id: 'asked_where_got_number', label: 'Asked where we got number', sentiment: 'neutral' },
      { id: 'said_sales_call', label: 'Said it is a sales call', sentiment: 'negative' },
      { id: 'let_me_go_on', label: 'Let me go on', sentiment: 'positive' }
    ]
  },
  {
    number: 3,
    name: 'Permission',
    purpose: 'Find out whether they are willing to talk now. A clear yes, a clear no, or a time to call back are all good outcomes. Talking on without one is not.',
    tendsToHappen: [
      'Call me after two, call me tomorrow, send it on WhatsApp first',
      'A short yes, and then they go quiet and wait',
      'They keep talking without answering, which is not a yes'
    ],
    prospectExamples: [
      '"Ah, yes. Go ahead."',
      '"Maybe can you call after 30 minutes, because I was in a call actually."',
      '"Actually, right now I\'m in a meeting with a customer. Can I call you after?"',
      '"Will it be okay if we have this call after one hour?"'
    ],
    oneTapOutcomes: [
      { id: 'agreed_to_talk_now', label: 'Agreed to talk now', sentiment: 'positive' },
      { id: 'call_back_later', label: 'Call back later', sentiment: 'neutral' },
      { id: 'send_whatsapp_first', label: 'Send on WhatsApp / email', sentiment: 'neutral' },
      { id: 'not_willing_to_talk', label: 'Refused to speak', sentiment: 'negative' }
    ]
  },
  {
    number: 4,
    name: 'Their business',
    purpose: 'Ask about their company and their work before saying anything about yours. People talk about what they do; they rarely listen to what you do.',
    tendsToHappen: [
      'They answer in one line and wait for the pitch',
      'They correct you: they do not make that, they are not that size, that is a different division',
      'They ask you to tell them about yourself first'
    ],
    prospectExamples: [
      '"We are a manufacturing unit. We manufacture outdoor light housings."',
      '"Actually, I\'m not an exporter anymore. I\'m currently dealing in India only."',
      '"So you have an idea of what we manufacture? You have done research on us?"',
      '"Yes, we make decorative pieces and lighting products as well."'
    ],
    oneTapOutcomes: [
      { id: 'explained_business', label: 'Shared operations & scope', sentiment: 'positive' },
      { id: 'corrected_scope', label: 'Corrected my assumptions', sentiment: 'neutral' },
      { id: 'tested_research', label: 'Challenged my research', sentiment: 'neutral' },
      { id: 'guarded_one_line', label: 'Guarded 1-line answer', sentiment: 'negative' }
    ]
  },
  {
    number: 5,
    name: 'Their need, in their words',
    purpose: 'Hear what they are trying to do or struggling with, in their own words. This is the one stage where the caller writes down exactly what was said.',
    tendsToHappen: [
      'They name a goal: a new market, a new product line, a plant running below capacity',
      'They say everything is fine and there is nothing they need',
      'They turn it around and ask what you can do for a company like theirs'
    ],
    prospectExamples: [
      '"We would have a clearer idea of our products and where to push them."',
      '"Otherwise, I don\'t have any particular need to find new customers or anything."',
      '"You can talk to our distributor in Hyderabad, Orion Components."',
      '"It is better that you come to the plant, the one plant in Hyderabad, and talk to them directly."'
    ],
    oneTapOutcomes: [
      { id: 'shared_specific_need', label: 'Named specific need / goal', sentiment: 'positive' },
      { id: 'referred_to_plant_partner', label: 'Referred to plant / partner', sentiment: 'neutral' },
      { id: 'turned_around_what_can_you_do', label: 'Asked what we can do', sentiment: 'neutral' },
      { id: 'said_no_need', label: 'Said no need / all fine', sentiment: 'negative' }
    ]
  },
  {
    number: 6,
    name: 'Objection',
    purpose: 'Hear the reason for a no and understand it. A reason you understand can be answered on this call or the next; a reason you talked over cannot.',
    tendsToHappen: [
      'We already have an agency, a consultant, an in-house team',
      'Not the right person; speak to marketing, speak to the owner',
      'Send something in writing and we will see'
    ],
    prospectExamples: [
      '"Meri internal team hai, to hum log nahi karte abhi."',
      '"Because we are an MNC, we already have such consultants at a global level."',
      '"Not interested. I am not on the line manager side."',
      '"Can you send an email on this, and any of your previous case studies?"'
    ],
    oneTapOutcomes: [
      { id: 'already_have_partner', label: 'Has agency / in-house team', sentiment: 'neutral' },
      { id: 'send_in_writing', label: 'Send proposal in writing', sentiment: 'neutral' },
      { id: 'not_decision_maker', label: 'Not decision maker', sentiment: 'negative' },
      { id: 'hard_not_interested', label: 'Not interested / brush off', sentiment: 'negative' }
    ]
  },
  {
    number: 7,
    name: 'Next step',
    purpose: 'Agree one concrete thing: a document on WhatsApp or email, a call at a named time, a meeting. One thing, named, with a time or a channel.',
    tendsToHappen: [
      'A yes to receiving a document, which may be politeness rather than interest',
      'A time named by them, which is worth more than a time proposed by you',
      'A referral to a colleague, with or without a number'
    ],
    prospectExamples: [
      '"Tuesday is a good day... After 2 PM. Call us in the afternoon and we can have a working session."',
      '"The call will be a Google Meet... Right. Got it."',
      '"Yeah, send the deck over WhatsApp first."',
      '"Call our GM Mr. Sharma on Monday."'
    ],
    oneTapOutcomes: [
      { id: 'meeting_time_agreed', label: 'Meeting agreed (date & time)', sentiment: 'positive' },
      { id: 'doc_agreed_whatsapp_email', label: 'Agreed to receive doc/report', sentiment: 'positive' },
      { id: 'callback_agreed', label: 'Specific callback agreed', sentiment: 'neutral' },
      { id: 'referral_given', label: 'Referral with contact given', sentiment: 'neutral' }
    ]
  },
  {
    number: 8,
    name: 'Close',
    purpose: 'End the call clearly and record what happened: the outcome, the next step, and the prospect\'s words from stage 5. The record is what the next call is built on.',
    tendsToHappen: [
      'The call ends mid-sentence, because the line dropped or they hung up',
      'A warm goodbye after a no, which is still a no',
      'The caller logs an outcome that does not match what was said on the call'
    ],
    prospectExamples: [
      '"The call will be a Google Meet... Right. Got it. Thank you."',
      '"I will call you in an hour then. All right. Thank you."',
      '"Okay, I will share the profile on your email. Have a great day."',
      '"Thank you for your time. Goodbye."'
    ],
    oneTapOutcomes: [
      { id: 'confirmed_and_closed', label: 'Confirmed next step & closed', sentiment: 'positive' },
      { id: 'polite_goodbye_after_no', label: 'Polite goodbye after no', sentiment: 'neutral' },
      { id: 'calendar_sent', label: 'Sent invite / WhatsApp details', sentiment: 'positive' },
      { id: 'abrupt_drop_or_hangup', label: 'Line dropped / hung up', sentiment: 'negative' }
    ]
  }
];

export function getStageByNumber(number) {
  return STAGES.find(s => s.number === Number(number)) || STAGES[0];
}

export default STAGES;
