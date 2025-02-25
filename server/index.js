const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const express = require("express");
const axios = require("axios");
// const { Server } = require("socket.io");
const http = require("http");
// const connectMongoDB = require("./connection");
const cors = require("cors");

dotenv.config();
const app = express();
const server = http.createServer(app);

// connectMongoDB(process.env.MONGODB_CONNECT_URI)
//   .then((value) => {
//     console.log("server connected");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

app.use(
  cors({
    origin: ["http://localhost:5173", "https://*.ngrok.io"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const apiKey = process.env.GEMINI_API_KEY;
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const VOICE_ID = process.env.VOICE_ID;

const genAI = new GoogleGenerativeAI(apiKey);

// Store the conversation history for each user session
const userHistories = {};

app.use(express.json());

app.get("/", (req, res) => {
  console.log("Hello World");
  res.send("Hello World");
});

app.post("/generate-voice", async (req, res) => {
  const { userId, text, role } = req.body;
  console.log("userId", userId);
  console.log("text", text);

  const company = {
    name: "Test Company",
    industry: "IT",
    location: "Bangalore",
    website: "https://testcompany.com",
    companySize: "100-500",
    about: "Test Company is a leading IT company in Bangalore.",
  };

  const jobDescription = {
    overview:
      "We are looking for an experienced Full Stack Developer to join our growing technology team. The ideal candidate will be responsible for developing and maintaining both front-end and back-end applications while working in an agile environment.",

    responsibilities:
      "Design and develop scalable web applications, create responsive user interfaces, optimize database performance, implement security measures, mentor junior developers, participate in architectural decisions, debug production issues, and collaborate with product managers to deliver high-quality solutions.",

    requirements:
      "5+ years of full-stack development experience, strong proficiency in React/Angular and Node.js, experience with cloud platforms (AWS/Azure), expertise in database design and optimization (SQL/NoSQL), understanding of DevOps practices, excellent problem-solving skills, and proven track record of delivering complex projects.",

    benefits:
      "Remote-first culture, competitive salary package, stock options, health and dental coverage, annual learning budget, flexible working hours, paid parental leave, regular team retreats, and opportunities for career advancement.",
  };

  const candidate = {
    personalInfo: {
      id: "12345",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1-123-456-7890",
      location: {
        city: "San Francisco",
        country: "USA",
      },
    },
    resume: {
      education: [
        {
          degree: "Bachelor of Science",
          institution: "Stanford University",
          specialization: "Computer Science",
          yearOfCompletion: 2020,
          score: "3.8 GPA",
        },
      ],
      workExperience: [
        {
          company: "Tech Corp",
          role: "Software Engineer",
          duration: {
            from: "2020-06-01",
            to: "2023-12-31",
          },
          responsibilities: [
            "Developed full-stack web applications",
            "Led team of 5 developers",
            "Implemented CI/CD pipelines",
          ],
          technologies: ["JavaScript", "React", "Node.js", "AWS"],
          achievements: [
            "Reduced deployment time by 50%",
            "Improved system performance by 30%",
          ],
        },
      ],
      skills: {
        technical: ["JavaScript", "Python", "SQL", "React", "Node.js"],
        soft: ["Leadership", "Communication", "Problem Solving"],
        tools: ["Git", "Docker", "Jenkins", "VS Code"],
      },
      certifications: "AWS Certified Solutions Architect",
      projects: [
        {
          name: "E-commerce Platform",
          description: "Built scalable e-commerce solution",
          role: "Lead Developer",
          technologies: ["React", "Node.js", "MongoDB"],
          url: "https://github.com/example/project",
        },
      ],
    },
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: `You are a professional interviewer conducting job interviews for ${role} positions at ${company.name}. Your purpose is to evaluate candidates thoroughly based on their qualifications, experience, and competencies.
      ###Available Context:
      Company Information: ${company}
      Job Description: ${jobDescription}
      Candidate Information: ${candidate.personalInfo}
      Candidate Resume: ${candidate.resume}

  ###  Introduction:
  Identify the candidate and acknowledge their application.
  Introduce yourself formally as the interviewer.
  Explain that the interview will assess their skills through structured and challenging questions based on their resume and job role.
  Ask the candidate for a brief self-introduction based on their resume .
  Do not directly go for technical questions; start with a general introductions and warm-up questions.

  ### Resume-Based Technical & Behavioral Questions
  Extract relevant skills & experience from resume to generate role-specific technical and behavioral questions.
  Ask one question at a time and expect structured responses.
  Adapt dynamically:
  If the candidate struggles, repeat the question once, but do not simplify it unnecessarily.
  If the candidate gives an incorrect or weak answer, provide a brief neutral acknowledgment and move to the next question.

  ### Situational & Problem-Solving Challenges:
  Ask role-specific real-world scenarios and assess the candidate’s approach.
  If applicable, trigger coding challenges: [CODING_TASK] (Only when required).
  Follow up with clarifying or deeper questions based on responses.

  ### Behavioral Assessment
  Focus on past experiences and specific situations
  Request concrete examples with measurable outcomes
  Evaluate cultural fit and soft skills


  ### Company-Specific Questions
  Assess candidate's knowledge of ${company.about} and ${company.industry}.
  Evaluate alignment with company values and goals

  ### Decision & Closing
  Do not provide unnecessary feedback unless explicitly required.
  If needed, summarize key observations neutrally without bias.
  End the interview professionally: using [END_INTERVIEW]

  ### Tone & Personality
  Strict, professional, and structured—this is a real interview, not a practice session.
  Maintain formal communication with a direct, neutral, and unbiased approach.
  Do not offer hints, encouragement, or unnecessary guidance.
  Do not go very deep into technical details unless the candidate demonstrates expertise.


  ### Question Categories
  Technical Knowledge
  Problem-Solving
  Leadership & Management (if applicable)
  Project Experience
  Role-Specific Skills
  Company Knowledge

  Ask Only One Question at a Time and Maximum of 2 or 3 Follow-Up Questions per Main Question.

  Example Opening
    "Hello, ${candidate.personalInfo.name} , I’m your interviewer for today’s session. Based on your application, this interview will evaluate your qualifications for the ${role} role. We will cover technical, behavioral, and problem-solving questions. Please ensure you answer clearly and concisely. Let’s begin—kindly introduce yourself briefly, based on your experience in user.resume."

`,
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  // Retrieve or initialize the user's history
  const userHistory = userHistories[userId] || [];
  console.log("userHistory", userHistory);

  try {
    // Generate AI response
    const chatSession = model.startChat({
      generationConfig,
      history: [...userHistory, { role: "user", parts: [{ text }] }],
    });

    const result = await chatSession.sendMessage(text);
    let aiResponse = result.response.text();
    const actions = {
      endInterview: aiResponse.includes("[END_INTERVIEW]"),
      codingTask: aiResponse.includes("[CODING_TASK]"),
    };

    aiResponse = aiResponse.replace(/\[.*?\]/g, "").trim();
    aiResponse = aiResponse.replace(/[^a-zA-Z0-9 ]/g, "");
    // Update conversation history
    userHistories[userId] = [
      ...userHistory,
      { role: "user", parts: [{ text }] },
      { role: "model", parts: [{ text: aiResponse }] },
    ];

    // Generate speech
    const voiceResponse = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      { text: aiResponse },
      {
        headers: {
          "xi-api-key": ELEVEN_LABS_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    // Send both audio and text response
    res.set({
      "Content-Type": "application/json",
    });
    console.log("Actions", actions);

    res.send({
      audio: Buffer.from(voiceResponse.data).toString("base64"),
      text: aiResponse,
      actions: actions,
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: "Error generating response or voice",
    });
  }
});

app.get("/get-conversation/:userId", (req, res) => {
  const { userId } = req.params;
  const userHistory = userHistories[userId] || [];

  // Format the conversation history
  const formattedHistory = userHistory.map((message) => ({
    type: message.role === "user" ? "user" : "ai",
    text: message.parts[0].text,
    timestamp: new Date(),
  }));

  res.json({
    success: true,
    conversation: formattedHistory,
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
