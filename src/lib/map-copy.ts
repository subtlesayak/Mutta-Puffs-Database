import type {Locale} from './locales';
import type {Accuracy} from './types';

const en = {
  description:'Explore saved egg puff spots with clustered pins, city filters, and coordinate accuracy labels.',
  intro:'Zoom into a cluster or choose a city to see the places nearby. Estimated pins mark a general area.',
  view:'View', map:'Map', list:'List', city:'City', allCities:'All cities', filters:'Filters',
  basemap:'Base map', offline:'Offline atlas', streets:'OpenStreetMap streets', trail:'Puff trail', allPlaces:'All places',
  accuracy:'Coordinate accuracy', pins:'All pins', selectPin:'Select a pin', showDensity:'Show density',
  atlasCanvas:'Interactive map of saved puff places', googleCanvas:'Google map of saved puff places',
  savedPlaces:'Saved places', cluster:'Cluster', density:'Density of saved places', attribution:'© OpenStreetMap contributors',
  tileNote:'The offline atlas uses locally hosted Natural Earth outlines. Choose OpenStreetMap streets under Filters for street detail. Street tiles load from OpenStreetMap when you choose that view.',
  searchList:'Search the place list', index:'Browse mappable places without using the map',
  noScript:'The map needs JavaScript. Explore a city directory instead.',
  status:{
    loading:'Loading the atlas map…', loadError:'Could not load the interactive directory. Browse the saved places below.',
    active:' · {count} active', mapCount:'{places} on the map.', listCount:'{places} in the list.',
    empty:'No places match. Clear filters or choose another area.',
    unavailable:'The interactive map is unavailable on this device.',
    googleLoading:'Loading Google Maps…', googleFailure:'Google Maps could not load. The atlas map is available.',
    streetFailure:'Street tiles are unavailable. Showing the offline atlas.',
  },
  controls:{zoomIn:'Zoom in',zoomOut:'Zoom out',locate:'Find my location',locationUnavailable:'Location not available',close:'Close popup'},
};

export type MapCopy = typeof en;
export type MapRuntimeCopy = MapCopy['status'] & {
  controls: MapCopy['controls'];
  atlasCanvas: string;
  accuracy: Record<Accuracy,string>;
  allDistricts: string;
  choosePlace: string;
  placeOne: string;
  placeMany: string;
};

