import {labelSets, type Locale} from './locales';
import {placeCount} from './format';

const en = {
  directoryTitle:'City directories', citiesHeading:'Pick a city.', onePlace:'place',
  citiesIntro:'See the places saved near each city. City areas can include nearby towns and suburbs.',
  allCities:'All cities', cityHeading:'Egg puffs near {city}', cityDescription:'Discover {count} saved near {city}, with community notes, coordinate accuracy, and map links.',
  cityDirectory:'Community city directory', cityMap:'View city map', searchCity:'Search near {city}',
  explorePlaces:'Explore places', placesNear:'Places near {city}', placeDescription:'{place}. A community entry in the Mutta Puffs Everywhere egg puff atlas.',
  save:'Save to Passport', saved:'Saved to your passport.', removed:'Removed from saved places.',
  saveError:'Could not save this place. Open your passport to check site storage.', visit:'Log a visit',
  directions:'Get there', showPin:'Show pin on the Puff Map',
  estimated:'The saved Maps link gives an approximate area. Use the listing link or share a corrected pin.',
  record:'What’s on record', price:'Price per puff', eggPortion:'Egg portion', batches:'Fresh batches', availability:'Availability',
  noReport:'No dated report', unknown:'Unknown', localTime:'Local time', source:'Source',
  portions:{whole:'Whole egg',half:'Half egg',other:'Other portion',eggless:'Eggless'},
  stock:{available:'Reported available',sold_out:'Reported sold out',no_longer_sold:'Reported no longer sold'},
  archive:'From the archive', archiveNote:'Contributor note from the original list. Visit date unknown.',
  reviews:'Community reviews', scoreMethod:'How it’s scored', submission:'Submission',
  approvedReview:'{count} approved review', approvedReviews:'{count} approved reviews',
  scoreLabels:{pastry:'Pastry',filling:'Filling',egg:'Egg',freshness:'Freshness',value:'Value'},
  noReviews:'This place is waiting for its first approved review.', addReview:'Share a puff review',
  photos:'Community photos', noPhotos:'This spot is waiting for its first photo.', addPhoto:'Share your photo',
  corrections:'Source and corrections', sourceExport:'Original crowdsourced Google Maps export',
  sourceCommunity:'Community contribution', row:'Row {number}', original:'Original source',
  verifiedOn:'Last verified {date}', evidence:'Verification evidence', correct:'Correct this listing',
};

type DirectoryCopy = typeof en;

