export type OptionDisplayType = 'swatch' | 'pill' | 'text';

export interface ProductOptionTemplate {
  id: string;
  key: string;
  label: string;
  displayType: OptionDisplayType;
  suggestedValues?: Array<{
    value: string;
    label: string;
    hex?: string;
  }>;
}

export interface ProductTemplate {
  id: string;
  title: string;
  optionGroups: ProductOptionTemplate[];
  notes?: string;
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    id: 'inci-star-keychain',
    title: 'İnci Yıldız Anahtarlık',
    optionGroups: [
      { id: 'ring-color', key: 'ringColor', label: 'Anahtarlık Halkası Rengi', displayType: 'swatch' },
      { id: 'bead-color', key: 'beadColor', label: 'Boncuk Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'wooden-star-keychain',
    title: 'Ahşap Yıldız Anahtarlık',
    optionGroups: [
      { id: 'ring-color', key: 'ringColor', label: 'Anahtarlık Halkası Rengi', displayType: 'swatch' },
      { id: 'bead-color', key: 'beadColor', label: 'Boncuk Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'tassel-wooden-star-keychain',
    title: 'Püsküllü Ahşap Yıldız Anahtarlık',
    optionGroups: [
      { id: 'ring-color', key: 'ringColor', label: 'Anahtarlık Halkası Rengi', displayType: 'swatch' },
      { id: 'bead-color', key: 'beadColor', label: 'Boncuk Rengi', displayType: 'swatch' },
      { id: 'tassel-color', key: 'tasselColor', label: 'Püskül Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'chocolate-star-keychain',
    title: 'Çikolatalı Yıldız Anahtarlık',
    optionGroups: [
      { id: 'ring-color', key: 'ringColor', label: 'Anahtarlık Halkası Rengi', displayType: 'swatch' },
      { id: 'bead-color', key: 'beadColor', label: 'Boncuk Rengi', displayType: 'swatch' },
      { id: 'coating-color', key: 'coatingColor', label: 'Çikolata Kaplaması Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'chocolate-wooden-star-keychain',
    title: 'Çikolatalı Ahşap Yıldız Anahtarlık',
    optionGroups: [
      { id: 'ring-color', key: 'ringColor', label: 'Anahtarlık Halkası Rengi', displayType: 'swatch' },
      { id: 'bead-color', key: 'beadColor', label: 'Boncuk Rengi', displayType: 'swatch' },
      { id: 'tassel-color', key: 'tasselColor', label: 'Püskül Rengi', displayType: 'swatch' },
      { id: 'coating-color', key: 'coatingColor', label: 'Çikolata Kaplaması Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'damla-macrame-keychain',
    title: 'Damla Makrome Anahtarlık',
    optionGroups: [
      { id: 'ring-color', key: 'ringColor', label: 'Anahtarlık Halkası Rengi', displayType: 'swatch' },
      { id: 'rope-color', key: 'ropeColor', label: 'İp Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'flat-macrame-keychain',
    title: 'Düz Makrome Anahtarlık',
    optionGroups: [
      { id: 'ring-color', key: 'ringColor', label: 'Anahtarlık Halkası Rengi', displayType: 'swatch' },
      { id: 'rope-color', key: 'ropeColor', label: 'İp Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'design-box-bubble-candle',
    title: 'Tasarım Kutu Bubble Mum',
    optionGroups: [
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'mica-box-bubble-candle',
    title: 'Mika Kutu Bubble Mum',
    optionGroups: [
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'lotus-candle',
    title: 'Lotus Mum',
    optionGroups: [
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'epoxy-magnet',
    title: 'Epoksi Magnet',
    optionGroups: [
      { id: 'magnet-shape', key: 'magnetShape', label: 'Magnet Şekli', displayType: 'pill' },
      { id: 'magnet-color', key: 'magnetColor', label: 'Magnet Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'pearl-epoxy-magnet',
    title: 'İncili Epoksi Magnet',
    optionGroups: [
      { id: 'magnet-shape', key: 'magnetShape', label: 'Magnet Şekli', displayType: 'pill' },
      { id: 'magnet-color', key: 'magnetColor', label: 'Magnet Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'round-cologne',
    title: 'Yuvarlak Kolonya Şişesi',
    optionGroups: [
      { id: 'cap-color', key: 'capColor', label: 'Kapak Rengi', displayType: 'swatch' },
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
      { id: 'ribbon-model', key: 'ribbonModel', label: 'Kurdele Modeli', displayType: 'pill' },
    ],
  },
  {
    id: 'hex-cologne',
    title: 'Altıgen Kolonya Şişesi',
    optionGroups: [
      { id: 'cap-color', key: 'capColor', label: 'Kapak Rengi', displayType: 'swatch' },
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
      { id: 'ribbon-model', key: 'ribbonModel', label: 'Kurdele Modeli', displayType: 'pill' },
    ],
  },
  {
    id: 'rectangle-cologne',
    title: 'Dikdörtgen Kolonya Şişesi',
    optionGroups: [
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
      { id: 'ribbon-model', key: 'ribbonModel', label: 'Kurdele Modeli', displayType: 'pill' },
    ],
  },
  {
    id: 'apple-cologne',
    title: 'Elma Kolonya Şişesi',
    optionGroups: [
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
      { id: 'ribbon-model', key: 'ribbonModel', label: 'Kurdele Modeli', displayType: 'pill' },
    ],
  },
  {
    id: 'engagement-chocolate',
    title: 'İsteme Çikolatası',
    optionGroups: [
      { id: 'box-color', key: 'boxColor', label: 'Kutu Rengi', displayType: 'swatch' },
      { id: 'coating-color', key: 'coatingColor', label: 'Çikolata Kaplaması Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'cardboard-chocolate',
    title: 'Karton Kutu Çikolata',
    optionGroups: [
      { id: 'coating-color', key: 'coatingColor', label: 'Çikolata Kaplaması Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'room-diffuser',
    title: 'Oda Kokusu',
    optionGroups: [
      { id: 'cap-color', key: 'capColor', label: 'Kapak Rengi', displayType: 'swatch' },
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'gift-room-set',
    title: 'Hediyelik Seti',
    optionGroups: [
      { id: 'cap-color', key: 'capColor', label: 'Kapak Rengi', displayType: 'swatch' },
      { id: 'ribbon-color', key: 'ribbonColor', label: 'Kurdele Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'boxed-engagement-bouquet',
    title: 'Kutuda İsteme Çiçeği',
    optionGroups: [
      { id: 'flower-color', key: 'flowerColor', label: 'Çiçek Rengi', displayType: 'swatch' },
      { id: 'box-color', key: 'boxColor', label: 'Kutu Rengi', displayType: 'swatch' },
      { id: 'plexi-color', key: 'plexiColor', label: 'Pleksi Rengi', displayType: 'swatch' },
    ],
  },
  {
    id: 'bouquet-engagement-flower',
    title: 'Buket İsteme Çiçeği',
    optionGroups: [
      { id: 'flower-color', key: 'flowerColor', label: 'Çiçek Rengi', displayType: 'swatch' },
      { id: 'plexi-color', key: 'plexiColor', label: 'Pleksi Rengi', displayType: 'swatch' },
      { id: 'cellophane-color', key: 'cellophaneColor', label: 'Selefon Rengi', displayType: 'swatch' },
    ],
  },
];

export function findProductTemplate(templateId: string): ProductTemplate | undefined {
  return PRODUCT_TEMPLATES.find((template) => template.id === templateId);
}
