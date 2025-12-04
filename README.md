# arcticulab.io

AI-powered job matching platform that helps you discover relevant career opportunities across leading tech companies using xAI's Grok API.

## Features

- 🤖 **AI-Powered Matching**: Uses xAI Grok to intelligently match jobs based on your criteria
- 🎯 **Smart Reasoning**: Understands typos and similar job titles (e.g., "Software Engineer" matches "SWE")
- 🏢 **Top Tech Companies**: Searches across Tesla, Anduril, Rivian, SpaceX, OpenAI, Anthropic, Neuralink, and Boston Dynamics
- 📊 **Match Scoring**: Shows how well each job matches your requirements (0-100%)
- 🎨 **xAI-Inspired Design**: Sleek black interface with typewriter font
- ⚡ **Real-time Results**: Fast job discovery with detailed reasoning

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **AI**: xAI Grok API
- **Styling**: Custom CSS with typewriter fonts (Courier Prime)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- xAI API key (get one at [x.ai](https://x.ai))

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd "c:\Users\steff\Documents\Vault of Horror\arcticulab.io"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure your xAI API key**:
   - Open the `.env` file
   - Replace `your_xai_api_key_here` with your actual xAI API key:
     ```
     XAI_API_KEY=xai-your-actual-api-key-here
     PORT=3000
     ```

## Getting Your xAI API Key

1. Go to [console.x.ai](https://console.x.ai)
2. Sign in or create an account
3. Navigate to API Keys section
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
   - You should see the arcticulab.io interface

3. **Search for jobs**:
   - Enter a job title (e.g., "Software Engineer")
   - Enter your specialization (e.g., "Machine Learning")
   - Enter your region (e.g., "San Francisco" or "Remote")
   - Click "Search Jobs"

## Project Structure

```
arcticulab.io/
├── index.html          # Main HTML file
├── styles.css          # xAI-inspired dark theme styling
├── app.js             # Frontend JavaScript
├── server.js          # Express backend server
├── package.json       # Node.js dependencies
├── .env              # Environment variables (API keys)
├── .gitignore        # Git ignore file
└── README.md         # This file
```

## How It Works

1. **User Input**: You provide job title, specialization, and region
2. **AI Processing**: The backend sends your criteria to xAI Grok API
3. **Intelligent Matching**: Grok analyzes each company's profile and generates relevant job matches
4. **Smart Reasoning**: The AI considers typos, similar titles, and company-specific roles
5. **Results Display**: Jobs are shown with match scores, reasoning, and application links

## Company Database

The platform currently tracks opportunities at:

- **Tesla** - Electric vehicles and sustainable energy
- **Anduril** - Defense technology and autonomous systems
- **Rivian** - Electric adventure vehicles
- **SpaceX** - Aerospace and space transportation
- **OpenAI** - AI research and deployment
- **Anthropic** - AI safety and research
- **Neuralink** - Brain-computer interfaces
- **Boston Dynamics** - Advanced robotics

## Customization

### Adding More Companies

Edit `server.js` and add to the `COMPANIES` array:

```javascript
{
    name: 'Your Company',
    careerUrl: 'https://company.com/careers',
    description: 'Company description'
}
```

### Changing the Port

Modify the `PORT` in your `.env` file:
```
PORT=8080
```

### Styling Customization

Edit `styles.css` to change colors, fonts, or layout. Key variables:
```css
:root {
    --bg-primary: #000000;
    --accent: #00ff88;
    /* ... */
}
```

## API Endpoints

### POST `/api/search-jobs`
Search for jobs matching criteria.

**Request Body**:
```json
{
  "jobTitle": "Software Engineer",
  "specialization": "Machine Learning",
  "region": "Remote"
}
```

**Response**:
```json
{
  "jobs": [
    {
      "company": "Tesla",
      "title": "Machine Learning Engineer",
      "location": "Palo Alto, CA",
      "type": "Full-time",
      "matchScore": 95,
      "reasoning": "Strong match for ML expertise...",
      "link": "https://tesla.com/careers/job/123"
    }
  ]
}
```

### GET `/api/health`
Check server status and configuration.

### GET `/api/companies`
Get list of all tracked companies.

## Troubleshooting

### "xAI API key not configured"
- Make sure you've added your API key to the `.env` file
- Restart the server after adding the key

### "Failed to search jobs"
- Check your internet connection
- Verify your xAI API key is valid
- Check the server console for detailed error messages

### Port already in use
- Change the PORT in `.env` to a different number (e.g., 3001)
- Or stop the process using port 3000

## Development

To contribute or modify:

1. Install nodemon for auto-reload: `npm install -g nodemon`
2. Run in dev mode: `npm run dev`
3. Make your changes
4. Test thoroughly before deploying

## Security Notes

- **Never commit your `.env` file** to version control
- Keep your xAI API key private
- Use environment variables for all sensitive data
- Consider rate limiting for production use

## Future Enhancements

- [ ] User authentication
- [ ] Save favorite jobs
- [ ] Email alerts for new matching jobs
- [ ] More companies and industries
- [ ] Advanced filtering options
- [ ] Job application tracking

## License

MIT License - feel free to use and modify for your projects.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review xAI API documentation at [docs.x.ai](https://docs.x.ai)
- Ensure all dependencies are properly installed

---

**Built with ❤️ using xAI Grok**
