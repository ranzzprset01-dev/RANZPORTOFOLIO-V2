import ctypes
import os
import platform
import shutil
import socket
import subprocess
import time
from urllib.error import URLError
from urllib.parse import quote
from urllib.request import urlopen
from pathlib import Path

import streamlit as st


st.set_page_config(page_title="WhatsApp Bot | Ranz Studio", page_icon="⌘", layout="wide")

BASE_DIR = Path(__file__).resolve().parents[1]
BOT_DIR = BASE_DIR / "BOT_WA_TERBARU"
BOT_URL = "http://127.0.0.1:3000"
MIN_FREE_MEMORY_MB = 256
WA_NUMBER = "6282183317690"


class MEMORYSTATUSEX(ctypes.Structure):
    _fields_ = [
        ("dwLength", ctypes.c_ulong),
        ("dwMemoryLoad", ctypes.c_ulong),
        ("ullTotalPhys", ctypes.c_ulonglong),
        ("ullAvailPhys", ctypes.c_ulonglong),
        ("ullTotalPageFile", ctypes.c_ulonglong),
        ("ullAvailPageFile", ctypes.c_ulonglong),
        ("ullTotalVirtual", ctypes.c_ulonglong),
        ("ullAvailVirtual", ctypes.c_ulonglong),
        ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
    ]


def available_memory_mb():
    if os.name != "nt":
        return None
    memory_status = MEMORYSTATUSEX()
    memory_status.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(memory_status)):
        return None
    return memory_status.ullAvailPhys // (1024 * 1024)


def local_network_ip():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as route_probe:
        route_probe.connect(("192.0.2.1", 80))
        return route_probe.getsockname()[0]


@st.cache_resource
def get_bot_manager():
    return {"process": None, "stderr_file": None}


def stop_local_bot(manager):
    process = manager["process"]
    if process is not None and process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=8)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
    manager["process"] = None
    stderr_file = manager["stderr_file"]
    if stderr_file is not None:
        stderr_file.close()
        manager["stderr_file"] = None


