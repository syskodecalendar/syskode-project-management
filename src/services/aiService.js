export const aiService = {
    async createProposalFromRfq(args) {
        const fileBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || '');
                resolve(result.includes(',') ? result.split(',')[1] : result);
            };
            reader.onerror = () => reject(reader.error || new Error('Unable to read RFQ file'));
            reader.readAsDataURL(args.file);
        });
        const response = await fetch('/api/ai/create-proposal-from-rfq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileBase64,
                mimeType: args.file.type || 'application/pdf',
                fileName: args.file.name,
                targetProposalName: args.targetProposalName,
                clientName: args.clientName,
                companyName: args.companyName,
                proposalCategory: args.proposalCategory,
                instructions: args.instructions,
            }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success)
            throw new Error(payload.error || 'Unable to create proposal from RFQ.');
        const sections = (payload.sections || []).map((section) => ({
            id: crypto.randomUUID(),
            name: String(section.name || 'RFQ Section'),
            blocks: (Array.isArray(section.blocks) ? section.blocks : []).map((block) => ({
                id: crypto.randomUUID(),
                type: ['heading', 'subheading', 'paragraph', 'points', 'table'].includes(block.type) ? block.type : 'paragraph',
                text: typeof block.text === 'string' ? block.text : undefined,
                points: Array.isArray(block.points) ? block.points.map(String) : undefined,
                tableHeaders: Array.isArray(block.tableHeaders) ? block.tableHeaders.map(String) : undefined,
                tableRows: Array.isArray(block.tableRows) ? block.tableRows.map((row) => Array.isArray(row) ? row.map(String) : []) : undefined,
                tableCaption: typeof block.tableCaption === 'string' ? block.tableCaption : undefined,
            })),
        }));
        return { success: true, sections, rfqSummary: payload.rfqSummary, assumptions: payload.assumptions || [], notes: payload.notes };
    },
    async extractVendorProposalSections(args) {
        const fileBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || '');
                resolve(result.includes(',') ? result.split(',')[1] : result);
            };
            reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
            reader.readAsDataURL(args.file);
        });
        const response = await fetch('/api/ai/extract-vendor-proposal-sections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileBase64,
                mimeType: args.file.type || 'application/pdf',
                fileName: args.file.name,
                vendorName: args.vendorName,
                fromHeading: args.fromHeading,
                toHeading: args.toHeading,
                targetProposalName: args.targetProposalName,
                clientName: args.clientName,
                companyName: args.companyName,
            }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
            throw new Error(payload.error || 'Unable to extract vendor proposal sections.');
        }
        const sections = (payload.sections || []).map((section) => ({
            id: crypto.randomUUID(),
            name: String(section.name || 'Imported Section'),
            blocks: (Array.isArray(section.blocks) ? section.blocks : []).map((block) => ({
                id: crypto.randomUUID(),
                type: ['heading', 'subheading', 'paragraph', 'points', 'table'].includes(block.type) ? block.type : 'paragraph',
                text: typeof block.text === 'string' ? block.text : undefined,
                points: Array.isArray(block.points) ? block.points.map(String) : undefined,
                tableHeaders: Array.isArray(block.tableHeaders) ? block.tableHeaders.map(String) : undefined,
                tableRows: Array.isArray(block.tableRows) ? block.tableRows.map((row) => Array.isArray(row) ? row.map(String) : []) : undefined,
                tableCaption: typeof block.tableCaption === 'string' ? block.tableCaption : undefined,
            })),
        }));
        return { success: true, sections, sourceRangeFound: payload.sourceRangeFound, notes: payload.notes };
    },
    async summarizeProposal(proposalText, documentName, leadName) {
        try {
            const response = await fetch('/api/ai/summarize-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalText, documentName, leadName })
            });
            if (!response.ok)
                throw new Error('Network response was not ok');
            return await response.json();
        }
        catch (e) {
            throw new Error(e?.message || 'AI proposal summary is unavailable. Check the server and GEMINI_API_KEY.');
        }
    },
    async compareProposals(syskodeProposal, syskodePricing, competitorName, vendorProposal, vendorPricing) {
        try {
            const response = await fetch('/api/ai/compare-proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ syskodeProposal, syskodePricing, competitorName, vendorProposal, vendorPricing })
            });
            if (!response.ok)
                throw new Error('Network response was not ok');
            return await response.json();
        }
        catch (e) {
            throw new Error(e?.message || 'AI proposal comparison is unavailable. Check the server and GEMINI_API_KEY.');
        }
    },
    async generateProjectTasks({ project, members, instructions, count = 8, dueDate = '' }) {
        const response = await fetch('/api/ai/generate-project-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project, members, instructions, count, dueDate })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success)
            throw new Error(payload.error || 'Unable to generate project tasks.');
        return { success: true, tasks: Array.isArray(payload.tasks) ? payload.tasks : [] };
    },
    async generateTestCases(projectType, projectDescription, modules, websiteUrl, projectId = '') {
        try {
            const response = await fetch('/api/ai/generate-test-cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectType, projectDescription, modules, websiteUrl })
            });
            if (!response.ok)
                throw new Error('Network response was not ok');
            const data = await response.json();
            return {
                success: data.success,
                testCases: (data.testCases || []).map((tc) => ({
                    projectId,
                    module: typeof tc.module === 'string' ? tc.module : '',
                    feature: typeof tc.feature === 'string' ? tc.feature : '',
                    scenario: typeof tc.scenario === 'string' ? tc.scenario : '',
                    preconditions: typeof tc.preconditions === 'string' ? tc.preconditions : '',
                    steps: Array.isArray(tc.steps) ? tc.steps.map(String) : [],
                    expectedResult: typeof tc.expectedResult === 'string' ? tc.expectedResult : '',
                    status: 'Not Tested',
                    priority: tc.priority || 'High',
                    severity: tc.severity || 'Major',
                    assignedQA: ''
                })),
                isFallback: data.isFallback
            };
        }
        catch (e) {
            throw new Error(e?.message || 'AI test case generation is unavailable. Check the server and GEMINI_API_KEY.');
        }
    },
    async getProjectAssistantAnalysis(action, projectDetails) {
        try {
            const response = await fetch('/api/ai/project-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, projectDetails })
            });
            if (!response.ok)
                throw new Error('Network response was not ok');
            return await response.json();
        }
        catch (e) {
            throw new Error(e?.message || 'AI project assistant is unavailable. Check the server and GEMINI_API_KEY.');
        }
    }
};