const ml: DirectoryCopy = {
  directoryTitle:'നഗരങ്ങളുടെ പട്ടിക', citiesHeading:'ഒരു നഗരം തിരഞ്ഞെടുക്കുക', onePlace:'സ്ഥലം',
  citiesIntro:'ഓരോ നഗരത്തിനും സമീപം ചേർത്ത പഫ് കടകൾ കാണൂ. സമീപത്തെ പട്ടണങ്ങളും പ്രാന്തപ്രദേശങ്ങളും പട്ടികയിൽ ഉൾപ്പെടാം.',
  allCities:'എല്ലാ നഗരങ്ങളും', cityHeading:'{city} സമീപം മുട്ട പഫ്സ്', cityDescription:'{city} സമീപം ചേർത്ത {count}. കൂട്ടായ്മയുടെ കുറിപ്പുകളും മാപ്പ് ലിങ്കുകളും കാണൂ.',
  cityDirectory:'കൂട്ടായ്മയുടെ നഗരപ്പട്ടിക', cityMap:'നഗരത്തിന്റെ മാപ്പ് കാണുക', searchCity:'{city} സമീപം തിരയുക',
  explorePlaces:'സ്ഥലങ്ങൾ തിരയുക', placesNear:'{city} സമീപമുള്ള സ്ഥലങ്ങൾ', placeDescription:'{place}. Mutta Puffs Everywhere കൂട്ടായ്മാ അറ്റ്‌ലസിലെ ഒരു സ്ഥലം.',
  save:'പാസ്‌പോർട്ടിൽ സൂക്ഷിക്കുക', saved:'പാസ്‌പോർട്ടിൽ സൂക്ഷിച്ചു.', removed:'സൂക്ഷിച്ച സ്ഥലങ്ങളിൽ നിന്ന് നീക്കി.',
  saveError:'സ്ഥലം സൂക്ഷിക്കാനായില്ല. പാസ്‌പോർട്ട് തുറന്ന് സൈറ്റിന് വിവരങ്ങൾ സൂക്ഷിക്കാനാകുമോ എന്ന് പരിശോധിക്കുക.', visit:'സന്ദർശനം രേഖപ്പെടുത്തുക',
  directions:'എങ്ങനെ എത്താം', showPin:'പഫ് മാപ്പിൽ പിൻ കാണുക',
  estimated:'സൂക്ഷിച്ച മാപ്പ് ലിങ്ക് ഏകദേശ സ്ഥലം കാണിക്കുന്നു. കടയുടെ ലിങ്ക് ഉപയോഗിക്കുകയോ തിരുത്തിയ പിൻ പങ്കിടുകയോ ചെയ്യുക.',
  record:'രേഖപ്പെടുത്തിയ വിവരങ്ങൾ', price:'ഒരു പഫിന്റെ വില', eggPortion:'മുട്ടയുടെ അളവ്', batches:'പുതിയ ബാച്ചുകൾ', availability:'ലഭ്യത',
  noReport:'തീയതി രേഖപ്പെടുത്തിയ റിപ്പോർട്ടില്ല', unknown:'അറിയില്ല', localTime:'പ്രാദേശിക സമയം', source:'ഉറവിടം',
  portions:{whole:'ഒരു മുട്ട',half:'അര മുട്ട',other:'മറ്റൊരു അളവ്',eggless:'മുട്ടയില്ലാത്തത്'},
  stock:{available:'ലഭ്യമാണെന്ന് അറിയിച്ചു',sold_out:'വിറ്റുതീർന്നതായി അറിയിച്ചു',no_longer_sold:'ഇനി വിൽക്കുന്നില്ലെന്ന് അറിയിച്ചു'},
  archive:'പഴയ പട്ടികയിൽ നിന്ന്', archiveNote:'ആദ്യ പട്ടികയിലെ സംഭാവനക്കുറിപ്പ്. സന്ദർശന തീയതി അറിയില്ല.',
  reviews:'കൂട്ടായ്മയുടെ അവലോകനങ്ങൾ', scoreMethod:'സ്കോർ എങ്ങനെ കണക്കാക്കുന്നു', submission:'അവലോകനത്തിന്റെ ഉറവിടം',
  approvedReview:'{count} അംഗീകരിച്ച അവലോകനം', approvedReviews:'{count} അംഗീകരിച്ച അവലോകനങ്ങൾ',
  scoreLabels:{pastry:'പഫിന്റെ പുറംപാളി',filling:'ഉള്ളിലെ മസാല',egg:'മുട്ട',freshness:'പുതുമ',value:'വിലയ്ക്കൊത്ത മൂല്യം'},
  noReviews:'അംഗീകരിച്ച അവലോകനങ്ങളൊന്നും ഇതുവരെ ലഭ്യമല്ല.', addReview:'പഫ് അവലോകനം പങ്കിടുക',
  photos:'കൂട്ടായ്മയുടെ ചിത്രങ്ങൾ', noPhotos:'ഇവിടത്തെ ചിത്രങ്ങളൊന്നും ഇതുവരെ ലഭ്യമല്ല.', addPhoto:'നിങ്ങളുടെ ചിത്രം പങ്കിടുക',
  corrections:'ഉറവിടവും തിരുത്തലുകളും', sourceExport:'കൂട്ടായ്മ ചേർത്ത ആദ്യ Google Maps പട്ടിക',
  sourceCommunity:'കൂട്ടായ്മയുടെ സംഭാവന', row:'വരി {number}', original:'ആദ്യ ഉറവിടം',
  verifiedOn:'അവസാനം സ്ഥിരീകരിച്ചത് {date}', evidence:'സ്ഥിരീകരണത്തിനുള്ള തെളിവ്', correct:'ഈ വിവരങ്ങൾ തിരുത്തുക',
};

