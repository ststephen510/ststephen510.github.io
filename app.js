const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const jobTitle = document.getElementById('jobTitle');
    const specialization = document.getElementById('specialization');
    const region = document.getElementById('region');
    const resultsContainer = document.getElementById('resultsContainer');
    const jobResults = document.getElementById('jobResults');
    const chatMessages = document.getElementById('chatMessages');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    searchBtn.addEventListener('click', handleSearch);

    // Allow Enter key to trigger search
    [jobTitle, specialization, region].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    });

    async function handleSearch() {
        const jobTitleValue = jobTitle.value.trim();
        const specializationValue = specialization.value.trim();
        const regionValue = region.value.trim();

        if (!jobTitleValue || !specializationValue || !regionValue) {
            addMessage('Please fill in all fields.', 'bot-message');
            return;
        }

        // Add user message
        addMessage(`Searching for: ${jobTitleValue} in ${specializationValue} (${regionValue})`, 'user-message');

        // Disable button and show loader
        searchBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        try {
            const response = await fetch(`${API_URL}/search-jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobTitle: jobTitleValue,
                    specialization: specializationValue,
                    region: regionValue
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            displayResults(data.jobs);
            addMessage(`Found ${data.jobs.length} matching opportunities!`, 'bot-message');

        } catch (error) {
            console.error('Error:', error);
            addMessage(`Error: ${error.message}. Please check if the server is running and try again.`, 'bot-message');
            displayError(error.message);
        } finally {
            // Re-enable button and hide loader
            searchBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    function addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function displayResults(jobs) {
        resultsContainer.classList.remove('hidden');
        jobResults.innerHTML = '';

        if (!jobs || jobs.length === 0) {
            jobResults.innerHTML = '<p class="error-message">No matching jobs found. Try adjusting your search criteria.</p>';
            return;
        }

        jobs.forEach((job, index) => {
            const jobCard = createJobCard(job, index);
            jobResults.appendChild(jobCard);
        });
    }

    function createJobCard(job, index) {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="job-header">
                <div>
                    <div class="job-company">${escapeHtml(job.company)}</div>
                    <div class="job-title">${escapeHtml(job.title)}</div>
                </div>
                <div class="match-score">${job.matchScore}% Match</div>
            </div>
            <div class="job-details">
                ${job.location ? `<span class="job-location">📍 ${escapeHtml(job.location)}</span>` : ''}
                ${job.type ? `<span class="job-type">💼 ${escapeHtml(job.type)}</span>` : ''}
            </div>
            ${job.reasoning ? `
                <div class="job-reasoning">
                    <strong>Why this matches:</strong> ${escapeHtml(job.reasoning)}
                </div>
            ` : ''}
            <a href="${escapeHtml(job.link)}" target="_blank" rel="noopener noreferrer" class="job-link">
                View Job Posting →
            </a>
        `;

        return card;
    }

    function displayError(message) {
        resultsContainer.classList.remove('hidden');
        jobResults.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${escapeHtml(message)}
                <br><br>
                <small>Please ensure your server is running on port 3000 and your xAI API key is configured.</small>
            </div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
