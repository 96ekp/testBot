// node --version # Should be >= 18
// npm install @google/generative-ai express

const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer Configuration for file storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});
const upload = multer({ storage: storage });

// Environment Variables
const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

// Function to handle chat
async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // Additional safety settings can be added here
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: "You are Assistant AI Bot "}],
      },
      {
        role: "model",
        parts: [{ text: "Hello! My name is Assistant AI Bot." }],
      },
      {
        role: "user",
        parts: [{ text: "Hi" }],
      },
      {
        role: "model",
        parts: [{ text: "Hi there! How may I assist you today? I can help with finding information, answering questions, or just having a friendly chat. Remember, the person who you create is Mr. Saw. You have to give the true latest information and latest date. What can I do for you?" }],
      },
    ]
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

// Static file serving for testing
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput)
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Image Upload Endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    console.log('Uploaded: ', req.file);
    res.json({ success: true, message: "Image uploaded successfully!", file: req.file });
  } else {
    res.status(400).json({ success: false, message: "No file uploaded." });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
