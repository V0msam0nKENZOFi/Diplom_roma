# -*- coding: utf-8 -*-
"""Генерация рисунков 2.1–2.5 и 3.1–3.6 для диплома «ТехноСервис+»."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
MOCKS = ROOT / "mocks"
OUT = Path(r"C:\Users\vlvlk\Desktop\Рисунки_ТехноСервис")


def ensure_deps() -> None:
    for pkg in ("matplotlib", "pillow"):
        try:
            __import__(pkg if pkg != "pillow" else "PIL")
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])
    try:
        import playwright  # noqa: F401
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "-q"])
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])


def fig_2_1() -> None:
    import matplotlib.pyplot as plt
    from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title(
        "Рисунок 2.1 — Схема клиент-серверной архитектуры веб-сайта",
        fontsize=13,
        fontweight="bold",
        pad=12,
    )

    def box(x, y, w, h, title, lines, color="#e8f4fc", edge="#1e3a5f"):
        p = FancyBboxPatch(
            (x, y),
            w,
            h,
            boxstyle="round,pad=0.02,rounding_size=0.15",
            facecolor=color,
            edgecolor=edge,
            linewidth=2,
        )
        ax.add_patch(p)
        ax.text(x + w / 2, y + h - 0.35, title, ha="center", va="top", fontsize=11, fontweight="bold")
        ax.text(x + w / 2, y + h / 2 - 0.15, "\n".join(lines), ha="center", va="center", fontsize=9)

    box(0.4, 2.2, 3.6, 4.2, "Клиентская часть\n(Frontend)", [
        "HTML5",
        "CSS3 (Flexbox/Grid)",
        "JavaScript (ES6+)",
        "Leaflet.js",
    ])
    box(5.0, 2.2, 3.6, 4.2, "Серверная часть\n(Backend)", ["Node.js сервер"], color="#fef3c7")
    box(9.2, 1.0, 4.4, 6.0, "Внешние сервисы\nи хранилища", [
        "LocalStorage",
        "(браузер)",
        "",
        "Telegram Bot API",
        "",
        "OpenStreetMap API",
    ], color="#f0fdf4")

    ax.annotate(
        "",
        xy=(5.0, 4.3),
        xytext=(4.0, 4.3),
        arrowprops=dict(arrowstyle="<->", color="#2563eb", lw=2),
    )
    ax.text(4.5, 4.55, "HTTP / HTTPS\nRequests (JSON)", ha="center", fontsize=8, color="#1e40af")

    arrows = [
        ((2.2, 2.2), (10.5, 5.8), "Запись/Чтение данных\nпользователей и отзывов"),
        ((6.8, 2.2), (10.5, 4.2), "Отправка уведомлений\nо заявках"),
        ((2.2, 6.0), (10.5, 2.5), "Рендеринг карты"),
    ]
    for (start, end, label) in arrows:
        ax.annotate(
            "",
            xy=end,
            xytext=start,
            arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.5, connectionstyle="arc3,rad=0.15"),
        )
        mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
        ax.text(mx, my + 0.25, label, fontsize=7, ha="center", color="#475569")

    ax.text(10.8, 5.9, "LocalStorage", fontsize=8, fontweight="bold")
    ax.text(10.5, 4.0, "Telegram Bot API", fontsize=8, fontweight="bold")
    ax.text(10.3, 2.3, "OpenStreetMap API", fontsize=8, fontweight="bold")

    fig.tight_layout()
    fig.savefig(OUT / "Рисунок_2_1_Архитектура.png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def fig_2_2() -> None:
    import matplotlib.pyplot as plt
    from matplotlib.patches import Ellipse

    fig, ax = plt.subplots(figsize=(12, 7))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Рисунок 2.2 — Диаграмма вариантов использования (UML Use Case)", fontsize=13, fontweight="bold")

    rect = plt.Rectangle((2.5, 0.8), 7, 5.6, fill=False, edgecolor="#94a3b8", linestyle="--", linewidth=1.5)
    ax.add_patch(rect)
    ax.text(6, 6.2, "Система «ТехноСервис+»", ha="center", fontsize=10, style="italic")

    def actor(x, y, label):
        ax.plot([x, x], [y, y + 0.8], "k-", lw=2)
        ax.plot([x - 0.35, x + 0.35], [y + 0.8, y + 0.8], "k-", lw=2)
        ax.add_patch(Ellipse((x, y + 1.15), 0.5, 0.55, facecolor="white", edgecolor="k", lw=2))
        ax.plot([x - 0.35, x - 0.2], [y + 0.8, y + 0.35], "k-", lw=2)
        ax.plot([x + 0.35, x + 0.2], [y + 0.8, y + 0.35], "k-", lw=2)
        ax.plot([x, x], [y, y - 0.15], "k-", lw=2)
        ax.text(x, y - 0.45, label, ha="center", fontsize=9, fontweight="bold")

    def usecase(cx, cy, text):
        e = Ellipse((cx, cy), 2.8, 0.75, facecolor="#dbeafe", edgecolor="#1e40af", lw=1.5)
        ax.add_patch(e)
        ax.text(cx, cy, text, ha="center", va="center", fontsize=8)

    actor(1.2, 1.5, "Гость /\nКлиент")
    actor(10.8, 1.5, "Администратор")

    left_cases = [
        (4.2, 5.2, "Просмотр каталога\nуслуг"),
        (4.2, 4.2, "Оставление отзыва"),
        (4.2, 3.2, "Регистрация /\nАвторизация"),
        (4.2, 2.2, "Отправка заявки\nна ремонт"),
    ]
    right_cases = [
        (7.8, 4.0, "Авторизация в панели\nуправления"),
        (7.8, 2.8, "Модерация отзывов\n(удаление/одобрение)"),
    ]

    for cx, cy, text in left_cases:
        usecase(cx, cy, text)
        ax.plot([1.55, cx - 1.4], [2.3, cy], "k-", lw=0.8)

    for cx, cy, text in right_cases:
        usecase(cx, cy, text)
        ax.plot([10.45, cx + 1.4], [2.3, cy], "k-", lw=0.8)

    fig.tight_layout()
    fig.savefig(OUT / "Рисунок_2_2_UseCase.png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def fig_2_3() -> None:
    import matplotlib.pyplot as plt
    from matplotlib.patches import Ellipse, Polygon, FancyBboxPatch

    fig, ax = plt.subplots(figsize=(10, 14))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 18)
    ax.axis("off")
    ax.set_title("Рисунок 2.3 — Блок-схема алгоритма отправки заявки на ремонт", fontsize=12, fontweight="bold")

    y = 17

    def oval(text, yy):
        e = Ellipse((5, yy), 2.2, 0.55, facecolor="#dcfce7", edgecolor="#166534", lw=1.5)
        ax.add_patch(e)
        ax.text(5, yy, text, ha="center", va="center", fontsize=9, fontweight="bold")

    def rect(text, yy, h=0.9):
        p = FancyBboxPatch((2.8, yy - h / 2), 4.4, h, boxstyle="square,pad=0", facecolor="#e0f2fe", edgecolor="#0369a1", lw=1.5)
        ax.add_patch(p)
        ax.text(5, yy, text, ha="center", va="center", fontsize=8)

    def diamond(text, yy):
        d = Polygon([(5, yy + 0.55), (6.3, yy), (5, yy - 0.55), (3.7, yy)], closed=True, facecolor="#fef9c3", edgecolor="#a16207", lw=1.5)
        ax.add_patch(d)
        ax.text(5, yy, text, ha="center", va="center", fontsize=7.5)

    def arrow(y1, y2, x1=5, x2=5):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", lw=1.2))

    oval("Начало", y)
    y -= 1.1
    arrow(16.45, y + 0.45)
    rect("Заполнение формы:\nИмя, Телефон, Модель устройства", y)
    y -= 1.3
    arrow(y + 1.3, y + 0.55)
    diamond("Данные\nвалидны?", y)
    y_err = y
    ax.annotate("", xy=(1.5, y_err), xytext=(3.7, y_err), arrowprops=dict(arrowstyle="->", lw=1.2))
    ax.text(2.5, y_err + 0.2, "Нет", fontsize=8, color="#b91c1c")
    rect("Вывод ошибки\nвалидации", y_err, 0.85)
    ax.plot([1.5, 1.5, 2.8], [y_err, 16.2, 16.2], "k-", lw=1)
    ax.annotate("", xy=(2.8, 16.2), xytext=(1.5, 16.2), arrowprops=dict(arrowstyle="->", lw=1.2))

    y -= 1.2
    arrow(y + 1.2, y + 0.55)
    ax.text(5.35, y + 1.0, "Да", fontsize=8, color="#15803d")
    rect("Формирование POST-запроса\nна Node.js сервер", y)
    y -= 1.2
    arrow(y + 1.2, y + 0.55)
    rect("Обработка запроса сервером\nи вызов Telegram Bot API", y)
    y -= 1.2
    arrow(y + 1.2, y + 0.55)
    diamond("Доставлено\nв Telegram?", y)
    y -= 1.2
    ax.text(5.35, y + 1.0, "Да", fontsize=8, color="#15803d")
    arrow(y + 1.2, y + 0.55)
    rect("Вывод сообщения:\nЗаявка принята", y)
    y -= 1.0
    arrow(y + 1.0, y + 0.35)
    oval("Конец", y)

    fig.tight_layout()
    fig.savefig(OUT / "Рисунок_2_3_Блоксхема.png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def fig_2_4() -> None:
    import matplotlib.pyplot as plt
    from matplotlib.patches import FancyBboxPatch

    fig, ax = plt.subplots(figsize=(12, 6))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6)
    ax.axis("off")
    ax.set_title("Рисунок 2.4 — Логическая схема структуры данных (localStorage)", fontsize=12, fontweight="bold")

    def entity(x, title, fields):
        h = 0.45 + len(fields) * 0.38
        p = FancyBboxPatch((x, 1.2), 3.2, h, boxstyle="round,pad=0.02", facecolor="#fff", edgecolor="#0f2744", lw=2)
        ax.add_patch(p)
        ax.add_patch(FancyBboxPatch((x, 1.2 + h - 0.55), 3.2, 0.55, boxstyle="round,pad=0.02", facecolor="#0f2744", edgecolor="#0f2744"))
        ax.text(x + 1.6, 1.2 + h - 0.28, title, ha="center", va="center", color="white", fontweight="bold", fontsize=10)
        for i, f in enumerate(fields):
            ax.text(x + 0.2, 1.2 + h - 0.75 - i * 0.38, f, fontsize=9, family="monospace")

    entity(0.5, "Users", ["id (PK)", "name", "email", "phone", "password", "role (admin/user)"])
    entity(4.4, "Reviews", ["id (PK)", "name", "rating (1-5)", "text", "date", "isDefault (boolean)"])
    entity(8.3, "Session", ["currentUserId"])

    ax.plot([3.7, 4.4], [3.0, 3.0], "k--", lw=1.2)
    ax.text(3.85, 3.15, "связь", fontsize=8, style="italic")
    ax.annotate("", xy=(8.3, 3.0), xytext=(7.6, 3.0), arrowprops=dict(arrowstyle="->", linestyle="dashed", color="#64748b"))

    fig.tight_layout()
    fig.savefig(OUT / "Рисунок_2_4_localStorage.png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def fig_2_5() -> None:
    import matplotlib.pyplot as plt
    from matplotlib.patches import Rectangle

    fig, axes = plt.subplots(1, 2, figsize=(14, 8))
    fig.suptitle("Рисунок 2.5 — Прототипы (Wireframes) интерфейса сайта", fontsize=13, fontweight="bold", y=0.98)

    def wireframe(ax, mobile=False):
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 14)
        ax.axis("off")
        ax.set_facecolor("#fafafa")
        title = "Мобильная версия" if mobile else "Десктоп"
        ax.text(5, 13.5, title, ha="center", fontsize=11, fontweight="bold")

        def r(x, y, w, h, label="", lw=1.5):
            ax.add_patch(Rectangle((x, y), w, h, fill=False, edgecolor="#334155", linewidth=lw))
            if label:
                ax.text(x + w / 2, y + h / 2, label, ha="center", va="center", fontsize=7 if mobile else 8, color="#475569")

        if mobile:
            r(1, 12.2, 8, 0.7, "☰  Лого  📞")
            r(1, 9.8, 8, 2.2, "Hero\n«Оставить заявку»")
            r(1, 6.8, 8, 2.8, "Услуги (1 кол.)")
            r(1, 3.8, 8, 2.6, "Карточки отзывов")
            r(1, 1.0, 8, 2.4, "Контакты / карта")
        else:
            r(0.5, 12.2, 9, 0.8, "Навигация: Лого | Меню | Телефон")
            r(0.5, 9.5, 9, 2.3, "Hero-баннер + кнопка «Оставить заявку»")
            for i in range(3):
                for j in range(2):
                    r(0.5 + j * 3.05, 6.8 - i * 1.55, 2.85, 1.35, "Услуга")
            ax.text(5, 7.5, "Наши услуги (сетка 2×3)", ha="center", fontsize=8, color="#64748b")
            r(0.5, 2.8, 2.8, 2.5, "Отзыв")
            r(3.6, 2.8, 2.8, 2.5, "Отзыв")
            r(6.7, 2.8, 2.8, 2.5, "Отзыв")

    wireframe(axes[0], mobile=False)
    wireframe(axes[1], mobile=True)
    fig.tight_layout(rect=[0, 0, 1, 0.96])
    fig.savefig(OUT / "Рисунок_2_5_Wireframes.png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def screenshots_chapter3() -> None:
    from playwright.sync_api import sync_playwright

    site = PROJECT / "index.html"
    mocks = MOCKS

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # 3.1 Desktop
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(site.as_uri())
        page.wait_for_timeout(800)
        page.evaluate(
            """() => {
            const btn = document.querySelector('#openModalBtn');
            if (btn) btn.textContent = 'Вызвать мастера';
        }"""
        )
        page.screenshot(path=str(OUT / "Рисунок_3_1_Главная_ПК.png"), full_page=False)
        page.close()

        # 3.2 Mobile
        page = browser.new_page(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page.goto(site.as_uri())
        page.wait_for_timeout(600)
        page.evaluate(
            """() => {
            const btn = document.querySelector('#openModalBtn');
            if (btn) btn.textContent = 'Вызвать мастера';
        }"""
        )
        page.screenshot(path=str(OUT / "Рисунок_3_2_Главная_Мобильная.png"), full_page=True)
        page.close()

        # 3.3 Modal mock
        page = browser.new_page(viewport={"width": 900, "height": 600})
        page.goto((mocks / "fig_3_3_modal.html").as_uri())
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / "Рисунок_3_3_Модальное_окно.png"))
        page.close()

        # 3.4 Telegram mock
        page = browser.new_page(viewport={"width": 500, "height": 420})
        page.goto((mocks / "fig_3_4_telegram.html").as_uri())
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / "Рисунок_3_4_Telegram.png"))
        page.close()

        # 3.5 Admin mock
        page = browser.new_page(viewport={"width": 1000, "height": 620})
        page.goto((mocks / "fig_3_5_admin.html").as_uri())
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / "Рисунок_3_5_Панель_администратора.png"))
        page.close()

        # 3.6 Map section
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(site.as_uri())
        page.wait_for_timeout(500)
        page.evaluate("document.querySelector('#contacts')?.scrollIntoView({behavior:'instant'})")
        page.wait_for_timeout(2500)
        el = page.query_selector(".map-container")
        if el:
            el.screenshot(path=str(OUT / "Рисунок_3_6_Карта_Leaflet.png"))
        else:
            page.locator("#contacts").screenshot(path=str(OUT / "Рисунок_3_6_Карта_Leaflet.png"))
        page.close()

        browser.close()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ensure_deps()
    print("Глава 2: диаграммы...")
    fig_2_1()
    fig_2_2()
    fig_2_3()
    fig_2_4()
    fig_2_5()
    print("Глава 3: скриншоты...")
    screenshots_chapter3()
    files = sorted(OUT.glob("*.png"))
    print(f"\nГотово: {len(files)} файлов в {OUT}")
    for f in files:
        print(f"  - {f.name}")


if __name__ == "__main__":
    main()
