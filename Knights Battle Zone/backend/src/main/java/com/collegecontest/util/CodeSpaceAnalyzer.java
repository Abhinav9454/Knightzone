package com.collegecontest.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CodeSpaceAnalyzer {

    public static class SpaceResult {
        public int allocationCount = 0; // number of collection/array allocations
        public boolean allocationInsideLoop = false;
        public boolean hasRecursion = false;
        public boolean recursionDivides = false;
    }

    private static final Pattern ALLOC_PATTERN = Pattern.compile(
            "new\\s+(ArrayList|LinkedList|HashMap|HashSet|TreeMap|int\\[|Integer\\[|double\\[|String\\[)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern LOOP_PATTERN = Pattern.compile("\\b(for|while|do)\\b");
    private static final Pattern METHOD_PATTERN = Pattern
            .compile("([a-zA-Z0-9_<>,\\s\\[\\]]+)\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\([^;{]*\\)\\s*\\{");

    public static SpaceResult analyzeJava(String code) {
        SpaceResult r = new SpaceResult();
        if (code == null || code.isEmpty())
            return r;

        // simple allocation count across the file
        Matcher allocM = ALLOC_PATTERN.matcher(code);
        while (allocM.find())
            r.allocationCount++;

        // detect allocations inside loops by scanning methods
        Matcher m = METHOD_PATTERN.matcher(code);
        while (m.find()) {
            int bodyStart = m.end() - 1;
            int bodyEnd = findMatchingBrace(code, bodyStart);
            if (bodyEnd <= bodyStart)
                continue;
            String body = code.substring(bodyStart + 1, bodyEnd);
            if (LOOP_PATTERN.matcher(body).find() && ALLOC_PATTERN.matcher(body).find()) {
                r.allocationInsideLoop = true;
            }

            // recursion detection: function name appears in body as call
            String name = m.group(2);
            Pattern call = Pattern.compile("\\b" + Pattern.quote(name) + "\\s*\\(");
            Matcher cm = call.matcher(body);
            if (cm.find()) {
                r.hasRecursion = true;
                if (body.contains("/") || body.contains("/2") || body.contains("/ 2"))
                    r.recursionDivides = true;
            }
        }

        return r;
    }

    public static SpaceResult analyzePython(String code) {
        SpaceResult r = new SpaceResult();
        if (code == null || code.isEmpty())
            return r;

        // allocations: look for [] = [] or = [] or dict() or list()
        Pattern pyAlloc = Pattern.compile("=\\s*\\[|list\\s*\\(|dict\\s*\\(|set\\s*\\(|\\w+\\s*=\\s*\\[\\]|");
        Matcher alloc = ALLOC_PATTERN.matcher(code); // reuse alloc pattern for 'new' won't match python, but we do a
                                                     // simpler check below
        // crude count of common python allocations
        int count = 0;
        Matcher mList = Pattern.compile("\\blist\\s*\\(").matcher(code);
        while (mList.find())
            count++;
        Matcher mDict = Pattern.compile("\\bdict\\s*\\(").matcher(code);
        while (mDict.find())
            count++;
        Matcher mSet = Pattern.compile("\\bset\\s*\\(").matcher(code);
        while (mSet.find())
            count++;
        Matcher arrAssign = Pattern.compile("=\\s*\\[\\s*\\]").matcher(code);
        while (arrAssign.find())
            count++;
        r.allocationCount = count;

        // naive detection inside loops: find 'for' or 'while' followed by allocation in
        // the same or next line
        String[] lines = code.split("\\r?\\n");
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            if (LOOP_PATTERN.matcher(line).find()) {
                String next = i + 1 < lines.length ? lines[i + 1] : "";
                if (next.contains("list(") || next.contains("dict(") || next.contains("=") && next.contains("[]"))
                    r.allocationInsideLoop = true;
            }
        }

        // recursion: detect def name and calls
        Pattern defPattern = Pattern.compile("^\\s*def\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(", Pattern.MULTILINE);
        Matcher dm = defPattern.matcher(code);
        while (dm.find()) {
            String name = dm.group(1);
            Pattern call = Pattern.compile("\\b" + Pattern.quote(name) + "\\s*\\(");
            Matcher cm = call.matcher(code.substring(dm.end()));
            if (cm.find()) {
                r.hasRecursion = true;
                if (code.substring(dm.end(), Math.min(code.length(), dm.end() + 200)).contains("/"))
                    r.recursionDivides = true;
            }
        }

        return r;
    }

    private static int findMatchingBrace(String code, int openPos) {
        if (openPos < 0 || openPos >= code.length() || code.charAt(openPos) != '{')
            return -1;
        int depth = 0;
        for (int i = openPos; i < code.length(); i++) {
            char c = code.charAt(i);
            if (c == '{')
                depth++;
            else if (c == '}') {
                depth--;
                if (depth == 0)
                    return i;
            }
        }
        return -1;
    }
}
