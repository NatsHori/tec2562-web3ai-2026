import './style.css'

// initial state setup removed the random icons array

const MAX_ICONS = 60;
const container = document.getElementById('desktop-icons');
const cleanupBtn = document.getElementById('cleanup-btn');
const smartFolders = document.getElementById('smart-folders');
const folderInput = document.getElementById('folder-input');
const folderStatus = document.getElementById('folder-status');

const modal = document.getElementById('folder-modal');
const modalTitle = document.getElementById('modal-title');
const modalFileList = document.getElementById('modal-file-list');
const closeModalBtn = document.getElementById('close-modal');

let isCleaned = false;
let icons = [];
let folderContents = {
  docs: [],
  images: [],
  projects: [],
  others: []
};

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
  
  // Reset contents
  folderContents = { docs: [], images: [], projects: [], others: [] };
  
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
    
    // Store for modal
    folderContents[category].push({ name: file.name, icon });
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

const folderElements = {
  docs: document.getElementById('folder-docs'),
  images: document.getElementById('folder-images'),
  projects: document.getElementById('folder-projects'),
  others: document.getElementById('folder-others')
};

// Cleanup Animation Logic
cleanupBtn.addEventListener('click', () => {
  if (isCleaned) return;
  isCleaned = true;
  
  cleanupBtn.disabled = true;
  cleanupBtn.innerHTML = '🧹 Cleaning...';
  
  smartFolders.classList.add('visible');

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
      
      // Make folders interactive
      Object.values(folderElements).forEach(folder => {
        folder.style.cursor = 'pointer';
      });
    }
  }, 50);
}

// Modal Logic
function openModal(category) {
  if (!isCleaned) return; // Only open after cleanup
  
  const categoryNames = {
    docs: '📄 Documents',
    images: '🖼️ Images',
    projects: '💻 Projects',
    others: '📦 Others'
  };
  
  modalTitle.textContent = categoryNames[category];
  modalFileList.innerHTML = '';
  
  const files = folderContents[category];
  if (files.length === 0) {
    modalFileList.innerHTML = '<li>ファイルがありません</li>';
  } else {
    // Dynamic grouping logic (3 to 10 characters)
    let ungrouped = [...files];
    const finalGroups = {};

    // Check longest prefix first (10 down to 3)
    for (let len = 10; len >= 3; len--) {
      const prefixMap = {};
      
      // Build prefix map for current length
      ungrouped.forEach(file => {
        const dotIndex = file.name.lastIndexOf('.');
        const baseName = dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;
        
        if (baseName.length >= len) {
          const prefix = baseName.substring(0, len);
          if (!prefixMap[prefix]) prefixMap[prefix] = [];
          prefixMap[prefix].push(file);
        }
      });

      // Find groups with 2 or more files
      for (const [prefix, groupFiles] of Object.entries(prefixMap)) {
        if (groupFiles.length >= 2) {
          finalGroups[prefix] = groupFiles;
          // Remove grouped files from ungrouped array
          ungrouped = ungrouped.filter(f => !groupFiles.includes(f));
        }
      }
    }

    // Render grouped folders
    for (const [prefix, groupFiles] of Object.entries(finalGroups)) {
      const header = document.createElement('div');
      header.className = 'sub-folder-header';
      header.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/716/716665.png" alt="folder"> [${prefix}] 関連 (${groupFiles.length}ファイル)`;
      modalFileList.appendChild(header);

      const subList = document.createElement('ul');
      subList.className = 'sub-folder-list';
      groupFiles.forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `<img src="${file.icon}" alt="icon"> ${file.name}`;
        subList.appendChild(li);
      });
      modalFileList.appendChild(subList);
    }
    
    // Render remaining individual files
    ungrouped.forEach(file => {
      const li = document.createElement('li');
      li.innerHTML = `<img src="${file.icon}" alt="icon"> ${file.name}`;
      modalFileList.appendChild(li);
    });
  }
  
  modal.classList.add('visible');
}

document.getElementById('folder-docs').addEventListener('click', () => openModal('docs'));
document.getElementById('folder-images').addEventListener('click', () => openModal('images'));
document.getElementById('folder-projects').addEventListener('click', () => openModal('projects'));
document.getElementById('folder-others').addEventListener('click', () => openModal('others'));

closeModalBtn.addEventListener('click', () => modal.classList.remove('visible'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('visible');
});
