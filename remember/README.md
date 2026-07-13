# Remember

Remember is a responsive, local-first productivity web application for saving ideas and products directly in the browser.

Tagline: **Capture every idea. Remember every product.**

## Project Overview

Remember is designed for private personal productivity. A user enters their name once, then stores ideas, product links, reminders, notes, and activity locally on their own device. The app has no backend, no database, no cloud sync, no analytics, and no external API calls.

## Features

- Name-only login with automatic login on return
- Dashboard with live statistics, recent activity, global search, latest ideas, and latest products
- Ideas module with add, view, edit, delete, search, sort, validation, duplicate prevention, and activity tracking
- Products module with add, view, edit, delete, search, filters, sort, URL validation, website detection, duplicate prevention, open link, and activity tracking
- Settings page for username changes, backup export, backup restore, clearing ideas/products, reset, theme information, and app version
- About page explaining purpose, privacy, features, version, and roadmap
- Toast notifications for successful actions
- Confirmation dialogs before destructive actions
- Responsive layouts for desktop, laptop, tablet, and mobile
- Local JSON backup and restore

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript ES6
- Browser Local Storage

No Bootstrap, Tailwind, React, Vue, Angular, jQuery, backend, database, or build tool is required.

## Folder Structure

```text
remember/
├── index.html
├── dashboard.html
├── ideas.html
├── products.html
├── settings.html
├── about.html
├── css/
│   ├── app.css
│   ├── dashboard.css
│   ├── ideas.css
│   ├── products.css
│   └── style.css
├── js/
│   ├── app-utils.js
│   ├── login.js
│   ├── dashboard.js
│   ├── ideas.js
│   ├── products.js
│   ├── settings.js
│   └── about.js
├── assets/
└── README.md
```

## Local Storage Architecture

Remember stores all app data in browser Local Storage:

- `rememberUser`: local display name
- `rememberIdeas`: array of idea objects
- `rememberProducts`: array of product objects
- `rememberRecentItems`: reverse chronological activity records

Idea object:

```json
{
  "id": "unique-id",
  "title": "Idea title",
  "description": "Idea description",
  "date": "YYYY-MM-DD",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

Product object:

```json
{
  "id": "unique-id",
  "productName": "Product name",
  "productLink": "https://example.com",
  "website": "Detected Website",
  "date": "YYYY-MM-DD",
  "notes": "Optional notes",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

Activity object:

```json
{
  "id": "unique-id",
  "type": "idea or product",
  "action": "Idea Added",
  "title": "Item title",
  "createdAt": "ISO timestamp"
}
```

## Installation

1. Download or clone the project.
2. Open `remember/index.html` in a modern browser.
3. Enter your name to start using the app.

Because Remember is static, no install command or local server is required.

## GitHub Pages Deployment

1. Create a GitHub repository.
2. Commit the contents of the `remember/` folder.
3. Push the repository to GitHub.
4. Open repository Settings.
5. Go to Pages.
6. Select the branch and folder that contain `index.html`.
7. Save the settings.

GitHub Pages will publish the app as a static site. All paths are relative and work without a build step.

## Privacy

Remember is browser-isolated. Each browser profile and device has its own Local Storage, so one user's local data is not available to another browser/device. Clearing browser data removes Remember data unless a backup was exported first.

## Future Roadmap

- Optional tags for ideas and products
- Archive view
- Import preview before restore
- More keyboard shortcuts
- Optional pinned items
- Advanced filters while remaining fully local-first
