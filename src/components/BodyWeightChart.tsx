"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Entry {
  date: string;
  weight: number;
}

interface Props {
  data: Entry[];
}

export default function BodyWeightChart({ data }: Props) {
  if (data.length < 1) return null;

  const chartData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      weight: d.weight,
    }));

  const minW = Math.min(...chartData.map((d) => d.weight)) - 1;
  const maxW = Math.max(...chartData.map((d) => d.weight)) + 1;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="date" stroke="var(--chart-text)" fontSize={10} tickLine={false} />
        <YAxis stroke="var(--chart-text)" fontSize={10} domain={[minW, maxW]} tickLine={false} axisLine={false} width={36} />
        <Tooltip
          contentStyle={{ backgroundColor: "var(--bg)", border: "1px solid var(--chart-grid)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--fg)" }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#f472b6"
          strokeWidth={2}
          dot={{ fill: "#f472b6", r: 3 }}
          name="Weight (kg)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
