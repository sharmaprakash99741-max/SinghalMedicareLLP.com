/*
 * Singhal Medicare LLP — Schedule Report (Java)
 * ==============================================
 * Reads data/clinic.json and prints:
 *   1. Whether the pharmacy is open right now (IST).
 *   2. Which doctors are sitting today (IST).
 *   3. A weekly schedule grid.
 *
 * Compile & run (from the project root):
 *   javac -d build/java java/ScheduleReport.java
 *   java -cp build/java ScheduleReport
 *
 * Optional JSON output:
 *   java -cp build/java ScheduleReport --json
 *
 * No external libraries required — uses only the JDK.
 */

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ScheduleReport {

    static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    static final String[] DAY_NAMES = {
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    };

    /* ---------------------------------------------------------- */
    /* Tiny JSON parser — enough for our flat clinic.json shape    */
    /* ---------------------------------------------------------- */
    static class Json {
        static Object parse(String src) {
            int[] pos = {0};
            Object v = parseValue(src, pos);
            return v;
        }

        static void skipWs(String s, int[] p) {
            while (p[0] < s.length() && Character.isWhitespace(s.charAt(p[0]))) p[0]++;
        }

        static Object parseValue(String s, int[] p) {
            skipWs(s, p);
            char c = s.charAt(p[0]);
            if (c == '{') return parseObject(s, p);
            if (c == '[') return parseArray(s, p);
            if (c == '"') return parseString(s, p);
            if (c == 't' || c == 'f') return parseBool(s, p);
            if (c == 'n') { p[0] += 4; return null; }
            return parseNumber(s, p);
        }

        @SuppressWarnings("unchecked")
        static Map<String, Object> parseObject(String s, int[] p) {
            Map<String, Object> m = new LinkedHashMap<>();
            p[0]++; // {
            skipWs(s, p);
            if (s.charAt(p[0]) == '}') { p[0]++; return m; }
            while (true) {
                skipWs(s, p);
                String key = parseString(s, p);
                skipWs(s, p);
                p[0]++; // :
                Object val = parseValue(s, p);
                m.put(key, val);
                skipWs(s, p);
                char c = s.charAt(p[0]++);
                if (c == '}') break;
            }
            return m;
        }

        static List<Object> parseArray(String s, int[] p) {
            List<Object> list = new ArrayList<>();
            p[0]++; // [
            skipWs(s, p);
            if (s.charAt(p[0]) == ']') { p[0]++; return list; }
            while (true) {
                list.add(parseValue(s, p));
                skipWs(s, p);
                char c = s.charAt(p[0]++);
                if (c == ']') break;
            }
            return list;
        }

        static String parseString(String s, int[] p) {
            p[0]++; // opening quote
            StringBuilder sb = new StringBuilder();
            while (true) {
                char c = s.charAt(p[0]++);
                if (c == '"') break;
                if (c == '\\') {
                    char e = s.charAt(p[0]++);
                    switch (e) {
                        case 'n': sb.append('\n'); break;
                        case 't': sb.append('\t'); break;
                        case 'r': sb.append('\r'); break;
                        case '"': sb.append('"'); break;
                        case '\\': sb.append('\\'); break;
                        case '/': sb.append('/'); break;
                        case 'u':
                            sb.append((char) Integer.parseInt(s.substring(p[0], p[0] + 4), 16));
                            p[0] += 4;
                            break;
                        default: sb.append(e);
                    }
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }

        static Boolean parseBool(String s, int[] p) {
            if (s.startsWith("true", p[0])) { p[0] += 4; return Boolean.TRUE; }
            p[0] += 5;
            return Boolean.FALSE;
        }

        static Object parseNumber(String s, int[] p) {
            int start = p[0];
            while (p[0] < s.length() && "+-0123456789.eE".indexOf(s.charAt(p[0])) >= 0) p[0]++;
            String tok = s.substring(start, p[0]);
            if (tok.contains(".") || tok.contains("e") || tok.contains("E")) return Double.parseDouble(tok);
            return Long.parseLong(tok);
        }
    }

    /* ---------------------------------------------------------- */
    /* Domain helpers                                              */
    /* ---------------------------------------------------------- */
    @SuppressWarnings("unchecked")
    static Map<String, Object> load(String path) throws IOException {
        String src = new String(Files.readAllBytes(Paths.get(path)), StandardCharsets.UTF_8);
        return (Map<String, Object>) Json.parse(src);
    }

    static int jsDay(ZonedDateTime t) {
        // JS getDay(): Sun=0..Sat=6
        DayOfWeek d = t.getDayOfWeek();
        return d == DayOfWeek.SUNDAY ? 0 : d.getValue();
    }

    static LocalTime parseHHMM(String s) {
        String[] parts = s.split(":");
        return LocalTime.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
    }

    static boolean pharmacyOpen(Map<String, Object> clinic, ZonedDateTime now) {
        Map<String, Object> hours = (Map<String, Object>) clinic.get("hours");
        LocalTime open = parseHHMM((String) hours.get("open"));
        LocalTime close = parseHHMM((String) hours.get("close"));
        LocalTime t = now.toLocalTime();
        return !t.isBefore(open) && t.isBefore(close);
    }

    @SuppressWarnings("unchecked")
    static boolean isSittingToday(Map<String, Object> doc, ZonedDateTime now) {
        Object days = doc.get("days");
        if (days == null) return true;                       // daily
        if (!(days instanceof List)) return false;
        List<Object> list = (List<Object>) days;
        if (list.isEmpty()) return false;                    // call for timing
        int today = jsDay(now);
        for (Object o : list) {
            if (((Number) o).intValue() == today) return true;
        }
        return false;
    }

    static String daysLabel(Map<String, Object> doc) {
        Object days = doc.get("days");
        if (days == null) return "Every day";
        if (!(days instanceof List)) return "No fixed day — call for timing";
        @SuppressWarnings("unchecked")
        List<Object> list = (List<Object>) days;
        if (list.isEmpty()) return "No fixed day — call for timing";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(DAY_NAMES[((Number) list.get(i)).intValue() % 7]);
        }
        return sb.toString();
    }

    /* ---------------------------------------------------------- */
    /* Output                                                      */
    /* ---------------------------------------------------------- */
    static String renderText(Map<String, Object> data, ZonedDateTime now) {
        StringBuilder out = new StringBuilder();
        Map<String, Object> clinic = (Map<String, Object>) data.get("clinic");
        Map<String, Object> addr = (Map<String, Object>) clinic.get("address");
        List<Map<String, Object>> docs = (List<Map<String, Object>>) data.get("doctors");

        String sep = "=".repeat(66);
        String sub = "-".repeat(66);

        out.append(sep).append('\n');
        out.append(" ").append(clinic.get("legal_name")).append(" — Schedule Report\n");
        out.append(" ").append(clinic.get("kind")).append(" · ")
           .append(addr.get("city")).append(", ").append(addr.get("state")).append('\n');
        out.append(sep).append('\n');
        out.append(" Generated: ")
           .append(now.format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy · HH:mm z")))
           .append('\n');
        out.append(" Phone    : ").append(clinic.get("phone")).append('\n');
        out.append(" WhatsApp : +").append(clinic.get("whatsapp")).append('\n');
        out.append('\n');

        boolean open = pharmacyOpen(clinic, now);
        Map<String, Object> hours = (Map<String, Object>) clinic.get("hours");
        out.append(" Pharmacy : ")
           .append(open ? "Open" : "Closed")
           .append(" · ").append(hours.get("open")).append("–").append(hours.get("close"))
           .append(" IST · now ").append(now.format(DateTimeFormatter.ofPattern("HH:mm")))
           .append('\n');
        out.append(" Payments : ").append(String.join(", ", (List<String>) clinic.get("payments"))).append('\n');
        out.append('\n');

        out.append(sub).append('\n').append(" Sitting today (IST)").append('\n').append(sub).append('\n');
        boolean any = false;
        for (Map<String, Object> d : docs) {
            if (isSittingToday(d, now)) {
                any = true;
                out.append(String.format("  • %-28s %-38s %s%n",
                        d.get("name"), d.get("specialty"), d.get("time")));
            }
        }
        if (!any) out.append("  (no doctor scheduled today — please call to confirm)\n");
        out.append('\n');

        out.append(sub).append('\n').append(" Weekly schedule").append('\n').append(sub).append('\n');
        for (int i = 0; i < 7; i++) {
            out.append(" ").append(DAY_NAMES[i]).append(":\n");
            boolean found = false;
            for (Map<String, Object> d : docs) {
                Object days = d.get("days");
                boolean sits;
                if (days == null) sits = true;
                else if (days instanceof List && !((List<?>) days).isEmpty()) {
                    sits = false;
                    for (Object o : (List<?>) days) {
                        if (((Number) o).intValue() % 7 == i) { sits = true; break; }
                    }
                } else sits = false;
                if (sits) {
                    found = true;
                    out.append("    - ").append(d.get("name"))
                       .append(" (").append(d.get("time")).append(")\n");
                }
            }
            if (!found) out.append("    - (no fixed sitting)\n");
            out.append('\n');
        }

        out.append(sub).append('\n').append(" Full doctor list").append('\n').append(sub).append('\n');
        for (Map<String, Object> d : docs) {
            out.append("  ").append(d.get("name")).append(" — ").append(d.get("specialty")).append('\n');
            out.append("     Time: ").append(d.get("time")).append('\n');
            out.append("     Days: ").append(daysLabel(d)).append('\n');
            if (d.get("note") != null) out.append("     Note: ").append(d.get("note")).append('\n');
            out.append('\n');
        }

        out.append(sep).append('\n');
        out.append(" Disclaimer: Doctor timings may change. Please call before visiting.\n");
        out.append(" Always take medicines as advised by your doctor.\n");
        out.append(sep).append('\n');
        return out.toString();
    }

    static String renderJson(Map<String, Object> data, ZonedDateTime now) {
        Map<String, Object> clinic = (Map<String, Object>) data.get("clinic");
        List<Map<String, Object>> docs = (List<Map<String, Object>>) data.get("doctors");
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"generated_at_ist\": \"").append(now.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)).append("\",\n");
        sb.append("  \"pharmacy\": \"").append(pharmacyOpen(clinic, now) ? "Open" : "Closed").append("\",\n");
        sb.append("  \"sitting_today\": [\n");
        boolean first = true;
        for (Map<String, Object> d : docs) {
            if (!isSittingToday(d, now)) continue;
            if (!first) sb.append(",\n");
            first = false;
            sb.append("    {\"name\":\"").append(escape(String.valueOf(d.get("name"))))
              .append("\",\"specialty\":\"").append(escape(String.valueOf(d.get("specialty"))))
              .append("\",\"time\":\"").append(escape(String.valueOf(d.get("time")))).append("\"}");
        }
        sb.append("\n  ]\n}\n");
        return sb.toString();
    }

    static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    /* ---------------------------------------------------------- */
    public static void main(String[] args) throws Exception {
        boolean json = Arrays.asList(args).contains("--json");
        Path dataPath = Paths.get("data", "clinic.json");
        if (!Files.exists(dataPath)) {
            dataPath = Paths.get("..", "data", "clinic.json");
        }
        if (!Files.exists(dataPath)) {
            System.err.println("[error] data/clinic.json not found — run from project root");
            System.exit(2);
        }
        Map<String, Object> data = load(dataPath.toString());
        ZonedDateTime now = ZonedDateTime.now(IST);
        System.out.print(json ? renderJson(data, now) : renderText(data, now));
    }
}
