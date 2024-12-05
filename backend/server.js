import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { processInterviewInteraction, analyzeInterview } from "./ai-chatbot-stateless.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 5998;

app.post('/api/interview/start', async (req, res) => {
    try {
        const { jobTitle } = req.body;
        if (!jobTitle) {
            return res.status(400).json({ error: 'Job title is required' });
        }
        
        const question = "Tell me about yourself.";
        res.json({ 
            jobTitle,
            question,
            history: [
                {
                    role: "user",
                    parts: [{ text: `I am applying for the ${jobTitle} position. Please start the interview with your first question.` }]
                },
                {
                    role: "assistant",
                    parts: [{ text: question }]
                }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Continue interview with a response
app.post('/api/interview/respond', async (req, res) => {
    try {
        const { jobTitle, response, history } = req.body;
        if (!jobTitle || !response || !history) {
            return res.status(400).json({ 
                error: 'Job title, response, and history are required' 
            });
        }

        // Add user's response to history
        const updatedHistory = [...history, {
            role: "user",
            parts: [{ text: response }]
        }];

        // Get next question
        const question = await processInterviewInteraction(jobTitle, updatedHistory);
        
        // Add AI's question to history
        updatedHistory.push({
            role: "assistant",
            parts: [{ text: question }]
        });

        res.json({
            jobTitle,
            question,
            history: updatedHistory
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/interview/analyze', async (req, res) => {
    try {
        const { jobTitle, history } = req.body;
        if (!jobTitle || !history) {
            return res.status(400).json({ 
                error: 'Job title and history are required' 
            });
        }

        const analysis = await analyzeInterview(jobTitle, history);
        res.json({
            jobTitle,
            analysis,
            history
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});