/**
 * Legal Knowledge Base — lightweight retrieval for victim-facing legal empowerment.
 *
 * Design goals:
 *  - Zero dependencies: scored keyword retrieval (no vector DB needed at this scale).
 *  - Conservative citations: only well-established Indian provisions, stored verbatim.
 *  - retrieved entries are injected into the LLM system prompt; the model is
 *    instructed to cite ONLY what is provided and never invent sections.
 *
 * Each entry: { id, title, citation, keywords[], text }
 *  - keywords: lowercase match terms scored against the victim's message
 *  - text: plain-language explanation suitable for quoting/paraphrasing
 */

const LEGAL_KB = [
  // ── Constitutional foundations ─────────────────────────────
  {
    id: 'art21-dignity',
    title: 'Right to life with dignity',
    citation: 'Article 21, Constitution of India',
    keywords: ['dignity', 'humiliated', 'humiliate', 'threat', 'unsafe', 'scared', 'fear', 'hurt', 'harm', 'attack', 'violen', 'abuse', 'bullied', 'bullying'],
    text: 'The Constitution guarantees every person the right to life and personal liberty with dignity. Threats, humiliation and violence violate this fundamental right, and the state is obligated to protect you.',
  },
  {
    id: 'art14-equality',
    title: 'Equality before law',
    citation: 'Article 14, Constitution of India',
    keywords: ['unfair', 'unjust', 'blamed', 'wrongly', 'false accusation', 'accused', 'discriminat', 'targeted', 'partiality'],
    text: 'Every person is equal before the law. If you are being wrongly blamed or targeted, the law does not permit anyone to punish you without a fair process — you have the right to defend yourself and be heard.',
  },
  {
    id: 'art15-nonvictim',
    title: 'No discrimination',
    citation: 'Article 15, Constitution of India',
    keywords: ['caste', 'religion', 'gender', 'woman', 'girl', 'dalit', 'sc', 'st', 'community', 'because i am'],
    text: 'The Constitution prohibits discrimination on grounds of religion, race, caste, sex or birthplace. Targeting you for who you are is unconstitutional as well as punishable.',
  },
  {
    id: 'art39a-legalaid',
    title: 'Free legal aid',
    citation: 'Article 39A, Constitution of India; Legal Services Authorities Act, 1987',
    keywords: ['lawyer', 'legal', 'court', 'police', 'fir', 'complaint', 'case', 'money for lawyer', 'cannot afford', 'justice', 'nal sa', 'nalsa'],
    text: 'Free legal aid is your fundamental right — you do not need money to get a lawyer. Any District Legal Services Authority (DLSA) provides free counsel, and the national helpline NALSA 15100 connects you directly.',
  },

  // ── Bullying, harassment, intimidation ─────────────────────
  {
    id: 'ipc509-harassment',
    title: 'Word, gesture or act intended to insult modesty / harassment',
    citation: 'Section 509 IPC (now Section 79 BNS)',
    keywords: ['bullied', 'bullying', 'teasing', 'mock', 'insult', 'verbal abuse', 'slut', 'shame', 'name calling', 'gesture', 'taunt'],
    text: 'Insulting someone with words, gestures or acts intended to outrage their dignity is a criminal offence. A police complaint can be filed directly, and for workplace or institution settings the institution is obliged to act.',
  },
  {
    id: 'ipc506-intimidation',
    title: 'Criminal intimidation',
    citation: 'Section 506 IPC (now Section 351 BNS)',
    keywords: ['threat', 'threaten', 'intimidat', 'scare me', 'warning me', 'harm me', 'kill me', 'afraid of him', 'afraid of her', 'afraid of them'],
    text: 'Threatening someone with injury to their body, reputation or property is criminal intimidation — a punishable offence. Threats over messages or calls are also evidence you can preserve.',
  },
  {
    id: 'ipc341-restraint',
    title: 'Wrongful restraint',
    citation: 'Sections 339–341 IPC (now Sections 126 BNS)',
    keywords: ['blocked', 'stopped me', 'not letting', 'wont let me', "won't let me", 'trapped', 'confined', 'locked', 'restrain'],
    text: 'Deliberately blocking, confining or stopping a person from moving freely is wrongful restraint or wrongful confinement, both criminal offences.',
  },
  {
    id: 'ipc499-defamation',
    title: 'Defamation',
    citation: 'Sections 499–500 IPC (now Section 356 BNS)',
    keywords: ['rumor', 'rumour', 'spread lies', 'false story', 'reputation', 'bad name', 'blaming me', 'calling me', 'saying i did'],
    text: 'Spreading false claims that harm your reputation — spoken, written or posted online — is defamation, a criminal offence. Screenshots and witnesses strengthen the complaint.',
  },
  {
    id: 'ragging-ugc',
    title: 'Anti-ragging protections for students',
    citation: 'UGC Regulations on Curbing the Menace of Ragging, 2009; SC in University of Kerala v. Council of Principals of Colleges',
    keywords: ['ragging', 'college', 'seniors', 'campus', 'hostel', 'school', 'classmates', 'student', 'university', 'class'],
    text: 'Ragging is completely banned by Supreme Court orders and UGC regulations. Every institution must have an Anti-Ragging Committee, must act within 24 hours, and can expel offenders; the national anti-ragging helpline is 1800-180-5522.',
  },
  {
    id: 'juvenile-bullying',
    title: 'Bullying by minors / in schools',
    citation: 'Section 75 Juvenile Justice Act, 2015; CBSE/State school safety guidelines',
    keywords: ['classmate', 'school bullying', 'kid', 'child', 'minor', 'teacher did nothing', 'principal'],
    text: 'Bullying in schools is treated seriously under child-protection law: school management can be held accountable for failing to act, and complaints can go to the school committee, the education department or the police.',
  },

  // ── Violence against women & children ──────────────────────
  {
    id: 'ipc354-assault-women',
    title: 'Assault or criminal force to a woman with intent to outrage her modesty',
    citation: 'Section 354 IPC (now Section 74 BNS)',
    keywords: ['touched', 'molest', 'groped', 'misbehave', 'outrage', 'inappropriate touch', 'eve teasing'],
    text: 'Any physical act intended to outrage a woman\'s modesty is a serious crime with stringent punishment. The survivor\'s statement carries weight and the law protects her identity throughout the proceedings.',
  },
  {
    id: 'pocso',
    title: 'Protection of children from sexual offences',
    citation: 'POCSO Act, 2012',
    keywords: ['child abuse', 'under 18', 'minor abuse', 'kid touched', 'child sexual'],
    text: 'The POCSO Act protects everyone under 18 from sexual offences, mandates child-friendly procedures, keeps the child\'s identity confidential, and requires mandatory reporting — any adult aware of it must report.',
  },
  {
    id: 'dv-act',
    title: 'Protection of women from domestic violence',
    citation: 'Protection of Women from Domestic Violence Act, 2005',
    keywords: ['husband', 'in laws', 'home violence', 'domestic', 'beats me', 'beating', 'at home', 'family member', 'mother in law'],
    text: 'The Domestic Violence Act gives women civil remedies — protection orders, residence rights, maintenance and monetary relief — through a Protection Officer, without needing to first file a criminal case.',
  },
  {
    id: 'dowry',
    title: 'Dowry prohibition',
    citation: 'Dowry Prohibition Act, 1961; Section 498A IPC (now Section 85 BNS)',
    keywords: ['dowry', 'demands money', 'demands gift', 'harassment for', 'in laws money'],
    text: 'Giving or taking dowry is banned, and harassment over dowry demands is a cognizable offence — police can arrest without warrant. Section 498A specifically covers cruelty by husband or relatives.',
  },

  // ── SC/ST atrocities ────────────────────────────────────────
  {
    id: 'scst-poa',
    title: 'SC/ST (Prevention of Atrocities) Act',
    citation: 'SC/ST (Prevention of Atrocities) Act, 1989 — Sections 3(1)(r), 3(1)(s), 3(2)',
    keywords: ['caste abuse', 'casteist', 'dalit', 'sc community', 'st community', 'caste name', 'caste slur', 'untouchab'],
    text: 'Intentional insult or intimidation in public view on caste grounds, and atrocities against SC/ST members, are offences with special protections: special courts, victim compensation, and officials who fail to register an FIR can be punished.',
  },

  // ── Cybercrime ──────────────────────────────────────────────
  {
    id: 'it67-cyber',
    title: 'Cyber harassment and obscene content',
    citation: 'Information Technology Act, 2000 — Sections 66C, 66D, 66E, 67',
    keywords: ['online', 'message', 'whatsapp', 'instagram', 'social media', 'cyber', 'fake account', 'hacked', 'photos posted', 'chat', 'dm', 'meme'],
    text: 'Identity theft, cheating by impersonation, publishing private images and transmitting obscene or threatening content online are all offences under the IT Act. Report at cybercrime.gov.in or helpline 1930 — digital evidence like screenshots and URLs should be preserved.',
  },

  // ── Workplace ───────────────────────────────────────────────
  {
    id: 'posh',
    title: 'Sexual harassment at workplace',
    citation: ' Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
    keywords: ['office', 'workplace', 'boss', 'colleague', 'job', 'work harassment', 'supervisor'],
    text: 'Every workplace with 10 or more employees must have an Internal Committee to investigate sexual-harassment complaints within 90 days; retaliation against the complainant is separately punishable.',
  },

  // ── Physical violence & procedure ───────────────────────────
  {
    id: 'ipc323-hurt',
    title: 'Causing hurt / assault',
    citation: 'Sections 319–323 IPC (now Sections 114–115 BNS)',
    keywords: ['beaten', 'hit me', 'slapped', 'punched', 'physical', 'injured', 'wound', 'bruises', 'attacked me'],
    text: 'Causing hurt or assault is a punishable criminal offence. Get a medical examination promptly — a Medical Legal Certificate is strong evidence, and a Zero FIR can be filed at any police station regardless of jurisdiction.',
  },
  {
    id: 'crpc-fir',
    title: 'Your rights when filing an FIR',
    citation: 'Sections 154, 173 CrPC (now Section 173 BNSS); Lalita Kumari v. Govt. of UP (2014)',
    keywords: ['fir', 'police not registering', 'police refused', 'file complaint', 'report to police', 'police station'],
    text: 'Police must register an FIR for cognizable offences — the Supreme Court has held registration is mandatory, not discretionary. If refused, you can approach the Superintendent of Police, a Magistrate under Section 156(3), or file a Zero FIR at any station, free of charge.',
  },
  {
    id: 'witness-protection',
    title: 'Witness protection & victim compensation',
    citation: 'Witness Protection Scheme, 2018 (approved in Mahender Chawla v. Union of India); Section 357A CrPC',
    keywords: ['testify', 'witness', 'afraid to testify', 'compensation', 'threatened to withdraw'],
    text: 'India has a formal Witness Protection Scheme, and Section 357A provides state-funded compensation for crime victims including rehabilitation support — available through the District Legal Services Authority.',
  },
];

