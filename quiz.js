// BreathEaseX assessment — pure static JS (no framework, no build step).

const quizQuestions = [
  {
    id: "q1",
    question: "Do you often experience shortness of breath during everyday activities like walking, climbing stairs, or light housework?",
    options: [
      { value: "rarely", label: "Rarely or never" },
      { value: "sometimes", label: "A few times a week" },
      { value: "often", label: "Almost every day" },
      { value: "always", label: "Constantly, even at rest" },
    ],
  },
  {
    id: "q2",
    question: "How would you describe your cough and mucus build-up over the last 3 months?",
    options: [
      { value: "none", label: "No persistent cough" },
      { value: "dry", label: "Occasional dry cough" },
      { value: "mucus", label: "Frequent cough with mucus" },
      { value: "chronic", label: "Chronic cough that disrupts sleep" },
    ],
  },
  {
    id: "q3",
    question: "Have you been diagnosed with (or suspect you have) any of the following: COPD, asthma, bronchitis, or long-term inflammation of the airways?",
    options: [
      { value: "no", label: "No, my lungs feel generally healthy" },
      { value: "suspect", label: "I suspect something is wrong" },
      { value: "mild", label: "Yes — mild or controlled" },
      { value: "severe", label: "Yes — moderate to severe" },
    ],
  },
  {
    id: "q4",
    question: "How is your sleep and energy affected by your breathing?",
    options: [
      { value: "fine", label: "Sleep and energy are fine" },
      { value: "tired", label: "I wake up tired but functional" },
      { value: "poor", label: "Poor sleep, low energy most days" },
      { value: "exhausted", label: "Wake up gasping, exhausted all day" },
    ],
  },
];

const processingSteps = [
  "Securing your anonymous responses...",
  "Indexing 83 lung health products in our database...",
  "Cross-referencing active ingredients with your symptom profile...",
  "Scoring clinical alignment across all formulas...",
  "Selecting your highest-match recommendation...",
];

const OFFICIAL_URL = "https://thelungexpandpro.com/text.php?aff_id=10042";
const STORAGE_KEY = "breatheasex-quiz-result";

let step = 0;
const answers = {};
let answering = false;
let processingTimer = null;
let quizCompleted = false;

function saveQuizResult() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ completed: true, answers: { ...answers }, completedAt: Date.now() })
    );
  } catch {
    /* storage unavailable */
  }
}

function loadQuizResult() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.completed && data.answers) return data;
  } catch {
    /* ignore corrupt data */
  }
  return null;
}

function clearQuizResult() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

function updateProgressBar() {
  const progressPct = (step / quizQuestions.length) * 100;
  document.getElementById("q-progress-bar").style.width = `${progressPct}%`;
  const progressEl = document.getElementById("q-progress");
  if (progressEl) progressEl.setAttribute("aria-valuenow", String(Math.round(progressPct)));
}

const phases = {
  intro: document.getElementById("phase-intro"),
  quiz: document.getElementById("phase-quiz"),
  processing: document.getElementById("phase-processing"),
};

const heroInitial = document.getElementById("hero-initial");
const heroShell = document.getElementById("hero-shell");
const heroResult = document.getElementById("hero-result");
const quizSection = document.getElementById("quiz");
const headerCta = document.querySelector(".site-header .btn-cta");

function init() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const officialLink = document.getElementById("official-link");
  if (officialLink) officialLink.href = OFFICIAL_URL;

  Object.entries(phases).forEach(([name, el]) => {
    if (!el) return;
    const isIntro = name === "intro";
    el.classList.toggle("active", isIntro);
    el.hidden = !isIntro;
    el.setAttribute("aria-hidden", String(!isIntro));
  });

  document.getElementById("start-quiz")?.addEventListener("click", startQuiz);

  document.querySelectorAll('a[href="#quiz"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (quizCompleted) return;
      event.preventDefault();
      startQuiz();
    });
  });

  const saved = loadQuizResult();
  if (saved) {
    Object.assign(answers, saved.answers);
    showResultHero();
  }
}