const hi: DirectoryCopy = {
  directoryTitle:'शहरों की सूची', citiesHeading:'शहर चुनें', onePlace:'जगह',
  citiesIntro:'हर शहर के आस-पास दर्ज पफ की दुकानें देखें। सूची में पास के कस्बे और उपनगर भी हो सकते हैं।',
  allCities:'सभी शहर', cityHeading:'{city} के पास एग पफ', cityDescription:'{city} के पास दर्ज {count} देखें। समुदाय के नोट और नक्शे के लिंक साथ हैं।',
  cityDirectory:'समुदाय की शहर सूची', cityMap:'शहर का नक्शा देखें', searchCity:'{city} के आस-पास खोजें',
  explorePlaces:'जगहें खोजें', placesNear:'{city} के पास की जगहें', placeDescription:'{place}। Mutta Puffs Everywhere के सामुदायिक नक्शे में दर्ज एक जगह।',
  save:'पासपोर्ट में सहेजें', saved:'आपके पासपोर्ट में सहेजा गया।', removed:'सहेजी गई जगहों से हटा दिया गया।',
  saveError:'यह जगह सहेजी नहीं जा सकी। पासपोर्ट खोलकर देखें कि साइट को डेटा सहेजने की अनुमति है या नहीं।', visit:'अपनी यात्रा दर्ज करें',
  directions:'कैसे पहुँचें', showPin:'पफ के नक्शे पर पिन देखें',
  estimated:'सहेजा गया नक्शे का लिंक अनुमानित जगह दिखाता है। दुकान का लिंक इस्तेमाल करें या सही पिन साझा करें।',
  record:'दर्ज जानकारी', price:'प्रति पफ कीमत', eggPortion:'अंडे की मात्रा', batches:'ताज़ा बैच', availability:'उपलब्धता',
  noReport:'तारीख के साथ कोई रिपोर्ट नहीं', unknown:'पता नहीं', localTime:'स्थानीय समय', source:'स्रोत',
  portions:{whole:'पूरा अंडा',half:'आधा अंडा',other:'अन्य मात्रा',eggless:'बिना अंडे का'},
  stock:{available:'उपलब्ध बताया गया',sold_out:'बिक चुका बताया गया',no_longer_sold:'अब बिक्री नहीं होती'},
  archive:'पुरानी सूची से', archiveNote:'मूल सूची से योगदानकर्ता का नोट। यात्रा की तारीख उपलब्ध नहीं है।',
  reviews:'समुदाय की समीक्षाएँ', scoreMethod:'स्कोर कैसे तय होता है', submission:'समीक्षा का स्रोत',
  approvedReview:'{count} स्वीकृत समीक्षा', approvedReviews:'{count} स्वीकृत समीक्षाएँ',
  scoreLabels:{pastry:'पेस्ट्री',filling:'भरावन',egg:'अंडा',freshness:'ताज़गी',value:'कीमत के मुताबिक'},
  noReviews:'अब तक कोई स्वीकृत समीक्षा नहीं है।', addReview:'पफ की समीक्षा साझा करें',
  photos:'समुदाय की तस्वीरें', noPhotos:'इस जगह की कोई तस्वीर अभी उपलब्ध नहीं है।', addPhoto:'अपनी तस्वीर साझा करें',
  corrections:'स्रोत और सुधार', sourceExport:'समुदाय की मूल Google Maps सूची',
  sourceCommunity:'समुदाय का योगदान', row:'पंक्ति {number}', original:'मूल स्रोत',
  verifiedOn:'पिछला सत्यापन {date}', evidence:'सत्यापन का प्रमाण', correct:'इस जानकारी में सुधार भेजें',
};