// Weight a single entry against the tokenized message + recent conversation keywords.
const scoreEntry = (entry, tokens, rawLower) => {
  let score = 0;
  for (const kw of entry.keywords) {
    if (kw.includes(' ')) {
      // phrase keywords: strong signal
      if (rawLower.includes(kw)) score += 3;
    } else if (tokens.has(kw)) {
      score += 2;
    } else {
      // partial token match (e.g. "bullied" matches "bullying")
      for (const t of tokens) {
        if (t.length >= 4 && (t.startsWith(kw) || kw.startsWith(t))) {
          score += 1;
          break;
        }
      }
    }
  }
  return score;
};

/**
 * Retrieve the most relevant legal provisions for a victim message.
 * @param {string} userText      latest victim message
 * @param {string[]} [extraContext] optional earlier messages for added signal
 * @returns {Array<{title:string, citation:string, text:string}>} top entries (max 2)
 */
const retrieveLegalContext = (userText, extraContext = []) => {
  try {
    const rawLower = [userText, ...extraContext].filter(Boolean).join(' ').toLowerCase();
    if (!rawLower || rawLower.length < 8) return [];

    const tokens = new Set(
      rawLower
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 3)
    );
    if (tokens.size === 0) return [];

    const scored = LEGAL_KB
      .map((entry) => ({ entry, score: scoreEntry(entry, tokens, rawLower) }))
      .filter((s) => s.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    return scored.map((s) => ({
      title: s.entry.title,
      citation: s.entry.citation,
      text: s.entry.text,
    }));
  } catch (err) {
    console.error('[legalKnowledge] retrieval failed:', err.message);
    return [];
  }
};

module.exports = { LEGAL_KB, retrieveLegalContext };
