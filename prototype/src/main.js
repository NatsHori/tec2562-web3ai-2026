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

async function analyzeFilesWithAI(filesList, apiKey) {
  const filenames = filesList.map(f => f.name);
  const prompt = `You are a smart desktop assistant. I have these files:
${JSON.stringify(filenames)}

Categorize each file into one of these categories: 'docs', 'images', 'projects', or 'others'.
Also, group semantically related files by giving them the exact same 'subfolder' name in Japanese (e.g., "沖縄旅行", "確定申告", "UIデザイン"). If a file doesn't relate to any others, leave 'subfolder' as an empty string "".

Respond ONLY with a JSON array of objects in this exact format, with no markdown code blocks:
[
  {"filename": "...", "category": "...", "subfolder": "..."}
]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || 'API Request failed';
    throw new Error(errMsg);
  }
  
  const data = await response.json();
  let text = data.candidates[0].content.parts[0].text;
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

// Cleanup Animation Logic
cleanupBtn.addEventListener('click', async () => {
  if (isCleaned) return;
  
  const apiKey = document.getElementById('api-key-input').value.trim();
  if (!apiKey) {
    alert('Gemini API Key を入力してください。');
    return;
  }
  
  isCleaned = true;
  cleanupBtn.disabled = true;
  cleanupBtn.innerHTML = '🤖 Analyzing...';
  
  const aiLoading = document.getElementById('ai-loading');
  aiLoading.classList.add('visible');

  try {
    const rawFiles = icons.map(iconEl => ({ name: iconEl.querySelector('span').textContent, el: iconEl }));
    const aiResults = await analyzeFilesWithAI(rawFiles, apiKey);
    
    // Update categories and folderContents based on AI result
    folderContents = { docs: [], images: [], projects: [], others: [] };
    
    aiResults.forEach(result => {
      const iconElObj = rawFiles.find(f => f.name === result.filename);
      if (iconElObj) {
        const el = iconElObj.el;
        const category = ['docs', 'images', 'projects'].includes(result.category) ? result.category : 'others';
        el.dataset.category = category; // Update dataset for animation
        
        folderContents[category].push({
          name: result.filename,
          icon: el.querySelector('img').src,
          subfolder: result.subfolder || ''
        });
      }
    });

    aiLoading.classList.remove('visible');
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

  } catch (err) {
    console.error(err);
    aiLoading.classList.remove('visible');
    alert('AIの分析に失敗しました: ' + err.message);
    isCleaned = false;
    cleanupBtn.disabled = false;
    cleanupBtn.innerHTML = '✨ Auto Clean Up';
  }
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
    // Dynamic grouping logic based on AI subfolder judgment
    const finalGroups = {};
    let ungrouped = [];

    files.forEach(file => {
      if (file.subfolder) {
        if (!finalGroups[file.subfolder]) finalGroups[file.subfolder] = [];
        finalGroups[file.subfolder].push(file);
      } else {
        ungrouped.push(file);
      }
    });

    // Render grouped folders (AI generated subfolders)
    for (const [subfolderName, groupFiles] of Object.entries(finalGroups)) {
      const header = document.createElement('div');
      header.className = 'sub-folder-header';
      header.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/716/716665.png" alt="folder"> ${subfolderName} (${groupFiles.length}ファイル)`;
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
