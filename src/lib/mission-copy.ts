import type {Locale} from './locales';
import {missionLabels} from './verification-missions';

const en = {
  title:'Verification missions', intro:'Find a place you know, check the public stall or bakery on a visit, and share what you confirmed.',
  area:'City or district', allAreas:'All areas', mission:'Mission', labels:missionLabels as Record<keyof typeof missionLabels,string>,
  instructions:{
    details:'Identify the bakery or stall and confirm what the listing is missing.',
    pin:'Check the storefront location and share a public pin from your visit.',
  },
  draftHelp:{
    details:'Describe what you confirmed in person and enter the date you visited. Add a public listing link if you have one.',
    pin:'On your visit, copy the public shop pin or use your device location at the storefront. Enter the date you checked and say what you confirmed.',
  },
  report:'Report what you checked', evidenceError:'Enter an HTTPS link to the public shop pin.',
  status:{one:'{count} mission',many:'{count} missions',empty:'No missions here yet. Choose another area or task.'},
  noScript:'Enable JavaScript to filter missions by city, district or task.',
};
type MissionCopy = typeof en;

const ml: MissionCopy = {
  title:'സ്ഥലങ്ങൾ പരിശോധിക്കാം', intro:'പരിചയമുള്ള സ്ഥലം കണ്ടെത്തുക. പൊതുസ്ഥലത്തുള്ള കടയോ ബേക്കറിയോ സന്ദർശിച്ച് സ്ഥിരീകരിച്ച വിവരം പങ്കിടുക.',
  area:'നഗരം അല്ലെങ്കിൽ ജില്ല', allAreas:'എല്ലാ പ്രദേശങ്ങളും', mission:'പരിശോധന', labels:{details:'വിട്ടുപോയ വിവരങ്ങൾ ചേർക്കുക',pin:'ഭൂപടത്തിലെ പിൻ പരിശോധിക്കുക'},
  instructions:{
    details:'ബേക്കറിയോ കടയോ തിരിച്ചറിഞ്ഞ് പട്ടികയിൽ വിട്ടുപോയ വിവരം സ്ഥിരീകരിക്കുക.',
    pin:'കട സ്ഥിതി ചെയ്യുന്ന സ്ഥലം നേരിട്ട് പരിശോധിച്ച് പൊതു പിൻ പങ്കിടുക.',
  },
  draftHelp:{
    details:'നേരിട്ട് സ്ഥിരീകരിച്ച കാര്യവും സന്ദർശിച്ച തീയതിയും നൽകുക. കടയുടെ പൊതുലിങ്ക് ലഭ്യമെങ്കിൽ ചേർക്കുക.',
    pin:'സന്ദർശിക്കുമ്പോൾ കടയുടെ പൊതു പിൻ പകർത്തുക അല്ലെങ്കിൽ കടയുടെ മുന്നിൽ നിന്ന് ഉപകരണത്തിന്റെ ലൊക്കേഷൻ ഉപയോഗിക്കുക. പരിശോധിച്ച തീയതിയും സ്ഥിരീകരിച്ച വിവരവും നൽകുക.',
  },
  report:'പരിശോധിച്ച വിവരം അറിയിക്കുക', evidenceError:'കടയുടെ പൊതു പിന്നിന്റെ HTTPS ലിങ്ക് നൽകുക.',
  status:{one:'{count} പരിശോധന',many:'{count} പരിശോധനകൾ',empty:'ഇവിടെ പരിശോധിക്കാനുള്ളത് ഒന്നുമില്ല. മറ്റൊരു പ്രദേശമോ തരമോ തിരഞ്ഞെടുക്കുക.'},
  noScript:'നഗരം, ജില്ല അല്ലെങ്കിൽ പരിശോധനയുടെ തരം തിരഞ്ഞെടുക്കാൻ JavaScript പ്രവർത്തനക്ഷമമാക്കുക.',
};

const hi: MissionCopy = {
  title:'सत्यापन के काम', intro:'कोई परिचित जगह चुनें। दुकान या बेकरी पर जाकर जानकारी जाँचें और जो पुष्टि हुई उसे साझा करें।',
  area:'शहर या जिला', allAreas:'सभी इलाके', mission:'जाँच का काम', labels:{details:'छूटी हुई जानकारी जोड़ें',pin:'नक्शे का पिन जाँचें'},
  instructions:{
    details:'बेकरी या स्टॉल की पहचान करें और पुष्टि करें कि कौन-सी जानकारी जोड़नी है।',
    pin:'दुकान की लोकेशन जाँचें और अपनी यात्रा का सार्वजनिक पिन साझा करें।',
  },
  draftHelp:{
    details:'अपने सामने देखी जानकारी और यात्रा की तारीख लिखें। दुकान का सार्वजनिक लिंक हो तो जोड़ें।',
    pin:'दुकान पर पहुँचकर सार्वजनिक पिन कॉपी करें या वहाँ अपने डिवाइस की लोकेशन इस्तेमाल करें। जाँच की तारीख और जिस बात की पुष्टि हुई, उसे लिखें।',
  },
  report:'जाँची गई जानकारी भेजें', evidenceError:'दुकान के सार्वजनिक पिन का HTTPS लिंक लिखें।',
  status:{one:'{count} काम',many:'{count} काम',empty:'यहाँ जाँच का कोई काम नहीं है। कोई दूसरा इलाका या काम चुनें।'},
  noScript:'शहर, जिले या काम के हिसाब से छाँटने के लिए JavaScript चालू करें।',
};

