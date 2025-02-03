var apiToken = "token";  // Telegram bot token
var appUrl = "url";
var apiUrl = "https://api.telegram.org/bot" + apiToken;

// Set the Webhook URL for the bot
function setWebhook() {
  var url = apiUrl + "/setWebhook?url=" + appUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// Handle incoming messages from the bot
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var chatId = data.message.chat.id;
    var text = data.message.text;

    if (text.startsWith("/start")) {
      sendMessage(chatId, "Hello! I am a Flibusta book bot. Enter the book title to search.");
    } else {
      searchBooks(chatId, text);
    }
  } catch (error) {
    Logger.log("Error: " + error.message);
  }
}

// Search books on Flibusta
function searchBooks(chatId, query) {
  var searchUrl = "http://flibusta.is/booksearch?ask=" + encodeURIComponent(query);
  var response = UrlFetchApp.fetch(searchUrl);
  var html = response.getContentText();
  var bookData = parseBooks(html);

  if (bookData.length === 0) {
    sendMessage(chatId, "No books found for: " + query);
  } else {
    // Send only the first result to avoid flooding
    var book = bookData[0];
    var message = `*${sanitizeText(book.title)}* (${book.format})`;
    if (book.author) {
      message += `\n*Author:* ${sanitizeText(book.author)}`;
    }
    if (book.genre !== "Unknown genre") {
      message += `\n*Genre:* ${sanitizeText(book.genre)}`;
    }
    if (book.year !== "Unknown year") {
      message += `\n*Year:* ${book.year}`;
    }
    if (book.description) {
      message += `\n\n${sanitizeText(book.description)}`;
    }
    sendBookWithLink(chatId, message, book.downloadLink);
  }
}

// Sanitize HTML tags from text
function sanitizeText(text) {
  return text.replace(/<[^>]*>/g, "");
}

// Parse HTML response to extract book information
function parseBooks(html) {
  var bookData = [];
  var regex = /<li>.*?<a href=\"(\/b\/\d+)\">(.*?)<\/a>(?:.*?<i>(.*?)<\/i>)?.*?(\d{4})?.*?<\/li>/gs;
  var match;

  while ((match = regex.exec(html)) !== null) {
    bookData.push({
      title: sanitizeText(match[2]),
      author: match[3] ? sanitizeText(match[3]) : "",
      genre: "Unknown genre", 
      year: match[4] || "Unknown year",
      description: "", 
      format: "fb2",
      downloadLink: "http://flibusta.is" + match[1] + "/download?format=fb2"
    });
  }
  return bookData;
}

// Send message with download link
function sendBookWithLink(chatId, message, downloadLink) {
  var fullMessage = message + `\n[Download Book](${downloadLink})`;
  var payload = {
    chat_id: chatId,
    text: fullMessage,
    parse_mode: "Markdown"
  };
  UrlFetchApp.fetch(apiUrl + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}

// Send a message to the user
function sendMessage(chatId, text) {
  var url = apiUrl + "/sendMessage?chat_id=" + chatId + "&text=" + encodeURIComponent(text);
  UrlFetchApp.fetch(url);
}

