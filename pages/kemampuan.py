from pathlib import Path

import streamlit as st


st.set_page_config(page_title="Kemampuan | Ranz Studio", page_icon="✦", layout="wide")

BASE_DIR = Path(__file__).resolve().parent
skill_image = BASE_DIR / "alightmotion.webp"

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
    :root { --bg:#0b0c10; --surface:#12141a; --line:#262932; --text:#f4f4f5; --muted:#9a9ca7; --lime:#c8f169; }
    .stApp { background:radial-gradient(ellipse at 85% 2%,rgba(200,241,105,.09),transparent 30%),radial-gradient(ellipse at 8% 42%,rgba(146,107,255,.06),transparent 28%),var(--bg); color:var(--text); font-family:'DM Sans',sans-serif; }
    h1,h2,h3 { font-family:'Space Grotesk',sans-serif !important; }
    .block-container { max-width:1120px; padding-top:2.3rem; padding-bottom:4rem; }
    [data-testid="stSidebar"] { background:linear-gradient(180deg,#12141a 0%,#0e0f13 100%); border-right:1px solid var(--line); }
    [data-testid="stSidebar"] .block-container { padding:1.5rem 1rem 1.2rem; }
    [data-testid="stSidebarNav"] { display:none; }
    [data-testid="stSidebar"] * { color:var(--text); }
    .sidebar-brand { display:flex; align-items:center; gap:.7rem; font-family:'Space Grotesk',sans-serif; font-size:1.35rem; font-weight:700; letter-spacing:-.06em; margin:.2rem .25rem .25rem; }
    .brand-mark { display:grid; place-items:center; width:39px; height:39px; border:1px solid rgba(200,241,105,.38); border-radius:13px; background:linear-gradient(145deg,#e6ffab,#a7d84e); color:#111 !important; font-size:1.1rem; }
    .sidebar-kicker { color:#777b86 !important; font-size:.62rem; letter-spacing:.11em; margin:.55rem .3rem 1.7rem; }
    .sidebar-section { color:#777b86 !important; font-size:.65rem; font-weight:700; letter-spacing:.14em; margin:0 0 .6rem .35rem; }
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] { margin:.25rem 0; }
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] a { min-height:42px; padding:.65rem .8rem; border:1px solid transparent; border-radius:11px; color:#b5b6bf !important; font-weight:500; transition:background .18s ease,border-color .18s ease,color .18s ease; }
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] a:hover { background:#1a1c22; border-color:#30333c; color:#f4f4f5 !important; }
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] a[aria-current="page"] { background:rgba(200,241,105,.1); border-color:rgba(200,241,105,.22); color:var(--lime) !important; }
    [data-testid="stSidebar"] [data-testid="stLinkButton"] a { justify-content:center; border:1px solid rgba(200,241,105,.25); border-radius:11px; background:rgba(200,241,105,.08); color:var(--lime) !important; font-size:.85rem; }
    .sidebar-contact { padding:.9rem .8rem; margin:.2rem 0 .75rem; border:1px solid #292c34; border-radius:13px; background:linear-gradient(145deg,#171920,#121319); }
    .sidebar-contact-title { color:#e9e9eb !important; font-size:.82rem; font-weight:600; }
    .sidebar-contact-copy { color:var(--muted) !important; font-size:.7rem; margin:.4rem 0 0 1rem; }
    .online-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--lime); box-shadow:0 0 12px var(--lime); margin-right:.5rem; }
    .eyebrow { color:var(--lime); font-size:.74rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
    .page-title { font-family:'Space Grotesk',sans-serif; font-size:clamp(2.6rem,6vw,4.4rem); font-weight:700; letter-spacing:-.065em; line-height:1.05; margin:.55rem 0 .8rem; }
    .page-copy { max-width:690px; color:var(--muted); font-size:1.04rem; line-height:1.75; }
    .skill-card { height:100%; padding:1.25rem; border:1px solid var(--line); border-radius:18px; background:linear-gradient(145deg,#171920,#111319); }
    .skill-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:13px; background:rgba(200,241,105,.12); color:var(--lime); font-size:1.25rem; }
    .skill-name { color:var(--text); font-family:'Space Grotesk',sans-serif; font-size:1.08rem; font-weight:600; margin:.8rem 0 .35rem; }
    .skill-copy { color:var(--muted); font-size:.88rem; line-height:1.6; }
    [data-testid="stVerticalBlockBorderWrapper"] { border-color:var(--line); border-radius:20px; background:rgba(18,20,26,.76); }
    [data-testid="stImage"] img { border:1px solid var(--line); border-radius:16px; }
    div.stLinkButton > a { border-radius:11px; border-color:#41444d; color:var(--text); }
    div.stLinkButton > a:hover { border-color:var(--lime); color:var(--lime); }
    @media(max-width:700px) { .block-container { padding-top:1.4rem; } }
    </style>
    """,
    unsafe_allow_html=True,
)

with st.sidebar:
    st.markdown(
        '<div class="sidebar-brand"><span class="brand-mark">R</span>'
        '<span>ranz<span style="color:#c8f169">studio</span></span></div>',
        unsafe_allow_html=True,
    )
    st.markdown('<div class="sidebar-kicker">CREATIVE DIGITAL STUDIO</div>', unsafe_allow_html=True)
    st.markdown('<div class="sidebar-section">MENU UTAMA</div>', unsafe_allow_html=True)
    st.page_link("home.py", label="✦  Beranda")
    st.page_link("pages/bot.py", label="⌘  WhatsApp Bot")
    st.page_link("pages/kemampuan.py", label="▦  Kemampuan")
    st.page_link("pages/profil.py", label="◎  Profil")
    st.page_link("pages/sosmed.py", label="↗  Sosial media")
    st.divider()
    st.markdown(
        '<div class="sidebar-contact"><div class="sidebar-contact-title">'
        '<span class="online-dot"></span>Siap bantu project kamu</div>'
        '<div class="sidebar-contact-copy">Jambi, Indonesia</div></div>',
        unsafe_allow_html=True,
    )
    st.link_button(
        "Chat WhatsApp ↗",
        "https://wa.me/6282183317690?text=Halo%20Ranz%2C%20saya%20ingin%20bertanya.",
        width="stretch",
    )

st.markdown('<div class="eyebrow">Yang saya suka kerjakan</div>', unsafe_allow_html=True)
st.markdown('<div class="page-title">Kreativitas bertemu<br><span style="color:#c8f169">teknologi.</span></div>', unsafe_allow_html=True)
st.markdown(
    '<p class="page-copy">Saya terus mengeksplorasi tools kreatif dan teknologi baru. '
    'Dari editing video sampai coding, setiap project adalah kesempatan untuk belajar '
    'dan menghasilkan karya yang lebih baik.</p>',
    unsafe_allow_html=True,
)
st.page_link("home.py", label="← Kembali ke beranda")
st.write("")

image_col, text_col = st.columns([0.9, 1.3], gap="large", vertical_alignment="center")
with image_col:
    with st.container(border=True):
        st.image(str(skill_image), width="stretch")
        st.caption("Eksplorasi kreatif dengan tools editing.")
with text_col:
    st.markdown('<div class="eyebrow">Minat & kemampuan</div>', unsafe_allow_html=True)
    st.subheader("Ruang untuk terus berkembang")
    st.write(
        "Saya menikmati proses dari mencari inspirasi, mengolah ide, hingga "
        "menyelesaikan sebuah karya. Saat ini saya banyak bereksperimen dengan "
        "editing foto, video, motion, serta coding."
    )
    st.markdown("**Tools yang sering saya gunakan**")
    st.caption("Alight Motion · Keyflow · Wink · CapCut · JJ · Animation")

st.write("")
st.markdown('<div class="eyebrow">Di luar layar</div>', unsafe_allow_html=True)
st.subheader("Hal yang saya nikmati")
cards = st.columns(4)
interests = [
    ("♫", "Bermain gitar", "Musik sebagai ruang untuk rehat dan berekspresi."),
    ("▤", "Badminton", "Menjaga energi dan menikmati permainan."),
    ("⌘", "Coding", "Mencoba ide dan membangun hal baru."),
    ("✧", "Editing", "Merangkai visual menjadi cerita."),
]
for column, (icon, title, description) in zip(cards, interests):
    with column:
        st.markdown(
            f'<div class="skill-card"><div class="skill-icon">{icon}</div>'
            f'<div class="skill-name">{title}</div><div class="skill-copy">{description}</div></div>',
            unsafe_allow_html=True,
        )
