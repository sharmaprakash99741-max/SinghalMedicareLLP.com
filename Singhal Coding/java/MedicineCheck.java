/*
 * Singhal Medicare LLP — Medicine Availability Checker (Java)
 * =============================================================
 * Console utility that takes a medicine name and prints:
 *   • A ready-to-send WhatsApp deep link (wa.me) with the enquiry.
 *   • A tel: link for direct calling.
 *   • A short stock-check checklist for the counter staff.
 *
 * Compile & run (from the project root):
 *   javac -d build/java java/MedicineCheck.java
 *   java -cp build/java MedicineCheck "Paracetamol 650 mg"
 *   java -cp build/java MedicineCheck --hi "पैरासिटामोल 650"
 *
 * No external libraries required.
 */

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

public class MedicineCheck {

    static final String PHONE_WA  = "919457088602";
    static final String PHONE_TEL = "+919457088602";
    static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    public static void main(String[] args) {
        boolean hindi = false;
        StringBuilder sb = new StringBuilder();
        for (String a : args) {
            if (a.equals("--hi") || a.equals("--hindi")) { hindi = true; continue; }
            if (a.equals("--en") || a.equals("--english")) { hindi = false; continue; }
            if (sb.length() > 0) sb.append(' ');
            sb.append(a);
        }
        String name = sb.toString().trim();

        if (name.isEmpty()) {
            printUsage(hindi);
            System.exit(1);
        }

        String message = hindi
            ? "नमस्ते सिंगल मेडिकेयर,\n\nमुझे यह दवाई चाहिए — " + name +
              "\n\nक्या यह स्टॉक में है? दाम कितना है?"
            : "Hi Singhal Medicare,\n\nI want to check the availability of: " + name +
              "\n\nIs it in stock? What is the price?";

        String waUrl = "https://wa.me/" + PHONE_WA + "?text=" +
                       URLEncoder.encode(message, StandardCharsets.UTF_8);
        String telUrl = "tel:" + PHONE_TEL;

        ZonedDateTime now = ZonedDateTime.now(IST);
        String stamp = now.format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy · HH:mm z"));

        System.out.println("=".repeat(64));
        System.out.println(" Singhal Medicare LLP — Medicine Availability Check");
        System.out.println("=".repeat(64));
        System.out.println(" Generated : " + stamp);
        System.out.println(" Medicine  : " + name);
        System.out.println();
        System.out.println(" WhatsApp  : " + waUrl);
        System.out.println(" Call      : " + telUrl);
        System.out.println();
        System.out.println("-".repeat(64));
        System.out.println(" Counter checklist");
        System.out.println("-".repeat(64));
        System.out.println("  [ ] Confirm generic / brand and strength");
        System.out.println("  [ ] Check batch expiry (min 6 months)");
        System.out.println("  [ ] Check rack + cold-chain (if applicable)");
        System.out.println("  [ ] Confirm prescription requirement (Schedule H / H1 / X)");
        System.out.println("  [ ] Quote MRP and any running discount");
        System.out.println("  [ ] Offer substitute only with patient's consent");
        System.out.println();
        System.out.println(" Disclaimer: Stock and prices change. The clinic confirms");
        System.out.println(" availability on WhatsApp or phone. Always take medicines");
        System.out.println(" as advised by your doctor.");
        System.out.println("=".repeat(64));
    }

    static void printUsage(boolean hindi) {
        if (hindi) {
            System.out.println("उपयोग: java -cp build/java MedicineCheck \"दवाई का नाम\"");
            System.out.println("उदाहरण: java -cp build/java MedicineCheck --hi \"पैरासिटामोल 650\"");
        } else {
            System.out.println("Usage: java -cp build/java MedicineCheck \"<medicine name>\"");
            System.out.println("Flags: --hi (Hindi message), --en (English message)");
            System.out.println("Example: java -cp build/java MedicineCheck \"Paracetamol 650 mg\"");
        }
    }
}
