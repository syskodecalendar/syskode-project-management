import { activityService } from './activityService';
const PRICING_KEY = 'syskode_pricings_store';
const VENDOR_KEY = 'syskode_vendors_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadPricings() {
    const stored = localStorage.getItem(PRICING_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch (e) { }
    }
    localStorage.setItem(PRICING_KEY, JSON.stringify([]));
    return [];
}
function savePricings(pricings) {
    localStorage.setItem(PRICING_KEY, JSON.stringify(pricings));
    databaseService.queueSync(PRICING_KEY, pricings);
}
function loadVendors() {
    const stored = localStorage.getItem(VENDOR_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch (e) { }
    }
    localStorage.setItem(VENDOR_KEY, JSON.stringify([]));
    return [];
}
function saveVendors(vendors) {
    localStorage.setItem(VENDOR_KEY, JSON.stringify(vendors));
    databaseService.queueSync(VENDOR_KEY, vendors);
}
export const pricingService = {
    getSyskodePricingByLead(leadId) {
        return loadPricings().find(p => p.leadId === leadId && p.isCurrent);
    },
    getAllSyskodePricingsByLead(leadId) {
        return loadPricings().filter(p => p.leadId === leadId);
    },
    createSyskodePricing(data) {
        const pricings = loadPricings();
        pricings.filter(p => p.leadId === data.leadId).forEach(p => (p.isCurrent = false));
        const totalBeforeVat = data.developmentPrice +
            data.hostingPrice +
            data.supportPrice +
            data.amcPrice +
            data.otherCharges -
            data.discount;
        const vatAmount = Math.round((totalBeforeVat * (data.vatPercentage || 10)) / 100);
        const finalAmount = totalBeforeVat + vatAmount;
        const newPricing = {
            ...data,
            id: createDatabaseId(),
            vatAmount,
            total: totalBeforeVat,
            finalAmount,
            uploadedDate: new Date().toISOString().split('T')[0],
            isCurrent: true
        };
        pricings.unshift(newPricing);
        savePricings(pricings);
        activityService.logActivity(data.uploadedBy || 'Sales User', 'Pricing Created', 'pricing', newPricing.id, `Created Syskode pricing (${newPricing.version}) total: BHD ${finalAmount}`);
        return newPricing;
    },
    deleteSyskodePricing(id) {
        const pricings = loadPricings().filter(p => p.id !== id);
        localStorage.setItem(PRICING_KEY, JSON.stringify(pricings));
        databaseService.queueDelete('syskode_pricings', id);
    },
    getVendorsByLead(leadId) {
        return loadVendors().filter(v => v.leadId === leadId);
    },
    addVendor(leadId, vendorName, contactPerson, email, phone, notes) {
        const vendors = loadVendors();
        const newVendor = {
            id: createDatabaseId(),
            leadId,
            vendorName,
            contactPerson,
            email,
            phone,
            notes,
            proposals: [],
            pricings: []
        };
        vendors.unshift(newVendor);
        saveVendors(vendors);
        activityService.logActivity('Sales User', 'Vendor Added', 'vendor', newVendor.id, `Added competitor/vendor "${vendorName}" for lead comparison`);
        return newVendor;
    },
    deleteVendor(id) {
        const vendors = loadVendors().filter(v => v.id !== id);
        localStorage.setItem(VENDOR_KEY, JSON.stringify(vendors));
        databaseService.queueDelete('vendors', id);
    },
    addVendorPricing(vendorId, price, finalPrice, notes) {
        const vendors = loadVendors();
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor)
            throw new Error('Vendor not found');
        const version = `V${vendor.pricings.length + 1}.0`;
        vendor.pricings.push({
            id: createDatabaseId(),
            version,
            price,
            currency: 'BHD',
            vat: Math.round(price * 0.1),
            discount: 0,
            finalPrice: finalPrice || Math.round(price * 1.1),
            notes,
            uploadedDate: new Date().toISOString().split('T')[0]
        });
        saveVendors(vendors);
        return vendor;
    }
};
