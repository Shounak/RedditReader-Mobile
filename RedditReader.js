var postBase64 = "{{PostBase64}}";
var commentsBase64 = "{{CommentsBase64}}";

postBase64 = postBase64.replace(/\s/g, "");
commentsBase64 = commentsBase64.replace(/\s/g, "");

function decodeBase64Utf8(base64) {
  var binary = atob(base64);
  var bytes = new Uint8Array(binary.length);

  for (var i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder("utf-8").decode(bytes);
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderText(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function decodeHtmlEntities(value) {
  var textarea = document.createElement("textarea");
  textarea.innerHTML = String(value == null ? "" : value);
  return textarea.value;
}

function renderRedditHtml(htmlValue, fallbackText) {
  if (htmlValue) {
    var decoded = decodeHtmlEntities(htmlValue);

    decoded = decoded
      .replace(/<!-- SC_OFF -->/g, "")
      .replace(/<!-- SC_ON -->/g, "");

    return decoded;
  }

  return renderText(fallbackText || "");
}

var postListing = JSON.parse(decodeBase64Utf8(postBase64));
var commentsListing = JSON.parse(decodeBase64Utf8(commentsBase64));

var post = postListing.data.children[0].data;
var comments = commentsListing.data.children || [];

var renderedCount = 0;
var MAX_COMMENTS = 800;

function renderComment(node, depth) {
  if (renderedCount >= MAX_COMMENTS) {
    return "";
  }

  if (!node || node.kind !== "t1") {
    return "";
  }

  renderedCount += 1;

  var d = node.data || {};
  var margin = Math.min(depth * 14, 84);

  var score = d.score;
  if (score == null) {
    score = d.ups;
  }
  if (score == null) {
    score = "";
  }

  var html = "";
  html += "<div class='comment' style='margin-left:" + margin + "px;'>";
  html += "<div class='comment-meta'>";
  html += "▲ " + escapeHtml(score) + " · u/" + escapeHtml(d.author || "[unknown]");
  html += "</div>";
  html += "<div class='md comment-body'>" + renderRedditHtml(d.body_html, d.body || "") + "</div>";
  html += "</div>";

  var replies = d.replies;
  if (replies && replies.data && replies.data.children) {
    var children = replies.data.children;
    for (var i = 0; i < children.length; i++) {
      html += renderComment(children[i], depth + 1);
    }
  }

  return html;
}

var postBodyHtml = post.selftext_html || "";
var postBody = post.selftext || post.url || "";
var commentsHtml = "";

for (var i = 0; i < comments.length; i++) {
  commentsHtml += renderComment(comments[i], 0);
}

if (renderedCount >= MAX_COMMENTS) {
  commentsHtml += "<p><em>Stopped after " + MAX_COMMENTS + " comments.</em></p>";
}

var html = "";
html += "<!doctype html>";
html += "<html>";
html += "<head>";
html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
html += "<style>";
html += "body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.45;padding:16px;max-width:760px;margin:auto;color:#111;background:#fff;}";
html += "h1{font-size:1.35rem;line-height:1.25;margin:0 0 0.6rem 0;}";
html += "h2{font-size:1.15rem;margin-top:1.4rem;}";
html += "hr{border:0;border-top:1px solid #ddd;margin:20px 0;}";
html += ".meta{color:#666;font-size:0.9rem;margin-bottom:1rem;}";
html += ".post{margin-bottom:1.5rem;}";
html += ".comment{border-left:3px solid #ddd;padding-left:10px;margin-top:12px;margin-bottom:12px;}";
html += ".comment-meta{color:#666;font-size:0.85rem;margin-bottom:4px;}";
html += ".comment-body{font-size:0.98rem;}";
html += "a{color:#0645ad;word-break:break-word;}";
html += ".md p{margin:0.45em 0;}";
html += ".md blockquote{border-left:3px solid #ccc;margin:0.6em 0;padding-left:10px;color:#555;}";
html += ".md pre{background:#f6f6f6;padding:10px;overflow:auto;border-radius:6px;}";
html += ".md code{background:#f6f6f6;padding:1px 4px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}";
html += ".md pre code{padding:0;background:transparent;}";
html += ".md ul,.md ol{padding-left:1.4em;}";
html += "</style>";
html += "</head>";
html += "<body>";

html += "<h1>" + escapeHtml(post.title || "Untitled Reddit post") + "</h1>";

html += "<div class='meta'>";
html += escapeHtml(post.subreddit_name_prefixed || "");
html += " · u/" + escapeHtml(post.author || "[unknown]");
html += " · ▲ " + escapeHtml(post.score == null ? "" : post.score);
html += " · " + escapeHtml(post.num_comments == null ? "" : post.num_comments) + " comments";
html += "</div>";

html += "<div class='md post'>" + renderRedditHtml(postBodyHtml, postBody) + "</div>";

html += "<hr>";
html += "<h2>Comments</h2>";
html += commentsHtml || "<p>No comments found.</p>";

html += "</body>";
html += "</html>";

completion(html);
