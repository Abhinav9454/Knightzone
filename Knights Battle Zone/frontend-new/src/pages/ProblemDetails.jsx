import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock3,
  FileCode2,
  Lightbulb,
} from "lucide-react";

const problems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Array",
    description:
      "Given an array of integers nums and an integer target, return the indices of two numbers whose sum equals target. You may not use the same element twice.",
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9.",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
      },
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "Exactly one valid answer exists.",
    ],
    starter: {
      JavaScript: `function twoSum(nums, target) {
  // Write your solution here
}`,
      Python: `def two_sum(nums, target):
    # Write your solution here
    pass`,
      Java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
      "C++": `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
    },
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stack",
    description:
      "Given a string containing parentheses, brackets, and braces, determine whether the brackets are correctly matched and properly nested.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "([)]"', output: "false" },
    ],
    constraints: [
      "1 ≤ s.length ≤ 10⁴",
      "s contains only (), [], and {}.",
    ],
    starter: {
      JavaScript: `function isValid(s) {
  // Write your solution here
}`,
      Python: `def is_valid(s):
    # Write your solution here
    pass`,
      Java: `class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        return false;
    }
}`,
      "C++": `class Solution {
public:
    bool isValid(string s) {
        // Write your solution here
        return false;
    }
};`,
    },
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "String",
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The substring is "abc".' },
      { input: 's = "bbbbb"', output: "1" },
    ],
    constraints: [
      "0 ≤ s.length ≤ 5 × 10⁴",
      "s may contain letters, digits, symbols, and spaces.",
    ],
    starter: {
      JavaScript: `function lengthOfLongestSubstring(s) {
  // Write your solution here
}`,
      Python: `def length_of_longest_substring(s):
    # Write your solution here
    pass`,
      Java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your solution here
        return 0;
    }
}`,
      "C++": `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your solution here
        return 0;
    }
};`,
    },
  },
  {
    id: 4,
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    topic: "Binary Search",
    description:
      "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. Your solution should aim for O(log(m+n)) time complexity.",
    examples: [
      { input: "nums1 = [1, 3], nums2 = [2]", output: "2.0" },
      { input: "nums1 = [1, 2], nums2 = [3, 4]", output: "2.5" },
    ],
    constraints: [
      "0 ≤ nums1.length, nums2.length",
      "1 ≤ nums1.length + nums2.length ≤ 2000",
      "Both arrays are sorted.",
    ],
    starter: {
      JavaScript: `function findMedianSortedArrays(nums1, nums2) {
  // Write your solution here
}`,
      Python: `def find_median_sorted_arrays(nums1, nums2):
    # Write your solution here
    pass`,
      Java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        // Write your solution here
        return 0.0;
    }
}`,
      "C++": `class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        // Write your solution here
        return 0.0;
    }
};`,
    },
  },
  {
    id: 5,
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Array",
    description:
      "Given an array prices where prices[i] is the price of a stock on day i, maximize your profit by choosing one day to buy and a later day to sell. Return the maximum profit.",
    examples: [
      { input: "prices = [7, 1, 5, 3, 6, 4]", output: "5" },
      { input: "prices = [7, 6, 4, 3, 1]", output: "0" },
    ],
    constraints: [
      "1 ≤ prices.length ≤ 10⁵",
      "0 ≤ prices[i] ≤ 10⁴",
    ],
    starter: {
      JavaScript: `function maxProfit(prices) {
  // Write your solution here
}`,
      Python: `def max_profit(prices):
    # Write your solution here
    pass`,
      Java: `class Solution {
    public int maxProfit(int[] prices) {
        // Write your solution here
        return 0;
    }
}`,
      "C++": `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Write your solution here
        return 0;
    }
};`,
    },
  },
  {
    id: 6,
    title: "Merge Intervals",
    difficulty: "Medium",
    topic: "Sorting",
    description:
      "Given an array of intervals, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the input intervals.",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
      },
    ],
    constraints: [
      "1 ≤ intervals.length ≤ 10⁴",
      "Intervals are represented as [start, end].",
    ],
    starter: {
      JavaScript: `function merge(intervals) {
  // Write your solution here
}`,
      Python: `def merge(intervals):
    # Write your solution here
    pass`,
      Java: `class Solution {
    public int[][] merge(int[][] intervals) {
        // Write your solution here
        return new int[][]{};
    }
}`,
      "C++": `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // Write your solution here
        return {};
    }
};`,
    },
  },
  {
    id: 7,
    title: "Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    description:
      "Given the head of a singly linked list, reverse the list and return its new head.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" },
    ],
    constraints: [
      "The number of nodes is in the range [0, 5000].",
      "-5000 ≤ Node.val ≤ 5000",
    ],
    starter: {
      JavaScript: `function reverseList(head) {
  // Write your solution here
}`,
      Python: `def reverse_list(head):
    # Write your solution here
    pass`,
      Java: `class Solution {
    public ListNode reverseList(ListNode head) {
        // Write your solution here
        return head;
    }
}`,
      "C++": `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // Write your solution here
        return head;
    }
};`,
    },
  },
  {
    id: 8,
    title: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Two Pointers",
    description:
      "Given n non-negative integers representing an elevation map, calculate how much water it can trap after raining.",
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    constraints: [
      "n == height.length",
      "1 ≤ n ≤ 2 × 10⁴",
      "0 ≤ height[i] ≤ 10⁵",
    ],
    starter: {
      JavaScript: `function trap(height) {
  // Write your solution here
}`,
      Python: `def trap(height):
    # Write your solution here
    pass`,
      Java: `class Solution {
    public int trap(int[] height) {
        // Write your solution here
        return 0;
    }
}`,
      "C++": `class Solution {
public:
    int trap(vector<int>& height) {
        // Write your solution here
        return 0;
    }
};`,
    },
  },
];

export default function ProblemDetails() {
  const { id } = useParams();
  const problem = problems.find((item) => item.id === Number(id));

  const [language, setLanguage] = useState("JavaScript");
  const [activeTab, setActiveTab] = useState("Description");
  const [code, setCode] = useState("");
  const [consoleMessage, setConsoleMessage] = useState("");
  const [showConsole, setShowConsole] = useState(false);

  if (!problem) {
    return (
      <main className="min-h-screen bg-[#f5f5f0] p-10 text-[#202720]">
        <h1 className="text-2xl font-bold">Problem not found</h1>
        <Link to="/problems" className="mt-4 inline-block text-green-700 underline">
          Back to problems
        </Link>
      </main>
    );
  }

  const currentCode = code || problem.starter[language];

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    setCode("");
    setConsoleMessage("");
  };

  const handleRun = () => {
    setShowConsole(true);
    setConsoleMessage(
      "Code execution is not connected yet. This is a frontend preview."
    );
  };

  const handleSubmit = () => {
    setShowConsole(true);
    setConsoleMessage(
      "Submission is not connected yet. Your code has not been evaluated."
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#202720]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-5 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/problems"
            className="rounded-xl border p-2 hover:bg-gray-100"
            aria-label="Back to problems"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Knight Battle Zone
            </p>
            <h1 className="text-lg font-bold">Problem Workspace</h1>
          </div>
        </div>
        <span className="text-sm text-amber-600">Frontend preview</span>
      </header>

      <main className="mx-auto max-w-[1600px] p-4 md:p-6">
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-green-100 px-3 py-1 text-sm text-green-800">
              {problem.difficulty}
            </span>
            <span className="rounded-md bg-white px-3 py-1 text-sm text-gray-600">
              {problem.topic}
            </span>
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">
            {problem.id}. {problem.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{problem.description}</p>
        </div>

        <div className="grid min-h-[650px] grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border bg-white">
            <div className="flex gap-6 border-b px-5">
              {["Description", "Hints", "Submissions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 py-4 text-sm font-semibold ${
                    activeTab === tab
                      ? "border-green-700 text-green-700"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-6 p-5 md:p-7">
              {activeTab === "Description" && (
                <>
                  <div>
                    <h3 className="mb-3 text-lg font-bold">Problem statement</h3>
                    <p className="text-sm leading-7 text-gray-600">
                      {problem.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-3 font-bold">Examples</h3>
                    {problem.examples.map((example, index) => (
                      <div
                        key={index}
                        className="mb-3 rounded-xl bg-gray-100 p-4 font-mono text-xs leading-6 md:text-sm"
                      >
                        <p>
                          <span className="text-gray-500">Input: </span>
                          {example.input}
                        </p>
                        <p>
                          <span className="text-gray-500">Output: </span>
                          {example.output}
                        </p>
                        {example.explanation && (
                          <p className="mt-2 font-sans text-gray-600">
                            Explanation: {example.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-3 font-bold">Constraints</h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
                      {problem.constraints.map((constraint) => (
                        <li key={constraint}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {activeTab === "Hints" && (
                <div>
                  <Lightbulb className="mb-3 text-amber-600" size={22} />
                  <h3 className="font-bold">Think before you code</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    Identify the input, expected output, and constraints first.
                    Then choose a suitable data structure or algorithm. Test your
                    approach against the examples before coding.
                  </p>
                </div>
              )}

              {activeTab === "Submissions" && (
                <div className="py-8 text-center">
                  <FileCode2 className="mx-auto text-gray-400" size={28} />
                  <p className="mt-3 font-semibold">No submissions yet</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Submission history will appear when evaluation is implemented.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl bg-[#171d1a] text-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 font-semibold">
                <FileCode2 size={17} className="text-lime-400" />
                Code editor
              </div>

              <select
                value={language}
                onChange={(event) => changeLanguage(event.target.value)}
                className="rounded-lg border border-white/10 bg-[#171d1a] px-3 py-2 text-sm"
              >
                {Object.keys(problem.starter).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/50">
              <span className="flex items-center gap-2">
                <FileCode2 size={14} />
                solution.
                {language === "JavaScript"
                  ? "js"
                  : language === "Python"
                  ? "py"
                  : language === "Java"
                  ? "java"
                  : "cpp"}
              </span>
              <button
                onClick={() => {
                  setCode("");
                  setConsoleMessage("");
                }}
                className="flex items-center gap-1.5 hover:text-white"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            <textarea
              value={currentCode}
              onChange={(event) => setCode(event.target.value)}
              spellCheck="false"
              aria-label="Code editor"
              className="min-h-[400px] w-full flex-1 resize-y bg-transparent p-4 font-mono text-sm leading-6 text-green-100 outline-none"
            />

            <div className="border-t border-white/10 px-4 py-3">
              <button
                onClick={() => setShowConsole((previous) => !previous)}
                className="flex items-center gap-2 text-xs font-semibold text-white/70"
              >
                <Clock3 size={15} />
                Console
              </button>

              {showConsole && (
                <div className="mt-3 rounded-lg bg-black/30 p-3 text-xs text-white/70">
                  {consoleMessage || "Run or submit to see the preview message."}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 bg-[#1d2520] px-4 py-4">
              <button
                onClick={handleRun}
                className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
              >
                <Play size={15} /> Run
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-bold text-[#172019] hover:bg-lime-300"
              >
                <Send size={15} /> Submit
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}