// script.js

document.addEventListener('DOMContentLoaded', function () {
    fetchRSSFeeds();
    loadMRCEntries();
    loadThreatAlerts();
    document.getElementById('entry-form').addEventListener('submit', addMRCEntry);
    document.getElementById('severity-filter').addEventListener('change', filterEntries);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('export-rss').addEventListener('click', exportRSSFeeds);
    document.getElementById('export-mrc').addEventListener('click', exportMRCEntries);
    document.getElementById('export-alerts').addEventListener('click', exportThreatAlerts);
});

// List of RSS feeds for RSS tab and Threat Alerts tab
const rssSources = [
    'https://www.retaildive.com/rss/technology',
    'https://www.darkreading.com/rss_simple.asp',
    'https://krebsonsecurity.com/feed/',
    'https://www.scmagazine.com/home/feed/',
    'https://www.wsj.com/xml/rss/3_7455.xml'
];

const alertSources = [
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.zdnet.com/topic/security/rss.xml',
    'https://www.csoonline.com/index.rss',
    'https://threatpost.com/feed/'
];

// Fetch RSS Feeds for RSS tab
function fetchRSSFeeds() {
    const rssEntriesContainer = document.getElementById('rss-entries');
    rssEntriesContainer.innerHTML = ''; // Clear previous entries

    const promises = rssSources.map(rssUrl =>
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
            .then(response => response.json())
    );

    Promise.all(promises)
        .then(results => {
            const entries = results.flatMap(result => result.items);
            entries.sort(() => 0.5 - Math.random()); // Shuffle entries

            entries.slice(0, 10).forEach(entry => { // Display only 10 entries
                const severity = determineSeverity(entry.title, entry.description);
                const entryElement = document.createElement('div');
                entryElement.classList.add('list-group-item');
                entryElement.dataset.severity = severity;
                entryElement.innerHTML = `
                    <h5>${entry.title}</h5>
                    <p>${entry.description}</p>
                    <span class="badge badge-${severityBadgeClass(severity)}">${severity}</span>
                    <a href="${entry.link}" target="_blank" class="btn btn-link btn-sm">Read more</a>
                `;
                rssEntriesContainer.appendChild(entryElement);
            });
        })
        .catch(error => console.error('Error fetching RSS feeds:', error));
}

// Fetch Real-Time Threat Alerts
function loadThreatAlerts() {
    const alertEntriesContainer = document.getElementById('alert-entries');
    alertEntriesContainer.innerHTML = ''; // Clear previous entries

    const promises = alertSources.map(url =>
        fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
            .then(response => response.json())
    );

    Promise.all(promises)
        .then(results => {
            const entries = results.flatMap(result => result.items);
            entries.sort(() => 0.5 - Math.random()); // Shuffle entries

            entries.slice(0, 10).forEach(item => { // Display only 10 entries
                const severity = determineSeverity(item.title, item.description);
                const entryElement = document.createElement('div');
                entryElement.classList.add('list-group-item');
                entryElement.dataset.severity = severity;
                entryElement.innerHTML = `
                    <h5>${item.title}</h5>
                    <p>${item.description}</p>
                    <span class="badge badge-${severityBadgeClass(severity)}">${severity}</span>
                    <a href="${item.link}" target="_blank" class="btn btn-link btn-sm">Read more</a>
                `;
                alertEntriesContainer.appendChild(entryElement);
            });
        })
        .catch(error => console.error('Error fetching threat alerts:', error));
}

// Determine severity (simple heuristic)
function determineSeverity(title, description) {
    const keywords = {
        high: ['breach', 'ransomware', 'critical', 'attack', 'hacked'],
        medium: ['vulnerability', 'exploit', 'risk'],
        low: ['update', 'patch', 'warning']
    };

    for (const severity in keywords) {
        if (keywords[severity].some(word => title.includes(word) || description.includes(word))) {
            return severity;
        }
    }
    return 'low';
}

