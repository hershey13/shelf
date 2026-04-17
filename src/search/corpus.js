// ─────────────────────────────────────────────────────────────────────────────
//  src/search/corpus.js
//  Phase 3 — The Fragment Corpus
// ─────────────────────────────────────────────────────────────────────────────
//
//  CONCEPT: What is a corpus?
//
//  A corpus is your searchable dataset of book passages.
//  This file is shelf's core data moat — the thing no competitor can easily
//  replicate. You're building it in layers:
//
//  Layer 1 (this file): ~60 hardcoded famous opening lines.
//                       Always available, zero network requests.
//                       These are the passages readers most commonly half-remember.
//
//  Layer 2 (Phase 3):   Books fetched from Open Library get their opening lines
//                       added to the index and cached in sessionStorage.
//                       The index grows as users search.
//
//  Layer 3 (Phase 6):   Community contributions, publisher data, Readwise import.
//                       This is your long-term moat.
//
//  Each entry has an "anatomy" field — which part of the book it comes from.
//  This powers the "where in the book?" filter.
//
//  ANATOMY VALUES:
//  'opening_line'   — first sentence or paragraph
//  'epigraph'       — quoted lines at chapter/book front
//  'dedication'     — "for everyone who felt too much"
//  'body'           — passage from main text
// ─────────────────────────────────────────────────────────────────────────────

