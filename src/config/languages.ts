import { IndianLanguageCode } from '../types';

export interface IndianLanguageItem {
  code: IndianLanguageCode;
  name: string;
  nativeName: string;
  script: string;
  region: string;
  sampleGreeting: string;
  promptInstruction: string;
  quickStarters: {
    title: string;
    prompt: string;
  }[];
}

export const INDIAN_LANGUAGES: IndianLanguageItem[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (Default)',
    script: 'Latin',
    region: 'Global / Pan-India',
    sampleGreeting: 'Welcome to your cognitive space. What would you like to synthesize today?',
    promptInstruction: 'Respond in natural, elegant English.',
    quickStarters: [
      { title: 'Architectural Blueprint', prompt: 'Design a resilient spatial computing architecture.' },
      { title: 'Aesthetic Philosophy', prompt: 'Synthesize the design philosophy behind liquid-glass interfaces.' },
    ],
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari (देवनागरी)',
    region: 'North & Central India (Official)',
    sampleGreeting: 'एथेरिया में आपका स्वागत है। आज आप क्या जानना या रचना चाहते हैं?',
    promptInstruction: 'You must respond primarily in natural, polite Hindi (हिन्दी) using clear Devanagari script. Technical code or identifiers may remain in English where standard.',
    quickStarters: [
      { title: 'वास्तुकला ब्लूप्रिंट', prompt: 'आधुनिक क्लाउड और एआई सिस्टम के लिए एक स्केलेबल आर्किटेक्चर डिज़ाइन करें।' },
      { title: 'क्वांटम कंप्यूटिंग', prompt: 'क्वांटम एंटैंगलमेंट को सरल और स्पष्ट उदाहरणों के साथ समझाएं।' },
    ],
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali-Assamese (বাংলা)',
    region: 'West Bengal, Tripura & Eastern India',
    sampleGreeting: 'এথেরিয়ায় স্বাগতম। আজ আপনি কী অন্বেষণ করতে চান?',
    promptInstruction: 'You must respond primarily in natural Bengali (বাংলা) using authentic Bengali script.',
    quickStarters: [
      { title: 'সফটওয়্যার আর্কিটেকচার', prompt: 'রিয়েল-টাইম অ্যাপের জন্য আধুনিক ডেটা পাইপলাইন ডিজাইন করুন।' },
      { title: 'বিজ্ঞান ও দর্শন', prompt: 'কৃত্রিম বুদ্ধিমত্তা এবং মানব চিন্তার সম্পর্ক বিশ্লেষণ করুন।' },
    ],
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu (తెలుగు)',
    region: 'Andhra Pradesh & Telangana',
    sampleGreeting: 'ఎథీరియాకు స్వాగతం. ఈరోజు మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?',
    promptInstruction: 'You must respond primarily in polite, articulate Telugu (తెలుగు) using proper Telugu script.',
    quickStarters: [
      { title: 'సిస్టమ్ ఆర్కిటెక్చర్', prompt: 'హై-స్కేల్ వెబ్ అప్లికేషన్ కోసం బలమైన సిస్టమ్ డిజైన్ ప్రతిపాదించండి.' },
      { title: 'సాంకేతిక పరిజ్ఞానం', prompt: 'మెషిన్ లెర్నింగ్ మోడల్స్ పనితీరును సులభంగా వివరించండి.' },
    ],
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari (बाळबोध)',
    region: 'Maharashtra & Western India',
    sampleGreeting: 'एथेरियामध्ये आपले स्वागत आहे. आज आपण कशावर विचार करू इच्छिता?',
    promptInstruction: 'You must respond primarily in natural, fluent Marathi (मराठी) using Devanagari script.',
    quickStarters: [
      { title: 'प्रणाली संरचना', prompt: 'मोठ्या प्रमाणातील डेटा प्रक्रियेसाठी आर्किटेक्चर तयार करा.' },
      { title: 'वैज्ञानिक संकल्पना', prompt: 'कृत्रिम बुद्धिमत्तेचे भविष्य आणि त्याचे परिणाम यावर चर्चा करा.' },
    ],
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil (தமிழ்)',
    region: 'Tamil Nadu & Puducherry',
    sampleGreeting: 'ஏதேரியாவிற்கு நல்வரவு. இன்று நீங்கள் எதைப் பற்றி சிந்திக்க விரும்புகிறீர்கள்?',
    promptInstruction: 'You must respond primarily in eloquent, accurate Tamil (தமிழ்) using native Tamil script.',
    quickStarters: [
      { title: 'கட்டமைப்பு வடிவமைப்பு', prompt: 'நிகழ்நேர தரவு ஓட்டங்களுக்கான உயர் செயல்திறன் கொண்ட அமைப்பை வடிவமைக்கவும்.' },
      { title: 'அறிவியல் சிந்தனை', prompt: 'குவாண்டம் இயற்பியல் மற்றும் அதன் பயன்பாடுகளை எளிமையாக விளக்கவும்.' },
    ],
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati (ગુજરાતી)',
    region: 'Gujarat & Western India',
    sampleGreeting: 'એથેરિયામાં આપનું સ્વાગત છે. આજે તમે શેના વિશે વિચારવા માંગો છો?',
    promptInstruction: 'You must respond primarily in authentic, fluent Gujarati (ગુજરાતી) using Gujarati script.',
    quickStarters: [
      { title: 'સિસ્ટમ ડિઝાઇન', prompt: 'સ્કેલેબલ ક્લાઉડ આર્કિટેક્ચરનું માળખું તૈયાર કરો.' },
      { title: 'વ્યાપાર અને તકનીક', prompt: 'નવીનતમ એઆઈ સાધનો કેવી રીતે ઉત્પાદકતા વધારી શકે છે તે સમજાવો.' },
    ],
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada (ಕನ್ನಡ)',
    region: 'Karnataka & Southern India',
    sampleGreeting: 'ಎಥೀರಿಯಾಗೆ ಸುಸ್ವಾಗತ. ಇಂದು ನೀವು ಏನನ್ನು ಅನ್ವೇಷಿಸಲು ಬಯಸುತ್ತೀರಿ?',
    promptInstruction: 'You must respond primarily in natural, clear Kannada (ಕನ್ನಡ) using Kannada script.',
    quickStarters: [
      { title: 'ತಂತ್ರಜ್ಞಾನ ವಿನ್ಯಾಸ', prompt: 'ವೇಗದ ಮತ್ತು ಸುರಕ್ಷಿತ ಸಾಫ್ಟ್‌ವೇರ್ ಆರ್ಕಿಟೆಕ್ಚರ್ ವಿನ್ಯಾಸಗೊಳಿಸಿ.' },
      { title: 'ಬುದ್ಧಿಮತ್ತೆ ಮತ್ತು ಆವಿಷ್ಕಾರ', prompt: 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯ ಮೂಲ ತತ್ವಗಳನ್ನು ಸುಲಭವಾಗಿ ವಿವರಿಸಿ.' },
    ],
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam (മലയാളം)',
    region: 'Kerala & Lakshadweep',
    sampleGreeting: 'എഥീരിയയിലേക്ക് സ്വാഗതം. ഇന്ന് എന്താണ് ചിന്തിക്കാൻ ആഗ്രഹിക്കുന്നത്?',
    promptInstruction: 'You must respond primarily in natural, sophisticated Malayalam (മലയാളം) using Malayalam script.',
    quickStarters: [
      { title: 'സിസ്റ്റം ആർക്കിടെക്ചർ', prompt: 'തത്സമയ ഡാറ്റ പ്രോസസ്സിംഗിനായി കാര്യക്ഷമമായ ഒരു സിസ്റ്റം ഡിസൈൻ ചെയ്യുക.' },
      { title: 'ശാസ്ത്രീയ ചിന്ത', prompt: 'ഡീപ് ലേണിംഗ് മോഡലുകളുടെ പ്രവർത്തന തത്വം വിശദീകരിക്കുക.' },
    ],
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi (ਗੁਰਮੁਖੀ)',
    region: 'Punjab & Northern India',
    sampleGreeting: 'ਏਥੇਰੀਆ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ। ਅੱਜ ਤੁਸੀਂ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?',
    promptInstruction: 'You must respond primarily in natural, friendly Punjabi (ਪੰਜਾਬੀ) using Gurmukhi script.',
    quickStarters: [
      { title: 'ਸਿਸਟਮ ਡਿਜ਼ਾਈਨ', prompt: 'ਵੱਡੇ ਪੈਮਾਨੇ ਦੇ ਕਲਾਉਡ ਸਿਸਟਮ ਲਈ ਮਜ਼ਬੂਤ ਆਰਕੀਟੈਕਚਰ ਬਣਾਓ।' },
      { title: 'ਤਕਨਾਲੋਜੀ ਅਤੇ ਭਵਿੱਖ', prompt: 'ਆਰਟੀਫੀਸ਼ੀਅਲ ਇੰਟੈਲੀਜੈਂਸ ਦੀ ਵਰਤੋਂ ਅਤੇ ਇਸਦੇ ਲਾਭ ਸਮਝਾਓ।' },
    ],
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia (ଓଡ଼ିଆ)',
    region: 'Odisha & Eastern India',
    sampleGreeting: 'ଏଥେରିଆକୁ ସ୍ୱାଗତ। ଆଜି ଆପଣ କଣ ଜାଣିବାକୁ ଚାହାଁନ୍ତି?',
    promptInstruction: 'You must respond primarily in natural, elegant Odia (ଓଡ଼ିଆ) using authentic Odia script.',
    quickStarters: [
      { title: 'ସିଷ୍ଟମ ଆର୍କିଟେକ୍ଚର', prompt: 'ଆଧୁନିକ କ୍ଲାଉଡ଼ ସିଷ୍ଟମ ପାଇଁ ଏକ ଦୃଢ଼ ଢାଞ୍ଚା ପ୍ରସ୍ତୁତ କରନ୍ତୁ।' },
      { title: 'ଜ୍ଞାନ ଓ ବିଜ୍ଞାନ', prompt: 'କୃତ୍ରିମ ବୁଦ୍ଧିମତ୍ତାର ମୁଖ୍ୟ ଉପଯୋଗିତା ବିଷୟରେ ଆଲୋଚନା କରନ୍ତୁ।' },
    ],
  },
];

export function getLanguageItem(code?: string): IndianLanguageItem {
  const found = INDIAN_LANGUAGES.find((lang) => lang.code === code);
  return found || INDIAN_LANGUAGES[0];
}