const ml: MapCopy = {
  description:'മുട്ട പഫ്സ് കിട്ടുന്ന സ്ഥലങ്ങൾ നഗരവും പിൻ കൃത്യതയും നോക്കി കണ്ടെത്താം.',
  intro:'പിൻ കൂട്ടം വലുതാക്കി നോക്കുകയോ ഒരു നഗരം തിരഞ്ഞെടുക്കുകയോ ചെയ്യുക. ഏകദേശ പിന്നുകൾ പൊതുവായ പ്രദേശമാണ് കാണിക്കുന്നത്.',
  view:'കാഴ്ച', map:'ഭൂപടം', list:'പട്ടിക', city:'നഗരം', allCities:'എല്ലാ നഗരങ്ങളും', filters:'ഫിൽട്ടറുകൾ',
  basemap:'അടിസ്ഥാന ഭൂപടം', offline:'ഓഫ്‌ലൈൻ അറ്റ്‌ലസ്', streets:'OpenStreetMap തെരുവുകൾ', trail:'പഫ് പാത', allPlaces:'എല്ലാ സ്ഥലങ്ങളും',
  accuracy:'പിന്നിന്റെ കൃത്യത', pins:'എല്ലാ പിന്നുകളും', selectPin:'ഒരു പിൻ തിരഞ്ഞെടുക്കുക', showDensity:'സ്ഥലങ്ങളുടെ സാന്ദ്രത കാണിക്കുക',
  atlasCanvas:'സൂക്ഷിച്ച പഫ് സ്ഥലങ്ങളുടെ സംവേദനാത്മക ഭൂപടം', googleCanvas:'സൂക്ഷിച്ച പഫ് സ്ഥലങ്ങളുടെ Google ഭൂപടം',
  savedPlaces:'സൂക്ഷിച്ച സ്ഥലങ്ങൾ', cluster:'പിൻ കൂട്ടം', density:'സൂക്ഷിച്ച സ്ഥലങ്ങളുടെ സാന്ദ്രത', attribution:'© OpenStreetMap സംഭാവനക്കാർ',
  tileNote:'ഓഫ്‌ലൈൻ അറ്റ്‌ലസ് സ്വന്തം സൈറ്റിലുള്ള Natural Earth അതിരുകൾ ഉപയോഗിക്കുന്നു. തെരുവുകൾ കാണാൻ ഫിൽട്ടറുകളിൽ OpenStreetMap തിരഞ്ഞെടുക്കുക. അപ്പോൾ തെരുവ് ഭൂപടം OpenStreetMap ൽ നിന്ന് ലഭിക്കും.',
  searchList:'സ്ഥലങ്ങളുടെ പട്ടികയിൽ തിരയുക', index:'ഭൂപടം ഉപയോഗിക്കാതെ പിന്നുള്ള സ്ഥലങ്ങൾ കാണുക',
  noScript:'ഭൂപടം ഉപയോഗിക്കാൻ JavaScript വേണം. നഗരങ്ങളുടെ പട്ടികയിൽ സ്ഥലങ്ങൾ കാണാം.',
  status:{
    loading:'അറ്റ്‌ലസ് ഭൂപടം തുറക്കുന്നു…', loadError:'ഭൂപട പട്ടിക തുറക്കാനായില്ല. താഴെയുള്ള സ്ഥലങ്ങൾ കാണുക.',
    active:' · {count} സജീവം', mapCount:'ഭൂപടത്തിൽ {places}.', listCount:'പട്ടികയിൽ {places}.',
    empty:'പൊരുത്തമുള്ള സ്ഥലങ്ങളില്ല. ഫിൽട്ടറുകൾ നീക്കുകയോ മറ്റൊരു പ്രദേശം തിരഞ്ഞെടുക്കുകയോ ചെയ്യുക.',
    unavailable:'ഈ ഉപകരണത്തിൽ സംവേദനാത്മക ഭൂപടം ലഭ്യമല്ല.',
    googleLoading:'Google Maps തുറക്കുന്നു…', googleFailure:'Google Maps തുറക്കാനായില്ല. അറ്റ്‌ലസ് ഭൂപടം ഉപയോഗിക്കാം.',
    streetFailure:'തെരുവ് ഭൂപടം ലഭ്യമല്ല. ഓഫ്‌ലൈൻ അറ്റ്‌ലസ് കാണിക്കുന്നു.',
  },
  controls:{zoomIn:'വലുതാക്കുക',zoomOut:'ചെറുതാക്കുക',locate:'എന്റെ സ്ഥലം കണ്ടെത്തുക',locationUnavailable:'സ്ഥലം ലഭ്യമല്ല',close:'പോപ്പപ്പ് അടയ്ക്കുക'},
};

