import type {Locale} from './locales.ts';

const aliases: Record<string, Partial<Record<Locale, string>>> = {
  Alappuzha: {ml:'ആലപ്പുഴ',hi:'आलप्पुषा',ta:'ஆலப்புழா',kn:'ಆಲಪ್ಪುಳ'},
  Bengaluru: {en:'Bangalore',ml:'ബെംഗളൂരു',hi:'बेंगलुरु',ta:'பெங்களூரு',kn:'ಬೆಂಗಳೂರು'},
  Chennai: {en:'Madras',ml:'ചെന്നൈ',hi:'चेन्नई',ta:'சென்னை',kn:'ಚೆನ್ನೈ'},
  Coimbatore: {en:'Kovai',ml:'കോയമ്പത്തൂർ',hi:'कोयंबटूर',ta:'கோயம்புத்தூர்',kn:'ಕೊಯಮತ್ತೂರು'},
  Dubai: {ml:'ദുബായ്',hi:'दुबई',ta:'துபாய்',kn:'ದುಬೈ'},
  Hyderabad: {ml:'ഹൈദരാബാദ്',hi:'हैदराबाद',ta:'ஹைதராபாத்',kn:'ಹೈದರಾಬಾದ್'},
  Kannur: {en:'Cannanore',ml:'കണ്ണൂർ',hi:'कन्नूर',ta:'கண்ணூர்',kn:'ಕಣ್ಣೂರು'},
  Kochi: {en:'Cochin',ml:'കൊച്ചി',hi:'कोच्चि',ta:'கொச்சி',kn:'ಕೊಚ್ಚಿ'},
  Kollam: {en:'Quilon',ml:'കൊല്ലം',hi:'कोल्लम',ta:'கொல்லம்',kn:'ಕೊಲ್ಲಂ'},
  Kottayam: {ml:'കോട്ടയം',hi:'कोट्टायम',ta:'கோட்டயம்',kn:'ಕೊಟ್ಟಾಯಂ'},
  Kozhikode: {en:'Calicut',ml:'കോഴിക്കോട്',hi:'कोझिकोड',ta:'கோழிக்கோடு',kn:'ಕೋಝಿಕ್ಕೋಡ್'},
  Liverpool: {ml:'ലിവർപൂൾ',hi:'लिवरपूल',ta:'லிவர்பூல்',kn:'ಲಿವರ್‌ಪೂಲ್'},
  Malappuram: {ml:'മലപ്പുറം',hi:'मलप्पुरम',ta:'மலப்புரம்',kn:'ಮಲಪ್ಪುರಂ'},
  Mangaluru: {en:'Mangalore',ml:'മംഗളൂരു',hi:'मंगलुरु',ta:'மங்களூரு',kn:'ಮಂಗಳೂರು'},
  Mumbai: {en:'Bombay',ml:'മുംബൈ',hi:'मुंबई',ta:'மும்பை',kn:'ಮುಂಬೈ'},
  Mysuru: {en:'Mysore',ml:'മൈസൂരു',hi:'मैसूर',ta:'மைசூரு',kn:'ಮೈಸೂರು'},
  Pala: {ml:'പാലാ',hi:'पाला',ta:'பாலா',kn:'ಪಾಲಾ'},
  Pune: {ml:'പുണെ',hi:'पुणे',ta:'புனே',kn:'ಪುಣೆ'},
  Thalassery: {en:'Tellicherry',ml:'തലശ്ശേരി',hi:'तलश्शेरी',ta:'தலச்சேரி',kn:'ತಲಶ್ಶೇರಿ'},
  Thiruvananthapuram: {en:'Trivandrum',ml:'തിരുവനന്തപുരം',hi:'तिरुवनंतपुरम',ta:'திருவனந்தபுரம்',kn:'ತಿರುವನಂತಪುರಂ'},
  Thrissur: {en:'Trichur',ml:'തൃശ്ശൂർ',hi:'त्रिशूर',ta:'திருச்சூர்',kn:'ತ್ರಿಶ್ಶೂರು'},
  Udupi: {ml:'ഉഡുപ്പി',hi:'उडुपी',ta:'உடுப்பி',kn:'ಉಡುಪಿ'},
  Kerala: {ml:'കേരളം',hi:'केरल',ta:'கேரளம்',kn:'ಕೇರಳ'},
  'Tamil Nadu': {ml:'തമിഴ്നാട്',hi:'तमिलनाडु',ta:'தமிழ்நாடு',kn:'ತಮಿಳುನಾಡು'},
  Karnataka: {ml:'കർണാടക',hi:'कर्नाटक',ta:'கர்நாடகம்',kn:'ಕರ್ನಾಟಕ'},
  Telangana: {ml:'തെലങ്കാന',hi:'तेलंगाना',ta:'தெலங்கானா',kn:'ತೆಲಂಗಾಣ'},
};

export const searchText = (value: string) => value.normalize('NFC').replace(/\u200c|\u200d/g,'').trim();
export const placeNameAliases = (names: (string | null)[]) =>
  [...new Set(names.flatMap(name => name ? Object.values(aliases[name] ?? {}).map(searchText) : []))];
export const translatedPlaceName = (name: string, locale: Locale) => locale === 'en' ? name : aliases[name]?.[locale] ?? name;
