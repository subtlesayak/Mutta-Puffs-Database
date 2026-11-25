export const locales = [
  {id:'en',name:'English'},
  {id:'ml',name:'മലയാളം'},
  {id:'hi',name:'हिन्दी'},
  {id:'ta',name:'தமிழ்'},
  {id:'kn',name:'ಕನ್ನಡ'},
] as const;
export type Locale = typeof locales[number]['id'];

const en = {
  explore:'Explore', map:'Puff Map', cities:'Cities', guide:'Puff Guide', insights:'Insights', contribute:'Contribute',
  menu:'Menu', mainNav:'Main navigation', skip:'Skip to content', language:'Language', about:'About', data:'Open data',
  projectNav:'Project', footerIntro:'A community atlas for one very good snack.',
  head:'Find an egg puff near you', intro:'Explore bakeries, cafés and stalls saved by the community.',
  directory:'The directory', find:'Find a puff stop', help:'Search for a place, choose a city or use your location.',
  search:'Search places', placeholder:'Bakery, city or neighbourhood', region:'State or country', allRegions:'All regions',
  district:'Indian district', allDistricts:'All districts', unknownCountry:'Country unassigned', verification:'Verification',
  anyStatus:'Any status', nearby:'Find nearby', useLocation:'Use my location', city:'Or choose a city', chooseCity:'Select a city',
  distance:'Distance', anyDistance:'Any distance', clearLocation:'Clear location', distanceHelp:'Distances are straight-line estimates. Your device location stays in this tab.',
  placeType:'Place type', allTypes:'All types', provider:'Open places in', notes:'With contributor notes', clear:'Clear filters',
  mapView:'Map view', previous:'Previous', next:'Next', unassignedDistrict:'District unassigned',
  loadingLocation:'Finding your location…', denied:'Could not get your location. Try again or choose a city.',
  loadError:'Could not load the list. Reload the page or browse cities.', empty:'No places match. Try another search or clear the filters.',
  places:'places', page:'Page', of:'of',
};
type Labels = typeof en;
const ml: Labels = {
  explore:'തിരയുക', map:'പഫ് ഭൂപടം', cities:'നഗരങ്ങൾ', guide:'പഫ് ഗൈഡ്', insights:'കണക്കുകൾ', contribute:'സംഭാവന ചെയ്യുക',
  menu:'മെനു', mainNav:'പ്രധാന നാവിഗേഷൻ', skip:'ഉള്ളടക്കത്തിലേക്ക് പോകുക', language:'ഭാഷ', about:'പദ്ധതിയെക്കുറിച്ച്', data:'തുറന്ന ഡാറ്റ',
  projectNav:'പദ്ധതി', footerIntro:'മുട്ട പഫ്സ് കിട്ടുന്ന ഇടങ്ങളുടെ കൂട്ടായ്മാ ഭൂപടം.',
  head:'അടുത്തുള്ള മുട്ട പഫ്സ് കണ്ടെത്താം', intro:'കൂട്ടായ്മ ചേർത്ത ബേക്കറികളും കഫേകളും കടകളും കാണൂ.',
  directory:'സ്ഥലങ്ങളുടെ പട്ടിക', find:'പഫ് കിട്ടുന്ന ഇടം കണ്ടെത്തുക', help:'സ്ഥലം തിരയുക, നഗരം തിരഞ്ഞെടുക്കുക, അല്ലെങ്കിൽ നിങ്ങളുടെ ലൊക്കേഷൻ ഉപയോഗിക്കുക.',
  search:'സ്ഥലങ്ങൾ തിരയുക', placeholder:'ബേക്കറി, നഗരം അല്ലെങ്കിൽ പ്രദേശം', region:'സംസ്ഥാനം അല്ലെങ്കിൽ രാജ്യം', allRegions:'എല്ലാ പ്രദേശങ്ങളും',
  district:'ഇന്ത്യയിലെ ജില്ല', allDistricts:'എല്ലാ ജില്ലകളും', unknownCountry:'രാജ്യം ചേർത്തിട്ടില്ല', verification:'സ്ഥിരീകരണം',
  anyStatus:'ഏത് നിലയും', nearby:'അടുത്തുള്ള ഇടങ്ങൾ', useLocation:'എന്റെ ലൊക്കേഷൻ ഉപയോഗിക്കുക', city:'അല്ലെങ്കിൽ നഗരം തിരഞ്ഞെടുക്കുക', chooseCity:'നഗരം തിരഞ്ഞെടുക്കുക',
  distance:'ദൂരം', anyDistance:'ഏത് ദൂരവും', clearLocation:'ലൊക്കേഷൻ നീക്കുക', distanceHelp:'നേർരേഖയിലുള്ള ഏകദേശ ദൂരമാണ് കാണിക്കുന്നത്. നിങ്ങളുടെ ലൊക്കേഷൻ ഈ ടാബിൽ മാത്രമേ ഉപയോഗിക്കൂ.',
  placeType:'സ്ഥലത്തിന്റെ തരം', allTypes:'എല്ലാ തരങ്ങളും', provider:'ഭൂപട ആപ്പ്', notes:'കൂട്ടായ്മയുടെ കുറിപ്പുകളുള്ളത്', clear:'ഫിൽട്ടറുകൾ നീക്കുക',
  mapView:'ഭൂപടത്തിൽ കാണുക', previous:'മുമ്പത്തെത്', next:'അടുത്തത്', unassignedDistrict:'ജില്ല ചേർത്തിട്ടില്ല',
  loadingLocation:'ലൊക്കേഷൻ കണ്ടെത്തുന്നു…', denied:'ലൊക്കേഷൻ ലഭിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ നഗരം തിരഞ്ഞെടുക്കുക.',
  loadError:'പട്ടിക ലഭിച്ചില്ല. പേജ് വീണ്ടും തുറക്കുക അല്ലെങ്കിൽ നഗരങ്ങൾ കാണുക.', empty:'പൊരുത്തമുള്ള സ്ഥലങ്ങളില്ല. തിരച്ചിൽ മാറ്റുക അല്ലെങ്കിൽ ഫിൽട്ടറുകൾ നീക്കുക.',
  places:'സ്ഥലങ്ങൾ', page:'പേജ്', of:'/',
};
const hi: Labels = {
  explore:'खोजें', map:'पफ का नक्शा', cities:'शहर', guide:'पफ गाइड', insights:'आँकड़े', contribute:'योगदान दें',
  menu:'मेनू', mainNav:'मुख्य नेविगेशन', skip:'सामग्री पर जाएँ', language:'भाषा', about:'परियोजना के बारे में', data:'खुला डेटा',
  projectNav:'परियोजना', footerIntro:'समुदाय का बनाया एग पफ की जगहों का नक्शा।',
  head:'अपने पास एग पफ खोजें', intro:'समुदाय की सुझाई बेकरी, कैफ़े और दुकानों को देखें।',
  directory:'जगहों की सूची', find:'पफ की दुकान खोजें', help:'किसी जगह को खोजें, शहर चुनें या अपनी लोकेशन इस्तेमाल करें।',
  search:'जगह खोजें', placeholder:'बेकरी, शहर या इलाका', region:'राज्य या देश', allRegions:'सभी क्षेत्र',
  district:'भारत का जिला', allDistricts:'सभी जिले', unknownCountry:'देश दर्ज नहीं है', verification:'सत्यापन',
  anyStatus:'कोई भी स्थिति', nearby:'आस-पास खोजें', useLocation:'मेरी लोकेशन इस्तेमाल करें', city:'या कोई शहर चुनें', chooseCity:'शहर चुनें',
  distance:'दूरी', anyDistance:'कोई भी दूरी', clearLocation:'लोकेशन हटाएँ', distanceHelp:'दूरी सीधी रेखा में अनुमानित है। आपकी लोकेशन इसी टैब में रहती है।',
  placeType:'जगह का प्रकार', allTypes:'सभी प्रकार', provider:'इस नक्शे में खोलें', notes:'योगदानकर्ताओं के नोट के साथ', clear:'फ़िल्टर हटाएँ',
  mapView:'नक्शे में देखें', previous:'पिछला', next:'अगला', unassignedDistrict:'जिला दर्ज नहीं है',
  loadingLocation:'लोकेशन मिल रही है…', denied:'लोकेशन नहीं मिली। फिर कोशिश करें या शहर चुनें।',
  loadError:'सूची नहीं खुली। पेज फिर खोलें या शहरों की सूची देखें।', empty:'कोई जगह नहीं मिली। फिर खोजें या फ़िल्टर हटाएँ।',
  places:'जगहें', page:'पेज', of:'/',
};
const ta: Labels = {
  explore:'தேடுங்கள்', map:'பஃப் வரைபடம்', cities:'நகரங்கள்', guide:'பஃப் வழிகாட்டி', insights:'புள்ளிவிவரங்கள்', contribute:'பங்களியுங்கள்',
  menu:'பட்டி', mainNav:'முதன்மை வழிசெலுத்தல்', skip:'உள்ளடக்கத்திற்குச் செல்லவும்', language:'மொழி', about:'திட்டத்தைப் பற்றி', data:'திறந்த தரவு',
  head:'அருகில் முட்டை பஃப் தேடுங்கள்', intro:'சமூகம் சேகரித்த பேக்கரிகள், கஃபேக்கள் மற்றும் கடைகளைப் பாருங்கள்.',
  projectNav:'திட்டம்', footerIntro:'முட்டை பஃப் கிடைக்கும் இடங்களுக்கான சமூக வரைபடம்.',
  directory:'இடங்களின் பட்டியல்', find:'பஃப் கிடைக்கும் இடத்தைத் தேடுங்கள்', help:'இடத்தைத் தேடுங்கள், நகரத்தைத் தேர்ந்தெடுங்கள் அல்லது உங்கள் இருப்பிடத்தைப் பயன்படுத்துங்கள்.',
  search:'இடங்களைத் தேடுங்கள்', placeholder:'பேக்கரி, நகரம் அல்லது பகுதி', region:'மாநிலம் அல்லது நாடு', allRegions:'அனைத்துப் பகுதிகளும்',
  district:'இந்திய மாவட்டம்', allDistricts:'அனைத்து மாவட்டங்களும்', unknownCountry:'நாடு குறிப்பிடப்படவில்லை', verification:'சரிபார்ப்பு',
  anyStatus:'எந்த நிலையும்', nearby:'அருகில் தேடுங்கள்', useLocation:'என் இருப்பிடத்தைப் பயன்படுத்தவும்', city:'அல்லது நகரத்தைத் தேர்ந்தெடுங்கள்', chooseCity:'நகரத்தைத் தேர்ந்தெடுங்கள்',
  distance:'தூரம்', anyDistance:'எந்தத் தூரமும்', clearLocation:'இருப்பிடத்தை நீக்கவும்', distanceHelp:'நேர்கோட்டுத் தூரம் தோராயமானது. உங்கள் இருப்பிடம் இந்தத் தாவலிலேயே இருக்கும்.',
  placeType:'இடத்தின் வகை', allTypes:'அனைத்து வகைகளும்', provider:'இந்த வரைபடத்தில் திறக்கவும்', notes:'பங்களிப்பாளர் குறிப்புகளுடன்', clear:'வடிப்பான்களை நீக்கவும்',
  mapView:'வரைபடத்தில் பார்க்கவும்', previous:'முந்தையது', next:'அடுத்தது', unassignedDistrict:'மாவட்டம் குறிப்பிடப்படவில்லை',
  loadingLocation:'இருப்பிடம் தேடப்படுகிறது…', denied:'இருப்பிடம் கிடைக்கவில்லை. மீண்டும் முயலுங்கள் அல்லது நகரத்தைத் தேர்ந்தெடுங்கள்.',
  loadError:'பட்டியலைத் திறக்க முடியவில்லை. பக்கத்தை மீண்டும் திறக்கவும் அல்லது நகரங்களைப் பார்க்கவும்.', empty:'பொருந்தும் இடங்கள் இல்லை. தேடலை மாற்றவும் அல்லது வடிப்பான்களை நீக்கவும்.',
  places:'இடங்கள்', page:'பக்கம்', of:'/',
};
const kn: Labels = {
  explore:'ಹುಡುಕಿ', map:'ಪಫ್ ನಕ್ಷೆ', cities:'ನಗರಗಳು', guide:'ಪಫ್ ಮಾರ್ಗದರ್ಶಿ', insights:'ಅಂಕಿಅಂಶಗಳು', contribute:'ಕೊಡುಗೆ ನೀಡಿ',
  menu:'ಮೆನು', mainNav:'ಮುಖ್ಯ ಸಂಚರಣೆ', skip:'ವಿಷಯಕ್ಕೆ ಹೋಗಿ', language:'ಭಾಷೆ', about:'ಯೋಜನೆಯ ಬಗ್ಗೆ', data:'ಮುಕ್ತ ದತ್ತಾಂಶ',
  projectNav:'ಯೋಜನೆ', footerIntro:'ಮೊಟ್ಟೆ ಪಫ್ ಸಿಗುವ ಸ್ಥಳಗಳ ಸಮುದಾಯ ನಕ್ಷೆ.',
  head:'ಹತ್ತಿರದ ಮೊಟ್ಟೆ ಪಫ್ ಹುಡುಕಿ', intro:'ಸಮುದಾಯ ಸೇರಿಸಿದ ಬೇಕರಿಗಳು, ಕೆಫೆಗಳು ಮತ್ತು ಅಂಗಡಿಗಳನ್ನು ನೋಡಿ.',
  directory:'ಸ್ಥಳಗಳ ಪಟ್ಟಿ', find:'ಪಫ್ ಸಿಗುವ ಸ್ಥಳ ಹುಡುಕಿ', help:'ಸ್ಥಳ ಹುಡುಕಿ, ನಗರವನ್ನು ಆರಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಬಳಸಿ.',
  search:'ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ', placeholder:'ಬೇಕರಿ, ನಗರ ಅಥವಾ ಪ್ರದೇಶ', region:'ರಾಜ್ಯ ಅಥವಾ ದೇಶ', allRegions:'ಎಲ್ಲ ಪ್ರದೇಶಗಳು',
  district:'ಭಾರತದ ಜಿಲ್ಲೆ', allDistricts:'ಎಲ್ಲ ಜಿಲ್ಲೆಗಳು', unknownCountry:'ದೇಶ ದಾಖಲಿಸಿಲ್ಲ', verification:'ಪರಿಶೀಲನೆ',
  anyStatus:'ಯಾವುದೇ ಸ್ಥಿತಿ', nearby:'ಹತ್ತಿರ ಹುಡುಕಿ', useLocation:'ನನ್ನ ಸ್ಥಳವನ್ನು ಬಳಸಿ', city:'ಅಥವಾ ನಗರವನ್ನು ಆರಿಸಿ', chooseCity:'ನಗರವನ್ನು ಆರಿಸಿ',
  distance:'ದೂರ', anyDistance:'ಯಾವುದೇ ದೂರ', clearLocation:'ಸ್ಥಳವನ್ನು ತೆಗೆದುಹಾಕಿ', distanceHelp:'ದೂರವು ಸರಳ ರೇಖೆಯ ಅಂದಾಜು. ನಿಮ್ಮ ಸ್ಥಳವು ಈ ಟ್ಯಾಬ್‌ನಲ್ಲೇ ಉಳಿಯುತ್ತದೆ.',
  placeType:'ಸ್ಥಳದ ವಿಧ', allTypes:'ಎಲ್ಲ ವಿಧಗಳು', provider:'ಈ ನಕ್ಷೆಯಲ್ಲಿ ತೆರೆಯಿರಿ', notes:'ಕೊಡುಗೆದಾರರ ಟಿಪ್ಪಣಿಗಳೊಂದಿಗೆ', clear:'ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆಗೆದುಹಾಕಿ',
  mapView:'ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ', previous:'ಹಿಂದಿನದು', next:'ಮುಂದಿನದು', unassignedDistrict:'ಜಿಲ್ಲೆ ದಾಖಲಿಸಿಲ್ಲ',
  loadingLocation:'ಸ್ಥಳ ಹುಡುಕಲಾಗುತ್ತಿದೆ…', denied:'ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನಗರವನ್ನು ಆರಿಸಿ.',
  loadError:'ಪಟ್ಟಿ ತೆರೆಯಲಿಲ್ಲ. ಪುಟವನ್ನು ಮತ್ತೆ ತೆರೆಯಿರಿ ಅಥವಾ ನಗರಗಳನ್ನು ನೋಡಿ.', empty:'ಹೊಂದುವ ಸ್ಥಳಗಳು ಸಿಗಲಿಲ್ಲ. ಹುಡುಕಾಟವನ್ನು ಬದಲಿಸಿ ಅಥವಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆಗೆದುಹಾಕಿ.',
  places:'ಸ್ಥಳಗಳು', page:'ಪುಟ', of:'/',
};

export const labelSets: Record<Locale, Labels> = {en, ml, hi, ta, kn};
export const isLocale = (value: string | undefined): value is Locale => Boolean(value && Object.hasOwn(labelSets,value));
