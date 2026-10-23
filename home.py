import json
from urllib.parse import quote

import streamlit as st
import streamlit.components.v1 as components


st.set_page_config(
    page_title="Ranz Studio | Premium Editing",
    page_icon="✦",
    layout="wide",
    initial_sidebar_state="expanded",
)

PRODUCTS = [
    {
        "name": "Canva Pro",
        "category": "Design",
        "description": "Akses fitur desain premium untuk kebutuhan konten dan brand.",
        "price": "Rp15.000",
        "period": "/ bulan",
        "icon": "✳",
        "tone": "lime",
        "badge": "Favorit",
    },
    {
        "name": "CapCut Pro",
        "category": "Video",
        "description": "Edit video lebih leluasa dengan fitur dan aset premium.",
        "price": "Rp20.000",
        "period": "/ bulan",
        "icon": "◉",
        "tone": "purple",
        "badge": "Populer",
    },
    {
        "name": "Alight Motion",
        "category": "Video",
        "description": "Bikin motion graphics dan video dengan tools editing premium.",
        "price": "Rp15.000",
        "period": "/ bulan",
        "icon": "✧",
        "tone": "blue",
        "badge": "Premium",
    },
    {
        "name": "Lightroom Premium",
        "category": "Foto",
        "description": "Sempurnakan foto dengan preset dan fitur editing premium.",
        "price": "Rp20.000",
        "period": "/ bulan",
        "icon": "◐",
        "tone": "orange",
        "badge": "Pilihan editor",
    },
    {
        "name": "Picsart Gold",
        "category": "Foto",
        "description": "Berkreasi dengan tools edit foto, efek, dan aset kreatif.",
        "price": "Rp18.000",
        "period": "/ bulan",
        "icon": "✿",
        "tone": "purple",
        "badge": "Kreatif",
    },
    {
        "name": "Adobe Express",
        "category": "Design",
        "description": "Buat desain sosial media dan konten visual dengan praktis.",
        "price": "Rp25.000",
        "period": "/ bulan",
        "icon": "A",
        "tone": "orange",
        "badge": "Pilihan kreator",
    },
    {
        "name": "InShot Pro",
        "category": "Video",
        "description": "Edit video vertikal dengan transisi, efek, dan tools premium.",
        "price": "Rp18.000",
        "period": "/ bulan",
        "icon": "▶",
        "tone": "blue",
        "badge": "Mobile edit",
    },
    {
        "name": "Wink VIP",
        "category": "Foto",
        "description": "Tingkatkan foto dan video dengan fitur retouch kreatif.",
        "price": "Rp20.000",
        "period": "/ bulan",
        "icon": "✧",
        "tone": "lime",
        "badge": "Beauty edit",
    },
    {
        "name": "Filmora",
        "category": "Video",
        "description": "Rangkai video dengan efek, judul, dan tools editing.",
        "price": "Rp30.000",
        "period": "/ bulan",
        "icon": "▰",
        "tone": "purple",
        "badge": "Video creator",
    },
    {
        "name": "VSCO Membership",
        "category": "Foto",
        "description": "Eksplorasi preset dan workflow fotografi untuk gaya khasmu.",
        "price": "Rp25.000",
        "period": "/ bulan",
        "icon": "V",
        "tone": "blue",
        "badge": "Preset",
    },
    {
        "name": "Remini",
        "category": "Foto",
        "description": "Coba fitur peningkatan dan penyempurnaan foto.",
        "price": "Rp18.000",
        "period": "/ bulan",
        "icon": "R",
        "tone": "orange",
        "badge": "Photo tools",
    },
]

WA_NUMBER = "6282183317690"

