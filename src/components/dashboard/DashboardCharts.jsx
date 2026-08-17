import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { leadService } from '../../services/leadService';
import { projectService } from '../../services/projectService';
export const DashboardCharts = ({ leads: propLeads, projects: propProjects }) => {
    const leads = propLeads || leadService.getLeads() || [];
    const projects = propProjects || projectService.getProjects() || [];
    // Service Distribution
    const serviceCounts = {};
    leads.forEach(l => {
        const s = l.serviceInterested || 'Other';
        serviceCounts[s] = (serviceCounts[s] || 0) + 1;
    });
    const serviceData = Object.keys(serviceCounts).map(k => ({
        name: k,
        count: serviceCounts[k]
    }));
    // Project Health Data
    const healthCounts = {
        'On Track': projects.filter(p => p.healthStatus === 'On Track').length,
        Attention: projects.filter(p => p.healthStatus === 'Attention').length,
        'At Risk': projects.filter(p => p.healthStatus === 'At Risk').length
    };
    const healthData = [
        { name: 'On Track', value: healthCounts['On Track'], color: '#10B981' },
        { name: 'Attention', value: healthCounts.Attention, color: '#F59E0B' },
        { name: 'At Risk', value: healthCounts['At Risk'], color: '#EF4444' }
    ].filter(d => d.value > 0);
    // Salesperson Lead Distribution
    const salesCounts = {};
    leads.forEach(l => {
        const rep = l.assignedSalesperson || 'Unassigned';
        salesCounts[rep] = (salesCounts[rep] || 0) + 1;
    });
    const salesData = Object.keys(salesCounts).map(k => ({
        name: k,
        leads: salesCounts[k]
    }));
    return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Services Demands Bar Chart */}
      <div className="rounded-2xl border border-[#d8e7f0] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#071A35] mb-1">
          Leads Demand by Technology & Service
        </h3>
        <p className="text-xs text-[#667085] mb-4">
          Client inquiries categorized by service offerings
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviceData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe8f0"/>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} interval={0} angle={-15} textAnchor="end"/>
              <YAxis tick={{ fontSize: 10, fill: '#667085' }}/>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', color: '#071A35', borderRadius: '12px', borderColor: '#d8e7f0', fontSize: '12px' }}/>
              <Bar dataKey="count" fill="#00AEEF" radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Health Status Pie Chart */}
      <div className="rounded-2xl border border-[#d8e7f0] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#071A35] mb-1">
          Active Projects Health Analysis
        </h3>
        <p className="text-xs text-[#667085] mb-4">
          Deterministic evaluation of deadline, task completion & QA status
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={healthData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                {healthData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', color: '#071A35', borderRadius: '12px', borderColor: '#d8e7f0', fontSize: '12px' }}/>
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#667085' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>);
};