const hi: MapCopy = {
  description:'समुदाय की सुझाई एग पफ की जगहें शहर, पिन समूह और पिन की सटीकता के साथ देखें।',
  intro:'किसी पिन समूह को ज़ूम करें या पास की जगहों के लिए शहर चुनें। अनुमानित पिन सामान्य इलाका दिखाते हैं।',
  view:'दृश्य', map:'नक्शा', list:'सूची', city:'शहर', allCities:'सभी शहर', filters:'फ़िल्टर',
  basemap:'आधार नक्शा', offline:'ऑफ़लाइन नक्शा', streets:'OpenStreetMap की सड़कें', trail:'पफ मार्ग', allPlaces:'सभी जगहें',
  accuracy:'पिन की सटीकता', pins:'सभी पिन', selectPin:'पिन चुनें', showDensity:'जगहों का घनत्व दिखाएँ',
  atlasCanvas:'दर्ज पफ की जगहों का इंटरैक्टिव नक्शा', googleCanvas:'दर्ज पफ की जगहों का Google नक्शा',
  savedPlaces:'दर्ज जगहें', cluster:'पिन समूह', density:'दर्ज जगहों का घनत्व', attribution:'© OpenStreetMap के योगदानकर्ता',
  tileNote:'ऑफ़लाइन नक्शा इसी साइट पर रखी Natural Earth की सीमाएँ इस्तेमाल करता है। सड़कों के लिए फ़िल्टर में OpenStreetMap चुनें। उस विकल्प को चुनने पर सड़क का नक्शा OpenStreetMap से आता है।',
  searchList:'जगहों की सूची में खोजें', index:'नक्शा खोले बिना पिन वाली जगहें देखें',
  noScript:'नक्शे के लिए JavaScript चाहिए। शहरों की सूची में जगहें देख सकते हैं।',
  status:{
    loading:'नक्शा खुल रहा है…', loadError:'नक्शे की सूची नहीं खुली। नीचे दर्ज जगहें देखें।',
    active:' · {count} लागू', mapCount:'नक्शे पर {places}।', listCount:'सूची में {places}।',
    empty:'कोई जगह नहीं मिली। फ़िल्टर हटाएँ या कोई दूसरा इलाका चुनें।',
    unavailable:'इस डिवाइस पर इंटरैक्टिव नक्शा उपलब्ध नहीं है।',
    googleLoading:'Google Maps खुल रहा है…', googleFailure:'Google Maps नहीं खुला। एटलस का नक्शा उपलब्ध है।',
    streetFailure:'सड़क का नक्शा उपलब्ध नहीं है। ऑफ़लाइन नक्शा दिख रहा है।',
  },
  controls:{zoomIn:'ज़ूम बढ़ाएँ',zoomOut:'ज़ूम घटाएँ',locate:'मेरी लोकेशन खोजें',locationUnavailable:'लोकेशन उपलब्ध नहीं है',close:'पॉपअप बंद करें'},
};

const ta: MapCopy = {
  description:'நகரம், இடக்குறிக் குழு, இடக்குறியின் துல்லியம் ஆகியவற்றைப் பயன்படுத்தி முட்டை பஃப் கிடைக்கும் இடங்களைப் பாருங்கள்.',
  intro:'அருகிலுள்ள இடங்களைப் பார்க்க இடக்குறிக் குழுவைப் பெரிதாக்குங்கள் அல்லது ஒரு நகரத்தைத் தேர்ந்தெடுங்கள். தோராயமான இடக்குறிகள் பொதுவான பகுதியைக் காட்டும்.',
  view:'காட்சி', map:'வரைபடம்', list:'பட்டியல்', city:'நகரம்', allCities:'அனைத்து நகரங்களும்', filters:'வடிகட்டிகள்',
  basemap:'அடிப்படை வரைபடம்', offline:'இணைப்பில்லா வரைபடம்', streets:'OpenStreetMap தெருக்கள்', trail:'பஃப் வழித்தடம்', allPlaces:'அனைத்து இடங்களும்',
  accuracy:'இடக்குறியின் துல்லியம்', pins:'அனைத்து இடக்குறிகளும்', selectPin:'ஓர் இடக்குறியைத் தேர்ந்தெடுங்கள்', showDensity:'இடங்களின் அடர்த்தியைக் காட்டுங்கள்',
  atlasCanvas:'பதிவான பஃப் இடங்களின் ஊடாடும் வரைபடம்', googleCanvas:'பதிவான பஃப் இடங்களின் Google வரைபடம்',
  savedPlaces:'பதிவான இடங்கள்', cluster:'இடக்குறிக் குழு', density:'பதிவான இடங்களின் அடர்த்தி', attribution:'© OpenStreetMap பங்களிப்பாளர்கள்',
  tileNote:'இணைப்பில்லா வரைபடம் இந்தத் தளத்தில் உள்ள Natural Earth எல்லைகளைப் பயன்படுத்தும். தெருக்களைப் பார்க்க வடிகட்டிகளில் OpenStreetMap ஐத் தேர்ந்தெடுங்கள். தேர்ந்தெடுத்தவுடன் தெரு வரைபடம் OpenStreetMap இலிருந்து பெறப்படும்.',
  searchList:'இடங்களின் பட்டியலில் தேடுங்கள்', index:'வரைபடத்தைத் திறக்காமல் இடக்குறி உள்ள இடங்களைப் பாருங்கள்',
  noScript:'வரைபடத்திற்கு JavaScript தேவை. நகரப் பட்டியலில் இடங்களைப் பார்க்கலாம்.',
  status:{
    loading:'வரைபடம் திறக்கிறது…', loadError:'வரைபடப் பட்டியலைத் திறக்க முடியவில்லை. கீழே பதிவான இடங்களைப் பாருங்கள்.',
    active:' · {count} செயலில்', mapCount:'வரைபடத்தில் {places}.', listCount:'பட்டியலில் {places}.',
    empty:'பொருந்தும் இடங்கள் இல்லை. வடிகட்டிகளை நீக்குங்கள் அல்லது வேறு பகுதியைத் தேர்ந்தெடுங்கள்.',
    unavailable:'இந்தச் சாதனத்தில் ஊடாடும் வரைபடம் கிடைக்கவில்லை.',
    googleLoading:'Google Maps திறக்கிறது…', googleFailure:'Google Maps திறக்கவில்லை. தளத்தின் வரைபடத்தைப் பயன்படுத்தலாம்.',
    streetFailure:'தெரு வரைபடம் கிடைக்கவில்லை. இணைப்பில்லா வரைபடம் காட்டப்படுகிறது.',
  },
  controls:{zoomIn:'பெரிதாக்குங்கள்',zoomOut:'சிறிதாக்குங்கள்',locate:'என் இருப்பிடத்தைக் கண்டறியுங்கள்',locationUnavailable:'இருப்பிடம் கிடைக்கவில்லை',close:'தகவல் சாளரத்தை மூடுங்கள்'},
};

