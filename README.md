# Amharic → Latin Harari Converter

A modern desktop application that transliterates Amharic (Soba Harari) script to Latin Harari phonetic text, with project management, photo uploads, and DOCX export. Built with **Eel** (Python + HTML/CSS/JS) and featuring a **modern neo‑brutalist** interface (bold borders, heavy shadows, monospace typography, 15px rounded corners).

![Screenshot placeholder](https://via.placeholder.com/800x450?text=Amharic+Converter+App)

## ✨ Features

### Converter
- 🔤 **Instant transliteration** – Amharic → Latin Harari phonetic text.
- 📋 **Copy to clipboard** – One‑click copy of the result (modal view).
- 📊 **Character counter** – Shows input length.
- 📝 **Example text** – Loads a sample Amharic phrase.
- 🧹 **Clear input** – Resets the textarea.

### Project Manager
- 📁 **Create / Edit / Delete projects** – Each project stores converted text and photos.
- 🖼️ **Multiple photo upload** – Select several images at once; order is preserved.
- 💾 **Smart save** – Converts any Amharic text to Latin Harari before saving.
- 👁️ **Live preview** – After saving, a preview modal shows exactly how the DOCX will look (text + photo grid).
- 📄 **DOCX export** – Exports the project to a Word document with a 3‑column photo grid, matching the preview.

### UI/UX
- 🎨 **Modern neo‑brutalist design** – Thick black borders, offset shadows, monospace font, and 15px border radius.
- 💬 **Toast notifications** – Non‑intrusive feedback for actions.
- ⚡ **Loading animation** – Visual feedback while saving.
- 🧩 **Fully modal‑based** – Converter results, project creation, editing, and preview all use custom modals.

## 🛠️ Tech Stack

| Component        | Technology                                         |
|------------------|----------------------------------------------------|
| Backend          | Python 3.8+                                        |
| Frontend         | HTML5, CSS3, vanilla JavaScript                    |
| Bridge           | [Eel](https://github.com/ChrisKnott/Eel)           |
| Image handling   | Pillow (PIL)                                       |
| DOCX generation  | python‑docx                                        |
| Screen detection | screeninfo                                         |
| Styling          | Neo‑brutalist CSS, inline SVGs, 15px border radius|

## 📁 Project Structure

```
amharic-latin-converter/
├── ui/                      # Frontend files
│   ├── index.html           # Main UI (tabs, modals)
│   ├── css/
│   │   └── style.css        # Modern neo‑brutalist styles
│   └── js/
│       └── script.js        # Frontend logic (Eel calls, modals)
├── main.py                  # Python backend (transliteration, project management)
├── requirements.txt         # Python dependencies
├── README.md                # This file
└── projects/                # Auto‑created; stores project data & photos
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- A modern browser (Chrome, Edge, Firefox) – Eel uses Chromium if available.

### Installation

1. **Clone or download** this repository.
2. Open a terminal in the project folder.
3. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the App

```bash
python main.py
```

The application window opens (≈90% of screen size). You can now:

- Switch between **Converter** and **Projects** tabs.
- Convert Amharic text.
- Create projects, upload photos, save (auto‑converts), and export to DOCX.

## 📖 How to Use

### Converter Tab
1. Type or paste Amharic text in the textarea.
2. Click **Convert to Latin Harari** – a modal shows the result.
3. Use **Copy** to copy the Latin text.
4. **Example** loads a sample; **Clear** empties the field.

### Projects Tab

#### Creating a Project
- Click **+ Create New Project**.
- Enter a name (letters, numbers, spaces, dots, hyphens allowed).
- The project editor opens automatically.

#### Editing a Project
- **Converted text area**: You can type Amharic or Latin. When you click **Save Changes**, any Amharic text is converted to Latin Harari automatically.
- **Photos**: Click the file input to select one or more images (order is preserved). They will be uploaded when you save.
- After saving, the editor closes and the **Preview modal** opens, showing the final text and a photo grid (identical to DOCX export).

#### Exporting to DOCX
- Inside the project editor, click **Export to DOCX**.
- The file is saved inside the project folder (e.g., `projects/MyProject/MyProject_export.docx`). The export uses a 3‑column table for photos, with filenames below each image.

#### Deleting a Project
- In the editor, click **Delete Project** and confirm.

#### Previewing Without Editing
- From the project list, click **Preview** to see the project’s text and photos in a read‑only modal.

## 🗂️ Data Storage

- All projects are stored in the `projects/` folder (created automatically on first run).
- Each project has its own subfolder containing:
  - `metadata.json` – stores the converted text and an ordered list of photo filenames.
  - Uploaded image files (original resolution preserved; thumbnails generated for the UI).
- DOCX exports are saved inside the same project folder.

## 🎨 Customization

- **Colors, borders, shadows**: Edit `ui/css/style.css` – CSS variables are at the top.
- **Border radius**: Currently `15px` for all major elements. Change the `--radius` variable.
- **Transliteration mapping**: Modify the dictionaries in `main.py` (`base_consonants`, `vowel_suffixes`, `extra_mapping`) to adjust phonetic output.
- **Photo grid columns**: In `main.py` (DOCX export) and `style.css` (preview modal), change the number `3` to your desired column count.

## ❗ Troubleshooting

- **No window appears?** Ensure Chromium/Chrome is installed. Eel uses your default Chrome installation.
- **Conversion does nothing?** Check the terminal for errors. The backend must be running.
- **Photos not showing in preview?** Verify the images are supported (JPG, PNG, GIF). Large images may take a moment to generate thumbnails.
- **DOCX export fails?** Make sure `python-docx` is installed and the project folder has write permissions.
- **"NoneType" error?** This was fixed by adding guards in JavaScript. Ensure you're using the latest `script.js`.

## 📜 License

This project is open‑source and available under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgements

- [Eel](https://github.com/ChrisKnott/Eel) – for making Python + frontend desktop apps seamless.
- [python-docx](https://python-docx.readthedocs.io/) – for DOCX generation.
- Neo‑brutalist design inspiration – bold, functional, and playful.

---

**Enjoy converting Amharic to Latin Harari with style!** ደስ ይበላችሁ።