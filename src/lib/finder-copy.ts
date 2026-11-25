import {accuracyLabels, verificationLabels} from './format';
import type {Locale} from './locales';
import type {Accuracy, Verification} from './types';

export interface FinderCopy {
  filterPlaces: string;
  accuracy: Record<Accuracy,string>;
  verification: Record<Verification,string>;
  categories: Readonly<Record<string,string>>;
  locationPending: string;
  near: string;
  away: string;
  openMap: string;
  openMapAccessible: string;
  mapUnavailable: string;
  priceTag: string;
  scoreTag: string;
  scoreTagSingle: string;
  metricTitle: string;
  priceStatus: string;
  anyPrice: string;
  hasPrice: string;
  currency: string;
  anyCurrency: string;
  maxPrice: string;
  currencyHint: string;
  score: string;
  anyScore: string;
  hasScore: string;
  scoreThreshold: string;
  metricsHelp: string;
  awaitingBoth: string;
  awaitingPrice: string;
  awaitingReviews: string;
  report: string;
  noScript: string;
  cityDirectory: string;
  fullList: string;
}

export const finderCopy: Record<Locale,FinderCopy> = {
  en: {
    filterPlaces:'Filter places', accuracy:accuracyLabels, verification:verificationLabels, categories:{},
    locationPending:'Location to be confirmed', near:'Under 0.1 km away', away:'{distance} km away',
    openMap:'Open in {provider}', openMapAccessible:'Open in {provider} · {place} (opens in a new tab)',
    mapUnavailable:'Map link unavailable', priceTag:'{price} last reported',
    scoreTag:'{score}/100 Puff Score · {count} reviews', scoreTagSingle:'{score}/100 Puff Score · {count} review',
    metricTitle:'Price and Puff Score', priceStatus:'Reported price', anyPrice:'Any price status', hasPrice:'Has a dated price',
    currency:'Currency', anyCurrency:'Any currency', maxPrice:'Maximum price', currencyHint:'Choose a currency first',
    score:'Puff Score', anyScore:'Any score status', hasScore:'Has an approved score', scoreThreshold:'{score}+ out of 100',
    metricsHelp:'Filters use the latest approved price and the weighted average of approved reviews.',
    awaitingBoth:'The atlas is waiting for its first approved prices and reviews.',
    awaitingPrice:'The atlas is waiting for its first approved prices.', awaitingReviews:'The atlas is waiting for its first approved reviews.',
    report:'Share a first-hand report', noScript:'The filters need JavaScript.',
    cityDirectory:'Browse the city directory', fullList:'Open the full place list on GitHub',
  },
  ml: {
    filterPlaces:'സ്ഥലങ്ങൾ ഫിൽട്ടർ ചെയ്യുക',
    accuracy:{estimated:'ഏകദേശ പിൻ', source_pin:'ആദ്യം ചേർത്ത പിൻ', verified:'സ്ഥിരീകരിച്ച പിൻ', unknown:'നിർദ്ദേശാങ്കങ്ങൾ ലഭ്യമല്ല'},
    verification:{unverified:'സ്ഥിരീകരിച്ചിട്ടില്ല', needs_details:'കൂടുതൽ വിവരങ്ങൾ വേണം', verified:'സ്ഥിരീകരിച്ചത്'},
    categories:{
      'Bakery or confectionery':'ബേക്കറി അല്ലെങ്കിൽ മിഠായിക്കട', 'Coordinate pin':'മാപ്പിലെ പിൻ',
      'Landmark or institution':'അടയാളസ്ഥലം അല്ലെങ്കിൽ സ്ഥാപനം', 'Restaurant or snack shop':'ഭക്ഷണശാല അല്ലെങ്കിൽ പലഹാരക്കട',
      'Store, market or dairy':'കട, ചന്ത അല്ലെങ്കിൽ പാൽക്കട', 'Tea or café':'ചായക്കട അല്ലെങ്കിൽ കഫേ',
      'Unclassified listing':'വിഭാഗം ചേർത്തിട്ടില്ല', 'Unlinked entry':'ലിങ്കില്ലാത്ത എൻട്രി',
    },
    locationPending:'സ്ഥലം സ്ഥിരീകരിക്കാനുണ്ട്', near:'0.1 കിലോമീറ്ററിൽ താഴെ', away:'{distance} കിലോമീറ്റർ അകലെ',
    openMap:'{provider} ൽ തുറക്കുക', openMapAccessible:'{place} · {provider} ൽ തുറക്കുക (പുതിയ ടാബിൽ)',
    mapUnavailable:'മാപ്പ് ലിങ്ക് ലഭ്യമല്ല', priceTag:'റിപ്പോർട്ട് ചെയ്ത അവസാന വില {price}',
    scoreTag:'പഫ് സ്കോർ {score}/100 · {count} അവലോകനങ്ങൾ', scoreTagSingle:'പഫ് സ്കോർ {score}/100 · ഒരു അവലോകനം',
    metricTitle:'വിലയും പഫ് സ്കോറും', priceStatus:'റിപ്പോർട്ട് ചെയ്ത വില', anyPrice:'വിലയുടെ ഏത് നിലയും', hasPrice:'തീയതിയോടെയുള്ള വിലയുണ്ട്',
    currency:'കറൻസി', anyCurrency:'ഏത് കറൻസിയും', maxPrice:'പരമാവധി വില', currencyHint:'ആദ്യം കറൻസി തിരഞ്ഞെടുക്കുക',
    score:'പഫ് സ്കോർ', anyScore:'സ്കോറിന്റെ ഏത് നിലയും', hasScore:'അംഗീകരിച്ച സ്കോറുണ്ട്', scoreThreshold:'100ൽ {score} അല്ലെങ്കിൽ കൂടുതൽ',
    metricsHelp:'ഏറ്റവും പുതിയ അംഗീകരിച്ച വിലയും അംഗീകരിച്ച അവലോകനങ്ങളുടെ ഭാരിത ശരാശരിയും ഫിൽട്ടറുകൾ ഉപയോഗിക്കുന്നു.',
    awaitingBoth:'അംഗീകരിച്ച വിലകളും അവലോകനങ്ങളും ഇതുവരെ ലഭ്യമല്ല.',
    awaitingPrice:'അംഗീകരിച്ച വിലകൾ ഇതുവരെ ലഭ്യമല്ല.', awaitingReviews:'അംഗീകരിച്ച അവലോകനങ്ങൾ ഇതുവരെ ലഭ്യമല്ല.',
    report:'നേരിട്ടുള്ള അനുഭവം പങ്കിടുക', noScript:'ഫിൽട്ടറുകൾ ഉപയോഗിക്കാൻ JavaScript വേണം.',
    cityDirectory:'നഗരങ്ങളുടെ പട്ടിക കാണുക', fullList:'GitHub ൽ മുഴുവൻ സ്ഥലങ്ങളും കാണുക',
  },
  hi: {
    filterPlaces:'जगहें फ़िल्टर करें',
    accuracy:{estimated:'अनुमानित पिन', source_pin:'मूल पिन', verified:'सत्यापित पिन', unknown:'निर्देशांक उपलब्ध नहीं हैं'},
    verification:{unverified:'असत्यापित', needs_details:'अधिक जानकारी चाहिए', verified:'सत्यापित'},
    categories:{
      'Bakery or confectionery':'बेकरी या मिठाई की दुकान', 'Coordinate pin':'नक्शे का पिन',
      'Landmark or institution':'पहचान की जगह या संस्था', 'Restaurant or snack shop':'रेस्तराँ या नाश्ते की दुकान',
      'Store, market or dairy':'दुकान, बाज़ार या डेयरी', 'Tea or café':'चाय की दुकान या कैफ़े',
      'Unclassified listing':'श्रेणी दर्ज नहीं है', 'Unlinked entry':'बिना लिंक की जगह',
    },
    locationPending:'जगह की पुष्टि बाकी है', near:'0.1 किलोमीटर से कम दूरी पर', away:'{distance} किलोमीटर दूर',
    openMap:'{provider} में खोलें', openMapAccessible:'{place} · {provider} में खोलें (नए टैब में)',
    mapUnavailable:'नक्शे का लिंक उपलब्ध नहीं है', priceTag:'पिछली दर्ज कीमत {price}',
    scoreTag:'पफ स्कोर {score}/100 · {count} समीक्षाएँ', scoreTagSingle:'पफ स्कोर {score}/100 · एक समीक्षा',
    metricTitle:'कीमत और पफ स्कोर', priceStatus:'दर्ज कीमत', anyPrice:'कीमत की कोई भी स्थिति', hasPrice:'तारीख के साथ कीमत दर्ज है',
    currency:'मुद्रा', anyCurrency:'कोई भी मुद्रा', maxPrice:'अधिकतम कीमत', currencyHint:'पहले मुद्रा चुनें',
    score:'पफ स्कोर', anyScore:'स्कोर की कोई भी स्थिति', hasScore:'स्वीकृत स्कोर है', scoreThreshold:'100 में से {score} या ज़्यादा',
    metricsHelp:'फ़िल्टर सबसे हाल की स्वीकृत कीमत और स्वीकृत समीक्षाओं के भारित औसत का इस्तेमाल करते हैं।',
    awaitingBoth:'स्वीकृत कीमतें और समीक्षाएँ अभी उपलब्ध नहीं हैं।',
    awaitingPrice:'स्वीकृत कीमतें अभी उपलब्ध नहीं हैं।', awaitingReviews:'स्वीकृत समीक्षाएँ अभी उपलब्ध नहीं हैं।',
    report:'अपना अनुभव साझा करें', noScript:'फ़िल्टर इस्तेमाल करने के लिए JavaScript चाहिए।',
    cityDirectory:'शहरों की सूची देखें', fullList:'GitHub पर सभी जगहों की सूची देखें',
  },
  ta: {
    filterPlaces:'இடங்களை வடிகட்டவும்',
    accuracy:{estimated:'தோராயமான இடக்குறி', source_pin:'அசல் இடக்குறி', verified:'சரிபார்க்கப்பட்ட இடக்குறி', unknown:'ஆயத்தொலைவுகள் தெரியவில்லை'},
    verification:{unverified:'சரிபார்க்கப்படவில்லை', needs_details:'கூடுதல் விவரம் தேவை', verified:'சரிபார்க்கப்பட்டது'},
    categories:{
      'Bakery or confectionery':'பேக்கரி அல்லது இனிப்புக் கடை', 'Coordinate pin':'வரைபட இடக்குறி',
      'Landmark or institution':'அடையாள இடம் அல்லது நிறுவனம்', 'Restaurant or snack shop':'உணவகம் அல்லது சிற்றுண்டிக் கடை',
      'Store, market or dairy':'கடை, சந்தை அல்லது பாலகம்', 'Tea or café':'தேநீர்க் கடை அல்லது கஃபே',
      'Unclassified listing':'வகை குறிப்பிடப்படவில்லை', 'Unlinked entry':'இணைப்பில்லாத பதிவு',
    },
    locationPending:'இடம் இன்னும் உறுதிசெய்யப்படவில்லை', near:'0.1 கிலோமீட்டருக்கும் குறைவான தொலைவு', away:'{distance} கிலோமீட்டர் தொலைவில்',
    openMap:'{provider} இல் திறக்கவும்', openMapAccessible:'{place} · {provider} இல் திறக்கவும் (புதிய தாவலில்)',
    mapUnavailable:'வரைபட இணைப்பு கிடைக்கவில்லை', priceTag:'கடைசியாகப் பதிவான விலை {price}',
    scoreTag:'பஃப் மதிப்பெண் {score}/100 · {count} மதிப்புரைகள்', scoreTagSingle:'பஃப் மதிப்பெண் {score}/100 · ஒரு மதிப்புரை',
    metricTitle:'விலையும் பஃப் மதிப்பெண்ணும்', priceStatus:'பதிவான விலை', anyPrice:'எந்த விலை நிலையும்', hasPrice:'தேதியுடன் விலை உள்ளது',
    currency:'நாணயம்', anyCurrency:'எந்த நாணயமும்', maxPrice:'அதிகபட்ச விலை', currencyHint:'முதலில் நாணயத்தைத் தேர்ந்தெடுக்கவும்',
    score:'பஃப் மதிப்பெண்', anyScore:'எந்த மதிப்பெண் நிலையும்', hasScore:'அங்கீகரிக்கப்பட்ட மதிப்பெண் உள்ளது', scoreThreshold:'100க்கு {score} அல்லது அதற்கு மேல்',
    metricsHelp:'வடிகட்டிகள் சமீபத்திய அங்கீகரிக்கப்பட்ட விலையையும் அங்கீகரிக்கப்பட்ட மதிப்புரைகளின் எடையிட்ட சராசரியையும் பயன்படுத்துகின்றன.',
    awaitingBoth:'அங்கீகரிக்கப்பட்ட விலைகளும் மதிப்புரைகளும் இன்னும் கிடைக்கவில்லை.',
    awaitingPrice:'அங்கீகரிக்கப்பட்ட விலைகள் இன்னும் கிடைக்கவில்லை.', awaitingReviews:'அங்கீகரிக்கப்பட்ட மதிப்புரைகள் இன்னும் கிடைக்கவில்லை.',
    report:'உங்கள் நேரடி அனுபவத்தைப் பகிரவும்', noScript:'வடிகட்டிகளைப் பயன்படுத்த JavaScript தேவை.',
    cityDirectory:'நகரங்களின் பட்டியலைப் பார்க்கவும்', fullList:'GitHub இல் முழு இடப் பட்டியலைப் பார்க்கவும்',
  },
  kn: {
    filterPlaces:'ಸ್ಥಳಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ',
    accuracy:{estimated:'ಅಂದಾಜು ಪಿನ್', source_pin:'ಮೂಲ ಪಿನ್', verified:'ಪರಿಶೀಲಿಸಿದ ಪಿನ್', unknown:'ನಿರ್ದೇಶಾಂಕಗಳು ಲಭ್ಯವಿಲ್ಲ'},
    verification:{unverified:'ಪರಿಶೀಲಿಸಿಲ್ಲ', needs_details:'ಹೆಚ್ಚಿನ ವಿವರ ಬೇಕು', verified:'ಪರಿಶೀಲಿಸಲಾಗಿದೆ'},
    categories:{
      'Bakery or confectionery':'ಬೇಕರಿ ಅಥವಾ ಸಿಹಿತಿಂಡಿ ಅಂಗಡಿ', 'Coordinate pin':'ನಕ್ಷೆಯ ಪಿನ್',
      'Landmark or institution':'ಗುರುತಿನ ಸ್ಥಳ ಅಥವಾ ಸಂಸ್ಥೆ', 'Restaurant or snack shop':'ಉಪಾಹಾರಗೃಹ ಅಥವಾ ತಿಂಡಿ ಅಂಗಡಿ',
      'Store, market or dairy':'ಅಂಗಡಿ, ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಡೈರಿ', 'Tea or café':'ಚಹಾ ಅಂಗಡಿ ಅಥವಾ ಕೆಫೆ',
      'Unclassified listing':'ವರ್ಗ ದಾಖಲಿಸಿಲ್ಲ', 'Unlinked entry':'ಲಿಂಕ್ ಇಲ್ಲದ ನಮೂದು',
    },
    locationPending:'ಸ್ಥಳದ ದೃಢೀಕರಣ ಬಾಕಿ ಇದೆ', near:'0.1 ಕಿಲೋಮೀಟರ್‌ಗಿಂತ ಕಡಿಮೆ ದೂರದಲ್ಲಿ', away:'{distance} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿ',
    openMap:'{provider} ನಲ್ಲಿ ತೆರೆಯಿರಿ', openMapAccessible:'{place} · {provider} ನಲ್ಲಿ ತೆರೆಯಿರಿ (ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ)',
    mapUnavailable:'ನಕ್ಷೆಯ ಲಿಂಕ್ ಲಭ್ಯವಿಲ್ಲ', priceTag:'ಕೊನೆಯದಾಗಿ ದಾಖಲಾದ ಬೆಲೆ {price}',
    scoreTag:'ಪಫ್ ಅಂಕ {score}/100 · {count} ವಿಮರ್ಶೆಗಳು', scoreTagSingle:'ಪಫ್ ಅಂಕ {score}/100 · ಒಂದು ವಿಮರ್ಶೆ',
    metricTitle:'ಬೆಲೆ ಮತ್ತು ಪಫ್ ಅಂಕ', priceStatus:'ದಾಖಲಾದ ಬೆಲೆ', anyPrice:'ಬೆಲೆಯ ಯಾವುದೇ ಸ್ಥಿತಿ', hasPrice:'ದಿನಾಂಕದೊಂದಿಗೆ ಬೆಲೆ ಇದೆ',
    currency:'ಕರೆನ್ಸಿ', anyCurrency:'ಯಾವುದೇ ಕರೆನ್ಸಿ', maxPrice:'ಗರಿಷ್ಠ ಬೆಲೆ', currencyHint:'ಮೊದಲು ಕರೆನ್ಸಿ ಆರಿಸಿ',
    score:'ಪಫ್ ಅಂಕ', anyScore:'ಅಂಕದ ಯಾವುದೇ ಸ್ಥಿತಿ', hasScore:'ಅನುಮೋದಿಸಿದ ಅಂಕ ಇದೆ', scoreThreshold:'100ರಲ್ಲಿ {score} ಅಥವಾ ಹೆಚ್ಚು',
    metricsHelp:'ಫಿಲ್ಟರ್‌ಗಳು ಇತ್ತೀಚಿನ ಅನುಮೋದಿತ ಬೆಲೆ ಮತ್ತು ಅನುಮೋದಿತ ವಿಮರ್ಶೆಗಳ ತೂಕದ ಸರಾಸರಿಯನ್ನು ಬಳಸುತ್ತವೆ.',
    awaitingBoth:'ಅನುಮೋದಿತ ಬೆಲೆಗಳು ಮತ್ತು ವಿಮರ್ಶೆಗಳು ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.',
    awaitingPrice:'ಅನುಮೋದಿತ ಬೆಲೆಗಳು ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.', awaitingReviews:'ಅನುಮೋದಿತ ವಿಮರ್ಶೆಗಳು ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.',
    report:'ನಿಮ್ಮ ನೇರ ಅನುಭವವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ', noScript:'ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಬಳಸಲು JavaScript ಬೇಕು.',
    cityDirectory:'ನಗರಗಳ ಪಟ್ಟಿಯನ್ನು ನೋಡಿ', fullList:'GitHub ನಲ್ಲಿ ಸಂಪೂರ್ಣ ಸ್ಥಳಪಟ್ಟಿಯನ್ನು ನೋಡಿ',
  },
};
