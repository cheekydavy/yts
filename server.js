const express = require("express")
const cors = require("cors")
const ytSearch = require("yt-search")

const app = express()
const PORT = process.env.PORT || 3000

// Enable CORS for all origins
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use(express.json())

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "YouTube Search API",
    version: "1.0.0",
    endpoints: {
      search: "/api/ytsearch?q=your-query",
      health: "/health",
    },
    status: "running",
  })
})

// YouTube search API
app.get("/api/ytsearch", async (req, res) => {
  const query = req.query.q
  if (!query) {
    return res.status(400).json({
      error: "Missing query parameter 'q'",
      example: "/api/ytsearch?q=your search term",
    })
  }

  // If it's already a valid YouTube URL, return it
  const isYouTubeURL = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(query)
  if (isYouTubeURL) {
    return res.json({
      url: query,
      title: "Direct YouTube URL",
      duration: "Unknown",
      thumbnail: "",
      source: "direct_url",
    })
  }

  try {
    console.log(`🔍 Searching for: ${query}`)
    const result = await ytSearch(query)
    const video = result.videos.length ? result.videos[0] : null

    if (!video) {
      return res.status(404).json({
        error: "No video found",
        query: query,
        suggestion: "Try a different search term",
      })
    }

    console.log(`✅ Found: ${video.title}`)
    res.json({
      url: video.url,
      title: video.title,
      duration: video.duration.timestamp,
      thumbnail: video.thumbnail,
      author: video.author.name,
      views: video.views,
      source: "search_result",
    })
  } catch (err) {
    console.error("❌ YouTube search error:", err)
    res.status(500).json({
      error: "Search failed",
      message: err.message,
      query: query,
    })
  }
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "youtube-search-api",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    version: "1.0.0",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    available_endpoints: {
      root: "/",
      search: "/api/ytsearch?q=your-query",
      health: "/health",
    },
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ YouTube search service error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`🎵 YouTube Search API running at: http://localhost:${PORT}`)
  console.log(`🔍 Search endpoint: /api/ytsearch?q=your-query`)
  console.log(`💚 Health check: /health`)
  console.log(`📚 API info: /`)
})
