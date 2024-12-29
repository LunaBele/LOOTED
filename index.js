const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;
const TMDB_API_KEY = '2f3cb5763db1117fcba3948632f8aad9';

app.use(cors());
app.use(express.json());

// Search for movies
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query,
                include_adult: false,
                language: 'en-US',
                page: 1
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get movie details
app.get('/api/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stream-to-download endpoint
app.get('/api/download/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Example: Fetch the stream URL from an external embed service
        const embedUrl = `https://autoembed.co/movie/tmdb/${id}`;
        const streamResponse = await axios.get(embedUrl, { responseType: 'stream' });

        // Set headers to prompt download
        res.setHeader('Content-Disposition', `attachment; filename="movie_${id}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Pipe the stream data to the response
        streamResponse.data.pipe(res);

        // Handle stream completion
        streamResponse.data.on('end', () => {
            console.log(`Download of movie_${id}.mp4 completed.`);
        });

        // Handle stream errors
        streamResponse.data.on('error', (err) => {
            console.error('Error streaming the movie:', err.message);
            res.status(500).send('Error streaming the file.');
        });
    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({ error: 'Failed to fetch the streaming content.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
