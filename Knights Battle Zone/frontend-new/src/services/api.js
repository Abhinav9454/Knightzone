import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("kbz_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRequest =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register");
      if (!isAuthRequest) {
        localStorage.removeItem("kbz_token");
        localStorage.removeItem("kbz_user");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials) => {
    const response = await API.post("/auth/login", credentials);
    if (response.data?.token) {
      localStorage.setItem("kbz_token", response.data.token);
      localStorage.setItem("kbz_user", JSON.stringify(response.data.user || { email: credentials.email }));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await API.post("/auth/register", userData);
    if (response.data?.token) {
      localStorage.setItem("kbz_token", response.data.token);
      localStorage.setItem("kbz_user", JSON.stringify(response.data.user || { email: userData.email, name: userData.name }));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("kbz_token");
    localStorage.removeItem("kbz_user");
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem("kbz_user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getToken: () => localStorage.getItem("kbz_token"),
};

export const problemsApi = {
  getProblemSet: async ({ page = 0, size = 20, q, difficulty } = {}) => {
    const params = { page, size };
    if (q) params.q = q;
    if (difficulty && difficulty !== "All") params.difficulty = difficulty.toUpperCase();
    const response = await API.get("/problems/problem-set", { params });
    return response.data;
  },

  getProblem: async (id) => {
    const response = await API.get(`/problems/problem-set/${id}`);
    return response.data;
  },
};

export const dashboardApi = {
  getSummary: async () => {
    const response = await API.get("/dashboard/summary");
    return response.data;
  },
};

export const contestsApi = {
  getAll: async (page = 0, size = 20) => {
    const response = await API.get("/contests", { params: { page, size } });
    return response.data;
  },

  getContest: async (id) => {
    const response = await API.get(`/contests/${id}`);
    return response.data;
  },

  registerForContest: async (id) => {
    const response = await API.post(`/contests/${id}/register`);
    return response.data;
  },
};

export const leaderboardApi = {
  getGlobal: async (params = {}) => {
    const response = await API.get("/leaderboard", { params });
    return response.data;
  },
};

export const submissionsApi = {
  runCode: async ({ problemId, language, code }) => {
    const response = await API.post("/submissions/run", {
      problemId,
      language,
      code,
    });
    return response.data;
  },

  submitCode: async ({ problemId, language, code }) => {
    const response = await API.post("/submissions", {
      problemId,
      language,
      code,
    });
    return response.data;
  },
};

export default API;
