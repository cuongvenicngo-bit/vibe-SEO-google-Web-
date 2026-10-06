import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { CompetitorProfile } from '../types';
import { RadarItem } from './RadarCriteriaChart';

export interface D3RadarChartProps {
  data: RadarItem[];
  actualCompetitors: CompetitorProfile[];
  visibleCompetitorSeries: string[];
  showUserSeries: boolean;
  showAvgSeries: boolean;
  viewMode: 'groups' | 'criteria';
  competitorColors: string[];
}

interface SeriesItem {
  id: string;
  name: string;
  color: string;
  fillOpacity: number;
  strokeWidth: number;
  strokeDasharray?: string;
  points: {
    axisIndex: number;
    score: number;
    value: number;
    angle: number;
    radius: number;
    x: number;
    y: number;
    subject: string;
    fullName: string;
    groupName?: string;
  }[];
}

export const D3RadarChart: React.FC<D3RadarChartProps> = ({
  data,
  actualCompetitors,
  visibleCompetitorSeries,
  showUserSeries,
  showAvgSeries,
  viewMode,
  competitorColors,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Active hover tooltip state
  const [hoveredPoint, setHoveredPoint] = useState<{
    seriesName: string;
    color: string;
    subject: string;
    fullName: string;
    groupName?: string;
    score: number;
    x: number;
    y: number;
  } | null>(null);

  // Dimensions
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 185;
  const totalAxes = data.length || 1;

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const levels = [20, 40, 60, 80, 100];

  // Compute active series list
  const activeSeriesList: SeriesItem[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    const list: SeriesItem[] = [];

    // Helper to calculate geometry for a score accessor
    const computePoints = (getScore: (item: RadarItem) => number) => {
      return data.map((item, idx) => {
        const score = Math.max(0, Math.min(100, getScore(item)));
        const angle = (idx / totalAxes) * 2 * Math.PI - Math.PI / 2;
        const radius = (score / 100) * maxRadius;
        return {
          axisIndex: idx,
          score,
          value: score,
          angle,
          radius,
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
          subject: item.subject,
          fullName: item.fullName || item.subject,
          groupName: item.groupName,
        };
      });
    };

    // 1. Competitor Average Series
    if (showAvgSeries && actualCompetitors.length > 0) {
      list.push({
        id: 'series-avg',
        name: `Trung bình ${actualCompetitors.length} đối thủ`,
        color: '#f59e0b',
        fillOpacity: visibleCompetitorSeries.length > 0 ? 0.08 : 0.2,
        strokeWidth: 2,
        points: computePoints((d) => d.competitorAvg),
      });
    }

    // 2. Individual Competitor Specific Series
    actualCompetitors.forEach((comp, idx) => {
      if (visibleCompetitorSeries.includes(comp.url)) {
        const color = competitorColors[idx % competitorColors.length];
        const hostname = comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        list.push({
          id: `series-comp-${comp.url}`,
          name: comp.name || hostname,
          color,
          fillOpacity: 0.08,
          strokeWidth: 2,
          strokeDasharray: '4 3',
          points: computePoints((d) => d[`comp_${idx}`] ?? 0),
        });
      }
    });

    // 3. User Website Series (Always primary)
    if (showUserSeries) {
      list.push({
        id: 'series-user',
        name: 'Website của bạn',
        color: '#2563eb',
        fillOpacity: 0.2,
        strokeWidth: 2.6,
        points: computePoints((d) => d.userScore),
      });
    }

    return list;
  }, [
    data,
    totalAxes,
    cx,
    cy,
    maxRadius,
    showUserSeries,
    showAvgSeries,
    actualCompetitors,
    visibleCompetitorSeries,
    competitorColors,
  ]);

  // Main D3 Rendering & Animated Transitions Effect
  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);

    // 1. Render Grid Rings (Web levels)
    const gridLayer = svg.select<SVGGElement>('.grid-layer');
    const ringSelection = gridLayer.selectAll<SVGPolygonElement, number>('.grid-ring').data(levels);

    ringSelection.join(
      (enter) =>
        enter
          .append('polygon')
          .attr('class', 'grid-ring')
          .attr('fill', 'none')
          .attr('stroke', '#94a3b8')
          .attr('stroke-opacity', 0.22)
          .attr('stroke-dasharray', '2 2')
          .attr('points', (level) => {
            const r = (level / 100) * maxRadius;
            return d3
              .range(totalAxes)
              .map((i) => {
                const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              })
              .join(' ');
          }),
      (update) =>
        update
          .transition()
          .duration(500)
          .ease(d3.easeCubicOut)
          .attr('points', (level) => {
            const r = (level / 100) * maxRadius;
            return d3
              .range(totalAxes)
              .map((i) => {
                const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              })
              .join(' ');
          }),
      (exit) => exit.remove()
    );

    // 2. Render Spoke Axes
    const axesLayer = svg.select<SVGGElement>('.axes-layer');
    const spokeSelection = axesLayer.selectAll<SVGLineElement, number>('.spoke-line').data(d3.range(totalAxes));

    spokeSelection.join(
      (enter) =>
        enter
          .append('line')
          .attr('class', 'spoke-line')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', (i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            return cx + maxRadius * Math.cos(angle);
          })
          .attr('y2', (i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            return cy + maxRadius * Math.sin(angle);
          })
          .attr('stroke', '#94a3b8')
          .attr('stroke-opacity', 0.25)
          .attr('stroke-width', 1),
      (update) =>
        update
          .transition()
          .duration(500)
          .ease(d3.easeCubicOut)
          .attr('x2', (i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            return cx + maxRadius * Math.cos(angle);
          })
          .attr('y2', (i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            return cy + maxRadius * Math.sin(angle);
          }),
      (exit) => exit.remove()
    );

    // 3. Render Axis Labels around Perimeter
    const labelsLayer = svg.select<SVGGElement>('.labels-layer');
    const labelSelection = labelsLayer
      .selectAll<SVGTextElement, RadarItem>('.axis-label')
      .data(data, (d) => d.key);

    labelSelection.join(
      (enter) =>
        enter
          .append('text')
          .attr('class', 'axis-label')
          .attr('text-anchor', (d, i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle);
            if (Math.abs(x) < 0.15) return 'middle';
            return x > 0 ? 'start' : 'end';
          })
          .attr('dominant-baseline', (d, i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            const y = Math.sin(angle);
            if (Math.abs(y) < 0.2) return 'central';
            return y > 0 ? 'hanging' : 'auto';
          })
          .attr('x', (d, i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            const labelR = maxRadius + (viewMode === 'criteria' ? 18 : 24);
            return cx + labelR * Math.cos(angle);
          })
          .attr('y', (d, i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            const labelR = maxRadius + (viewMode === 'criteria' ? 18 : 24);
            return cy + labelR * Math.sin(angle);
          })
          .attr('fill', '#64748b')
          .attr('font-size', viewMode === 'criteria' ? (totalAxes > 20 ? 9 : 10) : 11)
          .attr('font-weight', viewMode === 'groups' ? '700' : '600')
          .attr('opacity', 0)
          .text((d) => d.subject)
          .call((enter) =>
            enter
              .transition()
              .duration(400)
              .ease(d3.easeCubicOut)
              .attr('opacity', 1)
          ),
      (update) =>
        update
          .transition()
          .duration(500)
          .ease(d3.easeCubicOut)
          .attr('text-anchor', (d, i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle);
            if (Math.abs(x) < 0.15) return 'middle';
            return x > 0 ? 'start' : 'end';
          })
          .attr('dominant-baseline', (d, i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            const y = Math.sin(angle);
            if (Math.abs(y) < 0.2) return 'central';
            return y > 0 ? 'hanging' : 'auto';
          })
          .attr('x', (d, i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            const labelR = maxRadius + (viewMode === 'criteria' ? 18 : 24);
            return cx + labelR * Math.cos(angle);
          })
          .attr('y', (d, i) => {
            const angle = (i / totalAxes) * 2 * Math.PI - Math.PI / 2;
            const labelR = maxRadius + (viewMode === 'criteria' ? 18 : 24);
            return cy + labelR * Math.sin(angle);
          })
          .attr('font-size', viewMode === 'criteria' ? (totalAxes > 20 ? 9 : 10) : 11)
          .attr('font-weight', viewMode === 'groups' ? '700' : '600')
          .text((d) => d.subject),
      (exit) =>
        exit
          .transition()
          .duration(300)
          .attr('opacity', 0)
          .remove()
    );

    // 4. Render Series Layer with Smooth D3 Enter / Exit Transitions
    const seriesLayer = svg.select<SVGGElement>('.series-layer');
    const seriesSelection = seriesLayer
      .selectAll<SVGGElement, SeriesItem>('.radar-series-group')
      .data(activeSeriesList, (d) => d.id);

    // Helper: generate path string from points
    const makePath = (points: { x: number; y: number }[]) => {
      if (!points || points.length === 0) return '';
      return 'M ' + points.map((p) => `${p.x} ${p.y}`).join(' L ') + ' Z';
    };

    // Helper: collapsed center path for entry/exit
    const makeCollapsedPath = () => {
      return (
        'M ' +
        d3
          .range(totalAxes)
          .map(() => `${cx} ${cy}`)
          .join(' L ') +
        ' Z'
      );
    };

    seriesSelection.join(
      (enter) => {
        const g = enter.append('g').attr('class', 'radar-series-group').attr('data-id', (d) => d.id);

        // A. Polygon Area Entry (Bloom from center with cubic easing)
        g.append('path')
          .attr('class', 'series-area')
          .attr('d', makeCollapsedPath())
          .attr('fill', (d) => d.color)
          .attr('fill-opacity', 0)
          .attr('stroke', (d) => d.color)
          .attr('stroke-width', (d) => d.strokeWidth)
          .attr('stroke-dasharray', (d) => d.strokeDasharray || null)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .transition()
          .duration(600)
          .ease(d3.easeCubicOut)
          .attr('d', (d) => makePath(d.points))
          .attr('fill-opacity', (d) => d.fillOpacity);

        // B. Data Points (Circles) Entry with Staggered Pop-in
        const pointsGroup = g.append('g').attr('class', 'series-points');

        pointsGroup
          .selectAll<SVGCircleElement, any>('.data-point')
          .data((d) => d.points.map((p) => ({ ...p, seriesName: d.name, seriesColor: d.color })))
          .enter()
          .append('circle')
          .attr('class', 'data-point cursor-pointer transition-all')
          .attr('cx', (p) => p.x)
          .attr('cy', (p) => p.y)
          .attr('r', 0)
          .attr('fill', (p) => p.seriesColor)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0)
          .on('mouseenter', function (event, p) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 7)
              .attr('stroke-width', 2.5);
            setHoveredPoint({
              seriesName: p.seriesName,
              color: p.seriesColor,
              subject: p.subject,
              fullName: p.fullName,
              groupName: p.groupName,
              score: p.score,
              x: p.x,
              y: p.y,
            });
          })
          .on('mouseleave', function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 4.5)
              .attr('stroke-width', 1.5);
            setHoveredPoint(null);
          })
          .transition()
          .delay((_, i) => i * 14)
          .duration(550)
          .ease(d3.easeBackOut)
          .attr('r', 4.5)
          .attr('opacity', 1);

        return g;
      },
      (update) => {
        // A. Polygon Area Update
        update
          .select<SVGPathElement>('.series-area')
          .transition()
          .duration(500)
          .ease(d3.easeCubicInOut)
          .attr('d', (d) => makePath(d.points))
          .attr('fill', (d) => d.color)
          .attr('fill-opacity', (d) => d.fillOpacity)
          .attr('stroke', (d) => d.color)
          .attr('stroke-width', (d) => d.strokeWidth);

        // B. Data Points Update
        update.each(function (d) {
          const pointSel = d3
            .select(this)
            .select('.series-points')
            .selectAll<SVGCircleElement, any>('.data-point')
            .data(d.points.map((p) => ({ ...p, seriesName: d.name, seriesColor: d.color })));

          pointSel.join(
            (pEnter) =>
              pEnter
                .append('circle')
                .attr('class', 'data-point cursor-pointer transition-all')
                .attr('cx', (p) => p.x)
                .attr('cy', (p) => p.y)
                .attr('r', 0)
                .attr('fill', (p) => p.seriesColor)
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 1.5)
                .attr('opacity', 0)
                .on('mouseenter', function (event, p) {
                  d3.select(this).transition().duration(200).attr('r', 7).attr('stroke-width', 2.5);
                  setHoveredPoint({
                    seriesName: p.seriesName,
                    color: p.seriesColor,
                    subject: p.subject,
                    fullName: p.fullName,
                    groupName: p.groupName,
                    score: p.score,
                    x: p.x,
                    y: p.y,
                  });
                })
                .on('mouseleave', function () {
                  d3.select(this).transition().duration(200).attr('r', 4.5).attr('stroke-width', 1.5);
                  setHoveredPoint(null);
                })
                .transition()
                .delay((_, i) => i * 10)
                .duration(450)
                .ease(d3.easeBackOut)
                .attr('r', 4.5)
                .attr('opacity', 1),
            (pUpdate) =>
              pUpdate
                .transition()
                .duration(500)
                .ease(d3.easeCubicInOut)
                .attr('cx', (p) => p.x)
                .attr('cy', (p) => p.y)
                .attr('fill', (p) => p.seriesColor),
            (pExit) =>
              pExit
                .transition()
                .duration(300)
                .ease(d3.easeCubicIn)
                .attr('r', 0)
                .attr('opacity', 0)
                .remove()
          );
        });

        return update;
      },
      (exit) => {
        // A. Points shrink and vanish
        exit
          .selectAll('.data-point')
          .transition()
          .duration(300)
          .ease(d3.easeCubicIn)
          .attr('r', 0)
          .attr('opacity', 0);

        // B. Area collapses back to center and fades out
        exit
          .select('.series-area')
          .transition()
          .duration(420)
          .ease(d3.easeCubicIn)
          .attr('d', makeCollapsedPath())
          .attr('fill-opacity', 0)
          .attr('stroke-opacity', 0);

        // Clean up group once transition completes
        exit.transition().delay(450).remove();
        return exit;
      }
    );
  }, [activeSeriesList, data, levels, totalAxes, cx, cy, maxRadius, viewMode]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full max-h-[460px] overflow-visible"
      >
        <defs>
          {/* Subtle drop shadow for vertices */}
          <filter id="point-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Concentric Web Rings */}
        <g className="grid-layer" />

        {/* Level Percentage Markers */}
        <g className="level-markers" opacity={0.6}>
          {levels.map((lvl) => (
            <text
              key={lvl}
              x={cx + 6}
              y={cy - (lvl / 100) * maxRadius + 3}
              fill="#94a3b8"
              fontSize={9}
              fontWeight="600"
              textAnchor="start"
            >
              {lvl}%
            </text>
          ))}
        </g>

        {/* 2. Spoke Lines */}
        <g className="axes-layer" />

        {/* 3. Series Polygons and Data Points */}
        <g className="series-layer" />

        {/* 4. Axis Labels around perimeter */}
        <g className="labels-layer" />
      </svg>

      {/* Interactive Tooltip Card on Hover */}
      {hoveredPoint && (
        <div
          className="chart-tooltip absolute z-50 pointer-events-none px-3.5 py-2.5 rounded-xl text-xs space-y-1 transition-opacity duration-150 animate-in"
          style={{
            left: `${(hoveredPoint.x / size) * 100}%`,
            top: `${(hoveredPoint.y / size) * 100}%`,
            transform: 'translate(-50%, -125%)',
          }}
        >
          <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-1 font-bold text-slate-900 dark:text-white">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
              style={{ backgroundColor: hoveredPoint.color }}
            />
            <span className="truncate max-w-[180px]">{hoveredPoint.seriesName}</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[200px]">
            {hoveredPoint.fullName}
          </div>
          <div className="flex items-center justify-between gap-4 pt-0.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Mức đáp ứng:</span>
            <span className="font-extrabold text-sm text-brand-700 dark:text-white">{hoveredPoint.score}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