const ta: MissionCopy = {
  title:'சரிபார்ப்புப் பணிகள்', intro:'உங்களுக்குத் தெரிந்த இடத்தைத் தேர்ந்தெடுங்கள். கடைக்கோ பேக்கரிக்கோ நேரில் சென்று சரிபார்த்ததைப் பகிருங்கள்.',
  area:'நகரம் அல்லது மாவட்டம்', allAreas:'அனைத்துப் பகுதிகளும்', mission:'சரிபார்ப்புப் பணி', labels:{details:'விடுபட்ட விவரங்களைச் சேருங்கள்',pin:'வரைபட இடக்குறியைச் சரிபாருங்கள்'},
  instructions:{
    details:'பேக்கரி அல்லது கடையை அடையாளம் கண்டு விடுபட்ட விவரங்களைச் சரிபாருங்கள்.',
    pin:'கடை இருக்கும் இடத்தை நேரில் பார்த்து அதன் பொது இடக்குறியைப் பகிருங்கள்.',
  },
  draftHelp:{
    details:'நேரில் உறுதிசெய்த விவரங்களையும் சென்ற தேதியையும் எழுதுங்கள். கடையின் பொது இணைப்பு இருந்தால் சேருங்கள்.',
    pin:'கடைக்குச் சென்றதும் அதன் பொது இடக்குறியை நகலெடுங்கள் அல்லது கடை முன் சாதனத்தின் இருப்பிடத்தைப் பயன்படுத்துங்கள். சரிபார்த்த தேதியையும் உறுதிசெய்த விவரத்தையும் எழுதுங்கள்.',
  },
  report:'சரிபார்த்த விவரங்களை அனுப்புங்கள்', evidenceError:'கடையின் பொது இடக்குறிக்கான HTTPS இணைப்பைக் கொடுங்கள்.',
  status:{one:'{count} பணி',many:'{count} பணிகள்',empty:'இங்கு சரிபார்ப்புப் பணி எதுவும் இல்லை. வேறு பகுதியையோ பணியையோ தேர்ந்தெடுங்கள்.'},
  noScript:'நகரம், மாவட்டம் அல்லது பணியின் வகையைக் கொண்டு வடிகட்ட JavaScript தேவை.',
};

const kn: MissionCopy = {
  title:'ಪರಿಶೀಲನೆಯ ಕೆಲಸಗಳು', intro:'ನಿಮಗೆ ತಿಳಿದಿರುವ ಸ್ಥಳವನ್ನು ಆರಿಸಿ. ಅಂಗಡಿ ಅಥವಾ ಬೇಕರಿಗೆ ಭೇಟಿ ನೀಡಿ ಪರಿಶೀಲಿಸಿದ ಮಾಹಿತಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.',
  area:'ನಗರ ಅಥವಾ ಜಿಲ್ಲೆ', allAreas:'ಎಲ್ಲ ಪ್ರದೇಶಗಳು', mission:'ಪರಿಶೀಲನೆಯ ಕೆಲಸ', labels:{details:'ಬಿಟ್ಟಿರುವ ವಿವರಗಳನ್ನು ಸೇರಿಸಿ',pin:'ನಕ್ಷೆಯ ಪಿನ್ ಪರಿಶೀಲಿಸಿ'},
  instructions:{
    details:'ಬೇಕರಿ ಅಥವಾ ಮಳಿಗೆಯನ್ನು ಗುರುತಿಸಿ ಪಟ್ಟಿಯಲ್ಲಿ ಬಿಟ್ಟಿರುವ ವಿವರವನ್ನು ಪರಿಶೀಲಿಸಿ.',
    pin:'ಅಂಗಡಿ ಇರುವ ಸ್ಥಳವನ್ನು ನೇರವಾಗಿ ನೋಡಿ ಅದರ ಸಾರ್ವಜನಿಕ ಪಿನ್ ಹಂಚಿಕೊಳ್ಳಿ.',
  },
  draftHelp:{
    details:'ಖುದ್ದಾಗಿ ದೃಢಪಡಿಸಿದ ಮಾಹಿತಿಯನ್ನೂ ಭೇಟಿಯ ದಿನಾಂಕವನ್ನೂ ನಮೂದಿಸಿ. ಅಂಗಡಿಯ ಸಾರ್ವಜನಿಕ ಕೊಂಡಿ ಇದ್ದರೆ ಸೇರಿಸಿ.',
    pin:'ಭೇಟಿಯಲ್ಲಿ ಸಾರ್ವಜನಿಕ ಪಿನ್ ನಕಲಿಸಿ ಅಥವಾ ಅಂಗಡಿಯ ಮುಂದೆ ಸಾಧನದ ಸ್ಥಳವನ್ನು ಬಳಸಿ. ಪರಿಶೀಲಿಸಿದ ದಿನಾಂಕ ಮತ್ತು ದೃಢಪಟ್ಟ ಮಾಹಿತಿಯನ್ನು ಬರೆಯಿರಿ.',
  },
  report:'ಪರಿಶೀಲಿಸಿದ ಮಾಹಿತಿಯನ್ನು ಕಳುಹಿಸಿ', evidenceError:'ಅಂಗಡಿಯ ಸಾರ್ವಜನಿಕ ಪಿನ್‌ನ HTTPS ಕೊಂಡಿಯನ್ನು ನಮೂದಿಸಿ.',
  status:{one:'{count} ಕೆಲಸ',many:'{count} ಕೆಲಸಗಳು',empty:'ಇಲ್ಲಿ ಪರಿಶೀಲನೆಯ ಕೆಲಸಗಳಿಲ್ಲ. ಬೇರೆ ಪ್ರದೇಶ ಅಥವಾ ಕೆಲಸವನ್ನು ಆರಿಸಿ.'},
  noScript:'ನಗರ, ಜಿಲ್ಲೆ ಅಥವಾ ಕೆಲಸದ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಲು JavaScript ಆನ್ ಮಾಡಿ.',
};

export const missionCopy: Record<Locale,MissionCopy> = {en,ml,hi,ta,kn};
