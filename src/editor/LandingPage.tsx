import { useEffect, useRef, type MouseEvent } from "react";

interface LandingPageProps {
  onEnter: () => void;
}

const STEPS = [
  {
    n: "01",
    kicker: "Дизайн",
    title: "Создайте шаблон",
    text: "Соберите внешний вид одной карточки: текст, изображения, фигуры, иконки и другие элементы.",
  },
  {
    n: "02",
    kicker: "Данные",
    title: "Добавьте данные",
    text: "Подключите таблицу с названиями, характеристиками, изображениями и другим содержимым.",
  },
  {
    n: "03",
    kicker: "Результат",
    title: "Получите колоду",
    text: "Карточница создаст карточки автоматически. Экспортируйте результат в PNG, ZIP или PDF.",
  },
];

const FEATURES = [
  { icon: "🎨", title: "Любой дизайн", text: "Текст, изображения, фигуры, иконки и собственная композиция карточки." },
  { icon: "📊", title: "Данные из таблицы", text: "Используйте таблицу для автоматического заполнения карточек." },
  { icon: "🖼", title: "Изображения", text: "Подключайте изображения к данным и используйте их в шаблоне." },
  { icon: "👁", title: "Предпросмотр", text: "Проверьте, как выглядит вся колода, до экспорта." },
  { icon: "📦", title: "Экспорт", text: "PNG, ZIP и PDF — от отдельной карточки до готового набора." },
  { icon: "🔒", title: "Всё в браузере", text: "Работайте с проектом локально, без загрузки данных на сервер." },
];

const USE_CASES = [
  { icon: "🎲", label: "Настольные игры" },
  { icon: "🧪", label: "Прототипы" },
  { icon: "⚔️", label: "Игровые предметы" },
  { icon: "🧙", label: "Персонажи" },
  { icon: "✨", label: "Способности" },
  { icon: "📚", label: "Обучающие карточки" },
  { icon: "🃏", label: "Коллекционные наборы" },
];

const DATA_ROWS = [
  { name: "Fireball", type: "Spell", power: "5", image: "🔥" },
  { name: "Frostbite", type: "Spell", power: "4", image: "❄" },
  { name: "Thunder", type: "Spell", power: "7", image: "⚡" },
];

const DECK_CARDS = [
  { accent: "#9c8ff0", label: "002" },
  { accent: "#6fd6c4", label: "003" },
  { accent: "#f0b8e0", label: "004" },
  { accent: "#f0d28f", label: "005" },
];

export function LandingPage({ onEnter }: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Lightweight scroll-reveal: sections fade/slide up once, the first time they enter view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  function scrollToHow(e: MouseEvent) {
    e.preventDefault();
    rootRef.current?.querySelector("#how")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="landing" ref={rootRef}>
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <span className="landing-nav-brand">Карточница</span>
          <div className="landing-nav-links">
            <a href="#how" onClick={scrollToHow}>
              Как это работает
            </a>
            <button className="landing-nav-cta" onClick={onEnter}>
              Конструктор
            </button>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-glow" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div className="landing-hero-copy is-hero">
            <span className="landing-eyebrow">КАРТОЧНИЦА</span>
            <h1 className="landing-h1">
              Одна карточка.
              <br />
              Вся колода.
            </h1>
            <p className="landing-lede">
              Спроектируйте шаблон, добавьте данные — Карточница автоматически соберёт остальные карточки.
            </p>
            <div className="landing-hero-actions">
              <button className="landing-btn-primary" onClick={onEnter}>
                Открыть конструктор →
              </button>
              <a className="landing-btn-secondary" href="#how" onClick={scrollToHow}>
                Как это работает ↓
              </a>
            </div>
          </div>

          <div className="landing-hero-visual is-hero" style={{ animationDelay: "0.15s" }}>
            <div className="mini-card mini-card-source">
              <div className="mini-card-bar" />
              <div className="mini-card-art" />
              <div className="mini-card-line" />
            </div>
            <div className="landing-hero-arrow">↓</div>
            <div className="mini-deck">
              {DECK_CARDS.map((c, i) => (
                <div
                  key={c.label}
                  className="mini-card mini-card-small"
                  style={{ borderTopColor: c.accent, animationDelay: `${0.3 + i * 0.08}s` }}
                >
                  <span className="mini-card-tag">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-demo reveal">
        <div className="landing-demo-stage">
          <div className="demo-block">
            <div className="demo-card">
              <div className="demo-card-title" />
              <div className="demo-card-art" />
              <div className="demo-card-stat" />
            </div>
            <span className="demo-caption">Шаблон</span>
          </div>

          <div className="demo-arrow">↓</div>

          <div className="demo-block">
            <table className="demo-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Power</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {DATA_ROWS.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.type}</td>
                    <td>{row.power}</td>
                    <td>{row.image}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <span className="demo-caption">Данные</span>
          </div>

          <div className="demo-arrow">↓</div>

          <div className="demo-block">
            <div className="demo-result-grid">
              {DATA_ROWS.map((row) => (
                <div className="demo-result-card" key={row.name}>
                  <span className="demo-result-emoji">{row.image}</span>
                  <span className="demo-result-name">{row.name}</span>
                </div>
              ))}
              <div className="demo-result-card demo-result-more">+N</div>
            </div>
            <span className="demo-caption">Колода</span>
          </div>
        </div>
      </section>

      <section className="landing-steps reveal" id="how">
        <h2 className="landing-h2">Как это работает</h2>
        <div className="steps-row">
          {STEPS.map((step, i) => (
            <div className="step-card" key={step.n}>
              <span className="step-number">{step.n}</span>
              <span className="step-kicker">{step.kicker}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-text">{step.text}</p>
              {i < STEPS.length - 1 && <span className="step-connector">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-features reveal">
        <h2 className="landing-h2">Что можно делать</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-text">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-usecases reveal">
        <h2 className="landing-h2">Не только для настольных игр</h2>
        <p className="landing-section-sub">Карточница — универсальный генератор карточек, а не конструктор одной игры.</p>
        <div className="usecases-grid">
          {USE_CASES.map((u) => (
            <div className="usecase-chip" key={u.label}>
              <span className="usecase-icon">{u.icon}</span>
              <span>{u.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-idea-flow reveal">
        <div className="idea-flow-row">
          <span className="idea-flow-step">Идея</span>
          <span className="idea-flow-arrow">→</span>
          <span className="idea-flow-step">Шаблон</span>
          <span className="idea-flow-arrow">→</span>
          <span className="idea-flow-step">Данные</span>
          <span className="idea-flow-arrow">→</span>
          <span className="idea-flow-step idea-flow-step-final">Колода</span>
        </div>
        <p className="idea-flow-caption">Вместо того чтобы создавать сотни карточек вручную, вы создаёте одну.</p>
      </section>

      <section className="landing-final-cta reveal">
        <h2 className="landing-h2">Готовы собрать свою колоду?</h2>
        <p className="landing-section-sub">Создайте шаблон. Добавьте данные. Остальное сделает Карточница.</p>
        <button className="landing-btn-primary" onClick={onEnter}>
          Открыть конструктор →
        </button>
      </section>
    </div>
  );
}
