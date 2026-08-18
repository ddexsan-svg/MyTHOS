// Session configurations and static content for MyTHOS CBT Intervention

export interface StorySlide {
  text: string;
  imageType: 'malakas' | 'maganda' | 'bernardo' | 'lamang' | 'maria' | 'sarimanok' | 'quote';
  audioNarrationSimulated: string;
  videoStartSecond?: number;
  videoEndSecond?: number;
}

export interface ChoiceNode {
  text: string;
  nextIndex: number;
  points: number;
  feedback: string;
}

export interface StoryChoiceSlide extends StorySlide {
  choices: ChoiceNode[];
}

export interface CBTQuestion {
  id: string;
  question: string;
  placeholder: string;
  inputType: 'text' | 'textarea' | 'select' | 'distortion';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface SessionConfig {
  number: number;
  title: string;
  narrativeName: string;
  theme: string;
  centralQuote?: string;
  objectives: string[];
  slides: (StorySlide | StoryChoiceSlide)[];
  cbtQuestions: CBTQuestion[];
  homeworkPrompt: string;
  quizQuestions: QuizQuestion[];
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
}

export const INTERVENTION_SESSIONS: Record<number, SessionConfig> = {
  1: {
    number: 1,
    title: 'Knowing My Story',
    narrativeName: 'Malakas at Maganda (The Strong and the Beautiful)',
    theme: 'Identity and Self-Awareness',
    centralQuote: '"My experiences are part of my story, but they do not define my worth."',
    objectives: [
      'Describe the purpose and expectations of the MyTHOS intervention. (Ilarawan ang layunin at mga inaasahan sa MyTHOS intervention.)',
      'Identify personal strengths, positive qualities, and sources of support. (Tukuyin ang mga personal na kalakasan, positibong katangian, at mga pinagkukunan ng suporta.)',
      'Recognize how experiences may influence the way they think about themselves. (Kilalanin kung paano maaaring makaapekto ang mga karanasan sa kanilang pagtingin sa sarili.)',
      'Identify at least one negative self-belief or automatic thought without requiring disclosure of traumatic experiences. (Tukuyin ang kahit isang negatibong paniniwala sa sarili o awtomatikong kaisipan nang hindi kinakailangang ibunyag ang mga traumatikong karanasan.)',
      'Begin developing a more balanced and positive perception of themselves. (Simulang paunlarin ang isang mas balanse at positibong pagtingin sa sarili.)'
    ],
    badgeName: 'First Step',
    badgeDescription: 'Emerged from the bamboo of self-awareness.',
    badgeIcon: '🌱',
    slides: [
      {
        text: 'Sa simula, walang lupa. Mayroon lamang langit, dagat, at isang ibong lumilipad sa pagitan nito. Walang madapuan ang ibon kaya pinag-away niya ang langit at dagat. Noong naghagis ang langit ng malalaking bato upang pakalmahin ang dagat, ito ang naging simula ng mga isla ng Pilipinas.',
        imageType: 'malakas',
        audioNarrationSimulated: 'Sa simula, walang lupa. Mayroon lamang langit, dagat, at isang ibong lumilipad sa pagitan nito...',
        videoStartSecond: 0,
        videoEndSecond: 54
      },
      {
        text: 'Lumipas ang panahon at habang nagpapahinga ang ibon sa kawayanan, narinig niya ang isang mahiwagang tunog—isang katok sa loob ng kawayan. Sa kuryosidad, tinuka niya ito nang tinuka hanggang sa mabaak.',
        imageType: 'malakas',
        audioNarrationSimulated: 'Lumipas ang panahon at habang nagpapahinga ang ibon sa kawayanan, narinig niya ang isang mahiwagang tunog...',
        videoStartSecond: 54,
        videoEndSecond: 104
      },
      {
        text: 'Mula sa unang baak ay lumabas si Malakas, matipuno at matapang. Mula sa ikalawang baak ay lumabas si Maganda, mayumi at puspos ng biyaya. Sila ang naging unang lalaki at babae at mga ninuno ng ating lahi.',
        imageType: 'maganda',
        audioNarrationSimulated: 'Mula sa unang baak ay lumabas si Malakas, matipuno at matapang. Mula sa ikalawang baak ay lumabas si Maganda...',
        videoStartSecond: 104,
        videoEndSecond: 158
      },
      {
        text: 'Tulad ng kawayan, marami sa atin ang nakararanas ng mga negatibo at mabibigat na sitwasyong bumabalot sa atin. Ngunit sa ating loob, nananahan ang lakas at ganda na handang pumutok at magpakita ng katatagan.',
        imageType: 'malakas',
        audioNarrationSimulated: 'Tulad ng kawayan, marami sa atin ang nakararanas ng mga negatibo at mabibigat na sitwasyong bumabalot... ',
        videoStartSecond: 158,
        videoEndSecond: 215
      }
    ],
    cbtQuestions: [
      {
        id: 'q1',
        question: '1. What do you think Malakas and Maganda felt when they entered a new world? (Ano sa tingin mo ang naramdaman nina Malakas at Maganda nang pumasok sila sa bagong mundo?)',
        placeholder: 'Enter your answer (I-type ang iyong sagot)...',
        inputType: 'textarea'
      },
      {
        id: 'q2',
        question: '2. What qualities did they need to begin their journey? (Anong mga katangian ang kinailangan nila upang simulan ang kanilang paglalakbay?)',
        placeholder: 'Enter your answer (I-type ang iyong sagot)...',
        inputType: 'textarea'
      },
      {
        id: 'q3',
        question: '3. What does "strength" mean beyond physical strength? (Ano ang ibig sabihin ng "lakas" higit pa sa pisikal na kakayahan?)',
        placeholder: 'Enter your answer (I-type ang iyong sagot)...',
        inputType: 'textarea'
      },
      {
        id: 'q4',
        question: '4. What does "being beautiful" mean beyond physical appearance? (Ano ang ibig sabihin ng "pagiging maganda" higit pa sa panlabas na anyo?)',
        placeholder: 'Enter your answer (I-type ang iyong sagot)...',
        inputType: 'textarea'
      },
      {
        id: 'q5',
        question: '5. If the characters could describe themselves, what positive words might they use? (Kung mailalarawan ng mga tauhan ang kanilang sarili, anong mga positibong salita ang maaari nilang gamitin?)',
        placeholder: 'E.g., Resilient, determined... (Halimbawa: Matatag, mapursigi...)',
        inputType: 'textarea'
      }
    ],
    homeworkPrompt: 'Write your personal life story, focusing on the metaphorical "bamboo" shell you had to break out of, and the strengths that emerged from it. (Isulat ang iyong sariling kwento ng buhay, na nakatuon sa metaporikal na "kawayan" na shell na kailangan mong mabaak, at ang mga kalakasang lumabas mula rito.)',
    quizQuestions: [
      {
        question: 'Who emerged from the bamboo stalk split by the celestial bird?',
        options: ['Bernardo Carpio and Maria Makiling', 'Malakas and Maganda', 'Lam-ang and Ines Kannoyan', 'Bathala and Aman Sinaya'],
        correctAnswerIndex: 1,
        explanation: 'According to Philippine creation folklore, Malakas (the Strong) and Maganda (the Beautiful) emerged from the split bamboo stalk.'
      },
      {
        question: 'In Cognitive Behavioral Therapy (CBT), what does the term "Automatic Thoughts" refer to?',
        options: [
          'Thoughts that require deep conscious meditation to notice',
          'Involuntary, rapid thoughts that pop up in response to situations',
          'Deliberate thoughts used to solve math problems',
          'Logical conclusions drawn from scientific evidence'
        ],
        correctAnswerIndex: 1,
        explanation: 'Automatic thoughts are rapid, involuntary evaluative cognitions that occur automatically in response to triggers.'
      }
    ]
  },
  2: {
    number: 2,
    title: 'Facing My Shadows',
    narrativeName: 'Bernardo Carpio (The Giant Trapped in the Mountains)',
    theme: 'Facing Negative Thoughts',
    objectives: [
      'Identify common emotional and behavioral triggers (Tukuyin ang mga karaniwang nagpapalitaw ng emosyon at pag-uugali)',
      'Recognize thoughts associated with anger and aggression (Kilalanin ang mga kaisipang may kaugnayan sa galit at agresyon)',
      'Distinguish between feeling anger and acting aggressively (Tukuyin ang pagkakaiba ng pakiramdam na galit at ang kumilos nang agresibo)',
      'Identify cognitive distortions that may intensify anger (Kilalanin ang mga cognitive distortion na maaaring magpatindi sa galit)',
      'Practice a CBT-based strategy for managing aggressive responses (Magsanay ng CBT-based na estratehiya para makontrol ang agresibong reaksyon)'
    ],
    badgeName: 'Chain Breaker',
    badgeDescription: 'Identified and challenged your inner chains.',
    badgeIcon: '⛓️',
    slides: [
      {
        text: 'Sa kaibuturan ng kabundukan ng Montalban, Rizal, natutulog si Bernardo Carpio — isang higante na may di kapani-paniwalang lakas. Dinaya siya ng kanyang mga kaaway at nabilanggo sa pagitan ng dalawang nagsalubungang bundok na bato.',
        imageType: 'bernardo',
        audioNarrationSimulated: 'Sa kaibuturan ng kabundukan ng Montalban, Rizal, natutulog si Bernardo Carpio...'
      },
      {
        text: 'Sa tuwing tinutulak ni Bernardo Carpio ang mga pader ng bato upang makalaya, nagtatagpo ang mga bundok at nagdudulot ng lindol sa buong lupa. Siya ay nakakulong, nakagapos sa mabigat na mga tanikala, at nakikipaglaban sa bigat na tila imposibleng gawin.',
        imageType: 'bernardo',
        audioNarrationSimulated: 'Tuwing tinutulak ni Bernardo Carpio ang mga bato upang makalaya, yumayanig ang lupa...'
      },
      {
        text: 'Ang magkasalubong na mga bundok ay kumakatawan sa ating mga negatibong awtomatikong kaisipan at cognitive distortions — pumipigil sa atin mula sa magkabilang panig. Ang mga tanikala ay hindi gawa sa bakal, kundi sa ating sariling hindi pa nasusuring mga paniniwala. Ang pakikibaka ni Bernardo ay ang ating pakikibaka rin laban sa pagkulong sa sarili.',
        imageType: 'bernardo',
        audioNarrationSimulated: 'Ang mga bundok ay kumakatawan sa ating mga negatibong kaisipan at distortions...'
      }
    ],
    cbtQuestions: [
      {
        id: 'q1',
        question: 'What are the two biggest "colliding mountains" (negative situations or external pressures) pressing on you right now?\n(Ano ang dalawang pinakamalaking "magkasalubong na bundok" — ang mga negatibong sitwasyon o panlabas na presyon — na sumusugal sa iyo ngayon?)',
        placeholder: '1. Pressure sa paaralan / Academic pressure\n2. Pangamba sa pananalapi / Financial worries...',
        inputType: 'textarea'
      },
      {
        id: 'q2',
        question: 'Identify your "inner chains." Which cognitive distortion do you fall into most?\n(Tukuyin ang iyong "mga tanikala sa loob". Alin sa mga cognitive distortion ang madalas mong nahuhulog?\n• All-or-Nothing — Lahat o Wala\n• Catastrophizing — Pag-akala ng pinakamasama\n• Should Statements — Dapat na Pahayag\n• Personalization — Pagpapaako ng lahat\n• Labeling — Paglalagay ng etiketa sa sarili)',
        placeholder: 'Piliin ang iyong distortion...',
        inputType: 'distortion'
      },
      {
        id: 'q3',
        question: 'Challenge that distortion: What is the realistic, evidence-based alternative to your negative thought?\n(Harapin ang distorsiyon: Ano ang makatotohanang alternatibo sa iyong negatibong kaisipan? Halimbawa: "Nagkamali ako, ngunit makapasa na ako bago. Maaari akong mag-aral nang mas mabuti.")',
        placeholder: 'Alternative thought / Alternatibong kaisipan: "Nagkamali ako, ngunit hindi ibig sabihin nito ay kabigo na ako. Kaya kong mag-aral nang mas mabuti sa susunod."',
        inputType: 'textarea'
      }
    ],
    homeworkPrompt: 'Keep a "Shadow Log" this week: Record one difficult situation, write down the negative thought, identify its distortion, and write a rational response.\n(Magtago ng "Shadow Log" ngayong linggo: Itala ang isang mahirap na sitwasyon, isulat ang negatibong kaisipan, tukuyin ang distorsiyon nito, at sumulat ng makatotohanang sagot.)',
    quizQuestions: [
      {
        question: 'Where is Bernardo Carpio trapped according to the legend?',
        options: ['At the bottom of the Pacific Ocean', 'Between two colliding stone mountains in Montalban', 'Inside a volcanic crater in Mt. Mayon', 'Under a giant Balete tree'],
        correctAnswerIndex: 1,
        explanation: 'Legend says Bernardo Carpio was trapped between two colliding stone mountains in Montalban, Rizal.'
      },
      {
        question: 'What is "Catastrophizing"?',
        options: [
          'Assuming responsibility for things you didn\'t do',
          'Assuming the absolute worst-case scenario will happen',
          'Ignoring the positive events in your life',
          'Telling others how they should behave'
        ],
        correctAnswerIndex: 1,
        explanation: 'Catastrophizing is a cognitive distortion where a person assumes that the worst-case scenario is inevitable.'
      }
    ]
  },
  3: {
    number: 3,
    title: "Choosing the Hero's Path",
    narrativeName: 'Biag ni Lam-ang (The Life of Lam-ang)',
    theme: 'Building Courage and Healthy Decisions',
    objectives: [
      'Recognize the relationship between thoughts, choices, and consequences (Kilalanin ang ugnayan ng mga kaisipan, pagpili, at kahihinatnan)',
      'Identify alternative responses to conflict (Tukuyin ang mga alternatibong reaksyon sa mga alitan)',
      'Challenge thoughts that justify aggression (Harapin ang mga kaisipang nagbibigay-katuwiran sa pagiging agresibo)',
      'Practice problem-solving (Magsanay sa paglutas ng problema)',
      'Develop a personal "hero response" to difficult situations (Bumuo ng personal na "hero response" sa mahihirap na sitwasyon)'
    ],
    badgeName: "Hero's Ascent",
    badgeDescription: 'Mapped your decisions and faced the Berkakan of doubt.',
    badgeIcon: '🛡️',
    slides: [
      {
        text: 'Sa hilagang rehiyon ng Ilocos, si Lam-ang ay ipinanganak bilang isang bayani na may kamangha-manghang bilis at talino sa pananalita. Bilang isang sanggol, nagsalita siya agad, pinili ang kanyang sariling pangalan, at lumabas upang hanapin ang kanyang nawawalang ama.',
        imageType: 'lamang',
        audioNarrationSimulated: 'Sa hilagang rehiyon ng Ilocos, si Lam-ang ay ipinanganak bilang isang bayani na may kamangha-manghang bilis at talino...'
      },
      {
        text: 'Naharap si Lam-ang sa maraming pakikipagsapalaran. Nakipaglaban siya sa mga kaaway ng tribo, nanalo ng kamay ng magandang si Ines Kannoyan, at inutusan na sumisid para sa mga sagradong kabibe sa karagatan — kung saan siya ay nilamon ng malaking isdang Berkakan.',
        imageType: 'lamang',
        audioNarrationSimulated: 'Naharap si Lam-ang sa maraming pakikipagsapalaran at nilamon siya ng malaking isdang Berkakan...'
      },
      {
        text: 'Ngunit ang kwento ni Lam-ang ay hindi nagtapos sa tiyan ng isda. Ang kanyang mga buto ay nakuha, ang kanyang mga tapat na kasama — ang aso at manok — ay nagtulungan, at sa pamamagitan ng mahika at kooperasyon, si Lam-ang ay muling nabuhay, mas malakas kaysa dati.',
        imageType: 'lamang',
        audioNarrationSimulated: 'Ngunit ang kwento ni Lam-ang ay hindi nagtapos sa tiyan ng isda. Sa pamamagitan ng kooperasyon, siya ay muling nabuhay...'
      },
      {
        text: 'Ang "Paglalakbay ng Bayani" ay hindi tungkol sa pag-iwas sa malaking isda (ang ating mga kabiguan at takot). Ito ay tungkol sa kaalaman na kahit na nilamon tayo, mayroon tayong mga kasangkapan, mga sistema ng suporta, at katatagan upang muling maitayo ang ating sarili. Nahaharap ka sa isang pagpili sa iyong landas ngayon. Magpapatuloy ka ba?',
        imageType: 'lamang',
        audioNarrationSimulated: 'Ang Paglalakbay ng Bayani ay hindi tungkol sa pag-iwas sa kabiguan, kundi sa kaalaman na mayroon tayong mga kasangkapan upang muling maitayo ang sarili...'
      }
    ],
    cbtQuestions: [
      {
        id: 'q1',
        question: 'Who are the members of your "Rooster and Dog" support system? List friends, family, or counselors you can call when you are in the "belly of the fish.\'\n(Sino ang mga miyembro ng iyong sistema ng suporta — ang iyong "Manok at Aso"? Ilista ang mga kaibigan, pamilya, o counselor na maaari mong tawagan kapag ikaw ay nasa "tiyan ng isda.")',
        placeholder: 'Ang aking ina, ang aking pinakamatalik na kaibigan, ang aking counselor... / My mother, my best friend, my counselor...',
        inputType: 'textarea'
      },
      {
        id: 'q2',
        question: 'Identify a real-life challenge you face. What are two options available to you? (Option A: Passive, Option B: Active problem-solving)\n(Tukuyin ang isang tunay na hamon na iyong hinaharap. Ano ang dalawang pagpipilian na mayroon ka? (Pagpipilian A: Pasibo, Pagpipilian B: Aktibong paglutas ng problema))',
        placeholder: 'Hamon: Bagsak sa Matematika. Pagpipilian A: Sumuko. Pagpipilian B: Humingi ng tutor at mag-iskedyul ng pag-aaral. / Challenge: Failing math. Option A: Give up. Option B: Ask for tutoring.',
        inputType: 'textarea'
      },
      {
        id: 'q3',
        question: 'Compare the consequences: What happens in Option A vs Option B? What is the healthy choice?\n(Ihambing ang mga kahihinatnan: Ano ang mangyayari sa Pagpipilian A kumpara sa Pagpipilian B? Ano ang malusog na pagpili?)',
        placeholder: 'Ang Pagpipilian A ay humahantong sa tiyak na kabiguan. Ang Pagpipilian B ay mahirap ngunit nagtatayo ng kumpiyansa at nagpapataas ng pagkakataon. / Option A results in certain failure. Option B is hard but builds efficacy.',
        inputType: 'textarea'
      }
    ],
    homeworkPrompt: 'Map out your own Hero\'s Journey for a current obstacle: name the Call to Adventure, the Threshold Guardian, the Climax, and the Return.',
    quizQuestions: [
      {
        question: 'Which creature swallowed Lam-ang in the sea?',
        options: ['A giant Bakunawa dragon', 'The giant fish Berkakan', 'A golden Sarimanok', 'A flying Sigbin'],
        correctAnswerIndex: 1,
        explanation: 'Lam-ang was swallowed by the Berkakan, a mythical predatory giant fish, while diving for clams.'
      },
      {
        question: 'What is "Self-Efficacy" in cognitive psychology?',
        options: [
          'Feeling superior to others',
          'Belief in one\'s capability to execute actions and succeed in challenges',
          'Analyzing other people\'s behavior',
          'Suppressing all difficult emotions'
        ],
        correctAnswerIndex: 1,
        explanation: 'Self-efficacy is an individual\'s belief in their capacity to execute behaviors necessary to produce specific performance attainments.'
      }
    ]
  },
  4: {
    number: 4,
    title: 'Winning the Inner Battle',
    narrativeName: 'Maria Makiling (The Mountaintop Guardian)',
    theme: 'The most important battle is sometimes the battle within.',
    objectives: [
      'Recognize the relationship between thoughts, emotions, and behavior (Kilalanin ang ugnayan ng mga kaisipan, emosyon, at pag-uugali)',
      'Identify negative self-talk (Tukuyin ang negatibong pagkukuwento sa sarili)',
      'Challenge maladaptive thoughts (Harapin at baguhin ang mga maling kaisipan)',
      'Develop adaptive self-statements (Bumuo ng mga positibo at angkop na pahayag sa sarili)',
      'Practice at least two emotion-regulation strategies (Magsanay ng hindi bababa sa dalawang estratehiya para makontrol ang emosyon)'
    ],
    badgeName: 'Mindful Guardian',
    badgeDescription: 'Centered your breathing and calmed the volcanic storm.',
    badgeIcon: '🍃',
    slides: [
      {
        text: 'Ang Bundok Makiling sa Laguna ay sinasabing ang humilang anino ni Maria Makiling, isang maganda at mapagbigay na diyosa ng kagubatan. Binantayan niya ang mga puno, ang mga usa, at nagbigay ng gintong nagtago bilang luya sa mga mababait na nayon.',
        imageType: 'maria',
        audioNarrationSimulated: 'Ang Bundok Makiling sa Laguna ay sinasabing ang humilang anino ni Maria Makiling...'
      },
      {
        text: 'Ngunit nang putulin ng mga sakim na mamamayan ang kanyang mga puno, panahin ang kanyang mga hayop, at sirain ang kanyang tiwala, si Maria Makiling ay nakaramdam ng malalim na kalungkutan at galit. Nagpadala siya ng nakakatakot na bagyo, ulan, at kulog upang yayanig ang bundok, itinago ang kanyang sarili sa ulap.',
        imageType: 'maria',
        audioNarrationSimulated: 'Ngunit nang sirain ng mga tao ang kanyang tiwala, nagpadala si Maria ng mga bagyo at itinago ang kanyang sarili sa ulap...'
      },
      {
        text: 'Ang panahon sa Bundok Makiling ay katulad ng ating emosyonal na estado. Ang galit at kalungkutan ay natural na mga bagyo. Si Maria Makiling ay hindi winasak ang bundok; siya ay nagretiro upang gumaling. Tayo rin ay maaaring matutong nakaupo sa ating mga emosyonal na bagyo at makahanap ng tahimik na espasyo sa loob.',
        imageType: 'maria',
        audioNarrationSimulated: 'Ang panahon sa Bundok Makiling ay katulad ng ating emosyonal na estado. Maaari tayong matutong makaupo sa ating mga bagyo...'
      }
    ],
    cbtQuestions: [
      {
        id: 'q1',
        question: 'Describe what your emotional "storm" feels like physically (e.g. tight chest, racing heart, clenching jaw).\n(Ilarawan kung paano nararamdaman ang iyong emosyonal na "bagyo" sa katawan. Hal. mahigpit na dibdib, mabilis na tibok ng puso, nakangalit na panga.)',
        placeholder: 'Pisikal na sintomas: Nakakaramdam ako ng mabigat na buhol sa aking tiyan at mahigpit ang aking dibdib. / Physical symptoms: I feel a heavy knot in my stomach and my chest feels tight.',
        inputType: 'textarea'
      },
      {
        id: 'q2',
        question: 'Mindful Acceptance: Instead of fighting or suppressing this storm, write a self-compassionate statement. (e.g. "It is okay to feel angry right now. I am doing my best.")\n(Mindful na Pagtanggap: Sa halip na labanan o pigilin ang bagyo, sumulat ng pahayag na may habag sa sarili. Hal. "Okay lang na maramdamang nagagalit ako ngayon. Ginagawa ko ang aking pinakamabuti.")',
        placeholder: 'Maawain na pag-iisip: "Nakakaramdam ako ng overwhelm, at okay lang iyon. Kukuha ako ng dahan-dahang hininga." / Compassionate thought: "I am feeling overwhelmed, and that is okay. I will take a slow breath."',
        inputType: 'textarea'
      },
      {
        id: 'q3',
        question: 'Gratitude Exercise: List three small "ginger-into-gold" things you are grateful for today.\n(Ehersisyo ng Pasasalamat: Ilista ang tatlong maliit na bagay na "luya-tungo-sa-ginto" na iyong ipinagpapasalamat ngayon.)',
        placeholder: '1. Mainit na tasa ng kape / A warm cup of coffee, 2. Mensahe mula sa aking kapatid / A text from my sister, 3. Tahimik na oras sa hapon / Quiet time in the afternoon.',
        inputType: 'textarea'
      }
    ],
    homeworkPrompt: 'Practice the Mindful Breathing exercise for 5 minutes daily when feeling stressed, and log your pre/post emotional rating.',
    quizQuestions: [
      {
        question: 'What did the ginger given by Maria Makiling turn into when the villagers reached home?',
        options: ['Stone', 'Gold', 'Leaves', 'Fire'],
        correctAnswerIndex: 1,
        explanation: 'According to the myth, the ginger Maria Makiling gifted to kind-hearted villagers turned into pure gold.'
      },
      {
        question: 'Which of the following is a primary goal of Mindfulness in emotion regulation?',
        options: [
          'Permanently turning off all negative feelings',
          'Observing and accepting emotions without judgment',
          'Avoiding emotional triggers completely',
          'Analyzing who is to blame for your sadness'
        ],
        correctAnswerIndex: 1,
        explanation: 'Mindfulness focuses on observing thoughts and emotions non-judgmentally, allowing them to arise and pass naturally.'
      }
    ]
  },
  5: {
    number: 5,
    title: 'Writing My New Story',
    narrativeName: 'Sarimanok (The Bird of Flight and Renewal)',
    theme: 'Hope, Growth and Renewal',
    objectives: [
      'Review the cognitive and behavioral skills learned throughout MyTHOS. (Balikan ang mga cognitive at behavioral skills na natutunan sa MyTHOS.)',
      'Identify changes in their self-perceptions. (Tukuyin ang mga pagbabago sa pagtingin sa sarili.)',
      'Formulate adaptive beliefs about themselves. (Bumuo ng mga positibo at angkop na paniniwala tungkol sa sarili.)',
      'Develop a personal plan for responding to anger and conflict. (Gumawa ng personal na plano sa pagtugon sa galit at hidwaan.)',
      'Create a symbolic "new story" representing hope, growth, and positive change. (Lumikha ng isang simbolikong "bagong kuwento" na sumasagisag sa pag-asa, pag-unlad, at positibong pagbabago.)'
    ],
    badgeName: 'Golden Phoenix',
    badgeDescription: 'Flew to new heights, creating your hope statement.',
    badgeIcon: '🪶',
    slides: [
      {
        text: 'Ang Sarimanok ay ang legendaryong ibon ng mga taong Maranao, pinalamutian ng nagliliwanag at makulay na mga balahibo. Hawak nito ang isda sa kanyang tuka o mga kuko, na kumakatawan sa kasaganaan, kapalaran, at koneksyon sa pagitan ng mga mundo.',
        imageType: 'sarimanok',
        audioNarrationSimulated: 'Ang Sarimanok ay ang legendaryong ibon ng mga taong Maranao, na kumakatawan sa kasaganaan at pag-asa...'
      },
      {
        text: 'Ayon sa isang alamat, isang magandang prinsipe ang nakakita sa magandang diyosa ng langit at nagnais na sumunod sa kanya. Ang Sarimanok ay lumipad, dinadala ang prinsipe sa kanyang likod nang mataas patungo sa kalangitan, tinutuos ang mga ulap papasok sa isang mundo ng walang hanggang liwanag.',
        imageType: 'sarimanok',
        audioNarrationSimulated: 'Ayon sa alamat, dinala ng Sarimanok ang prinsipe nang mataas patungo sa kalangitan...'
      },
      {
        text: 'Ang Sarimanok ay simbolo ng ganap na pagbabago at pag-asa. Tulad ng paglipad nito lampas sa mga ulap patungo sa sikat ng araw, maaari tayong tumaas nang higit sa ating mga nakaraang cognitive distortions. Handa na tayong isulat ang ating bagong kwento, kulayan ang ating kinabukasan ng maliwanag na mga kulay, at lumipad.',
        imageType: 'sarimanok',
        audioNarrationSimulated: 'Ang Sarimanok ay simbolo ng ganap na pagbabago at pag-asa. Maaari tayong tumaas nang higit sa ating mga distortions...'
      },
      {
        text: 'Ano ang iyong gagawing desisyon ngayon bilang isang hero?',
        imageType: 'sarimanok',
        audioNarrationSimulated: 'Ano ang iyong gagawing desisyon ngayon bilang isang hero?',
        choices: [
          {
            text: 'Tatanggapin ko ang aking sarili at patuloy na lalago. (I will accept myself and continue to grow.)',
            feedback: 'Napakaganda. Ang pagtanggap sa nakaraan—kasama ang mga hirap at tagumpay—ang pinakamatibay na pundasyon para sa isang maliwanag na kinabukasan.',
            nextIndex: 4,
            points: 10
          },
          {
            text: 'Isusulat ko nang may pag-asa ang bagong kabanata ng aking buhay. (I will write the new chapter of my life with hope.)',
            feedback: 'Tama! Nasa iyong mga kamay ang kapangyarihan at panulat ng iyong buhay. Lumipad nang mataas tulad ng Sarimanok!',
            nextIndex: 4,
            points: 10
          }
        ]
      },
      {
        text: '"Ipinapaalala sa atin ng Sarimanok na may mahalagang bagay na maaaring umusbong mula sa isang mahirap na paglalakbay. Ang ating mga nakaraang karanasan ay maaaring mag-iwan ng marka, ngunit hindi nito kailangang tukuyin ang direksyon ng ating kinabukasan."\n\n(The Sarimanok reminds us that something valuable can emerge from a difficult journey. Our past experiences may leave marks, but they do not have to determine the direction of our future.)',
        imageType: 'quote',
        audioNarrationSimulated: 'Ipinapaalala sa atin ng Sarimanok na may mahalagang bagay na maaaring umusbong mula sa isang mahirap na paglalakbay. Ang ating mga nakaraang karanasan ay maaaring mag-iwan ng marka, ngunit hindi nito kailangang tukuyin ang direksyon ng ating kinabukasan.'
      }
    ],
    cbtQuestions: [
      {
        id: 'q1',
        question: 'Positive Core Belief: What is a new, empowering belief about yourself that you want to cultivate? (e.g. "I am capable of growth", "My worth is not defined by external achievements")\n(Positibong Pangunahing Paniniwala: Ano ang bagong, nagbibigay-lakas na paniniwala tungkol sa iyong sarili na nais mong paunlarin? Hal. "Kaya kong lumago", "Ang aking halaga ay hindi natutukoy ng panlabas na mga tagumpay")',
        placeholder: 'Bagong paniniwala: "Karapat-dapat ako sa pagmamahal at paggalang, at kaya kong harapin ang mga hamon sa pamamagitan ng tiyaga." / New belief: "I am worthy of love and respect, and I can overcome challenges through persistence."',
        inputType: 'textarea'
      },
      {
        id: 'q2',
        question: 'Personal Action Plan: List two specific goals you will work on in the next month to maintain your mental well-being.\n(Personal na Plano ng Aksyon: Ilista ang dalawang tiyak na layunin na iyong gagawin sa susunod na buwan upang mapanatili ang iyong kalusugan ng isipan.)',
        placeholder: '1. Matulog ng hindi bababa sa 7 oras / Sleep at least 7 hours. 2. Sumulat sa aking dyurnal tatlong beses sa isang linggo / Write in my journal three times a week.',
        inputType: 'textarea'
      },
      {
        id: 'q3',
        question: 'Write a Letter to your Future Self (6 months from now). Describe the hopes you have for yourself and the lessons you carry from MyTHOS.\n(Sumulat ng Liham sa iyong Kinabukasang Sarili (6 buwan mula ngayon). Ilarawan ang mga pag-asa na mayroon ka para sa iyong sarili at ang mga aral na dala mo mula sa MyTHOS.)',
        placeholder: 'Mahal na Kinabukasang Sarili, Umaasa akong nagsasanay ka ng mindfulness at hinahamon ang iyong mga distortions... / Dear Future Self, I hope you are practicing mindfulness and challenging your distortions...',
        inputType: 'textarea'
      }
    ],
    homeworkPrompt: 'Create a visual Hope Board and formulate a one-sentence personal Hope Statement inspired by the flight of the Sarimanok.',
    quizQuestions: [
      {
        question: 'Which cultural group in the Philippines is the Sarimanok primarily associated with?',
        options: ['Ilocano', 'Maranao', 'Tagalog', 'Waray'],
        correctAnswerIndex: 1,
        explanation: 'The Sarimanok is a legendary bird symbol originating from the Maranao people of Mindanao.'
      },
      {
        question: 'What is the core focus of the "Hope Theory" developed by C.R. Snyder?',
        options: [
          'Wishing for good luck without taking action',
          'Belief in path-finding (planning ways to goals) and agency (motivation to pursue them)',
          'Ignoring all negative events',
          'Relying entirely on external circumstances to change'
        ],
        correctAnswerIndex: 1,
        explanation: 'Snyder\'s Hope Theory defines hope as the capability to derive pathways to desired goals and motivate oneself via agency thoughts to use those pathways.'
      }
    ]
  }
};

export const DISTORTIONS_LIST = [
  'All-or-Nothing Thinking',
  'Catastrophizing (Fortune Telling)',
  'Personalization',
  'Should Statements',
  'Labeling / Self-Criticism'
];
