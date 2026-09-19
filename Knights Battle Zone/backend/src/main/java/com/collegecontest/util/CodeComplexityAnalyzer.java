package com.collegecontest.util;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CodeComplexityAnalyzer {

    public static class Result {
        public int maxLoopDepth = 0;
        public boolean hasRecursion = false;
        public int recursionCalls = 0; // max calls inside a recursive function
        public boolean recursionDivides = false; // calls with / indicating divide-and-conquer
        public boolean recursionInsideLoop = false;
    }

    // Very simple heuristic parser for Java-like code
    public static Result analyzeJava(String code) {
        Result r = new Result();
        if (code == null || code.isEmpty())
            return r;

        // detect loop nesting by tracking braces and loop occurrences
        int braceDepth = 0;
        int maxLoopDepth = 0;
        boolean inString = false;
        for (int i = 0; i < code.length(); i++) {
            char c = code.charAt(i);
            if (c == '"')
                inString = !inString;
            if (inString)
                continue;
            if (c == '{')
                braceDepth++;
            else if (c == '}')
                braceDepth = Math.max(0, braceDepth - 1);
            // check for loop keywords starting at this pos
            if (i + 3 < code.length()) {
                String nxt = code.substring(i, Math.min(code.length(), i + 6));
                if (nxt.startsWith("for(") || nxt.startsWith("for ") || nxt.startsWith("for(")) {
                    maxLoopDepth = Math.max(maxLoopDepth, braceDepth + 1);
                }
            }
            if (i + 5 < code.length()) {
                String s6 = code.substring(i, Math.min(code.length(), i + 6));
                if (s6.startsWith("while(") || s6.startsWith("while ") || s6.startsWith("do ")) {
                    maxLoopDepth = Math.max(maxLoopDepth, braceDepth + 1);
                }
            }
        }
        r.maxLoopDepth = maxLoopDepth;

        // detect methods and recursion
        Pattern methodPattern = Pattern
                .compile("([a-zA-Z0-9_<>,\\s\\[\\]]+)\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\([^;{]*\\)\\s*\\{");
        Matcher m = methodPattern.matcher(code);
        while (m.find()) {
            String name = m.group(2);
            int bodyStart = m.end() - 1; // position of '{'
            int bodyEnd = findMatchingBrace(code, bodyStart);
            if (bodyEnd <= bodyStart)
                continue;
            String body = code.substring(bodyStart + 1, bodyEnd);
            // count recursive calls
            Pattern callPattern = Pattern.compile("\\b" + Pattern.quote(name) + "\\s*\\(");
            Matcher cm = callPattern.matcher(body);
            int calls = 0;
            while (cm.find())
                calls++;
            if (calls > 0) {
                r.hasRecursion = true;
                r.recursionCalls = Math.max(r.recursionCalls, calls);
                if (body.contains("/"))
                    r.recursionDivides = true;
                // check if any loop keyword appears in body
                if (body.contains("for(") || body.contains("for ") || body.contains("while(") || body.contains("while ")
                        || body.contains("do ")) {
                    r.recursionInsideLoop = true;
                }
            }
        }

        return r;
    }

    // Simple Python analysis
    public static Result analyzePython(String code) {
        Result r = new Result();
        if (code == null || code.isEmpty())
            return r;

        // indent-based loop nesting approximation: count 'for'/'while' and track
        // indentation
        String[] lines = code.split("\\r?\\n");
        Deque<Integer> indentStack = new ArrayDeque<>();
        indentStack.push(0);
        int maxLoopDepth = 0;
        for (String line : lines) {
            String trimmed = line.replaceAll("\\t", "    ");
            int indent = 0;
            while (indent < trimmed.length() && trimmed.charAt(indent) == ' ')
                indent++;
            while (!indentStack.isEmpty() && indent < indentStack.peek())
                indentStack.pop();
            if (trimmed.trim().startsWith("for ") || trimmed.trim().startsWith("while ")) {
                int depth = indentStack.size();
                maxLoopDepth = Math.max(maxLoopDepth, depth);
                indentStack.push(indent + 1);
            }
        }
        r.maxLoopDepth = maxLoopDepth;

        // detect functions and recursion
        Pattern defPattern = Pattern.compile("^\\s*def\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\([^)]*\\):", Pattern.MULTILINE);
        Matcher dm = defPattern.matcher(code);
        while (dm.find()) {
            String name = dm.group(1);
            int start = dm.end();
            // find function body by locating next def at same or lower indent
            // naive: search for calls in the entire code after def
            Pattern callPattern = Pattern.compile("\\b" + Pattern.quote(name) + "\\s*\\(");
            Matcher cm = callPattern.matcher(code.substring(start));
            int calls = 0;
            while (cm.find())
                calls++;
            if (calls > 0) {
                r.hasRecursion = true;
                r.recursionCalls = Math.max(r.recursionCalls, calls);
                if (code.substring(start, Math.min(code.length(), start + 200)).contains("/"))
                    r.recursionDivides = true;
                if (code.substring(start, Math.min(code.length(), start + 200)).contains("for ")
                        || code.substring(start, Math.min(code.length(), start + 200)).contains("while "))
                    r.recursionInsideLoop = true;
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
