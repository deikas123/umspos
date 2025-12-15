"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerTypeData, RegionDistributionData } from "../types";

interface CustomerDistributionCardProps {
  readonly customerTypeData: CustomerTypeData[];
  readonly regionDistribution: RegionDistributionData[];
  readonly sidebarState: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const label = payload[0].payload.type || payload[0].payload.region;
    const capitalizedLabel = label
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return (
      <div className='bg-white p-3 border rounded-lg shadow-lg'>
        <p className='font-medium text-sm'>{capitalizedLabel}</p>
        <p className='text-sm text-muted-foreground'>
          Sales:{" "}
          <span className='font-medium text-primary'>{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function CustomerDistributionCard({
  customerTypeData,
  regionDistribution,
  sidebarState,
}: CustomerDistributionCardProps) {
  const [activeTab, setActiveTab] = useState<"customer" | "region">("customer");

  const getMostCommonType = () => {
    if (!customerTypeData.length) return "N/A";
    const mostCommon = customerTypeData.reduce((prev, current) =>
      prev.count > current.count ? prev : current
    ).type;
    return mostCommon
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getMostCommonRegion = () => {
    if (!regionDistribution.length) return "N/A";
    return regionDistribution.reduce(
      (prev, current) => (prev.count > current.count ? prev : current),
      regionDistribution[0]
    ).region;
  };

  // Sort region data by count for better visualization
  const sortedRegionData = [...regionDistribution].sort(
    (a, b) => b.count - a.count
  );

  return (
    <Card
      className={cn(
        "shadow-md hover:shadow-xl",
        sidebarState === "expanded"
          ? "col-span-full lg:col-span-2"
          : "col-span-full lg:col-span-2"
      )}>
      <CardHeader className='items-center pb-2'>
        <CardTitle>Sales Distribution</CardTitle>
        <CardDescription>
          Distribution of sales by customer type and region
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-0'>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "customer" | "region")}
          className='w-full'>
          <TabsList className='grid w-full grid-cols-2 mb-4'>
            <TabsTrigger
              value='customer'
              className='flex items-center gap-2 cursor-pointer'>
              <Users className='h-4 w-4' />
              Customer Type
            </TabsTrigger>
            <TabsTrigger
              value='region'
              className='flex items-center gap-2 cursor-pointer'>
              <MapPin className='h-4 w-4' />
              Region
            </TabsTrigger>
          </TabsList>

          <TabsContent value='customer' className='mt-0'>
            <div className='h-[320px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <RadarChart
                  data={customerTypeData}
                  margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                  <PolarGrid
                    stroke='hsl(var(--border))'
                    strokeDasharray='3 3'
                  />
                  <PolarAngleAxis
                    dataKey='type'
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                    tickFormatter={(value) =>
                      value
                        .split(" ")
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar
                    name='Customers'
                    dataKey='count'
                    stroke='hsl(var(--primary))'
                    fill='hsl(var(--primary))'
                    fillOpacity={0.5}
                    strokeWidth={2}
                    dot={{
                      r: 5,
                      fill: "hsl(var(--primary))",
                      fillOpacity: 1,
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value='region' className='mt-0'>
            <div className='h-[280px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={sortedRegionData}
                  layout='vertical'
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='hsl(var(--border))'
                  />
                  <XAxis type='number' tick={{ fontSize: 12 }} />
                  <YAxis
                    type='category'
                    dataKey='region'
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey='count' fill='#E46020' radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm pt-4'>
        <div className='flex items-center gap-2 font-medium leading-none'>
          {activeTab === "customer" ? (
            <>
              Most common: {getMostCommonType()}
              <TrendingUp className='h-4 w-4' />
            </>
          ) : (
            <>
              Top region: {getMostCommonRegion()}
              <TrendingUp className='h-4 w-4' />
            </>
          )}
        </div>
        <div className='flex items-center gap-2 leading-none text-muted-foreground'>
          Based on all sales data
        </div>
      </CardFooter>
    </Card>
  );
}