const ta: DirectoryCopy = {
  directoryTitle:'நகரங்களின் பட்டியல்', citiesHeading:'ஒரு நகரத்தைத் தேர்ந்தெடுங்கள்', onePlace:'இடம்',
  citiesIntro:'ஒவ்வொரு நகரத்தின் அருகில் பதிவுசெய்த பஃப் கடைகளைப் பாருங்கள். அருகிலுள்ள ஊர்களும் புறநகர்ப் பகுதிகளும் பட்டியலில் இருக்கலாம்.',
  allCities:'அனைத்து நகரங்களும்', cityHeading:'{city} அருகே முட்டை பஃப்', cityDescription:'{city} அருகே பதிவுசெய்த {count}. சமூகக் குறிப்புகளையும் வரைபட இணைப்புகளையும் பாருங்கள்.',
  cityDirectory:'சமூகத்தின் நகரப் பட்டியல்', cityMap:'நகர வரைபடத்தைப் பாருங்கள்', searchCity:'{city} அருகே தேடுங்கள்',
  explorePlaces:'இடங்களைத் தேடுங்கள்', placesNear:'{city} அருகிலுள்ள இடங்கள்', placeDescription:'{place}. Mutta Puffs Everywhere சமூக வரைபடத்தில் உள்ள ஓர் இடம்.',
  save:'பாஸ்போர்ட்டில் சேமியுங்கள்', saved:'உங்கள் பாஸ்போர்ட்டில் சேமிக்கப்பட்டது.', removed:'சேமித்த இடங்களிலிருந்து நீக்கப்பட்டது.',
  saveError:'இடத்தைச் சேமிக்க முடியவில்லை. பாஸ்போர்ட்டைத் திறந்து தளத்தில் தரவைச் சேமிக்க முடியுமா என்று பாருங்கள்.', visit:'வருகையைப் பதிவு செய்யுங்கள்',
  directions:'எப்படிச் செல்வது', showPin:'பஃப் வரைபடத்தில் இடக்குறியைப் பாருங்கள்',
  estimated:'சேமித்த வரைபட இணைப்பு தோராயமான இடத்தைக் காட்டுகிறது. கடையின் இணைப்பைப் பயன்படுத்துங்கள் அல்லது சரியான இடக்குறியைப் பகிருங்கள்.',
  record:'பதிவான விவரங்கள்', price:'ஒரு பஃப்பின் விலை', eggPortion:'முட்டையின் அளவு', batches:'புதிதாகச் சுடும் நேரங்கள்', availability:'கிடைக்கும் நிலை',
  noReport:'தேதியுடன் பதிவு இல்லை', unknown:'தெரியவில்லை', localTime:'உள்ளூர் நேரம்', source:'ஆதாரம்',
  portions:{whole:'முழு முட்டை',half:'அரை முட்டை',other:'வேறு அளவு',eggless:'முட்டையில்லாதது'},
  stock:{available:'கிடைப்பதாகத் தெரிவிக்கப்பட்டது',sold_out:'விற்றுத் தீர்ந்ததாகத் தெரிவிக்கப்பட்டது',no_longer_sold:'இப்போது விற்பதில்லை எனத் தெரிவிக்கப்பட்டது'},
  archive:'பழைய பட்டியலிலிருந்து', archiveNote:'முதலில் பகிரப்பட்ட பட்டியலிலிருந்து ஒரு குறிப்பு. சென்ற தேதி தெரியவில்லை.',
  reviews:'சமூக மதிப்புரைகள்', scoreMethod:'மதிப்பெண் கணக்கிடும் முறை', submission:'மதிப்புரையின் ஆதாரம்',
  approvedReview:'{count} அங்கீகரிக்கப்பட்ட மதிப்புரை', approvedReviews:'{count} அங்கீகரிக்கப்பட்ட மதிப்புரைகள்',
  scoreLabels:{pastry:'மேல் அடுக்கு',filling:'உள்ளிருக்கும் மசாலா',egg:'முட்டை',freshness:'புதிதாகச் சுட்டதா',value:'விலைக்கேற்ற தரம்'},
  noReviews:'இதுவரை அங்கீகரிக்கப்பட்ட மதிப்புரை இல்லை.', addReview:'பஃப் மதிப்புரையைப் பகிருங்கள்',
  photos:'சமூகப் படங்கள்', noPhotos:'இந்த இடத்தின் படங்கள் இன்னும் கிடைக்கவில்லை.', addPhoto:'உங்கள் படத்தைப் பகிருங்கள்',
  corrections:'ஆதாரமும் திருத்தங்களும்', sourceExport:'சமூகம் பகிர்ந்த அசல் Google Maps பட்டியல்',
  sourceCommunity:'சமூகப் பங்களிப்பு', row:'வரி {number}', original:'அசல் ஆதாரம்',
  verifiedOn:'கடைசியாகச் சரிபார்த்தது {date}', evidence:'சரிபார்த்ததற்கான ஆதாரம்', correct:'இந்தப் பதிவைத் திருத்துங்கள்',
};

