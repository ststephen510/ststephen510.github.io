# European Chemical Engineering Jobs

An AI-powered job search platform that helps you discover career opportunities at leading European chemical engineering companies using the xAI Grok API with web search capabilities.

## Features

- 🔬 **180 European Companies**: Searches across major chemical engineering companies, research institutes, and industry leaders
- 🤖 **AI-Powered Search**: Uses xAI's Grok API with web search to find real, current job openings
- 🎯 **Smart Ranking**: Jobs ranked by relevance (perfect fits first, then likely fits)
- 🌍 **Location Flexible**: Search by specific cities, countries, or remote positions
- ⚡ **Real-time Results**: Fast job discovery with up to 300 matching positions
- 🎨 **Clean Interface**: Simple, professional design with responsive layout

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI**: xAI Grok API (grok-beta model)
- **Dependencies**: axios, dotenv, cors

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- xAI API key ([Get one at console.x.ai](https://console.x.ai))

## Installation

1. **Clone or download the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your xAI API key:
     ```
     XAI_API_KEY=your_actual_api_key_here
     ```

## Getting Your xAI API Key

1. Visit [console.x.ai](https://console.x.ai)
2. Sign in or create an account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file

## Running the Application

1. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   - Navigate to `http://localhost:3000`
   - You should see the job search interface

3. **Search for jobs**:
   - Enter your profession (e.g., "Chemical Engineer")
   - Enter your specialization (e.g., "Process Engineering", "Catalysis")
   - Enter your desired location (e.g., "Germany", "Munich", "Remote")
   - Click "Search Jobs"

## Project Structure

```
/
├── app.js                 # Express backend server
├── public/
│   └── index.html        # Frontend interface
├── companies.txt         # List of 180 European companies
├── package.json          # Node.js dependencies
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore file
└── README.md            # This file
```

## How It Works

### Backend (app.js)

1. **Load Companies**: Reads up to 1000 company names from `companies.txt`
2. **Construct Prompt**: Creates an intelligent prompt for the Grok API including:
   - User's profession, specialization, and location
   - List of companies to search
   - Instructions for web search and ranking
3. **Call Grok API**: Sends request to `https://api.x.ai/v1/chat/completions`
4. **Parse Results**: Extracts job listings from API response
5. **Return Data**: Sends JSON response with up to 300 ranked jobs

### Frontend (public/index.html)

1. **User Input**: Collects profession, specialization, and location
2. **Submit Request**: Sends POST request to `/search` endpoint
3. **Display Loading**: Shows loading spinner during API call
4. **Render Results**: Dynamically creates job cards with:
   - Job title
   - Company name
   - Direct link to job posting
5. **Error Handling**: Displays user-friendly error messages

## API Endpoints

### POST `/search`

Search for jobs matching criteria.

**Request Body**:
```json
{
  "profession": "Chemical Engineer",
  "specialization": "Process Engineering",
  "location": "Germany"
}
```

**Response**:
```json
{
  "jobs": [
    {
      "title": "Process Engineer",
      "company": "BASF SE",
      "link": "https://basf.com/careers/job/12345"
    }
  ],
  "count": 150
}
```

**Error Response**:
```json
{
  "error": "Error message description"
}
```

### GET `/api/health`

Check server status and configuration.

**Response**:
```json
{
  "status": "ok",
  "apiKeyConfigured": true
}
```

## Company Database

The application searches for jobs at 180 European companies including:

- **Chemical Manufacturers**: BASF, Covestro, Evonik, Solvay, etc.
- **Specialty Chemicals**: Clariant, Arkema, Wacker Chemie, etc.
- **Industrial Gases**: Air Liquide, Linde, etc.
- **Research Institutes**: Fraunhofer Society, Max Planck Institutes, Helmholtz Centers
- **Aerospace & Defense**: Airbus, MTU Aero Engines, Safran, etc.
- **Automotive Suppliers**: Continental, Bosch, ZF Friedrichshafen, etc.

See `companies.txt` for the complete list.

## Job Ranking Logic

Jobs are ranked by relevance:

1. **Perfect Fits**: Exact match of profession, specialization, and location
2. **Likely Fits**: Strong match on profession and either specialization or location  
3. **Possible Fits**: Matches profession with related specialization or nearby location

The xAI Grok API handles the intelligent ranking using its advanced language understanding.

## Customization

### Adding More Companies

Edit `companies.txt` and add company names, separated by commas:
```
Company Name 1, Company Name 2, Company Name 3
```

### Changing the Port

Set the `PORT` environment variable in your `.env` file:
```
XAI_API_KEY=your_key_here
PORT=8080
```

### Modifying the Search Limit

Edit `app.js` and change the limit in the prompt or in the results processing:
```javascript
.slice(0, 300);  // Change 300 to your desired limit
```

## Troubleshooting

### "XAI_API_KEY not configured"
- Ensure you've created a `.env` file with your API key
- Restart the server after adding the key
- Check that the key is valid at console.x.ai

### "companies.txt file not found"
- Verify the file exists in the root directory
- Check file permissions

### "Failed to connect to xAI API"
- Check your internet connection
- Verify the API endpoint is accessible
- Check for rate limits on your API key

### No jobs found
- Try broader search criteria
- Check different locations or specializations
- Some companies may not have current openings

### Port already in use
- Change the PORT in `.env` to a different number (e.g., 3001)
- Or stop the process using port 3000:
  ```bash
  # On Linux/Mac
  lsof -ti:3000 | xargs kill
  
  # On Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

## Development

To contribute or modify:

1. Install nodemon for auto-reload:
   ```bash
   npm install -g nodemon
   ```

2. Run in dev mode:
   ```bash
   npm run dev
   ```

3. Make your changes to:
   - `app.js` for backend logic
   - `public/index.html` for frontend
   - `companies.txt` for company list

4. Test thoroughly before committing

## Security Notes

- **Never commit `.env`** to version control (already in `.gitignore`)
- Keep your xAI API key private and secure
- Use environment variables for all sensitive data
- Validate and sanitize all user inputs
- The frontend includes XSS protection via HTML escaping
- Consider implementing rate limiting for production use

## Performance Considerations

- API calls may take 10-60 seconds depending on search complexity
- The Grok API has rate limits - check your plan at console.x.ai
- Large result sets are automatically limited to 300 jobs
- Consider caching results for repeated searches (not implemented)

## Future Enhancements

- [ ] User authentication and saved searches
- [ ] Email alerts for new matching jobs
- [ ] More detailed job information (salary, requirements)
- [ ] Filter and sort options
- [ ] Save favorite jobs
- [ ] Application tracking
- [ ] Multi-language support
- [ ] Mobile app version

## License

MIT License - feel free to use and modify for your projects.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review xAI API documentation at [docs.x.ai](https://docs.x.ai)
- Ensure all dependencies are properly installed
- Check the server console for detailed error messages

## Architecture Overview

### Request Flow

1. User submits search form → Frontend JavaScript
2. Frontend sends POST to `/search` → Express backend
3. Backend reads companies.txt → Constructs prompt
4. Backend calls Grok API → Receives response
5. Backend parses and validates jobs → Returns JSON
6. Frontend displays results → User sees job cards

### Error Handling

- **Input Validation**: Missing fields return 400 Bad Request
- **File Errors**: Missing companies.txt returns 500 Internal Server Error
- **API Errors**: Network issues return 503 Service Unavailable
- **Parse Errors**: Invalid API response returns 500 with details
- **Frontend Errors**: User-friendly messages displayed in UI

### Data Flow

```
User Input (Form)
    ↓
Frontend Validation
    ↓
POST /search (JSON)
    ↓
Backend Validation
    ↓
Read companies.txt
    ↓
Construct Grok Prompt
    ↓
Call xAI API
    ↓
Parse JSON Response
    ↓
Validate & Limit Jobs
    ↓
Return JSON to Frontend
    ↓
Display Job Cards
```

---

**Built with ❤️ using xAI Grok API**

*Helping chemical engineers find their next opportunity in Europe*
