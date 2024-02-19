import { MessageGPT } from "../../model/Model";


export interface StudyTask {
  action: string;
  imageUrl: string;
}

export interface StudyCondition {
  type: "text" | "svg" | "code";
  messages: MessageGPT[],
  tasks: StudyTask[],
}

export interface StudyStep {
  type: 'condition' | 'message' | 'video';
  video?: string
  message?: string
  condition?: StudyCondition
  isDirect?: boolean,
  saveData?: boolean,
}

export class StudyTaskGenerator {

  static generateSteps(participantId: number): StudyStep[] {
    let steps: StudyStep[] = [{
      type: "message",
      message: "Thank you for participating in this study. Please, first complete this survey questionnaire: [demographic questions (link removed)]"
    }
    ];

    const latinSquare = [
      [['T1', 'C1', 'S2'], ['C2', 'S1', 'T2']],
      [['C1', 'S2', 'T1'], ['T2', 'C2', 'S1']],
      [['C2', 'T2', 'S1'], ['C1', 'T1', 'S2']],
      [['T2', 'S1', 'C2'], ['S2', 'C1', 'T1']],
      [['S1', 'C2', 'T2'], ['T1', 'S2', 'C1']],
      [['S2', 'T1', 'C1'], ['S1', 'T2', 'C2']],

      [['C2', 'S1', 'T2'], ['T1', 'C1', 'S2']],
      [['T2', 'C2', 'S1'], ['C1', 'S2', 'T1']],
      [['C1', 'T1', 'S2'], ['C2', 'T2', 'S1']],
      [['S2', 'C1', 'T1'], ['T2', 'S1', 'C2']],
      [['T1', 'S2', 'C1'], ['S1', 'C2', 'T2']],
      [['S1', 'T2', 'C2'], ['S2', 'T1', 'C1']],
    ]

    const order = latinSquare[participantId % latinSquare.length];
    for (let conditionIdx = 0; conditionIdx < order.length; ++conditionIdx) {
      const isBaseline = (participantId % 2) !== conditionIdx;
      const modalities = order[conditionIdx];

      for (const modality of modalities) {
        const condition = modalityTask[modality];

        const video_name = (condition.type) + "_" + (isBaseline ? 'chat' : 'direct');
        // Video tutorial right before the condition
        steps.push({
          type: "video",
          video: (process.env.PUBLIC_URL || "") + `/study/tuto/${video_name}.mp4`
        });


        if (condition.type === 'code' && isBaseline) {
          condition.messages[condition.messages.length-1].content = "```javascript\n" + condition.messages[condition.messages.length-1].content + "\n```"
        }

        if (condition.type === 'svg' && isBaseline) {
          condition.messages[condition.messages.length-1].content = "```html\n" + condition.messages[condition.messages.length-1].content + "\n```"
        }

        steps.push({
          type: 'condition',
          condition: condition,
          isDirect: !isBaseline
        });

        steps.push({
          type: 'message',
          message: "Feel free to take a break, and press 'Next' whenever you are ready.",
          saveData: true
        });  
      }




      steps.push({
        type: "message",
        message: `End of this part. Please answer this questionnaire: [usability questions (link removed)]`        ,
    });

    }

    steps.push(
      {
          type: "message",
          message: "Done! Thank you for participating in this study."
      }
  )

    return steps;

  }
}



