import './style.css'

// initial state setup removed the random icons array

const MAX_ICONS = 60;
const container = document.getElementById('desktop-icons');
const cleanupBtn = document.getElementById('cleanup-btn');
const smartFolders = document.getElementById('smart-folders');
const folderInput = document.getElementById('folder-input');
const folderStatus = document.getElementById('folder-status');

let isCleaned = false;
let icons = [];

// Determine category based on extension
function getCategoryAndIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  
  const docs = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
  const images = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
  const projects = ['js', 'ts', 'html', 'css', 'json', 'md', 'fig', 'zip', 'py'];
  
  if (docs.includes(ext)) return { category: 'docs', icon: 'https://cdn-icons-png.flaticon.com/512/3767/3767084.png' };
  if (images.includes(ext)) return { category: 'images', icon: 'https://cdn-icons-png.flaticon.com/512/3342/3342137.png' };
  if (projects.includes(ext)) return { category: 'projects', icon: 'https://cdn-icons-png.flaticon.com/512/716/716665.png' };
  
  return { category: 'others', icon: 'https://cdn-icons-png.flaticon.com/512/709/709699.png' };
}

function renderIcons(files) {
  container.innerHTML = '';
  icons = [];
  
  const displayCount = Math.min(files.length, MAX_ICONS);
  
  for (let i = 0; i < displayCount; i++) {
    const file = files[i];
    const { category, icon } = getCategoryAndIcon(file.name);
    
    const el = document.createElement('div');
    el.className = 'desktop-icon';
    el.innerHTML = `
      <img src="${icon}" draggable="false">
      <span>${file.name}</span>
    `;
    
    const left = 5 + Math.random() * 80;
    const top = 5 + Math.random() * 80;
    
    el.style.left = `${left}%`;
    el.style.top = `${top}%`;
    
    el.dataset.category = category;
    
    container.appendChild(el);
    icons.push(el);
  }
}

folderInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (files.length === 0) return;
  
  folderStatus.textContent = `${files.length}個のファイルを読み込みました`;
  cleanupBtn.disabled = false;
  isCleaned = false;
  
  renderIcons(Array.from(files));
});

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
    projects: document.getElementById('folder-projects'),
    others: document.getElementById('folder-others')
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
