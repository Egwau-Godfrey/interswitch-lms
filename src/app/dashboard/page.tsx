"use client";

import * as React from "react";
import { 
  Banknote, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

// Mock data for charts
const disbursementData = [
  { name: "Jan", amount: 450000 },
  { name: "Feb", amount: 520000 },
  { name: "Mar", amount: 480000 },
  { name: "Apr", amount: 610000 },
  { name: "May", amount: 550000 },
  { name: "Jun", amount: 670000 },
];

const collectionsData = [
  { name: "Mon", disbursed: 120000, collected: 80000 },
  { name: "Tue", disbursed: 150000, collected: 95000 },
  { name: "Wed", disbursed: 110000, collected: 115000 },
  { name: "Thu", disbursed: 180000, collected: 140000 },
  { name: "Fri", disbursed: 210000, collected: 190000 },
  { name: "Sat", disbursed: 90000, collected: 85000 },
  { name: "Sun", disbursed: 40000, collected: 60000 },
];

const statusDistribution = [
  { name: "Active", value: 65, color: "#004B91" },
  { name: "Cleared", value: 20, color: "#10B981" },
  { name: "Overdue", value: 10, color: "#F59E0B" },
  { name: "Defaulted", value: 5, color: "#EF4444" },
];

const overdueAging = [
  { range: "1-7 Days", value: 450000 },
  { range: "8-14 Days", value: 320000 },
  { range: "15-30 Days", value: 180000 },
  { range: "30+ Days", value: 95000 },
];

const recentActivity = [
  { id: 1, type: "loan", agent: "John Doe", amount: "UGX 50,000", status: "Approved", time: "10 mins ago" },
  { id: 2, type: "payment", agent: "Sarah Smith", amount: "UGX 25,000", status: "Received", time: "25 mins ago" },
  { id: 3, type: "loan", agent: "Michael Obi", amount: "UGX 100,000", status: "Disbursed", time: "1 hour ago" },
  { id: 4, type: "payment", agent: "Grace Ademola", amount: "UGX 15,000", status: "Received", time: "2 hours ago" },
  { id: 5, type: "alert", agent: "David Chen", amount: "UGX 75,000", status: "Overdue", time: "3 hours ago" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time performance metrics for Interswitch Loans.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600">Total Active Loans</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Banknote className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-slate-800">UGX 12.45M</div>
            <div className="flex items-center text-sm mt-2 font-medium">
              <div className="flex items-center bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </div>
              <span className="text-slate-400 ml-2 text-xs">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600">Disbursed (Month)</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-slate-800">UGX 4.28M</div>
            <div className="flex items-center text-sm mt-2 font-medium">
              <div className="flex items-center bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2%
              </div>
              <span className="text-slate-400 ml-2 text-xs">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600">Collections (Month)</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-slate-800">UGX 3.15M</div>
            <div className="flex items-center text-sm mt-2 font-medium">
              <div className="flex items-center bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15.3%
              </div>
              <span className="text-slate-400 ml-2 text-xs">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600">Overdue Loans</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-slate-800">UGX 845K</div>
            <div className="flex items-center text-sm mt-2 font-medium">
              <div className="flex items-center bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -2.1%
              </div>
              <span className="text-slate-400 ml-2 text-xs">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Disbursement vs Collections</CardTitle>
            <CardDescription>Weekly comparison of funds out and funds in</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `UGX ${value/1000}k`} />
                <Tooltip 
                  formatter={(value) => [`UGX ${Number(value).toLocaleString()}`, ""]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="disbursed" name="Disbursements" fill="#004B91" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collections" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Loan Status Distribution</CardTitle>
            <CardDescription>Portfolio health summary</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Overdue Aging Report</CardTitle>
            <CardDescription>Value of loans by days past due</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={overdueAging}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} />
                <Tooltip 
                   formatter={(value) => [`UGX ${Number(value).toLocaleString()}`, "Value"]}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system transactions and alerts</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      item.type === "loan" && "bg-blue-100 text-blue-600",
                      item.type === "payment" && "bg-emerald-100 text-emerald-600",
                      item.type === "alert" && "bg-rose-100 text-rose-600"
                    )}>
                      {item.type === "loan" && <Banknote className="w-5 h-5" />}
                      {item.type === "payment" && <CheckCircle2 className="w-5 h-5" />}
                      {item.type === "alert" && <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.agent}</p>
                      <p className="text-xs text-muted-foreground">{item.status} • {item.amount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground flex items-center justify-end">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.time}
                    </p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 mt-1">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
