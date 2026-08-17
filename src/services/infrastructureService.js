import { activityService } from './activityService';
const DOMAINS_KEY = 'syskode_domains_store';
const HOSTING_KEY = 'syskode_hosting_store';
const SSL_KEY = 'syskode_ssl_store';
const REPO_KEY = 'syskode_repos_store';
const DEPLOY_KEY = 'syskode_deploys_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadStorage(key, fallback) {
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch (e) { }
    }
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
}
function saveStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    databaseService.queueSync(key, data);
}
export const infrastructureService = {
    getDomains() {
        return loadStorage(DOMAINS_KEY, []);
    },
    getHosting() {
        return loadStorage(HOSTING_KEY, []);
    },
    getSSL() {
        return loadStorage(SSL_KEY, []);
    },
    getRepositories() {
        return loadStorage(REPO_KEY, []);
    },
    getDeployments() {
        return loadStorage(DEPLOY_KEY, []);
    },
    addDomain(data) {
        const list = this.getDomains();
        const item = { ...data, id: createDatabaseId() };
        list.unshift(item);
        saveStorage(DOMAINS_KEY, list);
        activityService.logActivity('DevOps', 'Domain Added', 'infrastructure', item.id, `Added domain ${item.domainName}`);
        return item;
    },
    addHosting(data) {
        const list = this.getHosting();
        const item = { ...data, id: createDatabaseId() };
        list.unshift(item);
        saveStorage(HOSTING_KEY, list);
        activityService.logActivity('DevOps', 'Hosting Added', 'infrastructure', item.id, `Added hosting account ${item.hostingProvider}`);
        return item;
    },
    addSSL(data) {
        const list = this.getSSL();
        const item = { ...data, id: createDatabaseId() };
        list.unshift(item);
        saveStorage(SSL_KEY, list);
        activityService.logActivity('DevOps', 'SSL Added', 'infrastructure', item.id, `Added SSL cert ${item.provider}`);
        return item;
    },
    addRepository(data) {
        const list = this.getRepositories();
        const item = { ...data, id: createDatabaseId() };
        list.unshift(item);
        saveStorage(REPO_KEY, list);
        activityService.logActivity('DevOps', 'Repository Added', 'infrastructure', item.id, `Added repository ${item.githubUrl}`);
        return item;
    },
    addDeployment(data) {
        const list = this.getDeployments();
        const item = { ...data, id: createDatabaseId() };
        list.unshift(item);
        saveStorage(DEPLOY_KEY, list);
        activityService.logActivity('DevOps', 'Deployment Added', 'infrastructure', item.id, `Added ${item.deploymentProvider} deployment`);
        return item;
    },
    updateDomain(id, updates) {
        const list = this.getDomains();
        const index = list.findIndex(x => x.id === id);
        if (index < 0)
            return null;
        list[index] = { ...list[index], ...updates };
        saveStorage(DOMAINS_KEY, list);
        activityService.logActivity('DevOps', 'Domain Updated', 'infrastructure', id, `Updated domain ${list[index].domainName}`);
        return list[index];
    },
    updateHosting(id, updates) {
        const list = this.getHosting();
        const index = list.findIndex(x => x.id === id);
        if (index < 0)
            return null;
        list[index] = { ...list[index], ...updates };
        saveStorage(HOSTING_KEY, list);
        activityService.logActivity('DevOps', 'Hosting Updated', 'infrastructure', id, `Updated hosting ${list[index].hostingProvider}`);
        return list[index];
    },
    updateSSL(id, updates) {
        const list = this.getSSL();
        const index = list.findIndex(x => x.id === id);
        if (index < 0)
            return null;
        list[index] = { ...list[index], ...updates };
        saveStorage(SSL_KEY, list);
        activityService.logActivity('DevOps', 'SSL Updated', 'infrastructure', id, `Updated SSL ${list[index].provider}`);
        return list[index];
    },
    updateRepository(id, updates) {
        const list = this.getRepositories();
        const index = list.findIndex(x => x.id === id);
        if (index < 0)
            return null;
        list[index] = { ...list[index], ...updates };
        saveStorage(REPO_KEY, list);
        activityService.logActivity('DevOps', 'Repository Updated', 'infrastructure', id, `Updated repository ${list[index].githubUrl}`);
        return list[index];
    },
    updateDeployment(id, updates) {
        const list = this.getDeployments();
        const index = list.findIndex(x => x.id === id);
        if (index < 0)
            return null;
        list[index] = { ...list[index], ...updates };
        saveStorage(DEPLOY_KEY, list);
        activityService.logActivity('DevOps', 'Deployment Updated', 'infrastructure', id, `Updated ${list[index].deploymentProvider} deployment`);
        return list[index];
    },
    deleteDomain(id) {
        localStorage.setItem(DOMAINS_KEY, JSON.stringify(this.getDomains().filter(x => x.id !== id)));
        databaseService.queueDelete('domain_records', id);
    },
    deleteHosting(id) {
        localStorage.setItem(HOSTING_KEY, JSON.stringify(this.getHosting().filter(x => x.id !== id)));
        databaseService.queueDelete('hosting_accounts', id);
    },
    deleteSSL(id) {
        localStorage.setItem(SSL_KEY, JSON.stringify(this.getSSL().filter(x => x.id !== id)));
        databaseService.queueDelete('ssl_certificates', id);
    },
    deleteRepository(id) {
        localStorage.setItem(REPO_KEY, JSON.stringify(this.getRepositories().filter(x => x.id !== id)));
        databaseService.queueDelete('repository_records', id);
    },
    deleteDeployment(id) {
        localStorage.setItem(DEPLOY_KEY, JSON.stringify(this.getDeployments().filter(x => x.id !== id)));
        databaseService.queueDelete('deployment_records', id);
    },
    getRenewalWarnings() {
        const warnings = [];
        const today = new Date();
        // Check Domains
        this.getDomains().forEach(dom => {
            const renewalDate = new Date(dom.renewalDate);
            const diffTime = renewalDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
            if (diffDays <= 60) {
                let severity = 'Low (<=60d)';
                if (diffDays <= 0)
                    severity = 'Expired';
                else if (diffDays <= 7)
                    severity = 'Critical (<=7d)';
                else if (diffDays <= 15)
                    severity = 'High (<=15d)';
                else if (diffDays <= 30)
                    severity = 'Medium (<=30d)';
                warnings.push({
                    id: `warn-dom-${dom.id}`,
                    type: 'Domain',
                    title: `Domain Renewal: ${dom.domainName}`,
                    relatedProject: dom.projectId,
                    expiryDate: dom.renewalDate,
                    daysRemaining: diffDays,
                    severity
                });
            }
        });
        // Check Hosting
        this.getHosting().forEach(hst => {
            const renewalDate = new Date(hst.renewalDate);
            const diffTime = renewalDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
            if (diffDays <= 60) {
                let severity = 'Low (<=60d)';
                if (diffDays <= 0)
                    severity = 'Expired';
                else if (diffDays <= 7)
                    severity = 'Critical (<=7d)';
                else if (diffDays <= 15)
                    severity = 'High (<=15d)';
                else if (diffDays <= 30)
                    severity = 'Medium (<=30d)';
                warnings.push({
                    id: `warn-hst-${hst.id}`,
                    type: 'Hosting',
                    title: `Hosting Renewal: ${hst.hostingProvider}`,
                    relatedProject: hst.projectId,
                    expiryDate: hst.renewalDate,
                    daysRemaining: diffDays,
                    severity
                });
            }
        });
        // Check SSL
        this.getSSL().forEach(ssl => {
            const expiryDate = new Date(ssl.expiryDate);
            const diffTime = expiryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
            if (diffDays <= 60) {
                let severity = 'Low (<=60d)';
                if (diffDays <= 0)
                    severity = 'Expired';
                else if (diffDays <= 7)
                    severity = 'Critical (<=7d)';
                else if (diffDays <= 15)
                    severity = 'High (<=15d)';
                else if (diffDays <= 30)
                    severity = 'Medium (<=30d)';
                warnings.push({
                    id: `warn-ssl-${ssl.id}`,
                    type: 'SSL',
                    title: `SSL Expiry: ${ssl.provider}`,
                    relatedProject: ssl.projectId,
                    expiryDate: ssl.expiryDate,
                    daysRemaining: diffDays,
                    severity
                });
            }
        });
        return warnings.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }
};
