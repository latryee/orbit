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

    // Analyze URL
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

    // Start Download
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

                // Reset UI
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
        // Remove empty state if present
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
                    document.getElementById(`status-${taskId}`).style.color = '#ef4444'; // Red
                    document.getElementById(`status-${taskId}`).title = data.error; // Full error on hover
                    document.getElementById(`prog-${taskId}`).textContent = '!';
                    document.getElementById(`prog-${taskId}`).style.color = '#ef4444';
                    document.getElementById(`prog-${taskId}`).style.border = '2px solid #ef4444';
                    return;
                }

                const percent = Math.round(data.progress || 0);
                const statusText = data.status;

                if (statusText === 'converting') {
                    document.getElementById(`status-${taskId}`).innerHTML = '<i class="fa-solid fa-gear fa-spin"></i> Merging Video & Audio...';
                    document.getElementById(`status-${taskId}`).style.color = '#fbbf24'; // Amber/Yellow
                    document.getElementById(`prog-${taskId}`).style.border = '2px solid #fbbf24';
                    document.getElementById(`prog-${taskId}`).style.color = '#fbbf24';
                } else {
                    // Normal text for downloading/pending
                    document.getElementById(`status-${taskId}`).textContent = statusText;
                    document.getElementById(`status-${taskId}`).style.color = '#94a3b8'; // Default gray
                    document.getElementById(`prog-${taskId}`).style.border = '2px solid #334155';
                    document.getElementById(`prog-${taskId}`).style.color = '#ec4899';
                }

                // Update styling based on completion
                if (statusText === 'completed') {
                    clearInterval(interval);
                    document.getElementById(`prog-${taskId}`).textContent = '✓';
                    document.getElementById(`prog-${taskId}`).style.color = '#4ade80';
                    document.getElementById(`prog-${taskId}`).style.border = '2px solid #4ade80';
                    document.getElementById(`status-${taskId}`).textContent = 'Saving...';

                    // Trigger Native Save Dialog
                    // We need to fetch the actual filename first or pass it from status
                    // For now, let's assume the API returns the filename in status

                    if (data.progress === 100) {
                        try {
                            // Small delay to ensure file write is closed
                            setTimeout(async () => {
                                // We might need to implement a way to get the final filename from backend
                                // For now, we will try to save using the title (simplified) or trigger a generic save
                                // Ideally, the backend should return the 'filename' in the completed status.

                                // Let's just ask user where to save.
                                // Note: In a real app we would pass the filename from Python.
                                // Assuming we pass data.filename if available, looking at app.py we didn't add it yet.
                                // Let's rely on the user finding it OR add a "Show Folder" button.

                                // Actually, let's just Open the Folder automatically for now as requested by user feedback
                                // "Kaydedemedik" -> User implies manual saving or finding.

                                // Let's try to call the save_file if available
                                if (window.pywebview && window.pywebview.api) {
                                    // We need the filename. Let's make a quick fetch to get it or just open folder.
                                    // Since we don't have the definitive filename in 'status' yet, 
                                    // let's just update the UI to say "Saved to Downloads/Orbit" 
                                    // AND give a button to Open Folder.

                                    document.getElementById(`status-${taskId}`).innerHTML = `
                                        Saved in Downloads/Orbit 
                                        <button onclick="openFolder()" class="folder-btn"><i class="fa-solid fa-folder-open"></i> Open Folder</button>
                                     `;
                                } else {
                                    document.getElementById(`status-${taskId}`).textContent = 'Saved to Downloads/Orbit';
                                }
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

// Defined outside DOMContentLoaded to be accessible by inline onclick
function openFolder() {
    // We can call a backend endpoint to open the folder
    fetch('/api/open-folder').catch(console.error);
}