const kn: DirectoryCopy = {
  directoryTitle:'ನಗರಗಳ ಪಟ್ಟಿ', citiesHeading:'ಒಂದು ನಗರವನ್ನು ಆರಿಸಿ', onePlace:'ಸ್ಥಳ',
  citiesIntro:'ಪ್ರತಿ ನಗರದ ಸುತ್ತ ದಾಖಲಿಸಿದ ಪಫ್ ಅಂಗಡಿಗಳನ್ನು ನೋಡಿ. ಪಟ್ಟಿಯಲ್ಲಿ ಹತ್ತಿರದ ಊರುಗಳು ಮತ್ತು ಉಪನಗರಗಳೂ ಇರಬಹುದು.',
  allCities:'ಎಲ್ಲ ನಗರಗಳು', cityHeading:'{city} ಹತ್ತಿರ ಮೊಟ್ಟೆ ಪಫ್', cityDescription:'{city} ಹತ್ತಿರ ದಾಖಲಿಸಿದ {count}. ಸಮುದಾಯದ ಟಿಪ್ಪಣಿಗಳು ಮತ್ತು ನಕ್ಷೆಯ ಕೊಂಡಿಗಳನ್ನು ನೋಡಿ.',
  cityDirectory:'ಸಮುದಾಯದ ನಗರ ಪಟ್ಟಿ', cityMap:'ನಗರದ ನಕ್ಷೆ ನೋಡಿ', searchCity:'{city} ಹತ್ತಿರ ಹುಡುಕಿ',
  explorePlaces:'ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ', placesNear:'{city} ಹತ್ತಿರದ ಸ್ಥಳಗಳು', placeDescription:'{place}. Mutta Puffs Everywhere ಸಮುದಾಯ ನಕ್ಷೆಯಲ್ಲಿ ದಾಖಲಿಸಿರುವ ಒಂದು ಸ್ಥಳ.',
  save:'ಪಾಸ್‌ಪೋರ್ಟ್‌ನಲ್ಲಿ ಉಳಿಸಿ', saved:'ನಿಮ್ಮ ಪಾಸ್‌ಪೋರ್ಟ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.', removed:'ಉಳಿಸಿದ ಸ್ಥಳಗಳಿಂದ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.',
  saveError:'ಈ ಸ್ಥಳವನ್ನು ಉಳಿಸಲಾಗಲಿಲ್ಲ. ಪಾಸ್‌ಪೋರ್ಟ್ ತೆರೆದು ತಾಣಕ್ಕೆ ಮಾಹಿತಿ ಉಳಿಸಲು ಸಾಧ್ಯವಿದೆಯೇ ನೋಡಿ.', visit:'ಭೇಟಿಯನ್ನು ದಾಖಲಿಸಿ',
  directions:'ತಲುಪುವ ದಾರಿ', showPin:'ಪಫ್ ನಕ್ಷೆಯಲ್ಲಿ ಪಿನ್ ನೋಡಿ',
  estimated:'ಉಳಿಸಿದ ನಕ್ಷೆಯ ಕೊಂಡಿ ಅಂದಾಜು ಸ್ಥಳವನ್ನು ತೋರಿಸುತ್ತದೆ. ಅಂಗಡಿಯ ಕೊಂಡಿ ಬಳಸಿ ಅಥವಾ ಸರಿಯಾದ ಪಿನ್ ಹಂಚಿಕೊಳ್ಳಿ.',
  record:'ದಾಖಲಾದ ಮಾಹಿತಿ', price:'ಒಂದು ಪಫ್‌ನ ಬೆಲೆ', eggPortion:'ಮೊಟ್ಟೆಯ ಪ್ರಮಾಣ', batches:'ಹೊಸದಾಗಿ ತಯಾರಿಸುವ ಸಮಯ', availability:'ಲಭ್ಯತೆ',
  noReport:'ದಿನಾಂಕವಿರುವ ವರದಿ ಇಲ್ಲ', unknown:'ತಿಳಿದಿಲ್ಲ', localTime:'ಸ್ಥಳೀಯ ಸಮಯ', source:'ಮೂಲ',
  portions:{whole:'ಪೂರ್ತಿ ಮೊಟ್ಟೆ',half:'ಅರ್ಧ ಮೊಟ್ಟೆ',other:'ಬೇರೆ ಪ್ರಮಾಣ',eggless:'ಮೊಟ್ಟೆಯಿಲ್ಲದ್ದು'},
  stock:{available:'ಲಭ್ಯವಿದೆ ಎಂದು ವರದಿಯಾಗಿದೆ',sold_out:'ಮಾರಾಟ ಮುಗಿದಿದೆ ಎಂದು ವರದಿಯಾಗಿದೆ',no_longer_sold:'ಈಗ ಮಾರುವುದಿಲ್ಲ ಎಂದು ವರದಿಯಾಗಿದೆ'},
  archive:'ಹಳೆಯ ಪಟ್ಟಿಯಿಂದ', archiveNote:'ಮೊದಲ ಪಟ್ಟಿಯಿಂದ ಕೊಡುಗೆದಾರರ ಟಿಪ್ಪಣಿ. ಭೇಟಿಯ ದಿನಾಂಕ ತಿಳಿದಿಲ್ಲ.',
  reviews:'ಸಮುದಾಯದ ವಿಮರ್ಶೆಗಳು', scoreMethod:'ಅಂಕ ಹೇಗೆ ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ', submission:'ವಿಮರ್ಶೆಯ ಮೂಲ',
  approvedReview:'{count} ಅನುಮೋದಿತ ವಿಮರ್ಶೆ', approvedReviews:'{count} ಅನುಮೋದಿತ ವಿಮರ್ಶೆಗಳು',
  scoreLabels:{pastry:'ಪಫ್‌ನ ಹೊರಪದರ',filling:'ಒಳಗಿನ ಮಸಾಲೆ',egg:'ಮೊಟ್ಟೆ',freshness:'ತಾಜಾತನ',value:'ಬೆಲೆಗೆ ತಕ್ಕ ಮೌಲ್ಯ'},
  noReviews:'ಇನ್ನೂ ಅನುಮೋದಿತ ವಿಮರ್ಶೆ ಇಲ್ಲ.', addReview:'ಪಫ್ ವಿಮರ್ಶೆಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
  photos:'ಸಮುದಾಯದ ಚಿತ್ರಗಳು', noPhotos:'ಈ ಸ್ಥಳದ ಯಾವುದೇ ಚಿತ್ರ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.', addPhoto:'ನಿಮ್ಮ ಚಿತ್ರವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
  corrections:'ಮೂಲ ಮತ್ತು ತಿದ್ದುಪಡಿಗಳು', sourceExport:'ಸಮುದಾಯದ ಮೂಲ Google Maps ಪಟ್ಟಿ',
  sourceCommunity:'ಸಮುದಾಯದ ಕೊಡುಗೆ', row:'ಸಾಲು {number}', original:'ಮೂಲ ಆಕರ',
  verifiedOn:'ಕೊನೆಯ ಪರಿಶೀಲನೆ {date}', evidence:'ಪರಿಶೀಲನೆಯ ಸಾಕ್ಷ್ಯ', correct:'ಈ ದಾಖಲೆಯನ್ನು ತಿದ್ದಿ',
};

export const directoryCopy: Record<Locale,DirectoryCopy> = {en,ml,hi,ta,kn};

export function directoryCount(count: number, locale: Locale) {
  if (locale === 'en') return placeCount(count);
  const places = new Intl.PluralRules(locale).select(count) === 'one' ? directoryCopy[locale].onePlace : labelSets[locale].places;
  return new Intl.NumberFormat(locale).format(count) + ' ' + places;
}
