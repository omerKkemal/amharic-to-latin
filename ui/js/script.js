// ui/js/script.js – Modal-based converter and project manager
// with loading animation, auto-preview after save, and merge functionality
// Added multiple export formats (DOCX, PPTX, PDF) in project editor
// Fixed: "+ Create New Project" button in Projects tab

document.addEventListener('DOMContentLoaded', () => {
    // ---------- DOM Elements ----------
    const inputText = document.getElementById('inputText');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearInputBtn');
    const exampleBtn = document.getElementById('exampleBtn');
    const charCountSpan = document.getElementById('charCount');
    const projectsListContainer = document.getElementById('projectsListContainer');

    // Modals
    const createProjectModal = document.getElementById('createProjectModal');
    const converterResultModal = document.getElementById('converterResultModal');
    const projectEditorModal = document.getElementById('projectEditorModal');
    const previewModal = document.getElementById('previewModal');

    const converterResultText = document.getElementById('converterResultText');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const closeConverterModal = document.getElementById('closeConverterModal');
    const closeConverterModalBtn = document.getElementById('closeConverterModalBtn');

    const editorProjectName = document.getElementById('editorProjectName');
    const editorConvertedText = document.getElementById('editorConvertedText');
    const editorPhotosList = document.getElementById('editorPhotosList');
    const editorPhotoInput = document.getElementById('editorPhotoInput');
    const editorSaveBtn = document.getElementById('editorSaveBtn');
    const editorExportBtn = document.getElementById('editorExportBtn');
    const editorDeleteBtn = document.getElementById('editorDeleteBtn');
    const closeEditorModal = document.getElementById('closeEditorModal');

    const previewContent = document.getElementById('previewContent');
    const closePreviewModal = document.getElementById('closePreviewModal');
    const previewCloseBtn = document.getElementById('previewCloseBtn');

    // Helper functions
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function setSaveButtonLoading(isLoading) {
        if (isLoading) {
            editorSaveBtn.disabled = true;
            editorSaveBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-dasharray="40 20" fill="none"/>
                </svg>
                <span>Saving...</span>
            `;
            if (!document.querySelector('#loading-style')) {
                const style = document.createElement('style');
                style.id = 'loading-style';
                style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }
        } else {
            editorSaveBtn.disabled = false;
            editorSaveBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 💾 Save Changes`;
        }
    }

    function setExportButtonLoading(isLoading) {
        if (isLoading) {
            editorExportBtn.disabled = true;
            editorExportBtn.innerHTML = `<span>⏳ Exporting...</span>`;
        } else {
            editorExportBtn.disabled = false;
            editorExportBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h3l3-9 3 18 3-9h3" stroke="currentColor"/></svg> 📄 Export`;
        }
    }

    // ---------- Converter ----------
    function updateCharCount() {
        charCountSpan.textContent = inputText.value.length;
    }
    inputText.addEventListener('input', updateCharCount);
    updateCharCount();

    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        updateCharCount();
        inputText.focus();
    });

    exampleBtn.addEventListener('click', () => {
        inputText.value = "ሰላም ልጅ እንዴት ነህ? ዛሬ ስራህ እንዴት ነው? አመሰግናለሁ";
        updateCharCount();
    });

    convertBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (!text) {
            showToast('Please enter some Amharic text.', 'error');
            return;
        }
        try {
            const result = await eel.amharic_to_english_sound(text)();
            converterResultText.textContent = result || '(empty result)';
            converterResultModal.style.display = 'flex';
        } catch (err) {
            console.error(err);
            showToast('Conversion failed. Check backend.', 'error');
            converterResultText.textContent = 'Error: Could not convert text.';
            converterResultModal.style.display = 'flex';
        }
    });

    copyResultBtn.addEventListener('click', async () => {
        const text = converterResultText.textContent;
        if (text && text !== '(empty result)' && !text.startsWith('Error')) {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!');
        } else {
            showToast('Nothing to copy', 'error');
        }
    });

    function closeConverterModalFunc() {
        converterResultModal.style.display = 'none';
    }
    closeConverterModal.addEventListener('click', closeConverterModalFunc);
    closeConverterModalBtn.addEventListener('click', closeConverterModalFunc);
    converterResultModal.addEventListener('click', (e) => {
        if (e.target === converterResultModal) closeConverterModalFunc();
    });

    // ---------- Project Manager ----------
    let currentEditingProject = null;

    window.showCreateProjectModal = function() {
        createProjectModal.style.display = 'flex';
        document.getElementById('projectNameInput').focus();
    };
    function hideCreateProjectModal() { createProjectModal.style.display = 'none'; }

    window.showEditorModal = function(projectName) {
        if (!projectName) {
            showToast('Invalid project name', 'error');
            return;
        }
        currentEditingProject = projectName;
        document.getElementById('projectEditorTitle').textContent = `✏️ Edit Project: ${escapeHtml(projectName)}`;
        editorProjectName.value = projectName;
        loadProjectIntoEditor(projectName);
        projectEditorModal.style.display = 'flex';
    };
    function hideEditorModal() {
        projectEditorModal.style.display = 'none';
        currentEditingProject = null;
    }

    window.showPreviewModal = function(projectName) {
        if (!projectName) {
            showToast('Invalid project name', 'error');
            return;
        }
        loadPreview(projectName);
        previewModal.style.display = 'flex';
    };
    function hidePreviewModal() { previewModal.style.display = 'none'; }

    async function loadProjectIntoEditor(projectName) {
        if (!projectName) return;
        try {
            const data = await eel.get_project_data(projectName)();
            editorConvertedText.value = data.converted_text || '';
            renderEditorPhotos(data.photos || []);
        } catch (err) {
            console.error(err);
            showToast('Error loading project data', 'error');
        }
    }

    function renderEditorPhotos(photos) {
        if (!photos || photos.length === 0) {
            editorPhotosList.innerHTML = '<div class="placeholder">📷 No photos uploaded yet. Use the button above to add images.</div>';
            return;
        }
        let html = '';
        for (let p of photos) {
            html += `
                <div class="photo-card">
                    <img src="${p.thumb || 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ctext%20x%3D%22100%22%20y%3D%22110%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394a3b8%22%3E%F0%9F%93%B7%3C%2Ftext%3E%3C%2Fsvg%3E'}" alt="${escapeHtml(p.name)}">
                    <div class="photo-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name.length > 15 ? p.name.slice(0,12)+'...' : p.name)}</div>
                </div>
            `;
        }
        editorPhotosList.innerHTML = html;
    }

    async function saveProjectChanges() {
        if (!currentEditingProject || typeof currentEditingProject !== 'string' || currentEditingProject.trim() === '') {
            showToast('No valid project selected', 'error');
            return;
        }
        setSaveButtonLoading(true);
        try {
            const rawText = editorConvertedText.value;
            let convertedText = rawText;
            if (rawText.trim()) {
                try {
                    convertedText = await eel.amharic_to_english_sound(rawText)();
                    editorConvertedText.value = convertedText;
                    showToast('Text converted to Latin Harari', 'success');
                } catch (err) {
                    console.error(err);
                    showToast('Conversion failed, saving original text', 'error');
                    convertedText = rawText;
                }
            }
            await eel.save_converted_text(currentEditingProject, convertedText)();
            const files = editorPhotoInput.files;
            if (files.length > 0) {
                const photoDataList = [];
                for (let file of files) {
                    const dataUrl = await readFileAsDataURL(file);
                    photoDataList.push({ name: file.name, data: dataUrl });
                }
                await eel.upload_photos(currentEditingProject, photoDataList)();
                showToast(`Uploaded ${photoDataList.length} photo(s)`);
                editorPhotoInput.value = '';
            }
            await loadProjectIntoEditor(currentEditingProject);
            refreshProjectsList();
            showToast('Project saved successfully!');
            hideEditorModal();
            showPreviewModal(currentEditingProject);
        } catch (err) {
            console.error(err);
            showToast('Save failed: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setSaveButtonLoading(false);
        }
    }

    async function exportProject() {
        if (!currentEditingProject) {
            showToast('No project selected', 'error');
            return;
        }
        const formatRadio = document.querySelector('input[name="editorExportFormat"]:checked');
        const format = formatRadio ? formatRadio.value : 'docx';
        
        setExportButtonLoading(true);
        try {
            let exportPath = '';
            if (format === 'docx') {
                exportPath = await eel.export_project_to_docx(currentEditingProject)();
            } else if (format === 'pptx') {
                exportPath = await eel.export_project_to_pptx(currentEditingProject)();
            } else if (format === 'pdf') {
                exportPath = await eel.export_project_to_pdf(currentEditingProject)();
            }
            if (exportPath) {
                showToast(`Exported to ${format.toUpperCase()}: ${exportPath}`, 'success');
            } else {
                showToast(`Export to ${format.toUpperCase()} failed`, 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Export failed', 'error');
        } finally {
            setExportButtonLoading(false);
        }
    }

    async function deleteCurrentProject() {
        if (!currentEditingProject) {
            showToast('No project selected', 'error');
            return;
        }
        if (confirm(`Delete project "${currentEditingProject}" permanently?`)) {
            try {
                await eel.delete_project(currentEditingProject)();
                showToast(`Deleted "${currentEditingProject}"`);
                hideEditorModal();
                refreshProjectsList();
                if (typeof refreshDashboard === 'function') refreshDashboard();
            } catch (err) {
                showToast('Delete failed', 'error');
            }
        }
    }

    async function loadPreview(projectName) {
        if (!projectName) {
            previewContent.innerHTML = '<div class="error">Invalid project name</div>';
            return;
        }
        try {
            const data = await eel.get_project_data(projectName)();
            const convertedText = data.converted_text || '(No text saved)';
            let photosHtml = '';
            if (data.photos && data.photos.length) {
                photosHtml = '<div class="preview-photos-grid">';
                for (let p of data.photos) {
                    photosHtml += `
                        <div class="preview-photo-card">
                            <img src="${p.thumb || ''}" alt="${escapeHtml(p.name)}">
                            <div class="photo-name">${escapeHtml(p.name)}</div>
                        </div>
                    `;
                }
                photosHtml += '</div>';
            } else {
                photosHtml = '<div class="placeholder">No photos</div>';
            }
            previewContent.innerHTML = `
                <div class="preview-header">
                    <h3>📄 Project: ${escapeHtml(projectName)}</h3>
                </div>
                <div class="preview-text">
                    <h4>Converted Text (Latin Harari)</h4>
                    <p>${escapeHtml(convertedText)}</p>
                </div>
                <div class="preview-photos">
                    <h4>Photos</h4>
                    ${photosHtml}
                </div>
            `;
        } catch (err) {
            previewContent.innerHTML = '<div class="error">Failed to load preview</div>';
        }
    }

    // Project list rendering
    async function refreshProjectsList() {
        try {
            const projects = await eel.list_projects()();
            renderProjectsList(projects);
        } catch (err) {
            projectsListContainer.innerHTML = '<div class="error">Failed to load projects</div>';
        }
    }

    function renderProjectsList(projects) {
        if (!projects.length) {
            projectsListContainer.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                    </svg>
                    <p>No projects yet. Click "Create New Project" to start.</p>
                </div>
            `;
            return;
        }
        let html = `<div class="projects-grid">`;
        for (let p of projects) {
            html += `
                <div class="project-card" data-project="${escapeHtml(p)}">
                    <div class="project-name">📁 ${escapeHtml(p)}</div>
                    <div class="project-actions">
                        <button class="action-btn preview-btn" data-project="${escapeHtml(p)}">👁️ Preview</button>
                        <button class="action-btn update-btn" data-project="${escapeHtml(p)}">✏️ Update</button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
        projectsListContainer.innerHTML = html;
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const project = btn.getAttribute('data-project');
                showPreviewModal(project);
            });
        });
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const project = btn.getAttribute('data-project');
                showEditorModal(project);
            });
        });
    }

    // Create project modal
    const projectNameInput = document.getElementById('projectNameInput');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalCloseBtn = document.querySelector('#createProjectModal .modal-close');

    async function createProject() {
        const name = projectNameInput.value.trim();
        if (!name) { showToast('Enter project name', 'error'); return; }
        try {
            const success = await eel.create_project(name)();
            if (success) {
                hideCreateProjectModal();
                refreshProjectsList();
                showEditorModal(name);
                if (typeof refreshDashboard === 'function') refreshDashboard();
            } else {
                showToast('Project already exists', 'error');
            }
        } catch (err) {
            showToast('Creation failed', 'error');
        }
    }

    modalConfirmBtn.addEventListener('click', createProject);
    modalCancelBtn.addEventListener('click', hideCreateProjectModal);
    modalCloseBtn.addEventListener('click', hideCreateProjectModal);
    createProjectModal.addEventListener('click', (e) => {
        if (e.target === createProjectModal) hideCreateProjectModal();
    });
    projectNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createProject();
    });

    editorSaveBtn.addEventListener('click', saveProjectChanges);
    editorExportBtn.addEventListener('click', exportProject);
    editorDeleteBtn.addEventListener('click', deleteCurrentProject);
    closeEditorModal.addEventListener('click', hideEditorModal);
    projectEditorModal.addEventListener('click', (e) => {
        if (e.target === projectEditorModal) hideEditorModal();
    });

    function closePreview() { previewModal.style.display = 'none'; }
    closePreviewModal.addEventListener('click', closePreview);
    previewCloseBtn.addEventListener('click', closePreview);
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) closePreview();
    });

    // ---------- Global Create Project Button (Projects Tab) ----------
    const globalCreateBtn = document.getElementById('globalCreateBtn');
    if (globalCreateBtn) {
        globalCreateBtn.addEventListener('click', () => {
            window.showCreateProjectModal();
        });
    }

    // ---------- Home Tab Buttons ----------
    const homeConvertBtn = document.getElementById('homeConvertBtn');
    const homeProjectsBtn = document.getElementById('homeProjectsBtn');
    if (homeConvertBtn) {
        homeConvertBtn.addEventListener('click', () => {
            document.querySelector('.nav-item[data-tab="converter-tab"]').click();
        });
    }
    if (homeProjectsBtn) {
        homeProjectsBtn.addEventListener('click', () => {
            document.querySelector('.nav-item[data-tab="projects-tab"]').click();
        });
    }

    // ---------- Dashboard ----------
    async function refreshDashboard() {
        try {
            const stats = await eel.get_dashboard_stats()();
            document.getElementById('totalProjects').textContent = stats.total_projects;
            document.getElementById('totalPhotos').textContent = stats.total_photos;
            document.getElementById('totalChars').textContent = stats.total_characters.toLocaleString();
            const recentList = document.getElementById('recentProjectsList');
            if (stats.recent_projects && stats.recent_projects.length > 0) {
                let html = '<div class="recent-grid">';
                for (let proj of stats.recent_projects) {
                    const date = new Date(proj.last_modified * 1000);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    html += `
                        <div class="recent-card" data-project="${escapeHtml(proj.name)}">
                            <div class="recent-name">📁 ${escapeHtml(proj.name)}</div>
                            <div class="recent-meta">
                                <span>🖼️ ${proj.photo_count} photos</span>
                                <span>🔤 ${proj.text_length} chars</span>
                                <span>🕒 ${formattedDate}</span>
                            </div>
                            <div class="recent-actions">
                                <button class="action-btn preview-recent" data-project="${escapeHtml(proj.name)}">Preview</button>
                                <button class="action-btn update-recent" data-project="${escapeHtml(proj.name)}">Update</button>
                            </div>
                        </div>
                    `;
                }
                html += '</div>';
                recentList.innerHTML = html;
                document.querySelectorAll('.preview-recent').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const project = btn.getAttribute('data-project');
                        showPreviewModal(project);
                    });
                });
                document.querySelectorAll('.update-recent').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const project = btn.getAttribute('data-project');
                        showEditorModal(project);
                    });
                });
            } else {
                recentList.innerHTML = '<div class="placeholder">No projects yet. Create one!</div>';
            }
        } catch (err) {
            console.error(err);
            document.getElementById('totalProjects').textContent = 'Error';
        }
    }
    window.refreshDashboard = refreshDashboard;

    // ---------- Merge Tab Functions ----------
    window.loadMergeProjects = async function() {
        try {
            const projects = await eel.get_all_projects()();
            const container = document.getElementById('mergeProjectsList');
            if (!projects.length) {
                container.innerHTML = '<div class="empty-state">No projects available to merge.</div>';
                return;
            }
            let html = '';
            for (let proj of projects) {
                html += `
                    <div class="project-checkbox-item">
                        <input type="checkbox" value="${escapeHtml(proj.name)}" id="merge_${escapeHtml(proj.name)}">
                        <label for="merge_${escapeHtml(proj.name)}">📁 ${escapeHtml(proj.name)}</label>
                        <span class="project-meta">${proj.text_length} chars, ${proj.photo_count} photos</span>
                    </div>
                `;
            }
            container.innerHTML = html;
        } catch (err) {
            console.error(err);
            document.getElementById('mergeProjectsList').innerHTML = '<div class="error">Failed to load projects</div>';
        }
    };

    const mergeBtn = document.getElementById('mergeBtn');
    if (mergeBtn) {
        mergeBtn.addEventListener('click', async () => {
            const newName = document.getElementById('mergedProjectName').value.trim();
            if (!newName) {
                showToast('Please enter a name for the merged project', 'error');
                return;
            }
            const checkboxes = document.querySelectorAll('#mergeProjectsList input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                showToast('Please select at least one project to merge', 'error');
                return;
            }
            const selectedProjects = Array.from(checkboxes).map(cb => cb.value);
            const format = document.querySelector('input[name="exportFormat"]:checked').value;
            
            mergeBtn.disabled = true;
            mergeBtn.innerHTML = '<span>⏳ Merging...</span>';
            
            try {
                const result = await eel.merge_projects(selectedProjects, newName, format)();
                if (result.success) {
                    showToast(`Merged project "${result.new_project_name}" created and exported to ${format.toUpperCase()}!`, 'success');
                    if (typeof refreshProjectsList === 'function') refreshProjectsList();
                    if (typeof refreshDashboard === 'function') refreshDashboard();
                    document.getElementById('mergedProjectName').value = '';
                    checkboxes.forEach(cb => cb.checked = false);
                    if (result.export_path) {
                        showToast(`File saved: ${result.export_path}`, 'success');
                    }
                } else {
                    showToast(`Merge failed: ${result.error}`, 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Merge failed: backend error', 'error');
            } finally {
                mergeBtn.disabled = false;
                mergeBtn.innerHTML = '🔀 Merge & Export';
            }
        });
    }

    // Initial loads
    refreshProjectsList();
});