const kn: MapCopy = {
  description:'ಮೊಟ್ಟೆ ಪಫ್ ಸಿಗುವ ಸ್ಥಳಗಳನ್ನು ನಗರ, ಪಿನ್ ಗುಂಪು ಮತ್ತು ಸ್ಥಳದ ನಿಖರತೆಯ ಮೂಲಕ ನೋಡಿ.',
  intro:'ಹತ್ತಿರದ ಸ್ಥಳಗಳನ್ನು ನೋಡಲು ಪಿನ್ ಗುಂಪನ್ನು ಹಿಗ್ಗಿಸಿ ಅಥವಾ ನಗರವನ್ನು ಆರಿಸಿ. ಅಂದಾಜು ಪಿನ್‌ಗಳು ಸಾಮಾನ್ಯ ಪ್ರದೇಶವನ್ನು ತೋರಿಸುತ್ತವೆ.',
  view:'ನೋಟ', map:'ನಕ್ಷೆ', list:'ಪಟ್ಟಿ', city:'ನಗರ', allCities:'ಎಲ್ಲ ನಗರಗಳು', filters:'ಫಿಲ್ಟರ್‌ಗಳು',
  basemap:'ಮೂಲ ನಕ್ಷೆ', offline:'ಆಫ್‌ಲೈನ್ ನಕ್ಷೆ', streets:'OpenStreetMap ರಸ್ತೆಗಳು', trail:'ಪಫ್ ಮಾರ್ಗ', allPlaces:'ಎಲ್ಲ ಸ್ಥಳಗಳು',
  accuracy:'ಪಿನ್‌ನ ನಿಖರತೆ', pins:'ಎಲ್ಲ ಪಿನ್‌ಗಳು', selectPin:'ಪಿನ್ ಆರಿಸಿ', showDensity:'ಸ್ಥಳಗಳ ಸಾಂದ್ರತೆ ತೋರಿಸಿ',
  atlasCanvas:'ದಾಖಲಿಸಿದ ಪಫ್ ಸ್ಥಳಗಳ ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆ', googleCanvas:'ದಾಖಲಿಸಿದ ಪಫ್ ಸ್ಥಳಗಳ Google ನಕ್ಷೆ',
  savedPlaces:'ದಾಖಲಿಸಿದ ಸ್ಥಳಗಳು', cluster:'ಪಿನ್ ಗುಂಪು', density:'ದಾಖಲಿಸಿದ ಸ್ಥಳಗಳ ಸಾಂದ್ರತೆ', attribution:'© OpenStreetMap ಕೊಡುಗೆದಾರರು',
  tileNote:'ಆಫ್‌ಲೈನ್ ನಕ್ಷೆ ಇದೇ ತಾಣದಲ್ಲಿರುವ Natural Earth ಗಡಿಗಳನ್ನು ಬಳಸುತ್ತದೆ. ರಸ್ತೆಗಳ ವಿವರಕ್ಕಾಗಿ ಫಿಲ್ಟರ್‌ಗಳಲ್ಲಿ OpenStreetMap ಆರಿಸಿ. ಆರಿಸಿದಾಗ ರಸ್ತೆ ನಕ್ಷೆ OpenStreetMap ನಿಂದ ಬರುತ್ತದೆ.',
  searchList:'ಸ್ಥಳಗಳ ಪಟ್ಟಿಯಲ್ಲಿ ಹುಡುಕಿ', index:'ನಕ್ಷೆ ತೆರೆಯದೆ ಪಿನ್ ಇರುವ ಸ್ಥಳಗಳನ್ನು ನೋಡಿ',
  noScript:'ನಕ್ಷೆಗೆ JavaScript ಬೇಕು. ನಗರ ಪಟ್ಟಿಯಲ್ಲಿ ಸ್ಥಳಗಳನ್ನು ನೋಡಬಹುದು.',
  status:{
    loading:'ನಕ್ಷೆ ತೆರೆಯುತ್ತಿದೆ…', loadError:'ನಕ್ಷೆಯ ಪಟ್ಟಿ ತೆರೆಯಲಿಲ್ಲ. ಕೆಳಗೆ ದಾಖಲಿಸಿದ ಸ್ಥಳಗಳನ್ನು ನೋಡಿ.',
    active:' · {count} ಸಕ್ರಿಯ', mapCount:'ನಕ್ಷೆಯಲ್ಲಿ {places}.', listCount:'ಪಟ್ಟಿಯಲ್ಲಿ {places}.',
    empty:'ಹೊಂದುವ ಸ್ಥಳಗಳು ಸಿಗಲಿಲ್ಲ. ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆಗೆದುಹಾಕಿ ಅಥವಾ ಬೇರೆ ಪ್ರದೇಶವನ್ನು ಆರಿಸಿ.',
    unavailable:'ಈ ಸಾಧನದಲ್ಲಿ ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆ ಲಭ್ಯವಿಲ್ಲ.',
    googleLoading:'Google Maps ತೆರೆಯುತ್ತಿದೆ…', googleFailure:'Google Maps ತೆರೆಯಲಿಲ್ಲ. ಅಟ್ಲಸ್ ನಕ್ಷೆ ಲಭ್ಯವಿದೆ.',
    streetFailure:'ರಸ್ತೆ ನಕ್ಷೆ ಲಭ್ಯವಿಲ್ಲ. ಆಫ್‌ಲೈನ್ ನಕ್ಷೆ ತೋರಿಸಲಾಗುತ್ತಿದೆ.',
  },
  controls:{zoomIn:'ಹಿಗ್ಗಿಸಿ',zoomOut:'ಕುಗ್ಗಿಸಿ',locate:'ನನ್ನ ಸ್ಥಳ ಹುಡುಕಿ',locationUnavailable:'ಸ್ಥಳ ಲಭ್ಯವಿಲ್ಲ',close:'ಮಾಹಿತಿ ಕಿಟಕಿ ಮುಚ್ಚಿ'},
};

export const mapCopy: Record<Locale,MapCopy> = {en,ml,hi,ta,kn};
