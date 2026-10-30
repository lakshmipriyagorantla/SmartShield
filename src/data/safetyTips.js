export const safetyTips = [
  {
    id: 1,
    icon: '🔐',
    languages: {
      en: { title: 'Never share OTP', text: 'An OTP is only for your bank or app login. No trusted person will ask for it.', explanation: 'An OTP approves a sign-in or sensitive action. Anyone who gets it may access your account or authorize an action.', steps: ['Keep the code private, including from callers claiming to be bank staff.', 'If you did not request the code, do not use it and contact the service through its official app or number.'] },
      hi: { title: 'OTP कभी साझा न करें', text: 'OTP केवल बैंक या ऐप में लॉगिन के लिए है। कोई भरोसेमंद व्यक्ति इसे नहीं मांगेगा।', explanation: 'OTP लॉगिन या संवेदनशील कार्रवाई की पुष्टि करता है। इसे पाने वाला व्यक्ति आपके खाते तक पहुँच सकता है या कार्रवाई मंजूर कर सकता है।', steps: ['कोड निजी रखें, उन कॉल करने वालों से भी जो बैंक कर्मचारी होने का दावा करें।', 'अगर आपने कोड नहीं मांगा, तो उसका उपयोग न करें और आधिकारिक ऐप या नंबर से सेवा से संपर्क करें।'] },
      te: { title: 'OTPను ఎప్పుడూ పంచకండి', text: 'OTP బ్యాంక్ లేదా యాప్‌లో లాగిన్ కోసం మాత్రమే. నమ్మకమైన వ్యక్తి దాన్ని అడగరు.', explanation: 'OTP లాగిన్ లేదా ముఖ్యమైన చర్యను ధ్రువీకరిస్తుంది. అది ఇతరులకు దొరికితే మీ ఖాతాను ఉపయోగించవచ్చు లేదా చర్యను ఆమోదించవచ్చు.', steps: ['బ్యాంక్ సిబ్బంది అని చెప్పే కాలర్‌తో సహా ఎవరికీ కోడ్ చెప్పకండి.', 'మీరు కోడ్ కోరనట్లయితే దాన్ని ఉపయోగించకండి; అధికారిక యాప్ లేదా నంబర్ ద్వారా సంప్రదించండి.'] },
    },
  },
  {
    id: 2,
    icon: '💳',
    languages: {
      en: { title: 'Never share UPI PIN', text: 'Your UPI PIN should never be shared with anyone, even if they say they are from a bank.', explanation: 'A UPI PIN authorizes a payment from your account. It is not needed to receive money or process a refund.', steps: ['Enter your PIN only in your trusted payment app to approve a payment you initiated.', 'Decline requests to disclose it by call, message, screen share, or QR code.'] },
      hi: { title: 'UPI PIN कभी साझा न करें', text: 'UPI PIN किसी को न बताएं, भले ही वह बैंक से होने का दावा करे।', explanation: 'UPI PIN आपके खाते से भुगतान को मंजूरी देता है। पैसे प्राप्त करने या रिफंड के लिए इसकी जरूरत नहीं होती।', steps: ['अपना PIN केवल भरोसेमंद भुगतान ऐप में, अपने शुरू किए भुगतान को मंजूर करने के लिए डालें।', 'कॉल, संदेश, स्क्रीन शेयर या QR कोड से PIN बताने के अनुरोध मना करें।'] },
      te: { title: 'UPI PINను ఎప్పుడూ పంచకండి', text: 'బ్యాంక్ నుంచి అని చెప్పినా మీ UPI PINను ఎవరికీ చెప్పకండి.', explanation: 'UPI PIN మీ ఖాతా నుంచి చెల్లింపును ఆమోదిస్తుంది. డబ్బు స్వీకరించడానికి లేదా రిఫండ్ పొందడానికి ఇది అవసరం లేదు.', steps: ['మీరు ప్రారంభించిన చెల్లింపును ఆమోదించేందుకు విశ్వసనీయ చెల్లింపు యాప్‌లో మాత్రమే PIN నమోదు చేయండి.', 'కాల్, సందేశం, స్క్రీన్ షేర్ లేదా QR కోడ్ ద్వారా PIN అడిగితే తిరస్కరించండి.'] },
    },
  },
  {
    id: 3,
    icon: '🔗',
    languages: {
      en: { title: 'Avoid unknown links', text: 'Do not tap links from unknown numbers or messages. They may steal your information.', explanation: 'A link can lead to a lookalike login page, an unwanted download, or a site asking for personal details.', steps: ['Check the full address and sender before opening a link.', 'Open the official app or type its known website address yourself instead.'] },
      hi: { title: 'अज्ञात लिंक से बचें', text: 'अज्ञात नंबर या संदेश के लिंक न खोलें। वे आपकी जानकारी चुरा सकते हैं।', explanation: 'लिंक नकली लॉगिन पेज, अवांछित डाउनलोड या निजी जानकारी मांगने वाली साइट पर ले जा सकता है।', steps: ['लिंक खोलने से पहले पूरा पता और भेजने वाले की जांच करें।', 'इसके बजाय आधिकारिक ऐप खोलें या वेबसाइट का जाना-पहचाना पता खुद लिखें।'] },
      te: { title: 'తెలియని లింక్‌లను తెరవకండి', text: 'తెలియని నంబర్లు లేదా సందేశాల లింక్‌లను నొక్కకండి. అవి మీ సమాచారాన్ని దొంగిలించవచ్చు.', explanation: 'లింక్ నకిలీ లాగిన్ పేజీకి, అనవసర డౌన్‌లోడ్‌కు లేదా వ్యక్తిగత వివరాలు అడిగే వెబ్‌సైట్‌కు తీసుకెళ్లవచ్చు.', steps: ['లింక్ తెరవడానికి ముందు పూర్తి చిరునామా, పంపినవారిని పరిశీలించండి.', 'బదులుగా అధికారిక యాప్‌ను తెరవండి లేదా తెలిసిన వెబ్ చిరునామాను మీరే టైప్ చేయండి.'] },
    },
  },
  {
    id: 4,
    icon: '📞',
    languages: {
      en: { title: 'Verify bank calls', text: 'If someone says they are from a bank, call the number on your bank card or passbook.', explanation: 'Caller ID and a caller’s story can be faked. Contacting the bank independently helps you avoid speaking with an impersonator.', steps: ['End an unexpected call that asks for codes, PINs, or urgent payment.', 'Call the official number printed on your card or listed in the official bank app.'] },
      hi: { title: 'बैंक कॉल की पुष्टि करें', text: 'कॉलर बैंक से होने का दावा करे तो कार्ड या पासबुक पर दिए नंबर पर कॉल करें।', explanation: 'कॉलर आईडी और कॉल करने वाले की कहानी नकली हो सकती है। बैंक से खुद संपर्क करने पर प्रतिरूपण करने वाले से बच सकते हैं।', steps: ['कोड, PIN या तत्काल भुगतान मांगने वाली अनपेक्षित कॉल काट दें।', 'कार्ड पर छपे या आधिकारिक बैंक ऐप में दिए नंबर पर कॉल करें।'] },
      te: { title: 'బ్యాంక్ కాల్‌ను ధ్రువీకరించండి', text: 'ఎవరైనా బ్యాంక్ నుంచి అని చెబితే, కార్డు లేదా పాస్‌బుక్‌లోని నంబర్‌కు కాల్ చేయండి.', explanation: 'కాలర్ ఐడీ, కాలర్ చెప్పే కథ నకిలీ కావచ్చు. బ్యాంక్‌ను మీరే సంప్రదిస్తే వేషధారిని నివారించవచ్చు.', steps: ['కోడ్‌లు, PINలు లేదా తక్షణ చెల్లింపు అడిగే ఊహించని కాల్‌ను ముగించండి.', 'కార్డుపై ముద్రించిన లేదా అధికారిక బ్యాంక్ యాప్‌లో ఉన్న నంబర్‌కు కాల్ చేయండి.'] },
    },
  },
  {
    id: 5,
    icon: '📱',
    languages: {
      en: { title: 'Do not install unknown apps', text: 'Only install apps from trusted stores and official app listings.', explanation: 'Apps from unknown sources may misuse contacts, messages, accessibility access, or payment information.', steps: ['Use your phone’s official app store and check the publisher name.', 'Review requested permissions and reject access the app does not need.'] },
      hi: { title: 'अज्ञात ऐप इंस्टॉल न करें', text: 'केवल भरोसेमंद स्टोर और आधिकारिक ऐप सूची से ऐप इंस्टॉल करें।', explanation: 'अज्ञात स्रोतों के ऐप संपर्क, संदेश, एक्सेसिबिलिटी या भुगतान जानकारी का दुरुपयोग कर सकते हैं।', steps: ['फोन के आधिकारिक ऐप स्टोर का उपयोग करें और प्रकाशक का नाम जांचें।', 'मांगी गई अनुमतियां पढ़ें और गैर-जरूरी पहुँच अस्वीकार करें।'] },
      te: { title: 'తెలియని యాప్‌లను ఇన్‌స్టాల్ చేయకండి', text: 'నమ్మకమైన స్టోర్‌లు, అధికారిక యాప్ జాబితాల నుంచే యాప్‌లను ఇన్‌స్టాల్ చేయండి.', explanation: 'తెలియని మూలాల యాప్‌లు కాంటాక్ట్‌లు, సందేశాలు, యాక్సెసిబిలిటీ లేదా చెల్లింపు సమాచారాన్ని దుర్వినియోగం చేయవచ్చు.', steps: ['ఫోన్ అధికారిక యాప్ స్టోర్‌ను ఉపయోగించి ప్రచురణకర్త పేరును చూడండి.', 'అడిగే అనుమతులను పరిశీలించి, అవసరం లేని ప్రాప్యతను నిరాకరించండి.'] },
    },
  },
  {
    id: 6,
    icon: '🛡️',
    languages: {
      en: { title: 'Use strong passwords', text: 'Choose a password that is hard to guess and do not share it with others.', explanation: 'Unique, hard-to-guess passwords reduce the chance that one exposed password opens several accounts.', steps: ['Use a different password for each important account.', 'Avoid names, birthdays, or common words; use a password manager if available.'] },
      hi: { title: 'मजबूत पासवर्ड रखें', text: 'ऐसा पासवर्ड चुनें जिसका अनुमान लगाना कठिन हो और उसे साझा न करें।', explanation: 'अलग और कठिन पासवर्ड से एक पासवर्ड उजागर होने पर कई खाते खुलने का जोखिम घटता है।', steps: ['हर महत्वपूर्ण खाते के लिए अलग पासवर्ड रखें।', 'नाम, जन्मदिन और आम शब्दों से बचें; उपलब्ध हो तो पासवर्ड मैनेजर इस्तेमाल करें।'] },
      te: { title: 'బలమైన పాస్‌వర్డ్‌లు వాడండి', text: 'ఊహించడం కష్టమైన పాస్‌వర్డ్ ఎంచుకుని ఇతరులతో పంచుకోకండి.', explanation: 'ప్రత్యేకమైన, ఊహించలేని పాస్‌వర్డ్‌లు ఒకటి బయటపడితే మిగతా ఖాతాలు తెరుచుకునే ప్రమాదాన్ని తగ్గిస్తాయి.', steps: ['ప్రతి ముఖ్యమైన ఖాతాకు వేరే పాస్‌వర్డ్ వాడండి.', 'పేర్లు, పుట్టినరోజులు, సాధారణ పదాలను నివారించండి; వీలైతే పాస్‌వర్డ్ మేనేజర్ వాడండి.'] },
    },
  },
  {
    id: 7,
    icon: '🔒',
    languages: {
      en: { title: 'Enable phone lock', text: 'Use a PIN, pattern, or fingerprint to protect your phone from unwanted access.', explanation: 'A screen lock helps protect messages, photos, and account sessions if the phone is lost or left unattended.', steps: ['Choose a non-obvious PIN or a secure biometric lock.', 'Set the screen to lock automatically after a short idle period.'] },
      hi: { title: 'फोन लॉक चालू रखें', text: 'अनचाही पहुँच से बचाने के लिए PIN, पैटर्न या फिंगरप्रिंट उपयोग करें।', explanation: 'फोन खोने या बिना देखरेख रहने पर स्क्रीन लॉक संदेशों, तस्वीरों और खुले खातों की रक्षा में मदद करता है।', steps: ['ऐसा PIN चुनें जिसका अनुमान न लगे, या सुरक्षित बायोमेट्रिक लॉक रखें।', 'थोड़ी देर उपयोग न होने पर स्क्रीन अपने आप लॉक होने दें।'] },
      te: { title: 'ఫోన్ లాక్‌ను ప్రారంభించండి', text: 'అనవసర ప్రాప్యతను అడ్డుకోవడానికి PIN, ప్యాటర్న్ లేదా వేలిముద్రను వాడండి.', explanation: 'ఫోన్ పోయినా లేదా గమనించకుండా వదిలినా స్క్రీన్ లాక్ సందేశాలు, ఫోటోలు, ఖాతాలను రక్షించడంలో సహాయపడుతుంది.', steps: ['ఊహించలేని PIN లేదా సురక్షిత బయోమెట్రిక్ లాక్ ఎంచుకోండి.', 'కొద్దిసేపు వాడకపోతే స్క్రీన్ స్వయంగా లాక్ అయ్యేలా పెట్టండి.'] },
    },
  },
  {
    id: 8,
    icon: '🔄',
    languages: {
      en: { title: 'Update your phone', text: 'Regular updates keep your phone safer and help fix security problems.', explanation: 'Operating-system and app updates often repair known security weaknesses and reliability issues.', steps: ['Install updates through the phone settings or official app store.', 'Turn on automatic updates when practical and restart if requested.'] },
      hi: { title: 'फोन अपडेट करें', text: 'नियमित अपडेट फोन को सुरक्षित रखते हैं और सुरक्षा समस्याएं ठीक करते हैं।', explanation: 'ऑपरेटिंग सिस्टम और ऐप अपडेट अक्सर ज्ञात सुरक्षा कमजोरियां और स्थिरता की समस्याएं ठीक करते हैं।', steps: ['फोन सेटिंग्स या आधिकारिक ऐप स्टोर से अपडेट इंस्टॉल करें।', 'उचित हो तो स्वचालित अपडेट चालू रखें और कहे जाने पर फोन रीस्टार्ट करें।'] },
      te: { title: 'ఫోన్‌ను అప్‌డేట్ చేయండి', text: 'క్రమమైన అప్‌డేట్‌లు ఫోన్‌ను సురక్షితంగా ఉంచి భద్రతా సమస్యలను సరిచేస్తాయి.', explanation: 'ఆపరేటింగ్ సిస్టమ్, యాప్ అప్‌డేట్‌లు తెలిసిన భద్రతా లోపాలు మరియు స్థిరత్వ సమస్యలను తరచుగా సరిచేస్తాయి.', steps: ['ఫోన్ సెట్టింగ్‌లు లేదా అధికారిక యాప్ స్టోర్ ద్వారా అప్‌డేట్‌లను ఇన్‌స్టాల్ చేయండి.', 'సాధ్యమైనప్పుడు ఆటోమేటిక్ అప్‌డేట్‌లు ప్రారంభించి, అడిగితే రీస్టార్ట్ చేయండి.'] },
    },
  },
  {
    id: 9,
    icon: '☎️',
    languages: {
      en: { title: 'Beware of fake customer-care numbers', text: 'Always check the official customer-care number from your bank, app, or card.', explanation: 'Search results, ads, and public posts can contain numbers planted by scammers pretending to offer support.', steps: ['Find support details inside the official app or on the organization’s known website.', 'Never install remote-access apps or share codes because a support caller asks.'] },
      hi: { title: 'नकली ग्राहक सहायता नंबर से सावधान रहें', text: 'बैंक, ऐप या कार्ड से आधिकारिक ग्राहक सहायता नंबर जांचें।', explanation: 'खोज परिणाम, विज्ञापन और सार्वजनिक पोस्ट में सहायता के नाम पर धोखेबाजों के नंबर हो सकते हैं।', steps: ['आधिकारिक ऐप या संस्था की जानी-पहचानी वेबसाइट से सहायता विवरण लें।', 'सहायता कॉलर के कहने पर रिमोट एक्सेस ऐप इंस्टॉल या कोड साझा न करें।'] },
      te: { title: 'నకిలీ కస్టమర్ కేర్ నంబర్ల పట్ల జాగ్రత్త', text: 'బ్యాంక్, యాప్ లేదా కార్డు నుంచి అధికారిక కస్టమర్ కేర్ నంబర్‌ను చూడండి.', explanation: 'శోధన ఫలితాలు, ప్రకటనలు, పబ్లిక్ పోస్టుల్లో సహాయం పేరుతో మోసగాళ్ల నంబర్లు ఉండవచ్చు.', steps: ['అధికారిక యాప్ లేదా సంస్థకు తెలిసిన వెబ్‌సైట్‌లోని వివరాలను ఉపయోగించండి.', 'సపోర్ట్ కాలర్ అడిగినందుకు రిమోట్ యాక్సెస్ యాప్ ఇన్‌స్టాల్ చేయకండి, కోడ్‌లు పంచకండి.'] },
    },
  },
  {
    id: 10,
    icon: '🎁',
    languages: {
      en: { title: 'Beware of lottery or prize scams', text: 'A surprise prize message is often a scam. Do not pay for a reward that you never asked for.', explanation: 'Fraudsters may claim you won a prize and demand a fee, tax, or personal details before releasing it.', steps: ['Do not pay an advance fee or share banking codes to claim a prize.', 'Verify the offer directly with the official organization using known contact details.'] },
      hi: { title: 'लॉटरी या इनाम धोखाधड़ी से सावधान रहें', text: 'अचानक इनाम का संदेश अक्सर धोखाधड़ी होता है। मांगे बिना मिले इनाम के लिए पैसे न दें।', explanation: 'धोखेबाज इनाम जीतने का दावा करके उसे देने से पहले शुल्क, टैक्स या निजी जानकारी मांग सकते हैं।', steps: ['इनाम पाने के लिए अग्रिम शुल्क न दें और बैंक कोड साझा न करें।', 'जाने-पहचाने आधिकारिक संपर्क से प्रस्ताव की पुष्टि करें।'] },
      te: { title: 'లాటరీ లేదా బహుమతి మోసాల పట్ల జాగ్రత్త', text: 'అకస్మాత్తుగా వచ్చే బహుమతి సందేశం మోసం కావచ్చు. మీరు అడగని బహుమతి కోసం డబ్బు చెల్లించకండి.', explanation: 'బహుమతి గెలిచారని చెప్పి దాన్ని విడుదల చేయడానికి ముందు రుసుము, పన్ను లేదా వ్యక్తిగత వివరాలు అడగవచ్చు.', steps: ['బహుమతి కోసం ముందస్తు రుసుము చెల్లించకండి, బ్యాంక్ కోడ్‌లు పంచకండి.', 'తెలిసిన అధికారిక సంప్రదింపు వివరాలతో ఆఫర్‌ను ధ్రువీకరించండి.'] },
    },
  },
  {
    id: 11,
    icon: '🧾',
    languages: {
      en: { title: 'Beware of fake KYC messages', text: 'Legitimate companies do not demand urgent KYC updates with payment links.', explanation: 'A fake KYC warning may threaten account suspension to pressure you into opening a link or sharing identity details.', steps: ['Do not use links or phone numbers in an unexpected message.', 'Check your account through the official app or contact the provider independently.'] },
      hi: { title: 'नकली KYC संदेशों से सावधान रहें', text: 'वैध कंपनियां भुगतान लिंक के साथ तुरंत KYC अपडेट की मांग नहीं करतीं।', explanation: 'नकली KYC चेतावनी खाता बंद करने की धमकी देकर लिंक खोलने या पहचान विवरण साझा करने का दबाव डाल सकती है।', steps: ['अनपेक्षित संदेश के लिंक या फोन नंबर का उपयोग न करें।', 'आधिकारिक ऐप में खाता जांचें या सेवा प्रदाता से खुद संपर्क करें।'] },
      te: { title: 'నకిలీ KYC సందేశాల పట్ల జాగ్రత్త', text: 'నిజమైన సంస్థలు చెల్లింపు లింక్‌తో అత్యవసర KYC అప్‌డేట్‌ను డిమాండ్ చేయవు.', explanation: 'నకిలీ KYC హెచ్చరిక ఖాతా నిలిపివేస్తామని బెదిరించి లింక్ తెరవమని లేదా గుర్తింపు వివరాలు పంచమని ఒత్తిడి చేయవచ్చు.', steps: ['అనుకోని సందేశంలోని లింక్ లేదా ఫోన్ నంబర్‌ను ఉపయోగించకండి.', 'అధికారిక యాప్‌లో ఖాతాను చూడండి లేదా సేవాదారుని మీరే సంప్రదించండి.'] },
    },
  },
  {
    id: 12,
    icon: '🖥️',
    languages: {
      en: { title: 'Beware of remote-access apps', text: 'Never allow someone to install an app that can control your phone without checking first.', explanation: 'Remote-access tools can expose screens, messages, and financial activity. Scammers often pose as support staff to gain control.', steps: ['Do not install remote-control apps at an unknown caller’s request.', 'If already installed under pressure, disconnect, remove the app, and contact your bank through an official channel.'] },
      hi: { title: 'रिमोट एक्सेस ऐप से सावधान रहें', text: 'जांच किए बिना किसी को फोन नियंत्रित करने वाला ऐप इंस्टॉल न करने दें।', explanation: 'रिमोट एक्सेस टूल स्क्रीन, संदेश और वित्तीय गतिविधि दिखा सकते हैं। धोखेबाज नियंत्रण पाने के लिए सहायता कर्मचारी बन सकते हैं।', steps: ['अज्ञात कॉलर के कहने पर रिमोट कंट्रोल ऐप इंस्टॉल न करें।', 'दबाव में ऐप इंस्टॉल हो गया हो तो इंटरनेट काटें, ऐप हटाएं और आधिकारिक माध्यम से बैंक से संपर्क करें।'] },
      te: { title: 'రిమోట్ యాక్సెస్ యాప్‌ల పట్ల జాగ్రత్త', text: 'పరిశీలించకుండా మీ ఫోన్‌ను నియంత్రించే యాప్‌ను ఎవరినీ ఇన్‌స్టాల్ చేయనివ్వకండి.', explanation: 'రిమోట్ యాక్సెస్ సాధనాలు స్క్రీన్, సందేశాలు, ఆర్థిక కార్యకలాపాలను చూపగలవు. నియంత్రణ పొందడానికి మోసగాళ్లు సపోర్ట్ సిబ్బందిగా నటిస్తారు.', steps: ['తెలియని కాలర్ అడిగినందుకు రిమోట్ కంట్రోల్ యాప్‌ను ఇన్‌స్టాల్ చేయకండి.', 'ఒత్తిడితో ఇన్‌స్టాల్ చేసి ఉంటే కనెక్షన్ నిలిపి, యాప్ తొలగించి, అధికారిక మార్గంలో బ్యాంక్‌ను సంప్రదించండి.'] },
    },
  },
]

export const tipsOfTheDay = [
  'Your OTP is personal. Never share it with anyone.',
  'If a call feels urgent, stop and verify using a trusted number.',
  'A safe payment always matches the recipient and amount.',
  'Do not install apps from unknown websites or messages.',
  'Ask a trusted family member to check before paying online.',
]