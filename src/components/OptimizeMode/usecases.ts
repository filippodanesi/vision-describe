export type UseCase = 'ecommerce' | 'sloggi-ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';

export type MappingField =
  | 'productId'
  | 'title'
  | 'descriptionIn'
  | 'bulletIn1'
  | 'bulletIn2'
  | 'bulletIn3'
  | 'bulletIn4'
  | 'bulletIn5';

export interface UseCaseProfile {
  id: string;
  label: string;
  detectors: Record<MappingField, RegExp[]>;
  required: MappingField[];
  outputColumns: string[];
}

const rx = (pattern: string): RegExp => new RegExp(pattern, 'i');

export const USECASE_PROFILES: Record<UseCase, UseCaseProfile> = {
  amazon: {
    id: 'amazon-bra-v1',
    label: 'Amazon (Distance Retail)',
    detectors: {
      productId: [rx('^vendor_sku#1\\.value$'), rx('external_product_id#1\\.value'), rx('asin'), rx('sku')],
      title: [rx('^item_name#1\\.value$')],
      descriptionIn: [rx('^rtip_product_description#1\\.value$')],
      bulletIn1: [rx('^bullet_point#1\\.value$')],
      bulletIn2: [rx('^bullet_point#2\\.value$')],
      bulletIn3: [rx('^bullet_point#3\\.value$')],
      bulletIn4: [rx('^bullet_point#4\\.value$')],
      bulletIn5: [rx('^bullet_point#5\\.value$')],
    },
    required: ['productId'],
    outputColumns: [
      'gen_bullet_1',
      'gen_bullet_2',
      'gen_bullet_3',
      'gen_bullet_4',
      'gen_bullet_5',
      'gen_description',
      'gen_aplus_short',
    ],
  },
  ecommerce: {
    id: 'inriver-ecommerce-v1',
    label: 'E-commerce (triumph.com)',
    detectors: {
      productId: [rx('^MaterialSAPMaterialNo$')],
      title: [rx('^MaterialSeriesName$')],
      descriptionIn: [rx('^MaterialLongDescriptionEcom_([a-z]{2})$')],
      bulletIn1: [rx('^Short description .*')],
      bulletIn2: [rx('^Short description .*')],
      bulletIn3: [rx('^Short description .*')],
      bulletIn4: [rx('^Short description .*')],
      bulletIn5: [rx('^Short description .*')],
    },
    required: ['productId', 'descriptionIn'],
    outputColumns: ['gen_description'],
  },
  'sloggi-ecommerce': {
    id: 'inriver-sloggi-ecommerce-v1',
    label: 'E-commerce (sloggi.com)',
    detectors: {
      productId: [rx('^MaterialSAPMaterialNo$')],
      title: [rx('^MaterialSeriesName$')],
      descriptionIn: [rx('^MaterialLongDescriptionEcom_([a-z]{2})$')],
      bulletIn1: [rx('^Short description .*')],
      bulletIn2: [rx('^Short description .*')],
      bulletIn3: [rx('^Short description .*')],
      bulletIn4: [rx('^Short description .*')],
      bulletIn5: [rx('^Short description .*')],
    },
    required: ['productId', 'descriptionIn'],
    outputColumns: ['gen_description'],
  },
  zalando: {
    id: 'zalando-v0',
    label: 'Zalando (TBD)',
    detectors: {
      productId: [],
      title: [],
      descriptionIn: [],
      bulletIn1: [],
      bulletIn2: [],
      bulletIn3: [],
      bulletIn4: [],
      bulletIn5: [],
    },
    required: [],
    outputColumns: [],
  },
  aboutyou: {
    id: 'aboutyou-v0',
    label: 'About You (Distance Retail)',
    detectors: {
      productId: [],
      title: [],
      descriptionIn: [],
      bulletIn1: [],
      bulletIn2: [],
      bulletIn3: [],
      bulletIn4: [],
      bulletIn5: [],
    },
    required: [],
    outputColumns: [],
  },
  next: {
    id: 'next-v0',
    label: 'NEXT (Distance Retail)',
    detectors: {
      productId: [],
      title: [],
      descriptionIn: [],
      bulletIn1: [],
      bulletIn2: [],
      bulletIn3: [],
      bulletIn4: [],
      bulletIn5: [],
    },
    required: [],
    outputColumns: [],
  },
  partoo: {
    id: 'partoo-stores-v1',
    label: 'Partoo (Store Locator)',
    detectors: {
      productId: [rx('^Business Id$'), rx('^Business identification$'), rx('^Code$')],
      title: [rx('^Name$')],
      descriptionIn: [rx('^Short description$'), rx('^Long description$')],
      bulletIn1: [],
      bulletIn2: [],
      bulletIn3: [],
      bulletIn4: [],
      bulletIn5: [],
    },
    required: ['productId', 'title'],
    outputColumns: [], // Partoo updates existing columns, doesn't add new ones
  },
};

const HIDDEN_USE_CASES: UseCase[] = ['zalando'];

export const AVAILABLE_USE_CASES: { value: UseCase; label: string }[] = (
  Object.keys(USECASE_PROFILES) as UseCase[]
)
  .filter((key) => !HIDDEN_USE_CASES.includes(key))
  .map((key) => ({ value: key, label: USECASE_PROFILES[key].label }));