def start_local_bot(manager):
    node_path = shutil.which("node.exe")
    if not node_path:
        raise RuntimeError("Node.js tidak ditemukan di PATH Windows.")
    if not (BOT_DIR / "src" / "server.js").is_file():
        raise RuntimeError("File entrypoint bot tidak ditemukan di BOT_WA_TERBARU/src/server.js.")
    if not (BOT_DIR / "node_modules").is_dir():
        raise RuntimeError("Dependency Node.js belum ada. Jalankan npm install di folder bot.")
    if not (BOT_DIR / ".env").is_file():
        raise RuntimeError("Konfigurasi lokal BOT_WA_TERBARU/.env belum tersedia.")

    bot_host = local_network_ip()
    bot_url = f"http://{bot_host}:3000"
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as port_check:
        if port_check.connect_ex(("127.0.0.1", 3000)) == 0:
            raise RuntimeError("Port 3000 sudah digunakan. Pastikan tidak ada server lain yang berjalan.")

    log_path = BOT_DIR / "logs" / "streamlit-launch.log"
    log_path.parent.mkdir(exist_ok=True)
    stderr_file = log_path.open("a", encoding="utf-8")
    environment = os.environ.copy()
    environment.update(
        {
            "ENABLE_CLOUDFLARE_TUNNEL": "false",
            "DASHBOARD_LAN_HTTP": "true",
            "HOST": bot_host,
            "PORT": "3000",
        }
    )
    try:
        process = subprocess.Popen(
            [node_path, "src/server.js"],
            cwd=BOT_DIR,
            env=environment,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=stderr_file,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
    except OSError:
        stderr_file.close()
        raise
    manager["process"] = process
    manager["stderr_file"] = stderr_file

    for _ in range(20):
        if process.poll() is not None:
            stop_local_bot(manager)
            raise RuntimeError(
                f"Proses bot berhenti saat startup (exit code {process.returncode}). "
                f"Periksa log lokal: {log_path}"
            )
        try:
            with urlopen(f"{bot_url}/api/port", timeout=1):
                return
        except URLError:
            time.sleep(0.5)

    stop_local_bot(manager)
    raise RuntimeError(
        f"Bot belum merespons di {bot_url} setelah 10 detik. "
        f"Periksa log lokal: {log_path}"
    )


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
    [data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] a { min-height:42px; padding:.65rem .8rem; border:1px solid transparent; border-radius:11px; color:#b5b6bf !important; font-weight:500; }
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
    .feature-card { min-height:175px; padding:1.3rem; border:1px solid var(--line); border-radius:18px; background:linear-gradient(145deg,#171920,#111319); }
    .feature-icon { width:43px; height:43px; display:grid; place-items:center; border-radius:14px; background:rgba(200,241,105,.12); color:var(--lime); font-size:1.3rem; }
    .feature-title { margin:.85rem 0 .35rem; color:var(--text); font-family:'Space Grotesk',sans-serif; font-size:1rem; font-weight:600; }
    .feature-copy { color:var(--muted); font-size:.85rem; line-height:1.6; }
    .notice { padding:1rem 1.1rem; border:1px solid rgba(200,241,105,.22); border-radius:14px; background:rgba(200,241,105,.06); color:#c4c6bd; line-height:1.65; }
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
        f"https://wa.me/{WA_NUMBER}?text={quote('Halo Ranz, saya ingin bertanya tentang WhatsApp Bot.')}",
        width="stretch",
    )

st.markdown('<div class="eyebrow">RANZZXITER · WHATSAPP AI BOT</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="page-title">Command center<br><span style="color:#c8f169">di WhatsApp.</span></div>',
    unsafe_allow_html=True,
)
st.markdown(
    '<p class="page-copy">Bot WhatsApp dengan menu interaktif, fitur AI, permainan grup, '
    'dan tools praktis. Kontrol di bawah dapat menjalankan bot saat Streamlit dibuka langsung '
    'di laptop Windows.</p>',
    unsafe_allow_html=True,
)

st.markdown('<div class="eyebrow">Kontrol BOT</div>', unsafe_allow_html=True)
st.subheader("Status dan kontrol WhatsApp bot")

if platform.system() != "Windows":
    control_col, status_col = st.columns([1, 1], gap="medium")
    with control_col:
        st.button("▶  Jalankan bot", disabled=True, width="stretch")
        st.button("■  Hentikan bot", disabled=True, width="stretch")
    with status_col:
        st.metric("Status", "Kontrol lokal saja")
        st.caption(
            "Aplikasi ini berjalan di Streamlit Cloud dan tidak dapat membuka port "
            "laptop Anda. Untuk akses ponsel, buka alamat IP laptop pada port 3000 "
            "saat laptop dan ponsel tersambung ke hotspot yang sama."
        )
else:
    manager = get_bot_manager()
    st.session_state.setdefault("bot_autostart_paused", False)
    process = manager["process"]

    if process is not None and process.poll() is not None:
        exit_code = process.returncode
        stop_local_bot(manager)
        st.session_state["bot_last_exit_code"] = exit_code
        st.session_state["bot_autostart_paused"] = True

    if manager["process"] is None and not st.session_state["bot_autostart_paused"]:
        free_memory_mb = available_memory_mb()
        if free_memory_mb is None:
            st.warning("Status RAM tidak dapat dibaca; auto-start bot ditahan.")
        elif free_memory_mb < MIN_FREE_MEMORY_MB:
            st.warning(
                f"Bot belum dinyalakan untuk menjaga laptop tetap responsif. "
                f"RAM tersedia {free_memory_mb} MB; minimal {MIN_FREE_MEMORY_MB} MB. "
                "Tutup aplikasi lain, lalu muat ulang halaman ini."
            )
        else:
            try:
                with st.spinner("Menyalakan bot lokal..."):
                    start_local_bot(manager)
                st.session_state.pop("bot_last_exit_code", None)
            except (OSError, RuntimeError) as error:
                st.error(f"Bot gagal dijalankan: {error}")

    process = manager["process"]
    running = process is not None and process.poll() is None
    control_col, status_col = st.columns([1, 1], gap="medium")
    with control_col:
        start_col, stop_col = st.columns(2, gap="small")
        with start_col:
            if st.button("▶  Jalankan bot", disabled=running, width="stretch"):
                free_memory_mb = available_memory_mb()
                if free_memory_mb is None or free_memory_mb < MIN_FREE_MEMORY_MB:
                    st.error(
                        f"RAM tersedia harus minimal {MIN_FREE_MEMORY_MB} MB untuk memulai bot."
                    )
                else:
                    try:
                        with st.spinner("Menyalakan bot lokal..."):
                            start_local_bot(manager)
                        st.session_state["bot_autostart_paused"] = False
                        st.session_state.pop("bot_last_exit_code", None)
                        st.rerun()
                    except (OSError, RuntimeError) as error:
                        st.error(f"Bot gagal dijalankan: {error}")
        with stop_col:
            if st.button("■  Hentikan bot", disabled=not running, width="stretch"):
                stop_local_bot(manager)
                st.session_state["bot_autostart_paused"] = True
                st.rerun()
    with status_col:
        st.metric("Status bot", "Berjalan" if running else "Berhenti")
        try:
            lan_bot_url = f"http://{local_network_ip()}:3000"
            st.link_button("Buka dashboard bot dari ponsel ↗", lan_bot_url, width="stretch")
        except OSError as error:
            st.error(f"Alamat jaringan lokal tidak dapat dibaca: {error}")
        if not running:
            st.caption("Bot berjalan di laptop ini; pastikan ponsel menggunakan hotspot yang sama.")

if "bot_last_exit_code" in st.session_state:
    st.error(
        f"Bot berhenti dengan exit code {st.session_state['bot_last_exit_code']}. "
        f"Periksa log lokal: {BOT_DIR / 'logs' / 'streamlit-launch.log'}"
    )

st.link_button(
    "Tanya tentang bot ↗",
    f"https://wa.me/{WA_NUMBER}?text={quote('Halo Ranz, saya ingin tahu lebih lanjut tentang WhatsApp Bot RANZZXITER.')}",
    type="primary",
)

st.write("")
st.markdown('<div class="eyebrow">Fitur utama</div>', unsafe_allow_html=True)
st.subheader("Satu bot, banyak aktivitas.")

features = [
    ("✦", "Menu interaktif", "Jelajahi perintah dan kategori fitur langsung dari chat WhatsApp."),
    ("◎", "Tools AI & media", "Fitur AI dan utilitas media untuk membantu kebutuhan sehari-hari."),
    ("♟", "Game grup", "Game tebak-tebakan dan permainan sosial yang bisa dimainkan bersama."),
    ("◈", "Koin & progres", "Sistem koin, aktivitas harian, dan progres untuk pengalaman yang lebih seru."),
    ("▣", "Command center", "Dashboard lokal untuk melihat dan mengelola aktivitas bot."),
    ("⌁", "Akses terkontrol", "Fitur administrasi dibatasi untuk pemilik dan pengguna yang diizinkan."),
]

for start in (0, 3):
    columns = st.columns(3, gap="medium")
    for column, (icon, title, description) in zip(columns, features[start : start + 3]):
        with column:
            st.markdown(
                f'<div class="feature-card"><div class="feature-icon">{icon}</div>'
                f'<div class="feature-title">{title}</div>'
                f'<div class="feature-copy">{description}</div></div>',
                unsafe_allow_html=True,
            )
    st.write("")
    st.markdown(
    '<div class="notice">Bot berjalan langsung di Windows, bukan di Streamlit Cloud. '
    'Cloudflare Tunnel dipaksa nonaktif saat Streamlit menyalakan bot; dashboard dapat dibuka '
    'melalui IP laptop pada jaringan lokal yang sama. Berkas `.env`, sesi WhatsApp, database, dan log tidak '
    'boleh diunggah ke GitHub.</div>',
    unsafe_allow_html=True,
)
