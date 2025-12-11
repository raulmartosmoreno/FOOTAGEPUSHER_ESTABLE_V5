import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { 
  FiHeart, FiMessageCircle, FiShare2, FiEye, FiVolume2, FiVolumeX, 
  FiPlus, FiRefreshCw, FiLogIn, FiX, FiCopy, FiMail, FiUser 
} from 'react-icons/fi';
import { FaHeart, FaInstagram, FaWhatsapp, FaGoogle } from 'react-icons/fa';

import { 
  signInWithPopup, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { 
  getOrInitVideoStats, incrementView, addLike, removeLike, addComment, subscribeToComments, subscribeToVideoStats 
} from "./services";

const CLOUD_NAME = "dieeqmbjb";
const VIDEO_TAG = "feed";
const PROFILE_PIC_URL = "https://res.cloudinary.com/dieeqmbjb/image/upload/v1765156173/logo_CUADRADO_grande_funclb.jpg";
const INSTAGRAM_URL = "https://www.instagram.com/footagepusher/";
const DESCRIPCION_GENERICA = "This collection of hyperrealistic video sequences, generated entirely by the AI model Sora 2, serves as a critical art project designed to challenge the public's perception of synthetic reality and the ethical obligations of its creators. The content, which is one hundred percent fictitious and depicts graphic themes including distress, violence, and the loss of dignity—applied exclusively to non-existent, AI-invented human beings—is intentionally crafted to push against the boundaries of social media content policy. Philosophically, the work forces a confrontation with the new reality of AI: demanding that spectators and creators alike grapple with the moral implications of generating simulated suffering, questioning the concept of authorship in the age of algorithmic creation, and highlighting the inherent risks of sophisticated deepfakes and mass misinformation. [ATTENTION: This work contains highly realistic, graphic, and potentially disturbing imagery. All subjects and events depicted are synthetic and fictional. Viewer discretion is strongly advised.]";

const DESCRIPCIONES_VIDEOS = {
  "s_6925fb1800808191aea4040a20adb578_-_copia_wduwsk": "pee leak",
  "s_6921f74f1d24819192c1a1317e4173ad_-_copia_glzyxl": "surgery issue",
  "s_6921f30096b08191981f0045b44f3d85_-_copia_ipwusy": "dynamic classes",
  "129_-_copia_q5joey": "parkour",
  "72_b7pa1a": "about consent",
  "91ee6ad2fd6575dde7119647ef64c60f_-_copia_y4ahou": "interactive classes",
  "89_qxf7ea": "loosing faith"
};

function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }
const formatK = (num) => (!num ? "0" : num > 999 ? (num/1000).toFixed(1) + 'K' : num);

const getGeneratedName = (user) => {
  if (!user) return "user.unknown";
  const suffix = user.uid.substring(0, 5).toUpperCase();
  if (user.isAnonymous) return `user.anonymous.${suffix}`;
  const providerId = user.providerData?.[0]?.providerId;
  if (providerId === 'google.com') return `user.google.${suffix}`;
  if (providerId === 'password') return `user.email.${suffix}`;
  return `user.guest.${suffix}`;
};

// === COMPONENTES ===

function LoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (promise) => {
    try { await promise; onLoginSuccess(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="overlay-popup">
      <div className="popup-box login-box" style={{position:'relative'}}>
        <button className="close-popup-btn" style={{position:'absolute', top:'10px', right:'10px', background:'none', border:'none', color:'#888', fontSize:'20px'}} onClick={onClose}><FiX /></button>
        <h2>{isRegistering ? "REGISTER" : "LOGIN"}</h2>
        <button className="auth-btn google-btn" style={{width:'100%', padding:'10px', marginBottom:'10px', background:'white', color:'black', border:'none', borderRadius:'5px', cursor:'pointer', display:'flex', justifyContent:'center', gap:'10px'}} onClick={() => handleAuth(signInWithPopup(auth, googleProvider))}><FaGoogle /> Continue with Google</button>
        <div style={{margin:'15px 0', color:'#555'}}>OR</div>
        <form onSubmit={(e) => { e.preventDefault(); handleAuth(isRegistering ? createUserWithEmailAndPassword(auth, email, password) : signInWithEmailAndPassword(auth, email, password)); }}>
          <input type="email" placeholder="Email" style={{width:'100%', padding:'10px', marginBottom:'10px', boxSizing:'border-box', background:'#222', border:'none', color:'white'}} value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" style={{width:'100%', padding:'10px', marginBottom:'10px', boxSizing:'border-box', background:'#222', border:'none', color:'white'}} value={password} onChange={e=>setPassword(e.target.value)} required />
          <button type="submit" style={{width:'100%', padding:'10px', background:'var(--primary-color)', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>{isRegistering ? "Sign Up" : "Log In"}</button>
        </form>
        <p style={{fontSize:'12px', color:'#888', cursor:'pointer', textDecoration:'underline', marginTop:'10px'}} onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? "Log In" : "Sign Up"}</p>
        <div style={{margin:'15px 0', color:'#555'}}>OR</div>
        <button style={{width:'100%', padding:'10px', background:'#333', color:'#ccc', border:'none', borderRadius:'5px', cursor:'pointer'}} onClick={() => handleAuth(signInAnonymously(auth))}>Continue as Guest</button>
        {error && <p style={{color:'red', fontSize:'12px', marginTop:'10px'}}>{error}</p>}
      </div>
    </div>
  );
}

function ShareModal({ onClose, videoUrl }) {
  const copy = () => { navigator.clipboard.writeText(videoUrl); alert("Link copied!"); onClose(); };
  return (
    <div className="overlay-popup" onClick={onClose}>
      <div className="popup-box" onClick={e => e.stopPropagation()}>
        <h3>Share Experience</h3>
        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <button className="popup-btn btn-cancel" onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(videoUrl)}`)}><FaWhatsapp/> WhatsApp</button>
          <button className="popup-btn btn-cancel" onClick={()=>window.open(`mailto:?body=${encodeURIComponent(videoUrl)}`)}><FiMail/> Email</button>
          <button className="popup-btn btn-confirm" onClick={copy}><FiCopy/> Copy Link</button>
        </div>
        <button style={{marginTop:'15px', background:'none', border:'none', color:'#888', cursor:'pointer'}} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function CommentsSheet({ videoId, isOpen, onClose, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (isOpen && videoId) {
      setComments([]);
      const unsubscribe = subscribeToComments(videoId, (data) => setComments(data));
      return () => unsubscribe();
    }
  }, [videoId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment(videoId, user, newComment, getGeneratedName(user));
    setNewComment("");
  };

  return (
    <>
      {isOpen && <div className="sheet-backdrop" onClick={onClose}></div>}
      <div className={`comments-sheet-container ${isOpen ? 'open' : ''}`}>
        <div className="sheet-handle" onClick={onClose}></div>
        <div className="comments-header">Comments <span>{formatK(comments.length)}</span></div>
        <div className="comments-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar"><FiUser/></div>
              <div className="comment-content">
                <div className="comment-user-id">{c.username}</div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <form className="comment-input-area" onSubmit={handleSubmit}>
          <input type="text" placeholder={user ? "Add a comment..." : "Log in first"} value={newComment} onChange={e => setNewComment(e.target.value)} disabled={!user} />
          <button type="submit" disabled={!newComment.trim() || !user}>Send</button>
        </form>
      </div>
    </>
  );
}

function EndScreen({ onRestart, onOpenLogin }) {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };
  return (
    <div className="end-screen-card">
      <div className="end-screen-content">
        <div className="end-message">This is all for now.</div>
        <div className="sicko-text">Still want more? U sicko...</div>
        <button className="end-btn btn-void" onClick={onOpenLogin}><FiLogIn /> BE AN ACCOMPLICE</button>
        <button className="end-btn btn-share" onClick={handleShare}><FiShare2 /> SHARE EXPERIENCE</button>
        <button className="end-btn btn-restart" onClick={onRestart}><FiRefreshCw style={{marginRight:'5px'}}/> Back to start</button>
      </div>
    </div>
  );
}

function VideoCard({ video, isActive, user, onShare, onOpenComments }) {
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [isMuted, setIsMuted] = useState(false);
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const [muteIcon, setMuteIcon] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showInstaPopup, setShowInstaPopup] = useState(false);
  const [stats, setStats] = useState({ likes: 0, views: 0, commentsCount: 0 });
  const [hasLikedLocal, setHasLikedLocal] = useState(false);

  // GESTOS: Tap, Double Tap y Hold
  const gestureRef = useRef({ 
    lastTap: 0, 
    holdTimer: null, 
    tapTimer: null, 
    isHolding: false 
  });

  useEffect(() => {
    if (!video.cloudinaryId) return;
    getOrInitVideoStats(video.cloudinaryId);
    const unsubscribe = subscribeToVideoStats(video.cloudinaryId, (data) => { if(data) setStats(data); });
    return () => unsubscribe();
  }, [video.cloudinaryId]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    let animationFrameId;
    const updateLoop = () => {
      if (videoEl && !isDraggingRef.current && !videoEl.paused) {
        const p = (videoEl.currentTime / videoEl.duration) * 100;
        if (!isNaN(p)) setProgress(p);
      }
      animationFrameId = requestAnimationFrame(updateLoop);
    };
    if (isActive) {
      setIsDescExpanded(false);
      videoEl.muted = isMuted;
      videoEl.currentTime = 0;
      const playPromise = videoEl.play();
      if (playPromise) playPromise.catch(() => { videoEl.muted = true; setIsMuted(true); videoEl.play(); });
      incrementView(video.cloudinaryId);
      animationFrameId = requestAnimationFrame(updateLoop);
    } else {
      videoEl.pause();
      setShowMuteIcon(false);
      cancelAnimationFrame(animationFrameId);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive]);

  const performToggleMute = () => {
    const newMute = !isMuted; setIsMuted(newMute); videoRef.current.muted = newMute;
    setMuteIcon(newMute ? <FiVolumeX className="mute-icon-svg"/> : <FiVolume2 className="mute-icon-svg"/>);
    setShowMuteIcon(true); setTimeout(() => setShowMuteIcon(false), 1000);
  };

  const performDoubleTapLike = () => {
    if (!isLiked) {
      setMuteIcon(<FaHeart className="mute-icon-svg" style={{color: '#fe2c55'}} />);
      setShowMuteIcon(true); setTimeout(() => setShowMuteIcon(false), 1000);
      addLike(video.cloudinaryId); setIsLiked(true); setHasLikedLocal(true);
    } else {
      // Si ya tiene like, solo animación
      setMuteIcon(<FaHeart className="mute-icon-svg" style={{color: '#fe2c55'}} />);
      setShowMuteIcon(true); setTimeout(() => setShowMuteIcon(false), 1000);
    }
  };

  const toggleLikeSidebar = (e) => {
    e.stopPropagation();
    if (isLiked) { removeLike(video.cloudinaryId); setIsLiked(false); }
    else { addLike(video.cloudinaryId); setIsLiked(true); setMuteIcon(<FaHeart className="mute-icon-svg" style={{color: '#fe2c55'}} />); setShowMuteIcon(true); setTimeout(() => setShowMuteIcon(false), 1000); }
  };

  // --- LOGICA GESTOS (TAP, HOLD, DOUBLE TAP) ---
  const handleInteractionStart = (e) => {
    // Si tocan un botón, ignoramos
    if (e.target.closest('button, .sidebar-item, .progress-container, .description-container, .toggle-more-btn, .comments-sheet-container, .expanded-backdrop')) return;

    gestureRef.current.isHolding = false;
    gestureRef.current.holdTimer = setTimeout(() => {
      videoRef.current.pause();
      gestureRef.current.isHolding = true;
    }, 250);
  };

  const handleInteractionEnd = (e) => {
    if (e.target.closest('button, .sidebar-item, .progress-container, .description-container, .toggle-more-btn, .comments-sheet-container, .expanded-backdrop')) return;
    
    clearTimeout(gestureRef.current.holdTimer);

    // Si estaba pausado por HOLD, reanudar
    if (gestureRef.current.isHolding) {
      videoRef.current.play();
      gestureRef.current.isHolding = false;
      return;
    }

    const now = Date.now();
    const timeDiff = now - gestureRef.current.lastTap;

    // Lógica de Doble Tap vs Single Tap
    if (timeDiff < 300 && timeDiff > 0) {
      clearTimeout(gestureRef.current.tapTimer);
      performDoubleTapLike();
      gestureRef.current.lastTap = 0;
    } else {
      gestureRef.current.lastTap = now;
      gestureRef.current.tapTimer = setTimeout(() => {
        performToggleMute();
        gestureRef.current.lastTap = 0;
      }, 300);
    }
  };
  
  const handleBackdropClick = (e) => { e.stopPropagation(); setIsDescExpanded(false); };
  const confirmInstaRedirect = () => { window.open(INSTAGRAM_URL, '_blank'); setShowInstaPopup(false); };

  const calculateProgress = (clientX) => { const progressBar = progressBarRef.current; if (!progressBar) return 0; const rect = progressBar.getBoundingClientRect(); const x = clientX - rect.left; return Math.max(0, Math.min(1, x / rect.width)); };
  const handleScrubStart = (e) => { e.stopPropagation(); isDraggingRef.current = true; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const ratio = calculateProgress(clientX); setProgress(ratio * 100); if (videoRef.current) videoRef.current.currentTime = ratio * videoRef.current.duration; if (e.type === 'mousedown') { window.addEventListener('mousemove', handleScrubMove); window.addEventListener('mouseup', handleScrubEnd); } };
  const handleScrubMove = (e) => { if (!isDraggingRef.current) return; const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX; const ratio = calculateProgress(clientX); setProgress(ratio * 100); if (videoRef.current) videoRef.current.currentTime = ratio * videoRef.current.duration; };
  const handleScrubEnd = () => { if (!isDraggingRef.current) return; isDraggingRef.current = false; window.removeEventListener('mousemove', handleScrubMove); window.removeEventListener('mouseup', handleScrubEnd); };

  // Helper para blindar botones
  const stopProp = (e) => { e.stopPropagation(); };

  return (
    <div className="video-card" 
      onMouseDown={handleInteractionStart} onMouseUp={handleInteractionEnd}
      onTouchStart={handleInteractionStart} onTouchEnd={handleInteractionEnd}
    >
      <video ref={videoRef} className="video-player" src={video.url} loop playsInline webkit-playsinline="true" preload="metadata" />
      {showInstaPopup && <div className="overlay-popup"><div className="popup-box"><div style={{marginBottom:'20px', display:'flex', flexDirection:'column', alignItems:'center'}}><FaInstagram size={40}/><p>Go to official Instagram?</p></div><div className="popup-actions"><button className="popup-btn btn-cancel" onClick={()=>setShowInstaPopup(false)}>Cancel</button><button className="popup-btn btn-confirm" onClick={confirmInstaRedirect}>Go</button></div></div></div>}
      
      {isDescExpanded && <div className="expanded-backdrop" onClick={handleBackdropClick} onTouchStart={stopProp} onMouseDown={stopProp}></div>}
      
      <div className={`mute-overlay ${showMuteIcon ? 'show' : ''}`}>{muteIcon}</div>
      <div className="top-bar">
        <div className="app-title">FootagePusher</div>
        <div className="view-count-badge"><FiEye style={{marginRight:'5px'}}/> {formatK(stats.views)}</div>
      </div>
      <div className="right-sidebar">
        <div className="profile-pic-container"><img src={PROFILE_PIC_URL} alt="Profile" className="profile-img" /></div>
        <div className="sidebar-item">
          <button className="sidebar-btn" onClick={toggleLikeSidebar} onMouseDown={stopProp} onTouchStart={stopProp}>
            {isLiked ? <FaHeart style={{color:'#fe2c55'}}/> : <FiHeart/>}
          </button>
          <span className="sidebar-label">{formatK(stats.likes)}</span>
        </div>
        <div className="sidebar-item"><button className="sidebar-btn" onClick={(e)=>{e.stopPropagation(); onOpenComments(video.cloudinaryId)}} onMouseDown={stopProp} onTouchStart={stopProp}><FiMessageCircle/></button><span className="sidebar-label">{formatK(stats.commentsCount)}</span></div>
        <div className="sidebar-item"><button className="sidebar-btn" onClick={(e)=>{e.stopPropagation(); onShare(video.url)}} onMouseDown={stopProp} onTouchStart={stopProp}><FiShare2/></button><span className="sidebar-label">Share</span></div>
        <div className="sidebar-item"><button className="sidebar-btn" onClick={(e)=>{e.stopPropagation(); setShowInstaPopup(true)}} onMouseDown={stopProp} onTouchStart={stopProp}><FiPlus/></button></div>
      </div>
      <div className="bottom-info">
        <div className="username-row"><span className="username">@footagepusher</span></div>
        <div className="description-container">
          <div className={`description-text ${isDescExpanded?'expanded':''}`}>{video.description}</div>
          <button className="toggle-more-btn" onClick={(e)=>{e.stopPropagation();setIsDescExpanded(!isDescExpanded)}} onMouseDown={stopProp} onTouchStart={stopProp}>{isDescExpanded?"Ocultar":"Ver más"}</button>
        </div>
      </div>
      <div className="progress-container" ref={progressBarRef} onMouseDown={handleScrubStart} onTouchStart={handleScrubStart} onTouchMove={handleScrubMove} onTouchEnd={handleScrubEnd} onClick={stopProp}><div className="progress-bar" style={{width:`${progress}%`}}></div></div>
    </div>
  );
}

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentShareUrl, setCurrentShareUrl] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [currentVideoIdForComments, setCurrentVideoIdForComments] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => { onAuthStateChanged(auth, (u) => setUser(u)); }, []);
  const handleEnterVoid = () => { if (user) setHasEntered(true); else setShowLoginModal(true); };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/video/list/${VIDEO_TAG}.json`);
        const data = await response.json();
        const formatted = data.resources.map((res, i) => {
          const titulo = DESCRIPCIONES_VIDEOS[res.public_id];
          const desc = titulo ? `${titulo}\n\n${DESCRIPCION_GENERICA}` : DESCRIPCION_GENERICA;
          return { id: i, cloudinaryId: res.public_id, url: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${res.public_id}.${res.format}`, description: desc };
        });
        const shuffled = shuffleArray(formatted);
        shuffled.push({ isEndCard: true, id: 'final' });
        setVideos(shuffled); setLoading(false);
      } catch (e) { setLoading(false); }
    };
    fetchVideos();
  }, []);

  const handleScroll = (e) => { const h = e.target.clientHeight; const i = Math.round(e.target.scrollTop / h); if (i !== currentVideoIndex) setCurrentVideoIndex(i); };
  const openShare = (url) => { setCurrentShareUrl(url); setShowShareModal(true); };
  const openComments = (vidId) => { setCurrentVideoIdForComments(vidId); setIsCommentsOpen(true); };

  if (!hasEntered) {
    return (
      <div className="app-container">
        <div className="start-screen-overlay">
          <div className="big-profile-container"><img src={PROFILE_PIC_URL} alt="Profile" className="profile-img" /></div>
          <div className="start-title">@footagepusher</div>
          <button className="enter-system-btn" onClick={handleEnterVoid}>{loading ? "LOADING..." : "ENTER THE VOID"}</button>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLoginSuccess={() => { setShowLoginModal(false); setHasEntered(true); }} />}
      </div>
    );
  }

  return (
    <div className={`app-container ${isCommentsOpen ? 'comments-open' : ''}`}>
      <div className="video-scroll-container" onScroll={handleScroll} ref={scrollContainerRef}>
        {videos.map((item, index) => {
          if (item.isEndCard) return <EndScreen key={item.id} onRestart={() => scrollContainerRef.current.scrollTo({top:0,behavior:'smooth'})} onOpenLogin={() => setShowLoginModal(true)} />;
          return <VideoCard key={item.id} video={item} isActive={index === currentVideoIndex} user={user} onShare={openShare} onOpenComments={openComments} />;
        })}
      </div>
      <CommentsSheet isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} videoId={currentVideoIdForComments} user={user} />
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} videoUrl={currentShareUrl} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLoginSuccess={() => setShowLoginModal(false)} />}
    </div>
  );
}