# Amharic → Latin Harari Converter

A modern desktop application that transliterates Amharic (Soba Harari) script to Latin Harari phonetic text. It includes project management, photo uploads, multiple export formats (DOCX, PPTX, PDF), project merging, and a beautiful neo‑brutalist interface with 15px rounded corners.

![Screenshot placeholder](https://via.placeholder.com/800x450?text=Amharic+Converter+App)

## Features

### Converter
- **Instant transliteration** – Amharic → Latin Harari phonetic text (modal result).
- **Copy to clipboard** – One‑click copy of the result.
- **Character counter** – Shows input length.
- **Example text** – Loads a sample Amharic phrase.
- **Clear input** – Resets the textarea.

### Project Manager
- **Create / Edit / Delete projects** – Each project stores converted text and photos.
- **Multiple photo upload** – Select several images at once; order is preserved.
- **Smart save** – Converts any Amharic text to Latin Harari before saving.
- **Live preview** – After saving, a preview modal shows exactly how the DOCX will look (text + photo grid).
- **Multi‑format export** – Export a single project as **DOCX**, **PPTX**, or **PDF** (select format in editor modal).

### Merge Projects
- **Combine projects** – Select multiple existing projects, provide a new name, and choose an export format.
- **Ordered merging** – Converted text from each project is appended with separators, and all photos are copied (renamed to avoid collisions).
- **Automatic export** – The merged project is saved and immediately exported to the chosen format (DOCX, PPTX, or PDF).

### Dashboard
- **Statistics** – Total projects, total photos, total characters across all projects.
- **Recent projects** – List of the 5 most recently modified projects with preview and update buttons.

### UI/UX
- **Modern neo‑brutalist design** – Thick black borders, offset shadows, monospace font, and 15px border radius.
- **Toast notifications** – Non‑intrusive feedback for actions.
- **Loading animation** – Visual feedback while saving.
- **Fully modal‑based** – Converter results, project creation, editing, and preview all use custom modals.
- **Logo integration** – Custom logo displayed in navigation bar and all tab headers (place `logo.png` in `ui/img/`).

## Tech Stack

| Component        | Technology                                         |
|------------------|----------------------------------------------------|
| Backend          | Python 3.8+                                        |
| Frontend         | HTML5, CSS3, vanilla JavaScript                    |
| Bridge           | [Eel](https://github.com/ChrisKnott/Eel)           |
| Image handling   | Pillow (PIL)                                       |
| DOCX generation  | python‑docx                                        |
| PPTX generation  | python‑pptx                                        |
| PDF generation   | ReportLab                                          |
| Screen detection | screeninfo                                         |
| Styling          | Neo‑brutalist CSS, inline SVGs, 15px border radius|

## Project Structure

```
amharic-latin-converter/
├── ui/                      # Frontend files
│   ├── index.html           # Main UI (tabs, modals)
│   ├── css/
│   │   └── style.css        # Modern neo‑brutalist styles
│   ├── js/
│   │   └── script.js        # Frontend logic (Eel calls, modals)
│   └── img/
│       └── logo.png         # Your custom logo (optional)
├── main.py                  # Python backend (transliteration, project management, exports)
├── requirements.txt         # Python dependencies
├── README.md                # This file
└── projects/                # Auto‑created; stores project data & photos
```

## Getting Started

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

- Switch between **Home**, **Dashboard**, **Converter**, **Projects**, and **Merge** tabs.
- Convert Amharic text to Latin Harari.
- Create projects, upload photos, save (auto‑converts), and export to DOCX, PPTX, or PDF.
- Merge multiple projects into one and export.

## How to Use

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
- **Export format**: Choose DOCX, PPTX, or PDF before clicking **Export**.
- After saving, the editor closes and the **Preview modal** opens, showing the final text and a photo grid (identical to the DOCX layout).

#### Exporting a Project
- In the editor, select your desired format (DOCX, PPTX, PDF) and click **Export**.
- The file is saved inside the project folder (e.g., `projects/MyProject/MyProject_export.docx`).

#### Deleting a Project
- In the editor, click **Delete Project** and confirm.

#### Previewing Without Editing
- From the project list, click **Preview** to see the project’s text and photos in a read‑only modal.

### Merge Projects Tab
1. Enter a name for the new merged project.
2. Check the boxes of the projects you want to merge.
3. Choose the export format (DOCX, PPTX, PDF).
4. Click **Merge & Export**.
5. The merged project is created, saved, and exported. A success message shows the file path.

### Dashboard Tab
- View total number of projects, total photos, and total characters.
- See the five most recently modified projects with buttons to **Preview** or **Update** them.

## Data Storage

- All projects are stored in the `projects/` folder (created automatically on first run).
- Each project has its own subfolder containing:
  - `metadata.json` – stores the converted text, an ordered list of photo filenames, and a `last_modified` timestamp.
  - Uploaded image files (original resolution preserved; thumbnails generated for the UI).
- Exported files (DOCX, PPTX, PDF) are saved inside the same project folder.

## Customization

- **Colors, borders, shadows**: Edit `ui/css/style.css` – CSS variables are at the top.
- **Border radius**: Currently `15px` for all major elements. Change the `--radius` variable.
- **Transliteration mapping**: Modify the dictionaries in `main.py` (`base_consonants`, `vowel_suffixes`, `extra_mapping`) to adjust phonetic output.
- **Logo**: Replace `ui/img/logo.png` with your own image (any size, will be scaled).
- **Photo grid columns**: In `main.py` (DOCX export, PPTX slides, PDF layout) and `style.css` (preview modal), adjust the column count.

## Troubleshooting

- **No window appears?** Ensure Chromium/Chrome is installed. Eel uses your default Chrome installation.
- **Conversion does nothing?** Check the terminal for errors. The backend must be running.
- **Photos not showing in preview?** Verify the images are supported (JPG, PNG, GIF). Large images may take a moment to generate thumbnails.
- **Export fails?** Make sure the required libraries are installed (`python-docx`, `python-pptx`, `reportlab`) and the project folder has write permissions.
- **Merge fails?** Ensure you have at least two projects with valid data. The new project name must not already exist.
- **"NoneType" error?** This was fixed by adding guards in JavaScript. Ensure you're using the latest `script.js`.

## License

This project is open‑source and available under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Eel](https://github.com/ChrisKnott/Eel) – for making Python + frontend desktop apps seamless.
- [python-docx](https://python-docx.readthedocs.io/) – for DOCX generation.
- [python-pptx](https://python-pptx.readthedocs.io/) – for PowerPoint export.
- [ReportLab](https://www.reportlab.com/) – for PDF export.
- Neo‑brutalist design inspiration – bold, functional, and playful.

---

**Enjoy converting Amharic to Latin Harari with style!** ደስ ይበላችሁ።