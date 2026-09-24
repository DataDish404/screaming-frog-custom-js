// Use Google Gemini to generate keyword-aware alt text for each article's hero image.
//
// Runs on ARTICLE PAGES in normal HTML crawl context (NOT filtered to image
// content-types). Derives the "keyword" live from the page itself — <title> tag first,
// falling back to H1 — instead of an external keyword-mapping CSV. This
// makes the script fully self-contained and reusable on any site: no mapping
// file to maintain, join, or explain when sharing it.
//
// Finds the hero image via the og:image meta tag. Fetches it, converts to
// base64 (Gemini's generateContent needs raw bytes), and calls Gemini with the
// page's H1/title topic woven into the prompt, requiring the exact keyword
// phrase (or an exact substring of it) verbatim in the output — not a
// paraphrase — since SEO alt text needs exact-match phrasing, not a synonym.
//
// Design choice: the alt text ALWAYS reflects the page topic, even for images
// that are only loosely/decoratively related (e.g. an abstract graphic) —
// chosen deliberately for a consistent, demoable behavior. This trades away
// an accuracy guardrail (skip the keyword if the image is unrelated); worth
// knowing if reusing this for production alt text at scale, where a
// falsely-specific description could hurt more than a generic one helps.
//
// Crawl Config requirement: in Screaming Frog's Crawl Config > Custom > Custom
// JavaScript, clear the content-type filter (or set it to text/html) — this
// must run on HTML pages, not image resources.
//
// Based on a prompt technique by Jarrod Blundy:
//     https://heydingus.net/shortcuts/generate-alt-text-with-openai-vision
//
// IMPORTANT:
// You will need to supply your own API key below, which will be stored as
// part of your SEO Spider configuration in plain text. Be mindful that
// sharing this script means sharing your API key too, unless you remove it
// first — the placeholder below is intentional; replace it locally, don't
// commit a real key.
//

const GEMINI_API_KEY = 'your_api_key_here';
const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent`;

function getPageTopic() {
    if (document.title && document.title.trim()) {
        return document.title.trim();
    }
    const h1 = document.querySelector('h1');
    return (h1 && h1.textContent.trim()) ? h1.textContent.trim() : '';
}

function buildPrompt(topic) {
    const base = 'Please provide a functional, objective description of the provided image in no more than around 30 words so that someone who could not see it would be able to imagine it. If possible, follow an "object-action-context" framework: The object is the main focus. The action describes what’s happening, usually what the object is doing. The context describes the surrounding environment. If there is text found in the image, it is very important that you transcribe all of it, even if it extends the word count beyond 30 words. If there is no text found in the image, then there is no need to mention it. You should not begin the description with any variation of The image.';

    if (!topic) {
        return base;
    }

    return `${base} This image appears on a page about "${topic}". You must include the exact phrase "${topic}" verbatim, word-for-word, somewhere in the description — do not paraphrase it, substitute synonyms, or rephrase it, even if it makes the sentence slightly less smooth. If the phrase is long, you may use a shorter exact substring of it that still captures the core subject, but do not reword the words you do use. Connect what's visually there to this topic even if the image is decorative or abstract. Do not invent visual details that aren't visible.`;
}

function geminiRequest(base64ImgData, mimeType, topic) {
    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
            "contents": [
                { "parts": [
                    { "text": buildPrompt(topic) },
                    {
                        "inline_data": {
                            "mime_type": mimeType || 'image/jpeg',
                            "data": base64ImgData
                        }
                    }
                    ] }
            ]
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        return data.candidates[0].content.parts[0].text.trim();
    });
}

function readAsData(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
            reader.onloadend = () => {
            if (reader.readyState === FileReader.DONE) {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read imgUrl'));
            }
        };
    });
}

// Single fetch for both the base64 payload and the mime type — fetching the
// hero image twice (once for the bytes, once again just for the
// Content-Type header) doubled the network latency for no reason, and was
// enough on its own to blow past Screaming Frog's Custom JavaScript timeout
// on slower image hosts. blob.type gives the mime type for free.
function fetchImageAsBase64(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.blob();
        })
        .then(blob => readAsData(blob).then(dataUrl => ({
            base64: dataUrl.split(",")[1],
            mimeType: blob.type
        })));
}

function findHeroImageUrl() {
    const ogImage = document.querySelector('meta[property="og:image"]');
    return (ogImage && ogImage.content) ? ogImage.content : null;
}

const heroImageUrl = findHeroImageUrl();
const topic = getPageTopic();

if (!heroImageUrl) {
    return seoSpider.error(new Error('No og:image found on this page.'));
} else {
    return fetchImageAsBase64(heroImageUrl)
        .then(({ base64, mimeType }) => geminiRequest(base64, mimeType, topic))
        .then(altText => seoSpider.data(altText))
        .catch(error => seoSpider.error(error));
}
