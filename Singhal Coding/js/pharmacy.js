/* ============================================================
   Pharmacy — WhatsApp medicine check, address copy
   ============================================================ */
window.PHARMACY_PHONE = "919457088602";

window.openWhatsAppForMedicine = function(medicineName){
  const name = (medicineName || "").trim();
  const lang = document.documentElement.getAttribute("data-lang") || "en";
  let message;
  if(lang === "hi"){
    message = name
      ? `नमस्ते सिंगल मेडिकेयर,\n\nमुझे यह दवाई चाहिए — ${name}\n\nक्या यह स्टॉक में है? दाम कितना है?`
      : "नमस्ते सिंगल मेडिकेयर, मुझे एक दवाई के बारे में पूछना है।";
  } else {
    message = name
      ? `Hi Singhal Medicare,\n\nI want to check the availability of: ${name}\n\nIs it in stock? What is the price?`
      : "Hi Singhal Medicare, I want to ask about a medicine.";
  }
  const url = `https://wa.me/${window.PHARMACY_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
};

window.copyAddress = async function(){
  const address = "Singhal Medicare LLP, Opposite Ahuja Hospital, Station Road, Khera Mohalla, Shikohabad, Firozabad, Uttar Pradesh 283135";
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(address);
    } else {
      const ta = document.createElement("textarea");
      ta.value = address;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    window.showToast(window.t("vs.copied","Address copied"));
  } catch(e){
    window.showToast("Could not copy — please copy manually.");
  }
};

window.showToast = function(msg){
  const el = document.getElementById("toast");
  if(!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>el.classList.remove("show"), 2200);
};
