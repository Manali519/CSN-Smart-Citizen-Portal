// Category definitions given to Gemini (utils/gemini.js). Keys must match backend/src/config/complaintCategories.js.
// image_prompts: what a photo of the category shows. text_phrases: typical descriptions.
// Categories with empty lists accept anything that is not junk.
export const COMPLAINT_PHRASES = {
  categories: {
    water: {
      image_prompts: [
        'a photo of a leaking or burst water pipe',
        'a photo of a waterlogged or flooded street',
        'a photo of an overflowing drain or open sewer manhole',
        'a photo of dirty water coming out of a tap'
      ],
      text_phrases: [
        'water pipe is leaking',
        'no water supply in our area',
        'very low water pressure',
        'dirty contaminated drinking water',
        'drainage is blocked and overflowing',
        'sewage water flowing on the road',
        'waterlogging on the street after rain',
        'open manhole on the road'
      ]
    },
    sanitation: {
      image_prompts: [
        'a photo of garbage piled up on a street',
        'a photo of an overflowing garbage bin',
        'a photo of waste dumped in an open plot',
        'a photo of a dirty public toilet'
      ],
      text_phrases: [
        'garbage has not been collected for days',
        'dustbin is overflowing',
        'waste dumped on the roadside',
        'public toilet is dirty',
        'dead animal lying on the road',
        'mosquito breeding because of filth',
        'street is not swept'
      ]
    },
    administration: {
      image_prompts: [],
      text_phrases: [
        'certificate has not been issued',
        'property tax bill is wrong',
        'office staff asked for a bribe',
        'rude behaviour by municipal staff',
        'my application is pending for months',
        'no response from the ward office',
        'illegal construction not acted upon',
        'encroachment on public land'
      ]
    },
    roads: {
      image_prompts: [
        'a photo of a pothole on a road',
        'a photo of a cracked or broken road surface',
        'a photo of a damaged bridge or flyover',
        'a photo of a broken footpath or road divider'
      ],
      text_phrases: [
        'large pothole on the road',
        'road surface is broken',
        'road has caved in',
        'bridge is damaged',
        'footpath is broken',
        'speed breaker is damaged',
        'road work left incomplete'
      ]
    },
    electrical: {
      image_prompts: [
        'a photo of a broken street light pole',
        'a photo of a dark street at night with street lights off',
        'a photo of loose hanging electric wires',
        'a photo of a damaged electric pole or transformer'
      ],
      text_phrases: [
        'street light is not working',
        'street lights are off at night',
        'electric pole is broken',
        'electric wires are hanging loose',
        'sparks coming from a transformer',
        'power cut in our street'
      ]
    },
    others: {
      image_prompts: [],
      text_phrases: []
    }
  },
  generic_image_prompts: [
    'a photo of a street or public place in a city',
    'a photo of a government office or public building',
    'a photo of a paper document or notice'
  ],
  junk_image_prompts: [
    'a selfie of a person',
    'a photo of food on a plate',
    'a photo of a pet animal',
    'a screenshot or meme with text',
    'a cartoon or digital illustration',
    'a completely black or blank image'
  ],
  junk_text_phrases: [
    'test test test',
    'hello how are you',
    'asdf qwerty random letters',
    'this is just a joke',
    'buy now limited offer advertisement'
  ]
};
