import streamlit as st

WA_NUMBER = "6282183317690"


st.set_page_config(
    page_title="Ranz | Bot Developer & Creator",
    page_icon="ðŸ¤–",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

    :root {
        --background: #0b0d12;
        --surface: #12151d;
        --border: #252a36;
        --text: #f3f5f8;
        --muted: #9299a8;
        --accent: #a3e635;
    }
    .stApp {
        background:
            radial-gradient(ellipse at 85% 0%, rgba(163, 230, 53, .08), transparent 32%),
            var(--background);
        color: var(--text);
        font-family: 'DM Sans', sans-serif;
    }
    h1, h2, h3, .eyebrow, .brand {
        font-family: 'Space Grotesk', sans-serif !important;
    }
    .block-container {
        max-width: 1120px;
        padding-top: 2.5rem;
        padding-bottom: 4rem;
    }
    [data-testid="stSidebar"] {
        background: #0e1016;
        border-right: 1px solid var(--border);
    }
    .brand {
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -.04em;
        padding: .5rem 0 2rem;
    }
    .brand span { color: var(--accent); }
    .eyebrow {
        color: var(--accent);
        font-size: .78rem;
        font-weight: 700;
        letter-spacing: .14em;
        text-transform: uppercase;
    }
    .hero-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(3.5rem, 9vw, 6.8rem);
        font-weight: 700;
        letter-spacing: -.08em;
        line-height: .98;
        margin: .65rem 0 1rem;
    }
    .hero-title span { color: var(--accent); }
    .hero-copy {
        color: var(--muted);
        font-size: 1.15rem;
        line-height: 1.7;
        max-width: 600px;
    }
    .panel {
        background: linear-gradient(145deg, rgba(22, 26, 36, .96), rgba(16, 19, 27, .96));
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.35rem 1.5rem;
        height: 100%;
    }
    .panel-label {
        color: var(--muted);
        font-size: .88rem;
        margin-bottom: .45rem;
    }
    .project-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid var(--border);
    }
    .project-row:last-child { border-bottom: 0; }
    .project-name { color: var(--text); font-weight: 600; }
    .project-type { color: var(--muted); font-size: .9rem; }
    .product-price {
        color: var(--accent);
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.55rem;
        font-weight: 700;
        margin: .5rem 0 1rem;
    }
    .profile-avatar {
        width: 168px;
        height: 168px;
        object-fit: cover;
        border-radius: 50%;
        border: 3px solid var(--accent);
        box-shadow: 0 0 40px rgba(163, 230, 53, .15);
    }
    div.stButton > button, div.stLinkButton > a {
        border-radius: 10px;
    }
    div.stLinkButton > a {
        border-color: #3a4351;
        color: var(--text);
    }
    div.stLinkButton > a:hover {
        border-color: var(--accent);
        color: var(--accent);
    }
    [data-testid="stMetric"] {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1rem 1.2rem;
    }
    [data-testid="stMetricLabel"] { color: var(--muted); }
    [data-testid="stMetricValue"] { color: var(--text); }
    [data-testid="stProgressBar"] > div > div {
        background-color: var(--accent);
    }
    </style>
    """,
    unsafe_allow_html=True,
)

with st.sidebar:
    st.markdown('<div class="brand">ranz<span>.</span></div>', unsafe_allow_html=True)
    st.caption("BOT DEVELOPER & CREATOR")
    page = st.radio(
        "Navigasi",
        ["Beranda", "Profile", "Toko Online", "Sosial Media"],
        label_visibility="collapsed",
    )
    st.divider()
    st.caption("Jambi, Indonesia")
    st.caption("Terbuka untuk project baru")


if page == "Beranda":
    st.markdown('<div class="eyebrow">Halo, saya</div>', unsafe_allow_html=True)
    st.markdown('<div class="hero-title">Ranz<span>.</span></div>', unsafe_allow_html=True)
    st.markdown(
        '<p class="hero-copy">Bot Developer &amp; Creator dari Jambi. '
        "Saya membangun bot, tools, dan solusi digital yang membantu aktivitas "
        "online jadi lebih mudah.</p>",
        unsafe_allow_html=True,
    )
    st.link_button(
        "Hubungi saya â†—",
        "https://wa.me/6282183317690?text=Halo%20Ranz%2C%20saya%20tertarik%20dengan%20layananmu.",
        type="primary",
    )

    st.write("")
    metric_cols = st.columns(3)
    metrics = [("Bot WA", "10+"), ("Client", "25+"), ("Uptime", "99.9%")]
    for col, (label, value) in zip(metric_cols, metrics):
        with col:
            st.metric(label, value)

    st.write("")
    st.subheader("Project pilihan")
    project_cols = st.columns(2)
    projects = [
        ("WhatsApp Automation", "Bot & otomasi"),
        ("Cloudflare Tools", "Tools & integrasi"),
        ("Custom Bot", "Bot sesuai kebutuhan"),
        ("Panel Management", "Deployment & server"),
    ]
    for col, (name, detail) in zip(project_cols * 2, projects):
        with col:
            st.markdown(
                f'<div class="project-row"><div><div class="project-name">{name}</div>'
                f'<div class="project-type">{detail}</div></div>'
                '<span style="color:#a3e635">â†—</span></div>',
                unsafe_allow_html=True,
            )

elif page == "Profile":
    st.markdown('<div class="eyebrow">Kenalan lebih dekat</div>', unsafe_allow_html=True)
    st.title("Profile")
    avatar_col, bio_col = st.columns([1, 2])
    with avatar_col:
        st.image(
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
            "?auto=format&fit=crop&w=500&q=85",
            width=168,
            caption="Ranz",
        )
    with bio_col:
        st.subheader("Ranz â€” Bot Developer & Creator")
        st.write(
            "Saya seorang developer dari Jambi yang berfokus pada pembuatan "
            "bot WhatsApp, otomasi, dan tools berbasis web. Saya senang mengubah "
            "ide menjadi solusi yang praktis, cepat, dan mudah digunakan."
        )
        st.caption("ðŸ“ Jambi, Indonesia  Â·  ðŸ’» Freelance")

    st.write("")
    st.subheader("Skill")
    skills = [("Node.js", 0.90), ("Cloudflare", 0.85), ("Python", 0.80)]
    for skill, level in skills:
        st.markdown(f"**{skill}** &nbsp; `{int(level * 100)}%`")
        st.progress(level)

elif page == "Toko Online":
    st.markdown('<div class="eyebrow">Produk & layanan</div>', unsafe_allow_html=True)
    st.title("Toko Online")
    st.write("Pilih layanan yang kamu butuhkan, lalu hubungi saya lewat WhatsApp.")
    products = [
        ("Bot WA Premium", "Bot WhatsApp dengan fitur premium.", "Rp150k", "Bot%20WA%20Premium"),
        ("Jasa Setup", "Bantuan setup bot dan kebutuhan server.", "Rp75k", "Jasa%20Setup"),
        ("Custom Script", "Script custom sesuai kebutuhan project.", "Rp100k", "Custom%20Script"),
        ("Sewa Panel", "Panel server praktis, harga per bulan.", "Rp25k/bulan", "Sewa%20Panel"),
    ]
    for start in (0, 2):
        cols = st.columns(2)
        for col, (name, description, price, product_query) in zip(cols, products[start : start + 2]):
            with col:
                st.markdown(
                    f'<div class="panel"><div class="eyebrow">LAYANAN RANZ</div>'
                    f'<h3>{name}</h3><div class="project-type">{description}</div>'
                    f'<div class="product-price">{price}</div></div>',
                    unsafe_allow_html=True,
                )
                st.link_button(
                    "Pesan via WhatsApp â†—",
                    f"https://wa.me/6282183317690?text=Halo%20Ranz%2C%20saya%20ingin%20memesan%20{product_query}.",
                    use_container_width=True,
                )
        st.write("")

elif page == "Sosial Media":
    st.markdown('<div class="eyebrow">Temukan saya</div>', unsafe_allow_html=True)
    st.title("Sosial Media")
    st.write("Terhubung dan ikuti aktivitas saya di sini.")
    social_links = [
        ("Instagram â†—", "https://www.instagram.com/bgranzzprset/"),
        ("TikTok â†—", "https://www.tiktok.com/@bgranzzprset"),
        ("WhatsApp â†—", "https://wa.me/6282183317690?text=Halo%20Ranz!"),
        ("GitHub â†—", "https://github.com/"),
    ]
    for start in (0, 2):
        cols = st.columns(2)
        for col, (label, url) in zip(cols, social_links[start : start + 2]):
            with col:
                st.link_button(label, url, use_container_width=True)