const modalityTask: { [name: string]: StudyCondition } = {
  /*********
   * Text
   ********/
  "T2": {
    type: 'text',
    messages: [
      {
        content:
          `I am by birth a Genevese, and my family is one of the most distinguished of that republic. My ancestors had been for many years counsellors and syndics, and my father had filled several public situations with honour and reputation. He was respected by all who knew him for his integrity and indefatigable attention to public business. He passed his younger days perpetually occupied by the affairs of his country; a variety of circumstances had prevented his marrying early, nor was it until the decline of life that he became a husband and the father of a family.

As the circumstances of his marriage illustrate his character, I cannot refrain from relating them. One of his most intimate friends was a merchant who, from a flourishing state, fell, through numerous mischances, into poverty. This man, whose name was Beaufort, was of a proud and unbending disposition and could not bear to live in poverty and oblivion in the same country where he had formerly been distinguished for his rank and magnificence. Having paid his debts, therefore, in the most honourable manner, he retreated with his daughter to the town of Lucerne, where he lived unknown and in wretchedness. My father loved Beaufort with the truest friendship and was deeply grieved by his retreat in these unfortunate circumstances. He bitterly deplored the false pride which led his friend to a conduct so little worthy of the affection that united them. He lost no time in endeavouring to seek him out, with the hope of persuading him to begin the world again through his credit and assistance.`,
        role: "assistant",
      }],
    tasks: [
      { imageUrl: process.env.PUBLIC_URL + '/study/T2_synonyms.png', action: 'Words in yellow => synonyms' },
      { imageUrl: process.env.PUBLIC_URL + '/study/T2_describe.png', action: 'Text in yellow => more description' },
      { imageUrl: process.env.PUBLIC_URL + '/study/T2_shorten.png', action: 'Text in yellow => shorter' },
      { imageUrl: process.env.PUBLIC_URL + '/study/T2_tense.png', action: 'Text => future tense' },
    ],
  },

  "T1": {
    type: 'text',
    messages: [
      {
        content:
`Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so _very_ remarkable in that; nor did Alice think it so _very_ much out of the way to hear the Rabbit say to itself, “Oh dear! Oh dear! I shall be late!” (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually _took a watch out of its waistcoat-pocket_, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.`,
        role: "assistant",
      }],
    tasks: [
      { imageUrl: process.env.PUBLIC_URL + '/study/T1_synonyms.png', action: 'Words in yellow => synonyms' },
      { imageUrl: process.env.PUBLIC_URL + '/study/T1_describe.png', action: 'Text in yellow => more description' },
      { imageUrl: process.env.PUBLIC_URL + '/study/T1_shorten.png', action: 'Text in yellow => shorter' },
      { imageUrl: process.env.PUBLIC_URL + '/study/T1_tense.png', action: 'Text => future tense' },
    ],
  },




  /*********
   * Code
   ********/
  'C1': {
    type: 'code',
    messages: [
      {
        content:
`function printPyramid(rows) {
  for (let i = 1; i <= rows; i++) {
    let spaces = '';

    for (let j = 0; j < rows - i; j++) {
      spaces += ' ';
    }

    let asterisks = '';

    for (let j = 0; j < 2 * i - 1; j++) {
      asterisks += '*';
    }

    console.log(spaces + asterisks);
  }
}`,
        role: "assistant",
      }],
    tasks: [
      { imageUrl: process.env.PUBLIC_URL + '/study/C1_refactor.png', action: 'Variable in yellow => k' },
      { imageUrl: process.env.PUBLIC_URL + '/study/C1_while.png', action: 'Code in yellow => while loops' },
      { imageUrl: process.env.PUBLIC_URL + '/study/C1_factorize.png', action: 'Code in yellow => use repeat function' },
      { imageUrl: process.env.PUBLIC_URL + '/study/C1_python.png', action: 'to Python' },
    ],
  },


  'C2': {
    type: 'code',
    messages: [
      {
        content:
`function countValuesBelowMean(data, windowSize) {
  for (let i = 0; i < data.length; i++) {
    const startIndex = Math.max(0, i - windowSize + 1);
    const windowData = data.slice(startIndex, i + 1);

    let windowSum = 0;
    for (const i of windowData) {
      windowSum += i;
    }

    let countBelowMean = 0;
    for (const i of windowData) {
      if (i < windowSum / windowData.length) {
        countBelowMean++;
      }
    }

    console.log(countBelowMean);
  }
}`,
        role: "assistant",
      }],
    tasks: [
      { imageUrl: process.env.PUBLIC_URL + '/study/C2_refactor.png', action: 'Variable in yellow => renamed to \'value\'' },
      { imageUrl: process.env.PUBLIC_URL + '/study/C2_while.png', action: 'Code in yellow => while loops' },
      { imageUrl: process.env.PUBLIC_URL + '/study/C2_factorize.png', action: 'Code in yellow => use reduce function' },
      { imageUrl: process.env.PUBLIC_URL + '/study/C2_python.png', action: 'to Python' },
    ],
  },



  /*********
   * SVG
   ********/
  'S1': {
    type: 'svg',
    messages: [
      {
        content:
          `<svg width="300" height="150">
<circle cx="133" cy="33" r="15"/>
<circle cx="151" cy="20" r="15"/>
<circle cx="163" cy="56" r="15"/>
<circle cx="140" cy="56" r="15"/>
<circle cx="171" cy="33" r="15"/>
<circle cx="151" cy="41" fill="white" r="12"/>
</svg>`,
        role: "assistant",
      }],
    tasks: [
      { imageUrl: process.env.PUBLIC_URL + '/study/S1_colorize.png', action: 'Reproduce (colour gradient petals red/blue)' },
      { imageUrl: process.env.PUBLIC_URL + '/study/S1_draw.png', action: 'Reproduce approximately' },
      { imageUrl: process.env.PUBLIC_URL + '/study/S1_remove.png', action: 'Reproduce' },
      { imageUrl: process.env.PUBLIC_URL + '/study/S1_flip.png', action: 'Reproduce (upside down)' },
    ],
  },


  'S2': {
    type: 'svg',
    messages: [
      {
        content:
          `<svg width="300" height="150">
<circle cx="152" cy="42" r="40" fill="#ffa600"/>
<circle cx="137" cy="27" r="5"/>
<circle cx="167" cy="27" r="5"/>
<circle cx="152" cy="44" r="5"/>
<path stroke="#000" stroke-width="2" d="M132 63h40"/>
</svg>`,
        role: "assistant",
      }],
    tasks: [
      { imageUrl: process.env.PUBLIC_URL + '/study/S2_colorize.png', action: 'Reproduce (colour gradient eyes and face white/black)' },
      { imageUrl: process.env.PUBLIC_URL + '/study/S2_draw.png', action: 'Reproduce approximately' },
      { imageUrl: process.env.PUBLIC_URL + '/study/S2_remove.png', action: 'Reproduce' },
      { imageUrl: process.env.PUBLIC_URL + '/study/S2_flip.png', action: 'Reproduce (upside down)' },
    ]
  }
}