# Job Crawler

Job Crawler is a web crawler that navigates LinkedIn job listings. It evaluates how closely your resume matches the job descriptions provided in a search URL and assigns a compatibility score from 0 to 100.

## Prerequisites

- **Google Chrome**: Necessary for running the crawler.
- **Node.js**: Required to execute the crawler script.

## Installation

First, clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/yourgithub/job-crawler.git
cd job-crawler
pnpm install # You can also use npm or yarn
```

## Configuration

Crate a `resume.txt` file in the project root and paste in your resume. Any special formatting used should be avoided, as this is just a plain text file. Just put formatted text on new lines as needed.

Create a `.env` file in the project root with the following entries:

```env
LINKEDIN_JOB_SEARCH_URL=<Your LinkedIn job search URL>
LINKEDIN_EMAIL=<Your LinkedIn login email>
LINKEDIN_PASSWORD=<Your LinkedIn password>
OPENAI_API_KEY=<Your OpenAI API key>
```

## Environment Variables Details

- LINKEDIN_JOB_SEARCH_URL: Perform a job search on LinkedIn with your desired filters, then copy and paste the URL from the address bar.
- LINKEDIN_EMAIL and LINKEDIN_PASSWORD: Your credentials for logging into LinkedIn.
- OPENAI_API_KEY: Can be obtained from OpenAI.

## Running the Application

```bash
npm start
```

## Problems

If you run this application over and over again, LinkedIn will eventually give you a test to make sure you are not a bot, which in fact you are haha. Nevertheless my current work around for this is the application will pause to give you a chance to solve the puzzle LinkedIn gives you. Best of luck!