/* ============================================================
   Doctors data + IST-based "Today" logic
   Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
   A doctor with `days: null` sits daily (subject to change).
   A doctor with `days: []` has no fixed day — call for timing.
   ============================================================ */
window.DOCTORS = [
  {
    id:"manshi-bansal",
    name:{en:"Dr. Manshi Bansal", hi:"डॉ. मंशी बंसल"},
    spec:{en:"General Physician", hi:"सामान्य चिकित्सक"},
    category:"physician",
    time:{en:"10:00 AM – 5:00 PM", hi:"सुबह 10:00 – शाम 5:00"},
    days:null, // daily per supplied info
    initials:"MB",
    about:{
      en:"General Physician sitting daily at the clinic. Consultation for fever, infection, diabetes, blood pressure, thyroid, and general adult illness.",
      hi:"क्लिनिक पर प्रतिदिन बैठने वाले सामान्य चिकित्सक। बुखार, संक्रमण, डायबिटीज़, ब्लड प्रेशर, थायराइड और सामान्य बीमारियों के लिए परामर्श।"
    }
  },
  {
    id:"mukesh-chaturvedi",
    name:{en:"Dr. Mukesh Chaturvedi", hi:"डॉ. मुकेश चतुर्वेदी"},
    spec:{en:"General Surgeon", hi:"सामान्य सर्जन"},
    category:"surgeon",
    time:{en:"Call for timing", hi:"समय के लिए कॉल करें"},
    days:[],
    initials:"MC",
    about:{
      en:"General Surgeon. Consultation for hernia, appendix, gall bladder, piles, fissure and other surgical conditions. Please call to confirm sitting day.",
      hi:"सामान्य सर्जन। हर्निया, अपेंडिक्स, गॉल ब्लैडर, पाइल्स, फिशर और अन्य सर्जिकल समस्याओं के लिए परामर्श। कृपया बैठने का दिन कॉल कर पूछें।"
    }
  },
  {
    id:"sd-sharma",
    name:{en:"Dr. S.D. Sharma", hi:"डॉ. एस.डी. शर्मा"},
    spec:{en:"Neurologist", hi:"न्यूरोलॉजिस्ट"},
    category:"neuro",
    time:{en:"Call for timing", hi:"समय के लिए कॉल करें"},
    days:[],
    initials:"SS",
    about:{
      en:"Neurologist. Headache, migraine, epilepsy, stroke follow-up, nerve and spine-related problems. Please call to confirm sitting day.",
      hi:"न्यूरोलॉजिस्ट। सिरदर्द, माइग्रेन, मिर्गी, स्ट्रोक फॉलो-अप, नस और रीढ़ से जुड़ी समस्याएँ। कृपया बैठने का दिन कॉल कर पूछें।"
    }
  },
  {
    id:"shuchita-bharadwaj",
    name:{en:"Dr. Shuchita Bharadwaj", hi:"डॉ. शुचिता भारद्वाज"},
    spec:{en:"Cosmetologist", hi:"कॉस्मेटोलॉजिस्ट"},
    category:"skin",
    time:{en:"Wed, Fri · 11:00 AM – 2:00 PM", hi:"बुध, शुक्र · सुबह 11:00 – दोपहर 2:00"},
    days:[3,5],
    initials:"SB",
    about:{
      en:"Cosmetologist. Acne, pigmentation, hair fall, laser and cosmetic consultations. Sits Wednesday and Friday, 11 AM to 2 PM.",
      hi:"कॉस्मेटोलॉजिस्ट। मुँहासे, पिगमेंटेशन, बाल झड़ना, लेज़र और कॉस्मेटिक परामर्श। बुधवार और शुक्रवार, सुबह 11 से दोपहर 2 बजे तक बैठती हैं।"
    }
  },
  {
    id:"rk-verma",
    name:{en:"Dr. R.K. Verma", hi:"डॉ. आर.के. वर्मा"},
    spec:{en:"Dermatologist & Cosmetologist", hi:"त्वचा रोग विशेषज्ञ और कॉस्मेटोलॉजिस्ट"},
    category:"skin",
    time:{en:"Tue, Sat · 3:00 PM – 5:00 PM", hi:"मंगल, शनि · शाम 3:00 – 5:00"},
    days:[2,6],
    initials:"RV",
    about:{
      en:"Dermatologist and Cosmetologist. Skin allergy, eczema, psoriasis, fungal infection, acne and cosmetic procedures. Sits Tuesday and Saturday, 3 PM to 5 PM.",
      hi:"त्वचा रोग विशेषज्ञ और कॉस्मेटोलॉजिस्ट। त्वचा एलर्जी, एक्ज़िमा, सोरायसिस, फंगल इन्फेक्शन, मुँहासे और कॉस्मेटिक प्रक्रियाएँ। मंगलवार और शनिवार, शाम 3 से 5 बजे तक बैठते हैं।"
    }
  },
  {
    id:"nancy-yadav",
    name:{en:"Dr. Nancy Yadav", hi:"डॉ. नैन्सी यादव"},
    spec:{en:"Gynecologist", hi:"स्त्री रोग विशेषज्ञ"},
    category:"women",
    time:{en:"Call for timing", hi:"समय के लिए कॉल करें"},
    days:[],
    initials:"NY",
    about:{
      en:"Gynecologist. Pregnancy care, menstrual problems, PCOS, menopause and general women's health. Please call to confirm sitting day.",
      hi:"स्त्री रोग विशेषज्ञ। गर्भावस्था देखभाल, मासिक धर्म समस्याएँ, PCOS, मेनोपॉज़ और सामान्य महिला स्वास्थ्य। कृपया बैठने का दिन कॉल कर पूछें।"
    }
  },
  {
    id:"virat-tiwari",
    name:{en:"Dr. Virat Tiwari", hi:"डॉ. विराट तिवारी"},
    spec:{en:"Pediatrician", hi:"बाल रोग विशेषज्ञ"},
    category:"child",
    time:{en:"Call for timing", hi:"समय के लिए कॉल करें"},
    days:[],
    initials:"VT",
    about:{
      en:"Pediatrician. Newborn care, vaccination, growth and development, fever, cough and childhood illness. Please call to confirm sitting day.",
      hi:"बाल रोग विशेषज्ञ। नवजात देखभाल, टीकाकरण, विकास, बुखार, खाँसी और बचपन की बीमारियाँ। कृपया बैठने का दिन कॉल कर पूछें।"
    }
  },
  {
    id:"anup-kumar",
    name:{en:"Dr. Anup Kumar", hi:"डॉ. अनुप कुमार"},
    spec:{en:"Ayurvedic Specialist (Ksharsutra)", hi:"आयुर्वेद विशेषज्ञ (क्षारसूत्र)"},
    category:"ayur",
    time:{en:"Call for timing", hi:"समय के लिए कॉल करें"},
    days:[],
    initials:"AK",
    about:{
      en:"Ayurvedic specialist with expertise in Ksharsutra therapy for piles, fissure and fistula. Please call to confirm sitting day.",
      hi:"पाइल्स, फिशर और फिस्टुला के लिए क्षारसूत्र चिकित्सा में विशेषज्ञ आयुर्वेदिक चिकित्सक। कृपया बैठने का दिन कॉल कर पूछें।"
    }
  }
];

/* Get current time in IST regardless of visitor timezone */
window.getISTNow = function(){
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5); // IST = UTC+5:30
};

/* Is a doctor sitting today? */
window.isSittingToday = function(doc){
  if(doc.days === null) return true;             // daily
  if(!Array.isArray(doc.days)) return false;
  if(doc.days.length === 0) return false;        // call for timing
  return doc.days.includes(window.getISTNow().getDay());
};

/* Pharmacy open state (8:30 – 20:00 IST daily) */
window.pharmacyOpenState = function(){
  const ist = window.getISTNow();
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  const open = minutes >= 8*60 + 30 && minutes < 20*60;
  return {open, minutes, ist};
};

/* Day names — used by utilities */
window.DAY_NAMES = {
  en:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  hi:["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"]
};
