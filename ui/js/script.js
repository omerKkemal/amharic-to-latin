// ui/js/script.js – Modal-based converter and project manager
// with loading animation, auto-preview after save, and ordered photos

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

    // Converter modal elements
    const converterResultText = document.getElementById('converterResultText');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const closeConverterModal = document.getElementById('closeConverterModal');
    const closeConverterModalBtn = document.getElementById('closeConverterModalBtn');

    // Editor modal elements
    const editorProjectName = document.getElementById('editorProjectName');
    const editorConvertedText = document.getElementById('editorConvertedText');
    const editorPhotosList = document.getElementById('editorPhotosList');
    const editorPhotoInput = document.getElementById('editorPhotoInput');
    const editorSaveBtn = document.getElementById('editorSaveBtn');
    const editorExportBtn = document.getElementById('editorExportBtn');
    const editorDeleteBtn = document.getElementById('editorDeleteBtn');
    const closeEditorModal = document.getElementById('closeEditorModal');

    // Preview modal
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

    // Loading state management for save button
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

    // ---------- Converter (modal result) ----------
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
        }
    });

    copyResultBtn.addEventListener('click', async () => {
        const text = converterResultText.textContent;
        if (text && text !== '(empty result)') {
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

    function showCreateProjectModal() {
        createProjectModal.style.display = 'flex';
        document.getElementById('projectNameInput').focus();
    }
    function hideCreateProjectModal() { createProjectModal.style.display = 'none'; }
    
    function showEditorModal(projectName) {
        if (!projectName) {
            showToast('Invalid project name', 'error');
            return;
        }
        currentEditingProject = projectName;
        document.getElementById('projectEditorTitle').textContent = `✏️ Edit Project: ${escapeHtml(projectName)}`;
        editorProjectName.value = projectName;
        loadProjectIntoEditor(projectName);
        projectEditorModal.style.display = 'flex';
    }
    function hideEditorModal() {
        projectEditorModal.style.display = 'none';
        currentEditingProject = null;
    }
    
    function showPreviewModal(projectName) {
        if (!projectName) {
            showToast('Invalid project name', 'error');
            return;
        }
        loadPreview(projectName);
        previewModal.style.display = 'flex';
    }
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

    // ========== SAVE FUNCTION with LOADING and AUTO-PREVIEW ==========
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
            
            // Auto-open preview modal after save
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
        try {
            const path = await eel.export_project_to_docx(currentEditingProject)();
            showToast(`Exported: ${path}`);
        } catch (err) {
            showToast('Export failed', 'error');
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
                    <p>No projects yet</p>
                    <button id="emptyCreateBtn" class="btn-primary">Create New Project</button>
                </div>
            `;
            const emptyBtn = document.getElementById('emptyCreateBtn');
            if (emptyBtn) emptyBtn.addEventListener('click', showCreateProjectModal);
            return;
        }

        let html = `<div class="projects-header"><button id="topCreateBtn" class="btn-primary">+ Create New Project</button></div>`;
        html += `<div class="projects-grid">`;
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

        document.getElementById('topCreateBtn')?.addEventListener('click', showCreateProjectModal);
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

    // Create project modal logic
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

    // Editor modal buttons
    editorSaveBtn.addEventListener('click', saveProjectChanges);
    editorExportBtn.addEventListener('click', exportProject);
    editorDeleteBtn.addEventListener('click', deleteCurrentProject);
    closeEditorModal.addEventListener('click', hideEditorModal);
    projectEditorModal.addEventListener('click', (e) => {
        if (e.target === projectEditorModal) hideEditorModal();
    });

    // Preview modal close
    function closePreview() { previewModal.style.display = 'none'; }
    closePreviewModal.addEventListener('click', closePreview);
    previewCloseBtn.addEventListener('click', closePreview);
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) closePreview();
    });

    // Initial load
    refreshProjectsList();
});