with st.sidebar:
    st.markdown(
        '<div class="sidebar-brand"><span class="brand-mark">R</span>'
        '<span>ranz<span class="accent">studio</span></span></div>',
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
        '<div class="sidebar-contact-copy">Layanan kreatif · Jambi, Indonesia</div></div>',
        unsafe_allow_html=True,
    )
    st.link_button(
        "Chat WhatsApp ↗",
        "https://wa.me/6282183317690?text=Halo%20Ranz%2C%20saya%20ingin%20bertanya.",
        width="stretch",
    )

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
    :root {
        --bg: #0b0c10;
        --surface: #12141a;
        --line: #262932;
        --text: #f4f4f5;
        --muted: #9a9ca7;
        --lime: #c8f169;
    }
    .stApp {
        background:
            radial-gradient(ellipse at 86% 2%, rgba(200,241,105,.10), transparent 30%),
            radial-gradient(ellipse at 8% 40%, rgba(146,107,255,.07), transparent 28%),
            var(--bg);
        color: var(--text);
        font-family: 'DM Sans', sans-serif;
    }
    h1, h2, h3, .sidebar-brand { font-family: 'Space Grotesk', sans-serif !important; }
    .block-container { max-width: 1180px; padding-top: 2rem; padding-bottom: 4rem; }
    [data-testid="stSidebar"] { background:linear-gradient(180deg,#12141a 0%,#0e0f13 100%); border-right:1px solid var(--line); }
    [data-testid="stSidebar"] .block-container { padding:1.5rem 1rem 1.2rem; }
    [data-testid="stSidebarNav"] { display:none; }
    .sidebar-brand { display:flex; align-items:center; gap:.7rem; font-size:1.35rem; font-weight:700; letter-spacing:-.06em; margin:.2rem .25rem .25rem; }
    .brand-mark { display:grid; place-items:center; width:39px; height:39px; border:1px solid rgba(200,241,105,.38); border-radius:13px; background:linear-gradient(145deg,#e6ffab,#a7d84e); color:#111; font-size:1.1rem; box-shadow:0 6px 22px rgba(200,241,105,.14); }
    .sidebar-kicker { color:#777b86; font-size:.62rem; letter-spacing:.11em; margin:.55rem .3rem 1.7rem; }
    .sidebar-section { color:#777b86; font-size:.65rem; font-weight:700; letter-spacing:.14em; margin:0 0 .6rem .35rem; }
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] { margin:.25rem 0; }
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] a { min-height:42px; padding:.65rem .8rem; border:1px solid transparent; border-radius:11px; color:#b5b6bf; font-weight:500; transition:background .18s ease,border-color .18s ease,color .18s ease; }
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] a:hover { background:#1a1c22; border-color:#30333c; color:#f4f4f5; }
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] a[aria-current="page"] { background:rgba(200,241,105,.1); border-color:rgba(200,241,105,.22); color:var(--lime); }
    [data-testid="stSidebar"] [data-testid="stLinkButton"] a { justify-content:center; border:1px solid rgba(200,241,105,.25); border-radius:11px; background:rgba(200,241,105,.08); color:var(--lime); font-size:.85rem; }
    [data-testid="stSidebar"] [data-testid="stLinkButton"] a:hover { background:var(--lime); color:#111; }
    .accent { color:var(--lime); }
    .eyebrow { color:var(--lime); text-transform:uppercase; letter-spacing:.16em; font-size:.74rem; font-weight:700; }
    .hero-title { font-family:'Space Grotesk',sans-serif; font-size:clamp(3rem,7vw,5.7rem); font-weight:700; line-height:.98; letter-spacing:-.075em; margin:.8rem 0 1.1rem; }
    .hero-title .highlight { color:var(--lime); }
    .hero-copy { max-width:620px; color:#a8aab3; font-size:1.08rem; line-height:1.75; }
    .hero-art { height:315px; border:1px solid #34363e; border-radius:26px; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at 50% 48%,#323a2b 0,#1d211c 25%,#14151a 63%); }
    .hero-art:before,.hero-art:after { content:""; position:absolute; border:1px solid rgba(200,241,105,.2); border-radius:50%; width:250px; height:250px; }
    .hero-art:after { width:330px; height:330px; }
    .hero-orb { width:145px; height:145px; border-radius:38px; display:grid; place-items:center; color:#15170f; font-size:4.2rem; font-family:'Space Grotesk',sans-serif; font-weight:700; transform:rotate(-9deg); background:linear-gradient(145deg,#e6ffab,#a7d84e); box-shadow:0 20px 90px rgba(200,241,105,.24); z-index:1; }
    .hero-caption { position:absolute; bottom:18px; left:20px; color:#a9aca0; font-size:.78rem; letter-spacing:.08em; text-transform:uppercase; }
    .trust-row { display:flex; align-items:center; gap:.65rem; color:#a8aab3; font-size:.86rem; margin-top:1.4rem; }
    .trust-stars { color:var(--lime); letter-spacing:.08em; }
    .section-heading { margin-top:3.5rem; }
    .section-subtitle { color:var(--muted); margin-top:-.5rem; }
    .stat-card { background:var(--surface); border:1px solid var(--line); border-radius:16px; padding:1rem 1.2rem; }
    [data-testid="stMetric"] { background:var(--surface); border:1px solid var(--line); border-radius:16px; padding:1rem 1.2rem; }
    [data-testid="stMetricLabel"] { color:var(--muted); }
    [data-testid="stMetricValue"] { color:var(--text); }
    div.stLinkButton > a { border-radius:11px; border-color:#41444d; color:var(--text); font-weight:600; }
    div.stLinkButton > a:hover { border-color:var(--lime); color:var(--lime); }
    div.stButton > button { border-radius:10px; }
    [data-testid="stPageLink-NavLink"] { border:1px solid transparent; border-radius:10px; }
    [data-testid="stPageLink-NavLink"]:hover { background:#1c1e25; border-color:var(--line); }
    .sidebar-contact { padding:.9rem .8rem; margin:.2rem 0 .75rem; border:1px solid #292c34; border-radius:13px; background:linear-gradient(145deg,#171920,#121319); }
    .sidebar-contact-title { color:#e9e9eb; font-size:.82rem; font-weight:600; }
    .sidebar-contact-copy { color:var(--muted); font-size:.7rem; margin:.4rem 0 0 1rem; }
    .online-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--lime); box-shadow:0 0 12px var(--lime); margin-right:.5rem; }
    @media (max-width: 800px) { .hero-art { height:230px; margin-top:1rem; } .hero-title { font-size:3.5rem; } }
    </style>
    """,
    unsafe_allow_html=True,
)

hero_left, hero_right = st.columns([1.15, 0.85], gap="large", vertical_alignment="center")
with hero_left:
    st.markdown('<div class="eyebrow">✦  Digital goods, made simple</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="hero-title">Karya keren,<br>mulai dari <span class="highlight">sini.</span></div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p class="hero-copy">Temukan akun editing premium untuk bantu kamu '
        'berkreasi tanpa batas. Proses simpel, layanan personal, dan siap menemani '
        'setiap ide kreatifmu.</p>',
        unsafe_allow_html=True,
    )
    st.link_button("Jelajahi produk ↓", "#produk", type="primary")
    st.markdown(
        '<div class="trust-row"><span class="trust-stars">★★★★★</span>'
        '<span>Teman kreatif untuk editor Indonesia</span></div>',
        unsafe_allow_html=True,
    )
with hero_right:
    st.markdown(
        '<div class="hero-art"><div class="hero-orb">R</div>'
        '<div class="hero-caption">tools for your next big idea</div></div>',
        unsafe_allow_html=True,
    )

st.write("")
metric_cols = st.columns(3)
for col, label, value in zip(
    metric_cols,
    ["Kreator terbantu", "Produk digital", "Support"],
    ["250+", f"{len(PRODUCTS)} pilihan", "Setiap hari"],
):
    with col:
        st.metric(label, value)

st.markdown('<div id="produk"></div>', unsafe_allow_html=True)
st.markdown('<div class="section-heading eyebrow">Koleksi pilihan</div>', unsafe_allow_html=True)
st.title("Upgrade cara kamu berkarya.")
st.markdown(
    '<p class="section-subtitle">Pilih tools favoritmu. Klik pesan untuk tanya stok dan detail paket.</p>',
    unsafe_allow_html=True,
)

products_json = json.dumps(PRODUCTS, ensure_ascii=False).replace("</", "<\\/")
phone_json = json.dumps(WA_NUMBER)
shop_html = f"""
<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* {{ box-sizing:border-box; }}
body {{ margin:0; background:transparent; color:#f4f4f5; font-family:'DM Sans',Arial,sans-serif; }}
.toolbar {{ display:flex; gap:10px; margin:8px 0 20px; flex-wrap:wrap; }}
.search {{ flex:1 1 220px; min-width:200px; border:1px solid #292c35; border-radius:11px; background:#12141a; padding:12px 14px; color:#f4f4f5; font:inherit; outline:none; }}
.search:focus {{ border-color:#c8f169; }}
.filter {{ border:1px solid #292c35; border-radius:11px; background:#12141a; padding:0 13px; color:#b2b3bb; font:inherit; cursor:pointer; }}
.filter.active {{ border-color:#c8f169; color:#c8f169; background:#1a2013; }}
.grid {{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }}
.card {{ min-height:275px; position:relative; overflow:hidden; border:1px solid #282b34; border-radius:18px; padding:19px; background:linear-gradient(145deg,#171920,#111319); transition:transform .2s,border-color .2s,box-shadow .2s; }}
.card:hover {{ transform:translateY(-4px); border-color:#535a43; box-shadow:0 15px 40px rgba(0,0,0,.25); }}
.top {{ display:flex; justify-content:space-between; align-items:center; }}
.icon {{ width:48px; height:48px; display:grid; place-items:center; border-radius:15px; font-size:1.65rem; font-weight:700; }}
.lime {{ color:#d7fa8c; background:rgba(200,241,105,.12); }} .purple {{ color:#c3a7ff; background:rgba(163,125,255,.13); }} .blue {{ color:#8dbdff; background:rgba(100,155,255,.13); }} .orange {{ color:#ffbd89; background:rgba(255,158,91,.13); }}
.badge {{ border:1px solid #343740; border-radius:20px; padding:5px 9px; color:#a8aab3; font-size:.68rem; }}
.category {{ color:#a6a8b2; font-size:.72rem; text-transform:uppercase; letter-spacing:.13em; margin-top:22px; }}
h3 {{ margin:7px 0 8px; font-family:'Space Grotesk',Arial,sans-serif; font-size:1.17rem; }}
.desc {{ min-height:43px; color:#9a9ca7; font-size:.82rem; line-height:1.55; }}
.price-row {{ display:flex; align-items:baseline; gap:5px; margin:17px 0 13px; }}
.price {{ color:#c8f169; font-family:'Space Grotesk',Arial,sans-serif; font-weight:700; font-size:1.3rem; }}
.period {{ color:#898b95; font-size:.75rem; }}
.buy {{ display:block; text-decoration:none; text-align:center; padding:10px 12px; border:1px solid #41444d; border-radius:10px; color:#f4f4f5; font-weight:600; font-size:.82rem; transition:all .2s; }}
.buy:hover {{ color:#111; background:#c8f169; border-color:#c8f169; }}
.empty {{ display:none; border:1px dashed #343740; border-radius:14px; padding:28px; color:#a8aab3; text-align:center; grid-column:1/-1; }}
.disclaimer {{ color:#777a85; font-size:.75rem; margin:14px 2px 0; line-height:1.6; }}
@media(max-width:900px) {{ .grid {{ grid-template-columns:repeat(2,minmax(0,1fr)); }} }}
@media(max-width:520px) {{ .grid {{ grid-template-columns:1fr; }} .card {{ min-height:250px; }} }}
</style>
</head>
<body>
<div class="toolbar" aria-label="Filter produk">
  <input id="search" class="search" type="search" placeholder="Cari produk..." aria-label="Cari produk">
  <button class="filter active" data-category="Semua">Semua</button>
  <button class="filter" data-category="Design">Desain</button>
  <button class="filter" data-category="Video">Video</button>
  <button class="filter" data-category="Foto">Foto</button>
</div>
<div id="grid" class="grid"></div>
<p id="empty" class="empty">Produk tidak ditemukan. Coba kata kunci lain.</p>
<p class="disclaimer">Paket, masa aktif, dan ketersediaan dikonfirmasi saat pemesanan. Pastikan penggunaan akun mengikuti ketentuan resmi masing-masing layanan.</p>
<script>
const products = {products_json};
const waNumber = {phone_json};
const grid = document.getElementById('grid');
const search = document.getElementById('search');
const empty = document.getElementById('empty');
let selected = 'Semua';

function renderProducts() {{
  const query = search.value.trim().toLowerCase();
  const visible = products.filter((item) =>
    (selected === 'Semua' || item.category === selected) &&
    (item.name + ' ' + item.description + ' ' + item.category).toLowerCase().includes(query)
  );
  grid.innerHTML = visible.map((item) => {{
    const message = encodeURIComponent('Halo, saya tertarik dengan ' + item.name + '. Bisa info paket dan stoknya?');
    const target = waNumber ? 'https://wa.me/' + waNumber + '?text=' + message : 'https://wa.me/?text=' + message;
    return `<article class="card">
      <div class="top"><div class="icon ${{item.tone}}">${{item.icon}}</div><span class="badge">${{item.badge}}</span></div>
      <div class="category">${{item.category}}</div><h3>${{item.name}}</h3>
      <div class="desc">${{item.description}}</div>
      <div class="price-row"><span class="price">${{item.price}}</span><span class="period">${{item.period}}</span></div>
      <a class="buy" href="${{target}}" target="_blank" rel="noopener noreferrer">Tanya &amp; pesan ↗</a>
    </article>`;
  }}).join('');
  empty.style.display = visible.length ? 'none' : 'block';
}}

document.querySelectorAll('.filter').forEach((button) => {{
  button.addEventListener('click', () => {{
    selected = button.dataset.category;
    document.querySelectorAll('.filter').forEach((filter) => filter.classList.toggle('active', filter === button));
    renderProducts();
  }});
}});
search.addEventListener('input', renderProducts);
renderProducts();
</script>
</body>
</html>
"""

components.html(shop_html, height=570, scrolling=True)

st.write("")
contact_cols = st.columns([1.5, 1], vertical_alignment="center")
with contact_cols[0]:
    st.markdown("### Punya pertanyaan sebelum checkout?")
    st.caption("Chat dulu untuk cek ketersediaan dan rekomendasi paket yang sesuai.")
with contact_cols[1]:
    message = quote("Halo, saya ingin tanya tentang akun editing premium.")
    contact_url = (
        f"https://wa.me/{WA_NUMBER}?text={message}"
        if WA_NUMBER
        else f"https://wa.me/?text={message}"
    )
    st.link_button("Chat Ranz di WhatsApp ↗", contact_url, width="stretch")

st.divider()
st.caption("© 2026 Ranz Studio · Jambi, Indonesia")
