# Zhixuan's Blog (Renovated)

This is a modern, static blog renovated with a "Glassmorphism" design. It uses pure HTML/CSS/JS and renders Markdown articles dynamically in the browser.

## Project Structure

- `index.html`: Home page.
- `blog.html`: List of all articles.
- `post.html`: Article reader (renders Markdown).
- `assets/`: Styles and Scripts.
- `data/posts.json`: Registry of your articles.
- `articles/`: Folder to store your Markdown files.

## How to Add a New Article

1. **Write Article**: Create a new `.md` file in the `articles/` folder (e.g., `articles/my-new-post.md`).
2. **Register Article**: Open `data/posts.json` and add a new entry at the top:

```json
{
    "id": "my-new-post",
    "title": "My New Post Title",
    "date": "2026-01-30",
    "summary": "Short summary of the post...",
    "file": "articles/my-new-post.md",
    "tags": ["Life", "Tech"]
}
```

## How to Preview Locally

Because this site uses `fetch()` to load data, it **will not work** if you just double-click `index.html` (due to browser security restrictions). You must run a local server.

**Using Python:**
```bash
python -m http.server
# Then open http://localhost:8000
```

**Using Node.js:**
```bash
npx serve
# Then open http://localhost:3000
```

## Customization

- **Background**: The site fetches Bing's daily image. You can change this behavior in `assets/js/main.js` (`setBackground` function).
- **Styles**: Edit `assets/css/style.css`.
