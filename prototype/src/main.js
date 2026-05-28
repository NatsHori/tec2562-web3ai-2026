import './style.css'

const FILE_TYPES = [
  { ext: 'pdf', icon: 'https://cdn-icons-png.flaticon.com/512/3143/3143460.png', category: 'docs' },
  { ext: 'docx', icon: 'https://cdn-icons-png.flaticon.com/512/888/888883.png', category: 'docs' },
  { ext: 'xlsx', icon: 'https://cdn-icons-png.flaticon.com/512/888/888882.png', category: 'docs' },
  { ext: 'png', icon: 'https://cdn-icons-png.flaticon.com/512/3342/3342137.png', category: 'images' },
  { ext: 'jpg', icon: 'https://cdn-icons-png.flaticon.com/512/3342/3342137.png', category: 'images' },
  { ext: 'fig', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', category: 'projects' },
  { ext: 'js', icon: 'https://cdn-icons-png.flaticon.com/512/1199/1199124.png', category: 'projects' },
  { ext: 'zip', icon: 'https://cdn-icons-png.flaticon.com/512/3143/3143460.png', category: 'projects' }
];

const FILE_NAMES = [
  '企画書_最新', '見積もり_final2', '無題のドキュメント', 'スクリーンショット 2026-05', 
  'DSC00912', 'logo_v3_修正', 'index', 'app', 'backup_2025', '会議メモ', 'TODO_急ぎ', 'ダウンロード'
];

const NUM_ICONS = 45;
const container = document.getElementById('desktop-icons');
const cleanupBtn = document.getElementById('cleanup-btn');
const smartFolders = document.getElementById('smart-folders');

let isCleaned = false;

// Generate random files
const icons = [];
for (let i = 0; i < NUM_ICONS; i++) {
  const type = FILE_TYPES[Math.floor(Math.random() * FILE_TYPES.length)];
  const name = `${FILE_NAMES[Math.floor(Math.random() * FILE_NAMES.length)]}_${i}.${type.ext}`;
  
  const el = document.createElement('div');
  el.className = 'desktop-icon';
  el.innerHTML = `
    <img src="${type.icon}" draggable="false">
    <span>${name}</span>
  `;
  
  // Random position within 80% of the desktop area to avoid edges
  const left = 5 + Math.random() * 80;
  const top = 5 + Math.random() * 80;
  
  el.style.left = `${left}%`;
  el.style.top = `${top}%`;
  
  // Storing data for animation
  el.dataset.category = type.category;
  
  container.appendChild(el);
  icons.push(el);
}

// Cleanup Animation Logic
cleanupBtn.addEventListener('click', () => {
  if (isCleaned) return;
  isCleaned = true;
  
  cleanupBtn.disabled = true;
  cleanupBtn.innerHTML = '🧹 Cleaning...';
  
  smartFolders.classList.add('visible');
  
  const folderElements = {
    docs: document.getElementById('folder-docs'),
    images: document.getElementById('folder-images'),
    projects: document.getElementById('folder-projects')
  };

  const containerRect = container.getBoundingClientRect();

  // Animate icons
  icons.forEach((icon, index) => {
    setTimeout(() => {
      const category = icon.dataset.category;
      const targetFolder = folderElements[category];
      
      const iconRect = icon.getBoundingClientRect();
      const folderRect = targetFolder.getBoundingClientRect();
      
      const tx = folderRect.left - iconRect.left + (folderRect.width / 2) - (iconRect.width / 2);
      const ty = folderRect.top - iconRect.top + (folderRect.height / 2) - (iconRect.height / 2);
      
      icon.style.setProperty('--tx', `${tx}px`);
      icon.style.setProperty('--ty', `${ty}px`);
      icon.classList.add('animating');
      
      // Highlight folder
      setTimeout(() => {
        targetFolder.classList.add('highlight');
        setTimeout(() => targetFolder.classList.remove('highlight'), 200);
      }, 700);
      
    }, index * 40); // stagger effect
  });

  // Update Scores progressively
  setTimeout(updateScores, 1500);
});

function updateScores() {
  const clutterScore = document.getElementById('clutter-score');
  const loadScore = document.getElementById('load-score');
  const timeScore = document.getElementById('time-score');

  let clutter = 98;
  let load = 85;
  let time = 45;

  const interval = setInterval(() => {
    if (clutter > 5) clutter -= 3;
    if (load > 12) load -= 2;
    if (time > 2) time -= 1;

    clutterScore.innerHTML = `${Math.max(5, clutter)}<span>%</span>`;
    loadScore.innerHTML = `${Math.max(12, load)}<span>%</span>`;
    timeScore.innerHTML = `${Math.max(2, time)}<span>秒/回</span>`;

    if (clutter <= 5 && load <= 12 && time <= 2) {
      clearInterval(interval);
      clutterScore.className = 'score-value good';
      loadScore.className = 'score-value good';
      timeScore.className = 'score-value good';
      
      document.getElementById('clutter-card').classList.add('improved');
      document.getElementById('load-card').classList.add('improved');
      document.getElementById('time-card').classList.add('improved');
      
      cleanupBtn.innerHTML = '✨ Optimized!';
      cleanupBtn.style.background = 'var(--success-color)';
    }
  }, 50);
}
