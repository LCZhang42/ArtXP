// Skill → preferred Pixabay image type
const SKILL_IMAGE_TYPE = {
  anatomy:     'illustration', // anatomy diagrams, 3D renders, medical art
  linework:    'illustration',
  gesture:     'photo',
  perspective: 'photo',
  composition: 'photo',
  lighting:    'photo',
};

export async function searchReferences(apiKey, query, count = 12, skill = null, page = 1) {
  const imageType = SKILL_IMAGE_TYPE[skill] || 'all';
  const url =
    `https://pixabay.com/api/?key=${apiKey}` +
    `&q=${encodeURIComponent(query)}` +
    `&image_type=${imageType}` +
    `&per_page=${count}` +
    `&page=${page}` +
    `&safesearch=true` +
    `&order=popular`;

  const response = await fetch(url);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Pixabay API error (${response.status})`);
  }

  const data = await response.json();
  return (data.hits || []).map(item => ({
    id:          String(item.id),
    url:         item.largeImageURL || item.webformatURL,
    smallUrl:    item.webformatURL,
    thumbUrl:    item.previewURL,
    description: item.tags || query,
    author:      item.user,
    authorUrl:   item.pageURL,
  }));
}

const ART_JARGON = [
  // technique / method names
  'loomis', 'bridgman', 'hogarth', 'reilly', 'vilppu', 'hampton',
  'method', 'technique', 'approach', 'system', 'principle', 'principles',
  'flow', 'form', 'forms', 'basic', 'advanced', 'simple', 'complex',
  // art process words
  'gesture', 'construction', 'study', 'studies', 'sketch', 'sketches',
  'drawing', 'drawings', 'exercise', 'practice', 'rendering', 'renderings',
  'illustration', 'painting', 'anatomy', 'proportion', 'proportions',
  'foreshortening', 'silhouette', 'contour', 'value', 'values', 'tone',
  'shading', 'crosshatching', 'hatching', 'blocking', 'layering',
  // style words that confuse Unsplash
  'anime', 'manga', 'cartoon', 'comic', 'chibi', 'stylized',
  'realistic', 'realism', 'semi', 'digital', 'traditional',
  // generic filler
  'reference', 'art', 'lv', 'level', 'pairs', 'pair', 'set', 'sets',
  'focus', 'focusing', 'using', 'with', 'and', 'the', 'for',
  'clump', 'clumps', 'weight', 'line',
];

const SKILL_QUALIFIERS = {
  gesture:     'full body action pose photo',
  anatomy:     'human body muscle form photo',
  perspective: 'architecture street depth vanishing point',
  composition: 'scenic landscape balanced framing',
  lighting:    'dramatic studio portrait side lighting',
  linework:    'detailed texture surface close-up',
};

const SUBJECT_MAP = {
  // animals
  cat:          'cat sitting standing lying various poses',
  cats:         'cat sitting standing lying various poses',
  kitten:       'kitten small cat cute poses',
  dog:          'dog running standing sitting poses',
  dogs:         'dog running standing sitting poses',
  puppy:        'puppy small dog poses',
  horse:        'horse standing running side view',
  bird:         'bird perched flying spread wings',
  rabbit:       'rabbit sitting standing poses',
  bear:         'bear standing full body',
  wolf:         'wolf standing full body side view',
  fox:          'fox standing sitting side view',
  lion:         'lion standing full body',
  tiger:        'tiger standing full body side view',
  animal:       'animal full body natural pose',
  animals:      'animals full body natural pose',
  // human body parts
  hand:         'person hand fingers open close-up photo',
  hands:        'person hands fingers open close-up photo',
  finger:       'person fingers hand detail close-up',
  fingers:      'person fingers hand detail close-up',
  fist:         'person closed fist hand tight',
  foot:         'person foot bare ground detail',
  feet:         'person feet bare ground detail',
  face:         'person face front portrait natural light',
  head:         'person face portrait natural light close-up',
  portrait:     'person face portrait natural light',
  skull:        'human skull bone structure',
  jaw:          'person face jaw chin side profile',
  cheek:        'person face cheek close-up',
  forehead:     'person face forehead close-up',
  brow:         'person face eyebrow close-up',
  eyebrow:      'person face eyebrow close-up',
  eye:          'person eye iris pupil close-up macro',
  eyelash:      'person eyelashes close-up detail',
  nose:         'person nose face profile close-up',
  lip:          'person lips mouth close-up',
  lips:         'person lips mouth close-up',
  mouth:        'person mouth lips expression close-up',
  ear:          'person ear side of head close-up',
  neck:         'person neck shoulder close-up',
  shoulder:     'person shoulder upper body close-up',
  back:         'person back upper body posterior view',
  chest:        'person chest upper body front view',
  torso:        'person torso upper body front view',
  belly:        'person stomach abdomen front view',
  hip:          'person hip lower body side view',
  knee:         'person knee leg bent close-up',
  leg:          'person leg standing full view',
  arm:          'person arm elbow raised',
  wrist:        'person wrist hand close-up',
  elbow:        'person elbow arm bent',
  // hair & skin
  hair:         'person hair strands flowing close-up',
  hairstyle:    'person hair styled different angles',
  fur:          'animal fur coat texture close-up',
  feather:      'bird feathers texture close-up macro',
  skin:         'person skin texture close-up',
  // figures
  figure:       'person full body standing neutral pose',
  human:        'person full body standing neutral pose',
  body:         'person full body fitness form',
  character:    'person full body standing front view',
  pose:         'person full body action pose',
  poses:        'person full body action poses multiple',
  muscle:       'person muscle fitness bodybuilder pose',
  // environment & objects
  environment:  'urban street outdoor environment',
  building:     'building exterior urban architecture',
  interior:     'room indoor architectural space',
  street:       'city street road perspective',
  tree:         'tree branches leaves outdoor',
  trees:        'forest trees outdoor natural',
  flower:       'flower close-up petals detail',
  fabric:       'fabric cloth folds texture close-up',
  cloth:        'fabric cloth draped folds',
  clothing:     'clothing folds fabric worn person',
  box:          'cardboard box cube angle perspective',
  cylinder:     'cylinder tube round object',
  sphere:       'ball sphere round object',
  rock:         'rock stone texture surface',
  water:        'water surface ripple wave',
  fire:         'fire flame light dynamic',
  cloud:        'cloud sky fluffy formation',
};

export function buildReferenceQuery(exerciseName, skill) {
  const lower = exerciseName.toLowerCase();

  // Find ALL matching subjects (not just the first)
  const matched = [];
  for (const [keyword, query] of Object.entries(SUBJECT_MAP)) {
    if (lower.includes(keyword)) {
      // avoid substring false positives: 'arm' inside 'warm', 'ear' inside 'bear'
      const re = new RegExp(`\\b${keyword}\\b`);
      if (re.test(lower)) {
        matched.push({ keyword, query });
      }
    }
  }

  if (matched.length === 1) {
    return matched[0].query;
  }

  if (matched.length > 1) {
    // Prefer longer (more specific) keywords, then combine the top two subjects
    matched.sort((a, b) => b.keyword.length - a.keyword.length);
    const subjects = matched.slice(0, 2).map(m => m.keyword).join(' ');
    return `${subjects} close-up detail photo`;
  }

  // Strip all art jargon to find the real subject
  const words = lower
    .split(/[\s,/]+/)
    .filter(w => !ART_JARGON.includes(w) && w.length > 2);

  const subject = words.join(' ').trim();

  // Fall back to skill-based qualifier
  const qualifier = SKILL_QUALIFIERS[skill] || 'full body pose photo';

  return subject ? `${subject} ${qualifier}` : qualifier;
}