function setPhase(name) {
  Object.entries(phases).forEach(([key, el]) => {
    if (!el) return;
    const active = key === name;
    el.classList.toggle("active", active);
    el.hidden = !active;
    el.setAttribute("aria-hidden", String(!active));
  });

  if (name === "result") {
    showResultHero();
    return;
  }

  if (name !== "intro") {
    quizSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function showResultHero() {
  quizCompleted = true;
  saveQuizResult();

  heroShell?.setAttribute("hidden", "");
  heroShell?.setAttribute("aria-hidden", "true");

  heroResult?.removeAttribute("hidden");
  heroResult?.setAttribute("aria-hidden", "false");

  quizSection?.setAttribute("hidden", "");
  quizSection?.setAttribute("aria-hidden", "true");

  document.querySelector(".trust")?.setAttribute("hidden", "");

  document.querySelector(".site-header")?.classList.add("site-header--solid");

  if (headerCta) {
    headerCta.textContent = "Get LungExpand Pro →";
    headerCta.href = OFFICIAL_URL;
    headerCta.target = "_blank";
    headerCta.rel = "noopener noreferrer sponsored";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startQuiz() {
  if (processingTimer) {
    clearTimeout(processingTimer);
    processingTimer = null;
  }

  clearQuizResult();
  quizCompleted = false;

  step = 0;
  answering = false;
  Object.keys(answers).forEach((key) => delete answers[key]);
  renderQuestion();
  setPhase("quiz");
}

function renderQuestion() {
  const q = quizQuestions[step];
  if (!q) return;

  document.getElementById("q-progress-text").textContent =
    `Question ${step + 1} of ${quizQuestions.length}`;
  updateProgressBar();
  document.getElementById("q-text").textContent = q.question;

  const opts = document.getElementById("q-options");
  opts.innerHTML = "";
  q.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = option.label;
    btn.addEventListener("click", () => handleAnswer(option.value, btn));
    opts.appendChild(btn);
  });
}

function handleAnswer(value, button) {
  if (answering) return;
  answering = true;

  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.disabled = true;
  });
  button.classList.add("selected");

  answers[quizQuestions[step].id] = value;

  const answeredCount = step + 1;
  const progressPct = (answeredCount / quizQuestions.length) * 100;
  document.getElementById("q-progress-bar").style.width = `${progressPct}%`;
  const progressEl = document.getElementById("q-progress");
  if (progressEl) progressEl.setAttribute("aria-valuenow", String(Math.round(progressPct)));

  setTimeout(() => {
    if (step < quizQuestions.length - 1) {
      step += 1;
      answering = false;
      renderQuestion();
      return;
    }
    runProcessing();
  }, 350);
}

function buildSteps() {
  const wrap = document.getElementById("p-steps");
  wrap.innerHTML = "";
  processingSteps.forEach((label) => {
    const row = document.createElement("div");
    row.className = "step-item";
    row.innerHTML = `<span class="check">✓</span><span>${label}</span>`;
    wrap.appendChild(row);
  });
  return wrap.querySelectorAll(".step-item");
}

function runProcessing() {
  answering = false;
  setPhase("processing");

  const items = buildSteps();
  const current = document.getElementById("p-current");
  let i = 0;

  current.textContent = processingSteps[0];
  items[0]?.classList.add("active");

  const tick = () => {
    if (i >= processingSteps.length) {
      processingTimer = null;
      setPhase("result");
      return;
    }

    items[i]?.classList.remove("active");
    items[i]?.classList.add("done");
    i += 1;

    if (i < processingSteps.length) {
      items[i]?.classList.add("active");
      current.textContent = processingSteps[i];
      processingTimer = setTimeout(tick, 900);
      return;
    }

    processingTimer = setTimeout(tick, 900);
  };

  processingTimer = setTimeout(tick, 900);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
