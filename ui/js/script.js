// web/script.js – text transliteration only, offline
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const convertBtn = document.getElementById('convertBtn');
    const outputDiv = document.getElementById('output');
    const clearBtn = document.getElementById('clearInputBtn');
    const exampleBtn = document.getElementById('exampleBtn');
    const copyBtn = document.getElementById('copyBtn');
    const charCountSpan = document.getElementById('charCount');

    function updateCharCount() {
        const len = inputText.value.length;
        charCountSpan.textContent = len;
    }

    function setOutput(text, isError = false) {
        if (isError) {
            outputDiv.innerHTML = `<div style="color:#b91c1c; display:flex; gap:0.5rem; align-items:center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${escapeHtml(text)}</span>
            </div>`;
        } else if (!text || text.trim() === '') {
            outputDiv.innerHTML = `<div class="output-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 12H4M12 4v16" stroke="currentColor"/>
                </svg>
                <span>Your English phonetic text will appear here</span>
            </div>`;
        } else {
            outputDiv.innerHTML = `<div style="white-space: pre-wrap;">${escapeHtml(text)}</div>`;
        }
        const outputText = (text && !isError && text !== 'Converting...' && text !== '') ? text : '';
        copyBtn.disabled = !outputText;
        if (outputText) {
            copyBtn.setAttribute('data-copy-text', outputText);
        } else {
            copyBtn.removeAttribute('data-copy-text');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    convertBtn.addEventListener('click', async () => {
        const text = inputText.value;
        if (!text.trim()) {
            setOutput('Please enter some Amharic text.', true);
            return;
        }
        setOutput('Converting...', false);
        try {
            const result = await eel.amharic_to_english_sound(text)();
            if (result && typeof result === 'string') {
                setOutput(result, false);
            } else {
                setOutput('Conversion returned empty result.', true);
            }
        } catch (error) {
            console.error(error);
            setOutput('Error: Could not convert text. Ensure backend is running.', true);
        }
    });

    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        updateCharCount();
        setOutput('', false);
        inputText.focus();
    });

    exampleBtn.addEventListener('click', () => {
        const example = "ሰላም ልጅ እንዴት ነህ? ዛሬ ስራህ እንዴት ነው? አመሰግናለሁ";
        inputText.value = example;
        updateCharCount();
        setOutput('', false);
    });

    copyBtn.addEventListener('click', async () => {
        const textToCopy = copyBtn.getAttribute('data-copy-text');
        if (!textToCopy) return;
        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> <span>Copied!</span>`;
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 1500);
        } catch (err) {
            console.warn('Clipboard failed', err);
            setOutput('⚠️ Could not copy automatically. Please select manually.', true);
        }
    });

    inputText.addEventListener('input', updateCharCount);
    updateCharCount();
    setOutput('', false);
});