import { activityService } from './activityService';
const STORAGE_KEY = 'syskode_qa_testcases_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadTestCases() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch (e) { }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
}
function saveTestCases(cases) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    databaseService.queueSync(STORAGE_KEY, cases);
}
export const qaService = {
    getTestCases() {
        return loadTestCases();
    },
    getTestCasesByProject(projectId) {
        return loadTestCases().filter(tc => tc.projectId === projectId);
    },
    createTestCase(data) {
        const cases = loadTestCases();
        const id = createDatabaseId();
        const testCaseId = `SYS-TC-${id.slice(0, 8).toUpperCase()}`;
        const newCase = {
            ...data,
            id,
            testCaseId
        };
        cases.unshift(newCase);
        saveTestCases(cases);
        activityService.logActivity(data.createdBy || data.assignedQA || 'System', 'Test Case Created', 'testCase', newCase.id, `Created test case ${testCaseId} for module "${data.module}"`);
        return newCase;
    },
    importBulkTestCases(casesToImport) {
        const existing = loadTestCases();
        const imported = [];
        casesToImport.forEach((data, index) => {
            const id = createDatabaseId();
            const testCaseId = `SYS-TC-${id.slice(0, 8).toUpperCase()}`;
            const tc = { ...data, id, testCaseId };
            imported.push(tc);
        });
        const updated = [...imported, ...existing];
        saveTestCases(updated);
        activityService.logActivity('System', 'Bulk Test Cases Imported', 'testCase', 'bulk', `Imported ${imported.length} test cases via template / AI generator`);
        return imported;
    },
    updateTestResult(id, status, actualResult, comments, qaName) {
        const cases = loadTestCases();
        const idx = cases.findIndex(c => c.id === id);
        if (idx === -1)
            throw new Error('Test case not found');
        cases[idx].status = status;
        if (actualResult)
            cases[idx].actualResult = actualResult;
        if (comments)
            cases[idx].comments = comments;
        cases[idx].testedDate = new Date().toISOString().split('T')[0];
        saveTestCases(cases);
        activityService.logActivity(qaName || cases[idx].assignedQA || 'System', 'Test Case Status Updated', 'testCase', id, `Marked test case ${cases[idx].testCaseId} as ${status}`);
        return cases[idx];
    },
    deleteTestCase(id) {
        const cases = loadTestCases().filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
        databaseService.queueDelete('test_cases', id);
    },
    getQAStats(projectId) {
        const cases = projectId
            ? this.getTestCasesByProject(projectId)
            : this.getTestCases();
        const total = cases.length;
        const passed = cases.filter(c => c.status === 'Passed').length;
        const failed = cases.filter(c => c.status === 'Failed').length;
        const blocked = cases.filter(c => c.status === 'Blocked').length;
        const retest = cases.filter(c => c.status === 'Retest').length;
        const notTested = cases.filter(c => c.status === 'Not Tested').length;
        const passPercentage = total > 0 ? Math.round((passed / total) * 100) : 0;
        const criticalDefects = cases.filter(c => c.status === 'Failed' && (c.severity === 'Critical' || c.severity === 'Blocker')).length;
        return { total, passed, failed, blocked, retest, notTested, passPercentage, criticalDefects };
    }
};
