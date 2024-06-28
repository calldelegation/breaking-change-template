import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Octokit } from '@octokit/rest';
import semver from 'semver';

// GitHub API URL for releases
const apiUrl = 'https://api.github.com/repos/calldelegation/breaking-change-template/releases';
// Path to the breaking changes file
const logFilePath = path.join(process.cwd(), 'docs/src/testnet-breaking-changes.md');
// Path to the file storing the latest version processed
const latestVersionFilePath = path.join(process.cwd(), 'latest-version.txt');

// Read the latest version from the file
let startingVersion = 'v1.0.0';
if (fs.existsSync(latestVersionFilePath)) {
  startingVersion = fs.readFileSync(latestVersionFilePath, 'utf8').trim();
}

// Read the existing log file
let logFileContent = '';
if (fs.existsSync(logFilePath)) {
  logFileContent = fs.readFileSync(logFilePath, 'utf8');
}

// Function to extract new changes from release data
function extractNewChanges(logContent, releases) {
  let newEntries = '';
  const logEntries = logContent.split('\n').filter(line => line.startsWith('Release'));
  let latestVersion = startingVersion;

  releases.forEach(release => {
    const breakingChangesSection = extractBreakingChanges(release.body);
    const releaseDate = new Date(release.published_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (breakingChangesSection && !logEntries.includes(`Release [${release.tag_name}](${release.html_url})`)) {
      newEntries = `## ${releaseDate}\n\nRelease [${release.tag_name}](${release.html_url})\n\n${breakingChangesSection}\n\n` + newEntries;
      if (semver.gt(release.tag_name, latestVersion)) {
        latestVersion = release.tag_name;
      }
    }
  });

  // Update the latest version file
  fs.writeFileSync(latestVersionFilePath, latestVersion, 'utf8');

  return newEntries;
}

// Function to extract the "Breaking Changes" section from the release notes
function extractBreakingChanges(content) {
  const lines = content.split('\n');
  const startIndex = lines.findIndex(line => line.trim() === '## Breaking Changes');

  if (startIndex === -1) return null;

  const endIndex = lines.slice(startIndex + 1).findIndex(line => line.startsWith('## '));
  const endPosition = endIndex === -1 ? lines.length : startIndex + 1 + endIndex;

  return lines.slice(startIndex + 1, endPosition).join('\n').trim();
}

// Function to create a pull request
async function createPullRequest(newChanges, octokit, branchName) {
  const owner = 'calldelegation'; // Replace with your GitHub username or org
  const repo = 'breaking-change-template'; // Replace with your repository name
  const base = 'main'; // Replace with the default branch of your repository
  const head = branchName;
  const title = 'Update Breaking Changes';
  const body = 'This PR updates the breaking changes log with the latest changes.';

  // Create a new branch
  const { data: { object: { sha } } } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${base}`,
  });

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${head}`,
    sha,
  });

  // Update the file on the new branch
  const { data: { content, sha: fileSha } } = await octokit.repos.getContent({
    owner,
    repo,
    path: 'docs/src/testnet-breaking-changes.md',
  });

  const updatedContent = Buffer.from(content, 'base64').toString('utf8');
  const headerIndex = updatedContent.indexOf('# Sepolia Testnet Breaking Change Guide') + '# Sepolia Testnet Breaking Change Guide'.length;
  const contentWithNewChanges = updatedContent.slice(0, headerIndex) + '\n\n' + newChanges + updatedContent.slice(headerIndex);

  const updatedContentBase64 = Buffer.from(contentWithNewChanges).toString('base64');

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'docs/src/testnet-breaking-changes.md',
    message: title,
    content: updatedContentBase64,
    sha: fileSha,
    branch: head,
  });

  // Create the pull request
  await octokit.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
  });
}

// Fetch releases from the GitHub API and update breaking changes
axios.get(apiUrl)
  .then(async response => {
    const releases = response.data;

    // Filter releases to include only those after the starting version
    const filteredReleases = releases.filter(release => {
      return semver.gt(release.tag_name, startingVersion);
    });

    // Extract the new changes
    const newChanges = extractNewChanges(logFileContent, filteredReleases);

    // Prepend the new changes to the log file if there are any
    if (newChanges) {
      fs.writeFileSync(logFilePath, newChanges + logFileContent);
      console.log('Breaking changes updated.');

      // Create a pull request to append the changes
      const octokit = new Octokit({ auth: process.env.MY_GITHUB_TOKEN });  // Use your new secret name here
      const branchName = `update-breaking-changes-${Date.now()}`;
      await createPullRequest(newChanges, octokit, branchName);
      console.log('Pull request created.');
    } else {
      console.log('No new breaking changes to update.');
    }
  })
  .catch(error => {
    console.error('Error fetching releases:', error);
  });
