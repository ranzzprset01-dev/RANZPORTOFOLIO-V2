from pathlib import Path
from urllib.parse import quote

import streamlit as st


st.set_page_config(page_title="Profil | Ranz Studio", page_icon="◎", layout="wide")

BASE_DIR = Path(__file__).resolve().parent
photo_path = BASE_DIR / "Proyek Baru 140.jpg"
WA_NUMBER = "6282183317690"

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
    .page-copy { max-width:720px; color:var(--muted); font-size:1.04rem; line-height:1.75; }
    .info-card { padding:1.35rem; border:1px solid var(--line); border-radius:18px; background:linear-gradient(145deg,#171920,#111319); }
    .info-label { color:var(--muted); font-size:.72rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
    .info-value { margin:.35rem 0 0; color:var(--text); font-size:1.02rem; font-weight:600; }
    [data-testid="stImage"] img { border:1px solid #3a3d45; border-radius:20px; }
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

st.markdown('<div class="eyebrow">Cerita di balik karya</div>', unsafe_allow_html=True)
st.markdown('<div class="page-title">Halo, saya <span style="color:#c8f169">Randi.</span></div>', unsafe_allow_html=True)
st.markdown(
    '<p class="page-copy">Mahasiswa Sistem Informasi yang senang belajar, '
    'bereksperimen dengan teknologi, dan mengekspresikan ide lewat editing. '
    'Saya percaya proses kecil yang konsisten bisa membawa kita ke karya yang berarti.</p>',
    unsafe_allow_html=True,
)
st.page_link("home.py", label="← Kembali ke beranda")
st.write("")

photo_col, intro_col = st.columns([0.82, 1.5], gap="large", vertical_alignment="center")
with photo_col:
    if photo_path.exists():
        st.image(str(photo_path), width="stretch")
    else:
        with st.container(border=True):
            st.markdown("### Randi Prasetyo")
            st.caption("Foto profil belum tersedia.")
with intro_col:
    st.markdown('<div class="eyebrow">Tentang saya</div>', unsafe_allow_html=True)
    st.subheader("Terus belajar, terus berkarya.")
    st.write(
        "Saat ini saya menempuh studi Sistem Informasi dan tertarik pada "
        "pemrograman berbasis platform. Di waktu luang, saya mengeksplorasi "
        "aplikasi editing, membuat konten, bermain gitar, dan bermain badminton."
    )
    st.link_button(
        "Sapa saya di WhatsApp ↗",
        f"https://wa.me/{WA_NUMBER}?text={quote('Halo Randi, saya melihat profilmu.')}",
        type="primary",
        width="stretch",
    )

st.write("")
st.markdown('<div class="eyebrow">Informasi</div>', unsafe_allow_html=True)
st.subheader("Sedikit tentang saya")
details = [
    ("Nama", "Randi Prasetyo"),
    ("Program studi", "Sistem Informasi"),
    ("NIM", "25111068"),
    ("Fokus belajar", "Pemrograman Berbasis Platform"),
]
for row_start in (0, 2):
    columns = st.columns(2)
    for column, (label, value) in zip(columns, details[row_start : row_start + 2]):
        with column:
            st.markdown(
                f'<div class="info-card"><div class="info-label">{label}</div>'
                f'<div class="info-value">{value}</div></div>',
                unsafe_allow_html=True,
            )
    st.write("")
