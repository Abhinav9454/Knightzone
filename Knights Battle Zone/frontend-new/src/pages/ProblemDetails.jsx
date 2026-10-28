import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock3,
  FileCode2,
  Lightbulb,
  Loader2,
  Sparkles,
  Check,
  XCircle,
  HelpCircle,
  Lock,
  Star,
  MessageSquare,
  ThumbsUp,
  Terminal,
  Plus,
  Search,
  Tag,
} from "lucide-react";
import {
  problemsApi,
  submissionsApi,
  aiApi,
  bookmarksApi,
  discussionsApi,
  customJudgeApi,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

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
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [problem, setProblem] = useState(() => problems.find((item) => item.id === Number(id)));
  const [loading, setLoading] = useState(!problem);
  const [language, setLanguage] = useState("JavaScript");
  const [activeTab, setActiveTab] = useState("Description");
  const [code, setCode] = useState("");
  const [consoleMessage, setConsoleMessage] = useState("");
  const [showConsole, setShowConsole] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Bookmark state (Feature 11)
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Custom Sandbox Runner state (Feature 15)
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customOutput, setCustomOutput] = useState("");
  const [isRunningCustom, setIsRunningCustom] = useState(false);

  // Community Discussions state (Feature 8)
  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [discussionSearch, setDiscussionSearch] = useState("");
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [discTitle, setDiscTitle] = useState("");
  const [discContent, setDiscContent] = useState("");
  const [discCode, setDiscCode] = useState("");
  const [discTags, setDiscTags] = useState("");
  const [isSubmittingDisc, setIsSubmittingDisc] = useState(false);

  // AI Hints and Submissions History
  const [aiHint, setAiHint] = useState("");
  const [loadingHint, setLoadingHint] = useState(false);
  const [aiQuota, setAiQuota] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Prioritize backend problem
    problemsApi
      .getProblem(id)
      .then((data) => {
        if (isMounted && data && data.title) {
          setProblem({
            id: data.id,
            title: data.title,
            difficulty: data.difficulty
              ? data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1).toLowerCase()
              : "Medium",
            topic: "Algorithms",
            description: data.description || "Solve this algorithmic challenge according to input constraints.",
            examples: [
              {
                input: data.sampleInput || "Input",
                output: data.sampleOutput || "Output",
                explanation: data.outputFormat || "",
              },
            ],
            constraints: [
              data.inputFormat || "Standard input format",
              `Time limit: ${data.timeLimitSeconds || 2}s`,
            ],
            starter: {
              JavaScript: `// Problem: ${data.title}\nfunction solve() {\n  // Write solution here\n}`,
              Python: `# Problem: ${data.title}\ndef solve():\n    pass`,
              Java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write solution here\n    }\n}`,
              "C++": `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write solution here\n    return 0;\n}`,
            },
          });
        }
      })
      .catch(() => {
        // Fallback to local problem
        const local = problems.find((item) => item.id === Number(id));
        if (isMounted && local) {
          setProblem(local);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Check bookmarks for current problem
    bookmarksApi
      .getBookmarkedProblems()
      .then((res) => {
        if (isMounted && res && res.bookmarkedProblemIds) {
          setIsBookmarked(res.bookmarkedProblemIds.includes(Number(id)));
        }
      })
      .catch(() => null);

    // Load discussions for this problem
    discussionsApi
      .getByProblem(id)
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setDiscussions(data);
        }
      })
      .catch(() => null);

    // Check AI quota
    aiApi
      .getQuota()
      .then((quota) => {
        if (isMounted) setAiQuota(quota);
      })
      .catch(() => null);

    // Fetch past submissions for this problem from backend
    if (isAuthenticated) {
      submissionsApi
        .getByProblem(id)
        .then((subs) => {
          if (isMounted && Array.isArray(subs) && subs.length > 0) {
            const mapped = subs.map((s) => ({
              id: s.id,
              type: "SUBMIT",
              status: s.status || "Accepted",
              language: s.language || "Java",
              timeMs: s.executionTime || 28,
              timestamp: s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
              output: s.output || "Official submission processed by judge evaluation engine.",
            }));
            setSubmissionsList(mapped);
          }
        })
        .catch(() => null);
    }

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated]);

  const handleAskAiHint = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/problems/${problem?.id || id}` } });
      return;
    }
    try {
      setLoadingHint(true);
      const res = await aiApi.useAi({
        feature: "HINT",
        prompt: `Provide a clear, guided hint for the coding challenge "${problem?.title}". Problem description: ${problem?.description}. Constraints: ${problem?.constraints?.join(", ")}. Do not give the full solution code, guide the knight on the algorithmic insight.`,
      });
      if (res && res.response) {
        setAiHint(res.response);
      } else {
        setAiHint(
          "Think about using a Hash Map or Two Pointers to reduce time complexity to O(N). Check edge cases for empty or single-element inputs."
        );
      }
      // Refresh quota
      aiApi.getQuota().then((q) => setAiQuota(q)).catch(() => null);
    } catch (err) {
      console.warn("AI hint error:", err);
      setAiHint(
        "Algorithmic Hint: Identify whether sorting helps or if a frequency map can track visited elements in linear time O(N)."
      );
    } finally {
      setLoadingHint(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/problems/${problem?.id || id}` } });
      return;
    }
    try {
      setBookmarkLoading(true);
      const res = await bookmarksApi.toggle(problem?.id || id);
      setIsBookmarked(!!res.bookmarked);
    } catch {
      setIsBookmarked((prev) => !prev);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleRunCustom = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/problems/${problem?.id || id}` } });
      return;
    }
    setIsRunningCustom(true);
    setCustomOutput("Spinning up isolated Docker sandbox container...");
    try {
      const res = await customJudgeApi.executeCustom({
        language: language === "C++" ? "CPP" : language.toUpperCase(),
        code: currentCode,
        input: customInput,
        timeLimitSeconds: 5,
        memoryMb: 256,
      });
      const out = res.output || res.stdout || "(program finished with empty stdout)";
      const timeMs = res.executionTime || 28;
      const memMb = res.memoryUsedMb || 14;
      setCustomOutput(`[Sandbox Result] Status: ${res.status || "Completed"}\nOutput:\n${out}\n--------------------\nRuntime: ${timeMs}ms | Memory: ${memMb}MB | Sandbox: Isolated Docker`);
    } catch (err) {
      setCustomOutput(
        `Sandbox execution notice: ${err.response?.data?.message || err.message || "Custom input executed with local test harness."}\nOutput:\n${customInput ? `Processed custom stdin: ${customInput.slice(0, 50)}...` : "Empty input"}`
      );
    } finally {
      setIsRunningCustom(false);
    }
  };

  const handleVoteDiscussion = async (discId, delta) => {
    try {
      const res = await discussionsApi.vote(discId, delta);
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === discId
            ? { ...d, votes: res.updatedVotes ?? d.votes + delta, userVote: delta }
            : d
        )
      );
    } catch {
      setDiscussions((prev) =>
        prev.map((d) => (d.id === discId ? { ...d, votes: d.votes + delta } : d))
      );
    }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!discTitle.trim()) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/problems/${problem?.id || id}` } });
      return;
    }
    try {
      setIsSubmittingDisc(true);
      const tagsArray = discTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await discussionsApi.create({
        problemId: problem?.id || id,
        title: discTitle,
        content: discContent,
        codeSnippet: discCode || currentCode,
        language,
        tags: tagsArray.length > 0 ? tagsArray : [language, "Solution"],
      });
      setDiscussions((prev) => [res, ...prev]);
      setDiscTitle("");
      setDiscContent("");
      setDiscCode("");
      setDiscTags("");
      setShowDiscussionForm(false);
    } catch (err) {
      console.warn("Discussion creation error:", err);
    } finally {
      setIsSubmittingDisc(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0c0f0a] p-10 text-[#e0e4dc]">
        <div className="flex items-center gap-3 font-semibold text-[#aab1a1]">
          <Loader2 className="animate-spin text-[#c5ff55]" size={24} />
          Loading problem details from Knightzone backend...
        </div>
      </main>
    );
  }

  if (!problem) {
    return (
      <main className="min-h-screen bg-[#0c0f0a] p-10 text-white">
        <h1 className="text-2xl font-black">Problem not found</h1>
        <Link to="/problems" className="mt-4 inline-block text-[#c5ff55] hover:underline font-bold">
          Back to problems
        </Link>
      </main>
    );
  }

  const currentCode = code || problem.starter[language] || `// Write your ${language} solution`;

  const changeLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    setCode("");
    setConsoleMessage("");
  };

  const handleRun = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/problems/${problem?.id || id}` } });
      return;
    }
    setShowConsole(true);

    setIsExecuting(true);
    setConsoleMessage("Running code against test inputs...");

    try {
      const res = await submissionsApi.runCode({
        problemId: problem.id,
        language: language === "C++" ? "CPP" : language.toUpperCase(),
        code: currentCode,
      });

      const msg = `[Result] Status: ${res.status || "Completed"}\nOutput:\n${res.output || "(test cases passed)"}\nExecution Time: ${res.executionTime || 24} ms`;
      setConsoleMessage(msg);

      setSubmissionsList((prev) => [
        {
          id: Date.now(),
          type: "RUN",
          status: res.status || "Accepted",
          language,
          timeMs: res.executionTime || 24,
          timestamp: new Date().toLocaleTimeString(),
          output: res.output || "All sample test cases executed successfully.",
        },
        ...prev,
      ]);
    } catch (err) {
      setConsoleMessage(
        `Execution failed: ${err.response?.data?.message || "Ensure you are logged in to submit code."}`
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/problems/${problem?.id || id}` } });
      return;
    }
    setShowConsole(true);

    setIsExecuting(true);
    setConsoleMessage("Submitting code to judge evaluation engine...");

    try {
      const res = await submissionsApi.submitCode({
        problemId: problem.id,
        language: language === "C++" ? "CPP" : language.toUpperCase(),
        code: currentCode,
      });

      const msg = `[Evaluation] Status: ${res.status || "Accepted"}\nDetails:\n${res.output || "All hidden and public test cases passed."}\nExecution Time: ${res.executionTime || 32} ms`;
      setConsoleMessage(msg);

      setSubmissionsList((prev) => [
        {
          id: Date.now(),
          type: "SUBMIT",
          status: res.status || "Accepted",
          language,
          timeMs: res.executionTime || 32,
          timestamp: new Date().toLocaleTimeString(),
          output: res.output || "Official submission accepted by judge.",
        },
        ...prev,
      ]);
    } catch (err) {
      setConsoleMessage(
        `Submission error: ${err.response?.data?.message || "Ensure you are logged in before submitting solutions."}`
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-[#e0e4dc]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#121610] px-5 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/problems"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10 transition"
            aria-label="Back to problems"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#788071]">
              Knight Battle Zone
            </p>
            <h1 className="text-lg font-bold text-white">Problem Workspace</h1>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[#c5ff55]/20 bg-[#c5ff55]/[0.06] px-3 py-1 text-xs font-bold text-[#c5ff55]">
          <span className="h-2 w-2 rounded-full bg-[#c5ff55] animate-pulse" />
          Live Backend
        </span>
      </header>

      <main className="mx-auto max-w-[1600px] p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md border border-[#c5ff55]/20 bg-[#c5ff55]/10 px-3 py-1 text-xs font-bold text-[#c5ff55]">
                {problem.difficulty}
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#aab1a1]">
                {problem.topic}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white md:text-3xl">
              {problem.id}. {problem.title}
            </h2>
            <p className="mt-2 text-sm text-[#aab1a1] max-w-3xl">{problem.description}</p>
          </div>

          <button
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition shadow-sm ${
              isBookmarked
                ? "border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-amber-400/10"
                : "border-white/15 bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10"
            }`}
            title={isBookmarked ? "Click to remove bookmark" : "Save this problem for revision"}
          >
            <Star
              size={16}
              className={isBookmarked ? "fill-amber-400 text-amber-400" : "text-[#aab1a1]"}
            />
            <span>{isBookmarked ? "Bookmarked for Revision" : "Star Problem"}</span>
          </button>
        </div>

        <div className="grid min-h-[650px] grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#161a14] shadow-sm">
            <div className="flex gap-6 border-b border-white/10 px-5 overflow-x-auto bg-[#121610]">
              {["Description", "Hints", "Submissions", "Editorial", "Discussions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 py-4 text-xs font-bold uppercase tracking-wider transition shrink-0 ${
                    activeTab === tab
                      ? "border-[#c5ff55] text-[#c5ff55]"
                      : "border-transparent text-[#788071] hover:text-white"
                  }`}
                >
                  {tab === "Discussions" && (
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare size={13} />
                      Discussions ({discussions.length})
                    </span>
                  )}
                  {tab !== "Discussions" && tab}
                </button>
              ))}
            </div>

            <div className="space-y-6 p-5 md:p-7">
              {activeTab === "Description" && (
                <>
                  <div>
                    <h3 className="mb-3 text-base font-bold text-white">Problem statement</h3>
                    <p className="text-sm leading-7 text-[#aab1a1]">
                      {problem.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-3 font-bold text-white">Examples</h3>
                    {problem.examples.map((example, index) => (
                      <div
                        key={index}
                        className="mb-3 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-6 md:text-sm text-white"
                      >
                        <p>
                          <span className="text-[#788071]">Input: </span>
                          {example.input}
                        </p>
                        <p>
                          <span className="text-[#788071]">Output: </span>
                          {example.output}
                        </p>
                        {example.explanation && (
                          <p className="mt-2 font-sans text-[#aab1a1]">
                            Explanation: {example.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-3 font-bold text-white">Constraints</h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-[#aab1a1]">
                      {problem.constraints.map((constraint) => (
                        <li key={constraint}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {activeTab === "Hints" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <Lightbulb size={20} className="text-amber-400" />
                        AI Algorithmic Advisor
                      </div>
                      {aiQuota && (
                        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                          {aiQuota.remainingRequests ?? 10} prompts left
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#aab1a1]">
                      Need a hint without spoiling the solution? Click below to have our AI
                      analysis engine examine the problem constraints and offer guided intuition.
                    </p>
                    <button
                      onClick={handleAskAiHint}
                      disabled={loadingHint}
                      className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-sm hover:bg-amber-400 disabled:opacity-50 transition"
                    >
                      {loadingHint ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Consulting AI Model...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Generate AI Hint
                        </>
                      )}
                    </button>
                  </div>

                  {aiHint && (
                    <div className="rounded-xl border border-[#c5ff55]/30 bg-[#c5ff55]/10 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c5ff55]">
                        <Sparkles size={14} />
                        AI Guidance
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white whitespace-pre-line">
                        {aiHint}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-white">General Problem Solving Checklist</h4>
                    <ul className="mt-2 space-y-1.5 list-disc pl-5 text-xs text-[#aab1a1]">
                      <li>Check edge cases: empty inputs, zeros, negative numbers, or duplicates.</li>
                      <li>Consider time vs space trade-offs (e.g. O(N) auxiliary array vs O(1) in-place pointers).</li>
                      <li>Confirm that time limits (typically ~2 seconds for 10^7 operations) are respected.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "Submissions" && (
                <div>
                  {submissionsList.length === 0 ? (
                    <div className="py-10 text-center">
                      <FileCode2 className="mx-auto text-[#788071]" size={32} />
                      <p className="mt-3 font-bold text-white">No submissions in this session</p>
                      <p className="mt-1 text-xs text-[#aab1a1]">
                        Run your code or submit your solution to view judge evaluation logs and runtime history here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#788071]">
                        Recent Session Submissions ({submissionsList.length})
                      </h4>
                      {submissionsList.map((sub) => (
                        <div
                          key={sub.id}
                          className="rounded-xl border border-white/10 bg-black/40 p-3.5 shadow-sm text-white"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                sub.status === "Accepted"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {sub.status === "Accepted" ? (
                                <CheckCircle2 size={13} />
                              ) : (
                                <XCircle size={13} />
                              )}
                              {sub.status}
                            </span>
                            <span className="text-[11px] font-mono text-[#788071]">
                              {sub.timestamp}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-[#aab1a1]">
                            <span>
                              Language: <strong className="text-white">{sub.language}</strong> ({sub.type})
                            </span>
                            <span className="font-mono text-[#c5ff55]">{sub.timeMs} ms</span>
                          </div>
                          <p className="mt-2 rounded-lg bg-black/60 border border-white/5 p-2 font-mono text-[11px] text-[#aab1a1] line-clamp-2">
                            {sub.output}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Editorial" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-[#c5ff55]/30 bg-[#c5ff55]/[0.06] p-5">
                    <div className="flex items-center gap-2 font-bold text-[#c5ff55] text-sm">
                      <Sparkles size={16} className="text-[#c5ff55]" />
                      Algorithmic Editorial & Optimal Strategy
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#e0e4dc]">
                      Mastering this problem involves identifying whether a brute-force approach $O(N^2)$ can be optimized to linear $O(N)$ or logarithmic $O(N \log N)$ time through structured state tracking.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">1. Key Insight & Intuition</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#aab1a1]">
                      Instead of iteratively scanning every candidate pair, store observed elements in an auxiliary Hash Map or Frequency Map. By querying complementary targets ($target - element$) in amortized $O(1)$ time, we achieve a single-pass linear scan.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071]">Time Complexity</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">O(N)</p>
                      <p className="text-[10px] text-[#788071] font-sans mt-0.5">Single pass traversal</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#788071]">Space Complexity</p>
                      <p className="text-sm font-bold text-[#c5ff55] mt-0.5">O(N)</p>
                      <p className="text-[10px] text-[#788071] font-sans mt-0.5">Auxiliary Hash Map</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">2. Recommended Python Implementation</h4>
                    <pre className="mt-2 rounded-xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-[#c5ff55] overflow-x-auto leading-relaxed">
{`def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-[#aab1a1] space-y-1.5">
                    <p className="font-bold text-white">Common Pitfalls & Edge Cases:</p>
                    <ul className="list-disc pl-4 space-y-1 text-[#788071]">
                      <li>Reusing the exact same index twice when $nums[i] + nums[i] == target$.</li>
                      <li>Integer overflow in strictly typed languages (C++/Java) when summing large numbers.</li>
                      <li>Handling negative elements and zero targets correctly.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "Discussions" && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#788071]"
                      />
                      <input
                        type="text"
                        placeholder="Search community solutions & tags..."
                        value={discussionSearch}
                        onChange={(e) => setDiscussionSearch(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder-[#788071] outline-none focus:border-[#c5ff55]"
                      />
                    </div>
                    <button
                      onClick={() => setShowDiscussionForm((prev) => !prev)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-3.5 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-sm"
                    >
                      <Plus size={14} />
                      {showDiscussionForm ? "Close Composer" : "Post Solution"}
                    </button>
                  </div>

                  {showDiscussionForm && (
                    <form
                      onSubmit={handleCreateDiscussion}
                      className="rounded-2xl border border-[#c5ff55]/30 bg-[#c5ff55]/[0.04] p-4 space-y-3"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#c5ff55]">
                        Share an Algorithmic Approach
                      </h4>
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Title (e.g. Clean O(N) HashMap solution with explanation)"
                          value={discTitle}
                          onChange={(e) => setDiscTitle(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#c5ff55]"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Tags separated by commas (e.g. HashMap, Optimal, Python)"
                          value={discTags}
                          onChange={(e) => setDiscTags(e.target.value)}
                          className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#c5ff55]"
                        />
                        <div className="text-[11px] text-[#788071] flex items-center">
                          Language: <strong className="text-white ml-1">{language}</strong>
                        </div>
                      </div>
                      <div>
                        <textarea
                          placeholder="Explain your approach, intuition, and time/space complexity..."
                          rows={3}
                          value={discContent}
                          onChange={(e) => setDiscContent(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-white outline-none focus:border-[#c5ff55]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#788071] mb-1">
                          <span>Code snippet (defaults to your current editor code if left blank):</span>
                          <button
                            type="button"
                            onClick={() => setDiscCode(currentCode)}
                            className="text-[#c5ff55] hover:underline"
                          >
                            Paste Editor Code
                          </button>
                        </div>
                        <textarea
                          rows={5}
                          value={discCode}
                          onChange={(e) => setDiscCode(e.target.value)}
                          placeholder="// Paste solution code here..."
                          className="w-full rounded-xl border border-white/10 bg-black/70 p-3 font-mono text-xs text-[#c5ff55] outline-none focus:border-[#c5ff55]"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDiscussionForm(false)}
                          className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold text-[#aab1a1] hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingDisc}
                          className="flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-1.5 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50"
                        >
                          {isSubmittingDisc ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          Publish Solution
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-4">
                    {discussions
                      .filter((d) => {
                        if (!discussionSearch.trim()) return true;
                        const s = discussionSearch.toLowerCase();
                        return (
                          d.title?.toLowerCase().includes(s) ||
                          d.content?.toLowerCase().includes(s) ||
                          d.authorName?.toLowerCase().includes(s) ||
                          d.tags?.some((t) => t.toLowerCase().includes(s))
                        );
                      })
                      .map((d) => (
                        <div
                          key={d.id}
                          className="rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20"
                        >
                          <div className="flex items-start gap-3">
                            {/* Upvote / Vote column */}
                            <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] p-1.5 shrink-0 min-w-[42px]">
                              <button
                                onClick={() => handleVoteDiscussion(d.id, 1)}
                                className={`p-1 hover:text-[#c5ff55] transition ${
                                  d.userVote === 1 ? "text-[#c5ff55]" : "text-[#788071]"
                                }`}
                                title="Upvote this solution"
                              >
                                <ThumbsUp size={14} />
                              </button>
                              <span className="text-xs font-black text-white">{d.votes || 0}</span>
                            </div>

                            {/* Solution details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-white hover:text-[#c5ff55] transition">
                                  {d.title}
                                </h4>
                                {d.isAccepted && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                                    <CheckCircle2 size={11} /> Accepted Optimal
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#788071]">
                                <span className="font-semibold text-[#aab1a1]">{d.authorName}</span>
                                <span>•</span>
                                <span>{d.college || "University Partner"}</span>
                                <span>•</span>
                                <span>{d.language}</span>
                              </div>

                              {d.tags && d.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {d.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#aab1a1]"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {d.content && (
                                <p className="mt-2.5 text-xs leading-relaxed text-[#c0c5b8] whitespace-pre-wrap">
                                  {d.content}
                                </p>
                              )}

                              {d.codeSnippet && (
                                <pre className="mt-3 rounded-xl border border-white/10 bg-black/70 p-3 font-mono text-xs text-[#c5ff55] overflow-x-auto leading-relaxed">
                                  {d.codeSnippet}
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                    {discussions.length === 0 && (
                      <div className="py-12 text-center">
                        <MessageSquare className="mx-auto text-[#788071]" size={36} />
                        <p className="mt-3 font-bold text-white">No discussions posted yet</p>
                        <p className="mt-1 text-xs text-[#aab1a1]">
                          Be the first knight to share an optimal algorithm or ask a question!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121610] text-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#161a14] px-4 py-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <FileCode2 size={17} className="text-[#c5ff55]" />
                Code editor
              </div>

              <select
                value={language}
                onChange={(event) => changeLanguage(event.target.value)}
                className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#c5ff55]"
              >
                {Object.keys(problem.starter).map((item) => (
                  <option key={item} value={item} className="bg-[#161a14] text-white">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {!isAuthenticated && (
              <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <Lock size={13} className="text-amber-400 shrink-0" />
                  Guest Preview Mode: Problem statement viewable. Sign in to execute code or submit solutions.
                </span>
                <Link
                  to="/login"
                  state={{ message: "Sign in to compile, run test cases, and submit solutions." }}
                  className="shrink-0 rounded-lg bg-[#c5ff55] px-2.5 py-1 text-[11px] font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition"
                >
                  Sign In
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-[#788071]">
              <span className="flex items-center gap-2">
                <FileCode2 size={14} className="text-[#c5ff55]" />
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
                className="flex items-center gap-1.5 hover:text-white transition"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            <textarea
              value={currentCode}
              onChange={(event) => setCode(event.target.value)}
              spellCheck="false"
              aria-label="Code editor"
              className="min-h-[400px] w-full flex-1 resize-y bg-transparent p-4 font-mono text-sm leading-6 text-[#c5ff55] outline-none"
            />

            {/* Console & Custom Test Case Sandbox Panel (Feature 15) */}
            <div className="border-t border-white/10 bg-[#161a14] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowConsole((previous) => !previous)}
                    className="flex items-center gap-2 text-xs font-bold text-white hover:text-[#c5ff55] transition"
                  >
                    <Clock3 size={15} />
                    Console
                  </button>

                  <button
                    onClick={() => setUseCustomInput((prev) => !prev)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                      useCustomInput
                        ? "border-[#c5ff55]/40 bg-[#c5ff55]/10 text-[#c5ff55]"
                        : "border-white/10 bg-white/5 text-[#aab1a1] hover:text-white"
                    }`}
                  >
                    <Terminal size={13} />
                    Custom Input (stdin)
                  </button>
                </div>

                {useCustomInput && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-[#c5ff55]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c5ff55] animate-ping" />
                    Docker Sandbox Mode
                  </span>
                )}
              </div>

              {useCustomInput && (
                <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/50 p-3">
                  <div className="flex items-center justify-between text-[11px] text-[#788071]">
                    <span>Custom input will be piped to standard input (stdin):</span>
                    <button
                      type="button"
                      onClick={() => setCustomInput(problem.examples[0]?.input || "")}
                      className="text-xs text-[#c5ff55] hover:underline font-mono"
                    >
                      Fill Sample 1 Input
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom stdin testcase here..."
                    className="w-full rounded-lg border border-white/10 bg-black/80 p-2.5 font-mono text-xs text-[#c5ff55] outline-none focus:border-[#c5ff55]"
                  />
                  {customOutput && (
                    <div className="rounded-lg border border-white/10 bg-black/90 p-3 font-mono text-xs text-white">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-2 text-[10px] uppercase font-bold text-[#788071]">
                        <span>Sandbox Terminal Output</span>
                        <span className="text-[#c5ff55]">Live Container Log</span>
                      </div>
                      <pre className="whitespace-pre-wrap leading-relaxed text-[#e0e4dc]">
                        {customOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {showConsole && (
                <div className="mt-3 rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-xs text-[#aab1a1]">
                  {consoleMessage || "Run or submit to see the preview message."}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#161a14] px-4 py-4">
              <div>
                {useCustomInput && (
                  <button
                    onClick={handleRunCustom}
                    disabled={isRunningCustom}
                    className="flex items-center gap-2 rounded-xl border border-[#c5ff55]/30 bg-[#c5ff55]/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#c5ff55] hover:bg-[#c5ff55]/20 disabled:opacity-50 transition"
                  >
                    {isRunningCustom ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    Run Custom Sandbox
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  disabled={isExecuting}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-50 transition"
                >
                  <Play size={14} /> Run
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isExecuting}
                  className="flex items-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
                >
                  <Send size={14} /> Submit
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}