// Map severity to Bootstrap badge classes
function severityBadgeClass(severity) {
    switch (severity) {
        case 'high':
            return 'danger';
        case 'medium':
            return 'warning';
        default:
            return 'success';
    }
}

// Load MRC Entries from Local Storage
function loadMRCEntries() {
    const entries = JSON.parse(localStorage.getItem('mrcEntries')) || [];
    const mrcEntriesContainer = document.getElementById('mrc-entries');
    const adminMrcEntriesContainer = document.getElementById('admin-mrc-entries');
    mrcEntriesContainer.innerHTML = '';
    adminMrcEntriesContainer.innerHTML = '';

    entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.classList.add('list-group-item');
        entryElement.dataset.severity = entry.severity;
        entryElement.innerHTML = `
            <h5>${entry.title}</h5>
            <p>${entry.description}</p>
            <span class="badge badge-${severityBadgeClass(entry.severity)}">${entry.severity}</span>
        `;
        mrcEntriesContainer.appendChild(entryElement);
        adminMrcEntriesContainer.appendChild(entryElement.cloneNode(true));
    });
}

// Add MRC Entry
function addMRCEntry(event) {
    event.preventDefault();

    const title = document.getElementById('manual-title').value;
    const description = document.getElementById('manual-description').value;
    const type = document.getElementById('manual-type').value;
    const severity = document.getElementById('manual-severity').value;

    const newEntry = { title, description, type, severity };
    const entries = JSON.parse(localStorage.getItem('mrcEntries')) || [];
    entries.push(newEntry);

    localStorage.setItem('mrcEntries', JSON.stringify(entries));

    document.getElementById('manual-title').value = '';
    document.getElementById('manual-description').value = '';
    document.getElementById('manual-type').value = '';
    document.getElementById('manual-severity').value = 'low';

    loadMRCEntries();
}

// Filter Entries by Severity
function filterEntries() {
    const filter = document.getElementById('severity-filter').value;
    const rssEntries = document.querySelectorAll('#rss-entries .list-group-item');
    const mrcEntries = document.querySelectorAll('#mrc-entries .list-group-item');

    const filterFunction = entry => {
        if (filter === 'all') return true;
        return entry.dataset.severity === filter;
    };

    rssEntries.forEach(entry => entry.style.display = filterFunction(entry) ? '' : 'none');
    mrcEntries.forEach(entry => entry.style.display = filterFunction(entry) ? '' : 'none');
}

// Handle Admin Login
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'shiva' && password === 'Lolthxs123!1') {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
    } else {
        alert('Incorrect username or password.');
    }
}

// Export RSS Feeds to Excel
function exportRSSFeeds() {
    const rssEntries = Array.from(document.querySelectorAll('#rss-entries .list-group-item'));
    const data = rssEntries.map(entry => ({
        title: entry.querySelector('h5').innerText,
        description: entry.querySelector('p').innerText,
        severity: entry.querySelector('span').innerText,
        link: entry.querySelector('a').href
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RSS Feeds');
    XLSX.writeFile(wb, 'rss_feeds.xlsx');
}

// Export MRC Entries to Excel
function exportMRCEntries() {
    const mrcEntries = Array.from(document.querySelectorAll('#mrc-entries .list-group-item'));
    const data = mrcEntries.map(entry => ({
        title: entry.querySelector('h5').innerText,
        description: entry.querySelector('p').innerText,
        severity: entry.querySelector('span').innerText
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MRC Entries');
    XLSX.writeFile(wb, 'mrc_entries.xlsx');
}

// Export Threat Alerts to Excel
function exportThreatAlerts() {
    const alertEntries = Array.from(document.querySelectorAll('#alert-entries .list-group-item'));
    const data = alertEntries.map(entry => ({
        title: entry.querySelector('h5').innerText,
        description: entry.querySelector('p').innerText,
        severity: entry.querySelector('span').innerText,
        link: entry.querySelector('a').href
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Threat Alerts');
    XLSX.writeFile(wb, 'threat_alerts.xlsx');
}
