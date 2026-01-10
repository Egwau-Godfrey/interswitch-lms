"use client";

import * as React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Filter, TrendingUp, AlertTriangle, CheckCircle2, Banknote } from "lucide-react";

const portfolioData = [
  { name: "Active", value: 65, color: "#004B91" },
  { name: "Overdue", value: 15, color: "#F59E0B" },
  { name: "Defaulted", value: 5, color: "#EF4444" },
  { name: "Cleared", value: 15, color: "#10B981" },
];

const agingData = [
  { range: "1-7 Days", value: 450000 },
  { range: "8-14 Days", value: 320000 },
  { range: "15-30 Days", value: 180000 },
  { range: "30+ Days", value: 95000 },
];

const monthlyTrends = [
  { month: "Jan", disbursed: 4.2, collected: 3.8 },
  { month: "Feb", disbursed: 4.8, collected: 4.1 },
  { month: "Mar", disbursed: 5.1, collected: 4.9 },
  { month: "Apr", disbursed: 4.5, collected: 4.7 },
  { month: "May", disbursed: 5.9, collected: 5.2 },
  { month: "Jun", disbursed: 6.2, collected: 5.8 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into portfolio performance and recovery.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="bg-[#E31C2D] hover:bg-[#C21827]">
            <Download className="w-4 h-4 mr-2" />
            Download PDF Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio at Risk (PAR 30)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">4.2%</div>
            <p className="text-xs text-muted-foreground mt-1">-0.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Loan Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦84,500</div>
            <p className="text-xs text-muted-foreground mt-1">+₦2,100 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">92.8%</div>
            <p className="text-xs text-muted-foreground mt-1">+1.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Interest Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#004B91]">₦2.45M</div>
            <p className="text-xs text-muted-foreground mt-1">+15% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Status Distribution</CardTitle>
            <CardDescription>Breakdown of all active and historical loans</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth Trends</CardTitle>
            <CardDescription>Disbursements vs Collections (Millions ₦)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="disbursed" name="Disbursements" stroke="#004B91" strokeWidth={2} />
                <Line type="monotone" dataKey="collected" name="Collections" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Aging Analysis (Overdue Value)</CardTitle>
            <CardDescription>Value of outstanding loans categorized by days past due</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₦${value/1000}k`} />
                <Tooltip />
                <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