export const OPENING_LINES_CORPUS = [
  // ── Literary fiction ────────────────────────────────────────────────────
  {
    id: 'corpus_001',
    anatomy: 'opening_line',
    text: 'It was a bright cold day in April, and the clocks were striking thirteen.',
    metadata: {
      title: 'Nineteen Eighty-Four',
      author: 'George Orwell',
      year: '1949',
      cover: null,
      moods: ['dystopia', 'dark', 'political'],
      synopsis: 'A totalitarian future society where Winston Smith works for the government rewriting history, until he begins a forbidden love affair.',
    },
  },
  {
    id: 'corpus_002',
    anatomy: 'opening_line',
    text: 'Call me Ishmael.',
    metadata: {
      title: 'Moby-Dick',
      author: 'Herman Melville',
      year: '1851',
      cover: null,
      moods: ['literary', 'adventure', 'philosophical'],
      synopsis: 'A sailor joins the Pequod, a whaling ship captained by the monomaniacal Ahab, who is obsessed with hunting the white whale Moby Dick.',
    },
  },
  {
    id: 'corpus_003',
    anatomy: 'opening_line',
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    metadata: {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      year: '1813',
      cover: null,
      moods: ['romantic', 'witty', 'classic'],
      synopsis: 'Elizabeth Bennet navigates issues of manners, morality, and marriage in early 19th century England.',
    },
  },
  {
    id: 'corpus_004',
    anatomy: 'opening_line',
    text: 'Happy families are all alike; every unhappy family is unhappy in its own way.',
    metadata: {
      title: 'Anna Karenina',
      author: 'Leo Tolstoy',
      year: '1878',
      cover: null,
      moods: ['literary', 'tragic', 'romantic'],
      synopsis: 'Anna Karenina, a married aristocrat, enters a doomed love affair with the dashing Count Vronsky.',
    },
  },
  {
    id: 'corpus_005',
    anatomy: 'opening_line',
    text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.',
    metadata: {
      title: 'A Tale of Two Cities',
      author: 'Charles Dickens',
      year: '1859',
      cover: null,
      moods: ['historical', 'dramatic', 'classic'],
      synopsis: 'A story of sacrifice and resurrection set against the backdrop of the French Revolution.',
    },
  },
  {
    id: 'corpus_006',
    anatomy: 'opening_line',
    text: 'Many years later, as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice.',
    metadata: {
      title: 'One Hundred Years of Solitude',
      author: 'Gabriel García Márquez',
      year: '1967',
      cover: null,
      moods: ['magical realism', 'family saga', 'literary'],
      synopsis: 'The multigenerational story of the Buendía family and the fictional town of Macondo.',
    },
  },
  {
    id: 'corpus_007',
    anatomy: 'opening_line',
    text: 'Lolita, light of my life, fire of my loins.',
    metadata: {
      title: 'Lolita',
      author: 'Vladimir Nabokov',
      year: '1955',
      cover: null,
      moods: ['literary', 'controversial', 'unreliable narrator'],
      synopsis: 'A deeply controversial novel narrated by Humbert Humbert, an obsessive professor.',
    },
  },
  {
    id: 'corpus_008',
    anatomy: 'opening_line',
    text: 'The sky above the port was the color of television, tuned to a dead channel.',
    metadata: {
      title: 'Neuromancer',
      author: 'William Gibson',
      year: '1984',
      cover: null,
      moods: ['sci-fi', 'cyberpunk', 'dark'],
      synopsis: 'A washed-up computer hacker is hired for one last job that takes him on a journey through cyberspace.',
    },
  },
  {
    id: 'corpus_009',
    anatomy: 'opening_line',
    text: 'I am an invisible man.',
    metadata: {
      title: 'Invisible Man',
      author: 'Ralph Ellison',
      year: '1952',
      cover: null,
      moods: ['literary', 'social', 'identity'],
      synopsis: 'An unnamed Black narrator describes his experiences of racism and social invisibility in America.',
    },
  },
  {
    id: 'corpus_010',
    anatomy: 'opening_line',
    text: 'It was a pleasure to burn.',
    metadata: {
      title: 'Fahrenheit 451',
      author: 'Ray Bradbury',
      year: '1953',
      cover: null,
      moods: ['dystopia', 'dark', 'sci-fi'],
      synopsis: 'In a future where books are outlawed and burned, a fireman begins to question everything.',
    },
  },
  {
    id: 'corpus_011',
    anatomy: 'opening_line',
    text: 'The man in black fled across the desert, and the gunslinger followed.',
    metadata: {
      title: 'The Gunslinger',
      author: 'Stephen King',
      year: '1982',
      cover: null,
      moods: ['dark', 'fantasy', 'western'],
      synopsis: 'Roland Deschain, the last gunslinger, pursues the man in black across a post-apocalyptic world.',
    },
  },
  {
    id: 'corpus_012',
    anatomy: 'opening_line',
    text: 'Last night I dreamt I went to Manderley again.',
    metadata: {
      title: 'Rebecca',
      author: 'Daphne du Maurier',
      year: '1938',
      cover: null,
      moods: ['gothic', 'mystery', 'romantic'],
      synopsis: 'A young woman marries a wealthy widower and becomes haunted by the memory of his first wife, Rebecca.',
    },
  },
  {
    id: 'corpus_013',
    anatomy: 'opening_line',
    text: 'Someone must have slandered Josef K., for one morning, without having done anything truly wrong, he was arrested.',
    metadata: {
      title: 'The Trial',
      author: 'Franz Kafka',
      year: '1925',
      cover: null,
      moods: ['existential', 'dark', 'literary'],
      synopsis: 'Josef K. is arrested and prosecuted by a mysterious court with no explanation.',
    },
  },
  {
    id: 'corpus_014',
    anatomy: 'opening_line',
    text: 'If you really want to hear about it, the first thing you\'ll probably want to know is where I was born, and what my lousy childhood was like.',
    metadata: {
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      year: '1951',
      cover: null,
      moods: ['coming-of-age', 'literary', 'voice-driven'],
      synopsis: 'Teenager Holden Caulfield recounts the days following his expulsion from prep school.',
    },
  },
  {
    id: 'corpus_015',
    anatomy: 'opening_line',
    text: 'All children, except one, grow up.',
    metadata: {
      title: 'Peter Pan',
      author: 'J.M. Barrie',
      year: '1911',
      cover: null,
      moods: ['whimsical', 'bittersweet', 'classic'],
      synopsis: 'Three children are whisked away to Neverland by the boy who never grows up.',
    },
  },
  {
    id: 'corpus_016',
    anatomy: 'opening_line',
    text: 'It was a dark and stormy night; the rain fell in torrents.',
    metadata: {
      title: 'Paul Clifford',
      author: 'Edward Bulwer-Lytton',
      year: '1830',
      cover: null,
      moods: ['gothic', 'classic'],
      synopsis: 'A young man raised in poverty becomes a highwayman.',
    },
  },

  // ── Contemporary literary ────────────────────────────────────────────────
  {
    id: 'corpus_017',
    anatomy: 'opening_line',
    text: 'I write this sitting in the kitchen sink.',
    metadata: {
      title: 'I Capture the Castle',
      author: 'Dodie Smith',
      year: '1948',
      cover: null,
      moods: ['coming-of-age', 'romantic', 'whimsical'],
      synopsis: 'Cassandra Mortmain chronicles her eccentric family living in a dilapidated castle in 1930s England.',
    },
  },
  {
    id: 'corpus_018',
    anatomy: 'opening_line',
    text: 'The morning after her first night in England, Ifemelu woke up smelling of sleep and stale perfume.',
    metadata: {
      title: 'Americanah',
      author: 'Chimamanda Ngozi Adichie',
      year: '2013',
      cover: null,
      moods: ['literary', 'identity', 'romance'],
      synopsis: 'A young Nigerian woman emigrates to the US for university, navigating race and identity.',
    },
  },
  {
    id: 'corpus_019',
    anatomy: 'opening_line',
    text: 'We did not ask to be born into this story.',
    metadata: {
      title: 'The Sympathizer',
      author: 'Viet Thanh Nguyen',
      year: '2015',
      cover: null,
      moods: ['literary', 'war', 'identity'],
      synopsis: 'A communist spy living as a South Vietnamese refugee recounts his experiences during and after the Vietnam War.',
    },
  },
  {
    id: 'corpus_020',
    anatomy: 'opening_line',
    text: 'They shoot the white girl first.',
    metadata: {
      title: 'Paradise',
      author: 'Toni Morrison',
      year: '1997',
      cover: null,
      moods: ['literary', 'dark', 'historical'],
      synopsis: 'An all-Black Oklahoma town raids a nearby women\'s commune, sending ripples of consequence.',
    },
  },

  // ── Dark academia / gothic ───────────────────────────────────────────────
  {
    id: 'corpus_021',
    anatomy: 'opening_line',
    text: 'The snow in the mountains was melting and Bunny had been dead for several weeks before we came to understand the gravity of our situation.',
    metadata: {
      title: 'The Secret History',
      author: 'Donna Tartt',
      year: '1992',
      cover: null,
      moods: ['dark academia', 'gothic', 'thriller'],
      synopsis: 'A group of classics students at a Vermont college are drawn together by their charismatic professor, leading to murder.',
    },
  },
  {
    id: 'corpus_022',
    anatomy: 'opening_line',
    text: 'No live organism can continue for long to exist sanely under conditions of absolute reality; even larks and katydids are supposed, by some, to dream.',
    metadata: {
      title: 'The Haunting of Hill House',
      author: 'Shirley Jackson',
      year: '1959',
      cover: null,
      moods: ['gothic', 'horror', 'psychological'],
      synopsis: 'Four people spend the summer in the notoriously haunted Hill House.',
    },
  },
  {
    id: 'corpus_023',
    anatomy: 'opening_line',
    text: 'I am not what you think I am.',
    metadata: {
      title: 'Ninth House',
      author: 'Leigh Bardugo',
      year: '2019',
      cover: null,
      moods: ['dark academia', 'fantasy', 'gothic'],
      synopsis: 'Galaxy Stern earns a scholarship to Yale, tasked with monitoring the activities of secret societies.',
    },
  },

  // ── Romance / coming of age ──────────────────────────────────────────────
  {
    id: 'corpus_024',
    anatomy: 'opening_line',
    text: 'I fell in love the way you fall asleep: slowly, and then all at once.',
    metadata: {
      title: 'The Fault in Our Stars',
      author: 'John Green',
      year: '2012',
      cover: null,
      moods: ['romantic', 'coming-of-age', 'emotional'],
      synopsis: 'Two teenagers with cancer meet at a support group and fall in love.',
    },
  },
  {
    id: 'corpus_025',
    anatomy: 'opening_line',
    text: 'When I was twelve, my father tried to sell my soul.',
    metadata: {
      title: 'The Knife of Never Letting Go',
      author: 'Patrick Ness',
      year: '2008',
      cover: null,
      moods: ['coming-of-age', 'sci-fi', 'dark'],
      synopsis: 'Todd Hewitt is the only boy in a town of men, about to discover a terrible secret.',
    },
  },

  // ── Dedications ──────────────────────────────────────────────────────────
  //
  //  Dedications are short, emotionally loaded, and what readers fall in love
  //  with before page one. This is a shelf superpower — no other tool indexes these.
  {
    id: 'corpus_ded_001',
    anatomy: 'dedication',
    text: 'For everyone who has ever felt too much, or not enough.',
    metadata: {
      title: 'Wintergirls',
      author: 'Laurie Halse Anderson',
      year: '2009',
      cover: null,
      moods: ['emotional', 'dark', 'coming-of-age'],
      synopsis: 'Lia, an eighteen-year-old struggling with anorexia, is haunted by the ghost of her best friend.',
    },
  },
  {
    id: 'corpus_ded_002',
    anatomy: 'dedication',
    text: 'To the ones who dream of a softer world.',
    metadata: {
      title: 'The House in the Cerulean Sea',
      author: 'TJ Klune',
      year: '2020',
      cover: null,
      moods: ['cozy', 'romantic', 'fantasy'],
      synopsis: 'A caseworker for magical children is sent to investigate a mysterious orphanage and its six dangerous children.',
    },
  },
  {
    id: 'corpus_ded_003',
    anatomy: 'dedication',
    text: 'For the girls who are told they are too much: you are not too much. The world has not yet caught up with you.',
    metadata: {
      title: 'Untamed',
      author: 'Glennon Doyle',
      year: '2020',
      cover: null,
      moods: ['memoir', 'empowering', 'emotional'],
      synopsis: 'Glennon Doyle recounts her journey of freeing herself from the expectations others had for her life.',
    },
  },
  {
    id: 'corpus_ded_004',
    anatomy: 'dedication',
    text: 'For you, if you\'re reading this. It means you\'re still here.',
    metadata: {
      title: 'All the Bright Places',
      author: 'Jennifer Niven',
      year: '2015',
      cover: null,
      moods: ['romantic', 'emotional', 'coming-of-age'],
      synopsis: 'Theodore Finch and Violet Markey meet on the ledge of their school bell tower and fall in love.',
    },
  },
  {
    id: 'corpus_ded_005',
    anatomy: 'dedication',
    text: 'To all the girls who fell apart and put themselves back together.',
    metadata: {
      title: 'The Sun and Her Flowers',
      author: 'Rupi Kaur',
      year: '2017',
      cover: null,
      moods: ['poetry', 'emotional', 'healing'],
      synopsis: 'A poetry collection about wilting, falling, rooting, rising, and blooming.',
    },
  },
  {
    id: 'corpus_ded_006',
    anatomy: 'dedication',
    text: 'To the weird kids. You\'re exactly right.',
    metadata: {
      title: 'Miss Peregrine\'s Home for Peculiar Children',
      author: 'Ransom Riggs',
      year: '2011',
      cover: null,
      moods: ['fantasy', 'gothic', 'coming-of-age'],
      synopsis: 'A teenage boy discovers a magical orphanage on a Welsh island.',
    },
  },

  // ── Epigraphs ─────────────────────────────────────────────────────────────
  {
    id: 'corpus_epig_001',
    anatomy: 'epigraph',
    text: 'What is grief, if not love persevering?',
    metadata: {
      title: 'WandaVision',
      author: 'Various',
      year: '2021',
      cover: null,
      moods: ['grief', 'love', 'emotional'],
      synopsis: 'Often used as an epigraph in grief memoirs and romance novels about loss.',
    },
  },
  {
    id: 'corpus_epig_002',
    anatomy: 'epigraph',
    text: 'She is too fond of books, and it has turned her brain.',
    metadata: {
      title: 'A Room with a View',
      author: 'E.M. Forster',
      year: '1908',
      cover: null,
      moods: ['classic', 'romantic', 'witty'],
      synopsis: 'A young Englishwoman finds herself torn between the spontaneous George Emerson and the conventional Cecil Vyse.',
    },
  },
  {
    id: 'corpus_epig_003',
    anatomy: 'epigraph',
    text: 'I took a deep breath and listened to the old brag of my heart: I am, I am, I am.',
    metadata: {
      title: 'The Bell Jar',
      author: 'Sylvia Plath',
      year: '1963',
      cover: null,
      moods: ['literary', 'dark', 'psychological'],
      synopsis: 'Esther Greenwood, a brilliant college student, descends into mental illness.',
    },
  },
  {
    id: 'corpus_epig_004',
    anatomy: 'epigraph',
    text: 'We are all just walking each other home.',
    metadata: {
      title: 'Be Here Now',
      author: 'Ram Dass',
      year: '1971',
      cover: null,
      moods: ['spiritual', 'philosophical', 'hopeful'],
      synopsis: 'A foundational text of the American spiritual movement.',
    },
  },
  {
    id: 'corpus_epig_005',
    anatomy: 'epigraph',
    text: 'For what it\'s worth: it\'s never too late or, in my case, too early to be whoever you want to be. There\'s no time limit, stop whenever you want.',
    metadata: {
      title: 'The Curious Case of Benjamin Button',
      author: 'F. Scott Fitzgerald',
      year: '1922',
      cover: null,
      moods: ['philosophical', 'bittersweet', 'classic'],
      synopsis: 'A man who ages in reverse, exploring what time, love, and identity really mean.',
    },
  },

  // ── More contemporary ────────────────────────────────────────────────────
  {
    id: 'corpus_026',
    anatomy: 'opening_line',
    text: 'There is no real ending. It\'s just the place where you stop the story.',
    metadata: {
      title: 'A Wizard of Earthsea',
      author: 'Ursula K. Le Guin',
      year: '1968',
      cover: null,
      moods: ['fantasy', 'coming-of-age', 'philosophical'],
      synopsis: 'A young boy discovers his gift for magic and must confront the shadow he unleashed upon the world.',
    },
  },
  {
    id: 'corpus_027',
    anatomy: 'opening_line',
    text: 'Once upon a time, there was a woman who discovered she had turned into the wrong person.',
    metadata: {
      title: 'Back When We Were Grownups',
      author: 'Anne Tyler',
      year: '2001',
      cover: null,
      moods: ['literary', 'bittersweet', 'character study'],
      synopsis: 'A woman looks back at her life and wonders if she made the right choices.',
    },
  },
  {
    id: 'corpus_028',
    anatomy: 'opening_line',
    text: 'The drought had lasted now for ten million years, and the reign of the terrible lizards had long since ended.',
    metadata: {
      title: '2001: A Space Odyssey',
      author: 'Arthur C. Clarke',
      year: '1968',
      cover: null,
      moods: ['sci-fi', 'philosophical', 'epic'],
      synopsis: 'A mysterious monolith guides early man toward evolution, and later leads astronauts on a journey to Jupiter.',
    },
  },
  {
    id: 'corpus_029',
    anatomy: 'opening_line',
    text: 'Renowned curator Jacques Saunière staggered through the vaulted archway of the museum\'s Grand Gallery.',
    metadata: {
      title: 'The Da Vinci Code',
      author: 'Dan Brown',
      year: '2003',
      cover: null,
      moods: ['thriller', 'mystery', 'fast-paced'],
      synopsis: 'Robert Langdon races to uncover a secret that could shake the foundations of Christianity.',
    },
  },
  {
    id: 'corpus_030',
    anatomy: 'opening_line',
    text: 'It was a queer, sultry summer, the summer they executed the Rosenbergs, and I didn\'t know what I was doing in New York.',
    metadata: {
      title: 'The Bell Jar',
      author: 'Sylvia Plath',
      year: '1963',
      cover: null,
      moods: ['literary', 'dark', 'coming-of-age'],
      synopsis: 'A semi-autobiographical novel about a young woman\'s descent into mental illness.',
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns just the opening lines entries (useful for building a lighter index)
export const OPENING_LINES_ONLY = OPENING_LINES_CORPUS.filter(
  e => e.anatomy === 'opening_line'
)

export const DEDICATIONS_ONLY = OPENING_LINES_CORPUS.filter(
  e => e.anatomy === 'dedication'
)

export const EPIGRAPHS_ONLY = OPENING_LINES_CORPUS.filter(
  e => e.anatomy === 'epigraph'
)