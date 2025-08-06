# 🚀 Deployment Guide - Hybrid Processing System

## 📋 Overview

This application features a **hybrid processing system** that automatically detects the environment and chooses the optimal processing method:

- **🚀 Server Processing**: When deployed on Vercel (or similar platforms)
- **💻 Client Processing**: When running locally or when server is unavailable
- **🔄 Automatic Fallback**: Seamless switching between modes if needed

## 🌐 Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository (recommended)
- API keys for OpenAI/Anthropic

### Environment Variables
Set these in your Vercel dashboard:

```bash
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### Deploy Steps

1. **Connect Repository**
   ```bash
   # Push to GitHub first
   git add .
   git commit -m "Add hybrid processing system"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

3. **Automatic Configuration**
   - `vercel.json` is already configured
   - API routes will be available at `/api/health` and `/api/process-chunk`
   - 5-minute timeout configured for processing chunks

### Vercel Benefits
- ✅ **No standby issues**: Processing runs on server
- ✅ **Chunked processing**: Optimized for Vercel's 5-minute function limit
- ✅ **Auto-scaling**: Handles multiple users simultaneously
- ✅ **CDN optimization**: Fast global access

## 🏠 Local Development

### Setup
```bash
npm install
npm run dev
```

### Environment Variables
Create `.env.local`:
```bash
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### Local Benefits
- ✅ **Keep-alive system**: Prevents interruptions during standby
- ✅ **No server dependency**: Works completely offline
- ✅ **Full control**: All processing happens in your browser

## 🔧 How the Hybrid System Works

### 1. **Automatic Detection**
```typescript
// App checks server availability on processing start
const serverAvailable = await isServerProcessingAvailable();
```

### 2. **Processing Modes**

#### Server Mode (Vercel)
- **Chunk size**: 10 rows per chunk
- **Timeout**: 5 minutes per chunk
- **Parallelization**: Multiple chunks can process simultaneously
- **Fallback**: Auto-switches to client if server overloaded

#### Client Mode (Local)
- **Chunk size**: 5 rows per chunk  
- **Keep-alive**: Pings every 30 seconds
- **Standby protection**: Prevents sleep interruption
- **Progress saving**: Resumes if accidentally interrupted

### 3. **UI Indicators**
- 🟢 **Green Badge**: Server Processing (Vercel optimized)
- 🔵 **Blue Badge**: Client Processing (Keep-alive enabled)
- 🟡 **Yellow Badge**: Checking availability

## 📊 Performance Comparison

| Aspect | Server (Vercel) | Client (Local) |
|--------|----------------|----------------|
| **Standby Issues** | ✅ None | ⚠️ Mitigated with keep-alive |
| **Speed** | 🚀 Fast (server-grade) | 🐌 Depends on browser |
| **Scalability** | ✅ High | ❌ Single user |
| **Offline Support** | ❌ Requires internet | ✅ Full offline |
| **Resource Usage** | ✅ Server resources | ⚠️ Local CPU/memory |

## 🔒 Security Notes

### API Keys
- Never commit API keys to version control
- Use environment variables only
- Keys are processed client-side or server-side securely

### CORS Configuration
- Vercel routes have CORS headers configured
- Local development uses browser's built-in CORS

## 🐛 Troubleshooting

### Server Processing Not Available
```
🔍 Checking server processing availability...
💻 Server not available - using client-side processing with keep-alive
```
**Solution**: This is normal for local development. Deploy to Vercel for server processing.

### Processing Interrupted
```
⚠️ Processing cancelled after X rows
```
**Solution**: 
- Check progress is saved in localStorage
- Restart processing to resume from last checkpoint
- Ensure keep-alive is working (look for ping logs)

### Memory Issues (Large Files)
```
❌ Chunk X failed, falling back to client-side
```
**Solution**:
- Reduce chunk size in `createProcessingChunks()`
- Process smaller files
- Use server processing on Vercel for better memory handling

## 🎯 Optimization Tips

### For Large Files (1000+ rows)
1. **Deploy on Vercel** for server processing
2. **Process during low-traffic hours** 
3. **Split very large files** into smaller batches
4. **Monitor budget limits** closely

### For Better Performance
1. **Use server processing** when available
2. **Keep browser tab active** during client processing
3. **Ensure stable internet** connection
4. **Close other heavy applications** during processing

## 📈 Monitoring

### Cost Tracking
- Real-time budget monitoring in header
- Detailed cost breakdown after processing
- Per-operation cost tracking

### Progress Monitoring
- Real-time progress bar
- Detailed logs with timestamps
- Estimated time remaining
- Processing mode indicators

## 🔄 Updates and Maintenance

### Updating API Keys
1. Update in Vercel dashboard (for deployed version)
2. Update in `.env.local` (for local development)
3. Restart application

### Updating Processing Logic
1. Modify `optimizationUtils.ts` for client-side changes
2. Modify `api/process-chunk.ts` for server-side changes
3. Deploy to Vercel for server-side updates

---

## 🆘 Support

If you encounter issues:
1. Check the browser console for detailed logs
2. Verify API keys are correctly set
3. Test with a small file first
4. Check your budget limits

The hybrid system is designed to be resilient and will automatically choose the best processing method for your environment! 🎯 