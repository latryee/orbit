document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const previewCard = document.getElementById('previewCard');
    const thumbnail = document.getElementById('thumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const videoMeta = document.getElementById('videoMeta');
    const downloadBtn = document.getElementById('downloadBtn');
    const formatSelect = document.getElementById('formatSelect');
    const downloadsList = document.getElementById('downloadsList');

    let currentUrl = '';

    analyzeBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) return;

        analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        analyzeBtn.disabled = true;

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await response.json();

            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                currentUrl = data.url;
                thumbnail.src = data.thumbnail;
                videoTitle.textContent = data.title;
                videoMeta.textContent = `${data.duration} • ${data.platform}`;
                previewCard.classList.remove('hidden');
            }
        } catch (e) {
            alert('Failed to analyze link');
        } finally {
            analyzeBtn.innerHTML = 'Analyze';
            analyzeBtn.disabled = false;
        }
    });

    downloadBtn.addEventListener('click', async () => {
        const selection = formatSelect.value;
        let format = 'video';
        let quality = 'best';

        if (selection.startsWith('audio')) {
            format = 'audio';
        } else {
            format = 'video';
            quality = selection.replace('video_', '');
        }

        downloadBtn.disabled = true;
        downloadBtn.innerHTML = 'Starting...';

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentUrl, format, quality })
            });
            const data = await response.json();

            if (data.task_id) {
                addDownloadItem(data.task_id, videoTitle.textContent);
                trackProgress(data.task_id);

                urlInput.value = '';
                previewCard.classList.add('hidden');
            }
        } catch (e) {
            alert('Download failed to start');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download';
        }
    });

    function addDownloadItem(taskId, title) {
        const empty = document.querySelector('.empty-state');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'download-item';
        item.id = `task-${taskId}`;
        item.innerHTML = `
            <div class="progress-circle" id="prog-${taskId}">0%</div>
            <div class="item-info">
                <div class="item-title">${title}</div>
                <div class="item-status" id="status-${taskId}">Starting...</div>
            </div>
        `;
        downloadsList.prepend(item);
    }

    function trackProgress(taskId) {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/status/${taskId}`);
                const data = await res.json();

                if (data.error) {
                    clearInterval(interval);
                    document.getElementById(`status-${taskId}`).textContent = 'Error: ' + data.error.substring(0, 30) + '...';
                    document.getElementById(`status-${taskId}`).style.color = '#ef4444';
                    document.getElementById(`status-${taskId}`).title = data.error;
                    document.getElementById(`prog-${taskId}`).textContent = '!';
                    document.getElementById(`prog-${taskId}`).style.color = '#ef4444';
                    document.getElementById(`prog-${taskId}`).style.border = '2px solid #ef4444';
                    return;
                }

                const percent = Math.round(data.progress || 0);
                const statusText = data.status;

                if (statusText === 'converting') {
                    document.getElementById(`status-${taskId}`).innerHTML = '<i class="fa-solid fa-gear fa-spin"></i> Merging Video & Audio...';
                    document.getElementById(`status-${taskId}`).style.color = '#fbbf24';
                    document.getElementById(`prog-${taskId}`).style.border = '2px solid #fbbf24';
                    document.getElementById(`prog-${taskId}`).style.color = '#fbbf24';
                } else {
                    document.getElementById(`status-${taskId}`).textContent = statusText;
                    document.getElementById(`status-${taskId}`).style.color = '#94a3b8';
                    document.getElementById(`prog-${taskId}`).style.border = '2px solid #334155';
                    document.getElementById(`prog-${taskId}`).style.color = '#ec4899';
                }

                if (statusText === 'completed') {
                    clearInterval(interval);
                    document.getElementById(`prog-${taskId}`).textContent = '✓';
                    document.getElementById(`prog-${taskId}`).style.color = '#4ade80';
                    document.getElementById(`prog-${taskId}`).style.border = '2px solid #4ade80';

                    if (data.progress === 100) {
                        try {
                            setTimeout(async () => {
                                document.getElementById(`status-${taskId}`).innerHTML = `
                                    Saved in Downloads/Orbit 
                                    <button onclick="openFolder()" class="folder-btn"><i class="fa-solid fa-folder-open"></i> Open Folder</button>
                                    `;
                            }, 500);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }

            } catch (e) {
                clearInterval(interval);
            }
        }, 1000);
    }
});

function openFolder() {
    fetch('/api/open-folder').catch(console.error);
}
