import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

// Diagrams are declared as data: nodes sit on a grid, groups wrap node sets,
// edges are routed orthogonally between node sides. Layout is deterministic, so a
// diff to the declaration is a reviewable diff to the picture.

export type Tone = 'core' | 'decision' | 'output' | 'neutral' | 'edge' | 'gate' | 'card';
type Side = 'top' | 'right' | 'bottom' | 'left';

export interface DiagramNode {
  id: string;
  title: string;
  sub?: string;
  col: number;
  row: number;
  tone?: Tone;
  /** Width in grid columns (default 1). */
  span?: number;
}

export interface DiagramGroup {
  label: string;
  nodes: string[];
  tone?: 'core' | 'decision' | 'output' | 'edge' | 'dashed';
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  fromSide?: Side;
  toSide?: Side;
  /** Position along the side, 0..1 (default 0.5). */
  fromAt?: number;
  toAt?: number;
  /** Override the elbow line: y for vertical-to-vertical, x for horizontal-to-horizontal. */
  via?: number;
  dashed?: boolean;
  /** A dependency the contract forbids: drawn dashed, in the warning colour, ending in a cross. */
  blocked?: boolean;
}

export interface LegendItem {
  tone: Tone;
  label: string;
}

interface Props {
  nodes: DiagramNode[];
  edges?: DiagramEdge[];
  groups?: DiagramGroup[];
  legend?: LegendItem[];
  caption?: ReactNode;
  label: string;
  /** Vertical distance between rows; raise it when stacked rows both sit in groups. */
  rowPitch?: number;
}

const NODE_W = 236;
const NODE_H = 76;
const COL_PITCH = 304;
const PAD = 28;
const GROUP_PAD_X = 22;
const GROUP_PAD_TOP = 54;
const GROUP_PAD_BOTTOM = 22;
const TITLE_SIZE = 17;
const SUB_SIZE = 14;
const CORNER = 8;
const ARROW_GAP = 5;
// Cap rendering scale so a small diagram's text is no larger than a wide diagram's.
const MAX_SCALE = 0.8;

type Box = {x: number; y: number; w: number; h: number};
type Point = [number, number];

function textWidth(text: string, size: number, weight = 400): number {
  return text.length * size * (weight >= 600 ? 0.56 : 0.52);
}

function anchor(box: Box, side: Side, at = 0.5): Point {
  switch (side) {
    case 'top':
      return [box.x + box.w * at, box.y];
    case 'bottom':
      return [box.x + box.w * at, box.y + box.h];
    case 'left':
      return [box.x, box.y + box.h * at];
    case 'right':
      return [box.x + box.w, box.y + box.h * at];
  }
}

function autoSides(a: Box, b: Box): [Side, Side] {
  const sameRow = Math.abs(a.y - b.y) < a.h / 2;
  if (sameRow) {
    return a.x < b.x ? ['right', 'left'] : ['left', 'right'];
  }
  return a.y < b.y ? ['bottom', 'top'] : ['top', 'bottom'];
}

const isVertical = (side: Side) => side === 'top' || side === 'bottom';

function route(a: Box, b: Box, edge: DiagramEdge): Point[] {
  const [autoFrom, autoTo] = autoSides(a, b);
  const fromSide = edge.fromSide ?? autoFrom;
  const toSide = edge.toSide ?? autoTo;
  const s = anchor(a, fromSide, edge.fromAt);
  const e = anchor(b, toSide, edge.toAt);
  let points: Point[];
  if (isVertical(fromSide) && isVertical(toSide)) {
    const midY = edge.via ?? (s[1] + e[1]) / 2;
    points = [s, [s[0], midY], [e[0], midY], e];
  } else if (!isVertical(fromSide) && !isVertical(toSide)) {
    const midX = edge.via ?? (s[0] + e[0]) / 2;
    points = [s, [midX, s[1]], [midX, e[1]], e];
  } else if (!isVertical(fromSide)) {
    points = [s, [e[0], s[1]], e];
  } else {
    points = [s, [s[0], e[1]], e];
  }
  // Drop zero-length and collinear points so corners are only drawn where the line turns.
  const clean: Point[] = [];
  for (const p of points) {
    const last = clean[clean.length - 1];
    if (last && Math.abs(last[0] - p[0]) < 0.5 && Math.abs(last[1] - p[1]) < 0.5) continue;
    clean.push(p);
  }
  const simplified = clean.filter((p, i) => {
    if (i === 0 || i === clean.length - 1) return true;
    const [p0, p2] = [clean[i - 1], clean[i + 1]];
    return !((p0[0] === p[0] && p[0] === p2[0]) || (p0[1] === p[1] && p[1] === p2[1]));
  });
  // Stop short of the target so the arrowhead does not touch the card border.
  const n = simplified.length;
  const [px, py] = simplified[n - 2];
  const [ex, ey] = simplified[n - 1];
  const len = Math.hypot(ex - px, ey - py) || 1;
  simplified[n - 1] = [ex - ((ex - px) / len) * ARROW_GAP, ey - ((ey - py) / len) * ARROW_GAP];
  return simplified;
}

function roundedPath(points: Point[]): string {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const r = Math.min(CORNER, Math.hypot(x1 - x0, y1 - y0) / 2, Math.hypot(x2 - x1, y2 - y1) / 2);
    const inX = x1 - Math.sign(x1 - x0) * r;
    const inY = y1 - Math.sign(y1 - y0) * r;
    const outX = x1 + Math.sign(x2 - x1) * r;
    const outY = y1 + Math.sign(y2 - y1) * r;
    d += ` L ${inX} ${inY} Q ${x1} ${y1} ${outX} ${outY}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last[0]} ${last[1]}`;
}

function labelPoint(points: Point[]): {x: number; y: number; horizontal: boolean} {
  let best = 0;
  let bestLen = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
    if (len > bestLen) {
      bestLen = len;
      best = i;
    }
  }
  const [a, b] = [points[best], points[best + 1]];
  return {x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, horizontal: Math.abs(a[1] - b[1]) < 0.5};
}

function FitText({x, y, text, size, weight, className}: {x: number; y: number; text: string; size: number; weight: number; className: string}) {
  const max = NODE_W - 24;
  const fits = textWidth(text, size, weight) <= max;
  return (
    <text
      x={x}
      y={y}
      className={className}
      style={{fontSize: size, fontWeight: weight}}
      textAnchor="middle"
      {...(fits ? {} : {textLength: max, lengthAdjust: 'spacingAndGlyphs'})}>
      {text}
    </text>
  );
}

export default function ArchDiagram({nodes, edges = [], groups = [], legend = [], caption, label, rowPitch = 170}: Props): ReactNode {
  const boxes = new Map<string, Box>();
  for (const node of nodes) {
    const span = node.span ?? 1;
    boxes.set(node.id, {
      x: PAD + GROUP_PAD_X + node.col * COL_PITCH,
      y: PAD + GROUP_PAD_TOP + node.row * rowPitch,
      w: NODE_W + (span - 1) * COL_PITCH,
      h: NODE_H,
    });
  }
  const box = (id: string) => {
    const found = boxes.get(id);
    if (!found) throw new Error(`ArchDiagram: unknown node "${id}" in "${label}"`);
    return found;
  };

  const groupBoxes = groups.map((group) => {
    const members = group.nodes.map(box);
    const x = Math.min(...members.map((m) => m.x)) - GROUP_PAD_X;
    const y = Math.min(...members.map((m) => m.y)) - GROUP_PAD_TOP;
    const right = Math.max(...members.map((m) => m.x + m.w)) + GROUP_PAD_X;
    const bottom = Math.max(...members.map((m) => m.y + m.h)) + GROUP_PAD_BOTTOM;
    return {group, x, y, w: right - x, h: bottom - y};
  });

  const routes = edges.map((edge) => ({edge, points: route(box(edge.from), box(edge.to), edge)}));

  const allBoxes = [...boxes.values(), ...groupBoxes];
  const routeYs = routes.flatMap(({points}) => points.map((p) => p[1]));
  const minX = Math.min(...allBoxes.map((b) => b.x)) - PAD;
  const minY = Math.min(...allBoxes.map((b) => b.y), ...routeYs) - PAD;
  const width = Math.max(...allBoxes.map((b) => b.x + b.w)) + PAD - minX;
  const contentBottom = Math.max(...allBoxes.map((b) => b.y + b.h), ...routeYs);
  const legendY = contentBottom + 46;
  const height = (legend.length ? legendY + 22 : contentBottom) + PAD - minY;

  let legendX = minX + PAD;
  const legendItems = legend.map((item) => {
    const x = legendX;
    legendX += 34 + textWidth(item.label, 15) + 44;
    return {item, x};
  });

  const markerId = `arrow-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

  return (
    <figure className={styles.figure}>
      <div className={styles.scroller}>
        <svg viewBox={`${minX} ${minY} ${width} ${height}`} role="img" aria-label={label} className={styles.svg} style={{minWidth: Math.min(width, 720), maxWidth: Math.round(width * MAX_SCALE)}}>
          <defs>
            <marker id={markerId} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M 2 1.5 L 10 6 L 2 10.5" className={styles.arrowHead} />
            </marker>
            <marker id={`${markerId}-blocked`} viewBox="0 0 12 12" refX="6" refY="6" markerWidth="12" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M 2 2 L 10 10 M 10 2 L 2 10" className={styles.blockedHead} />
            </marker>
          </defs>

          {groupBoxes.map(({group, x, y, w, h}) => (
            <g key={group.label}>
              <rect x={x} y={y} width={w} height={h} rx={22} className={`${styles.group} ${styles[`group_${group.tone ?? 'dashed'}`]}`} />
              <text x={x + 22} y={y + 34} className={`${styles.groupLabel} ${styles[`groupLabel_${group.tone ?? 'dashed'}`]}`}>
                {group.label}
              </text>
            </g>
          ))}

          {routes.map(({edge, points}, i) => (
            <path
              key={`edge-${i}`}
              d={roundedPath(points)}
              className={`${styles.edge} ${edge.dashed ? styles.edgeDashed : ''} ${edge.blocked ? styles.edgeBlocked : ''}`}
              markerEnd={`url(#${markerId}${edge.blocked ? '-blocked' : ''})`}
            />
          ))}

          {nodes.map((node) => {
            const b = box(node.id);
            const tone = node.tone ?? 'card';
            const cx = b.x + b.w / 2;
            return (
              <g key={node.id}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} className={`${styles.node} ${styles[`node_${tone}`]}`} />
                <FitText x={cx} y={node.sub ? b.y + 32 : b.y + b.h / 2 + 6} text={node.title} size={TITLE_SIZE} weight={600} className={`${styles.title} ${styles[`title_${tone}`]}`} />
                {node.sub && <FitText x={cx} y={b.y + 56} text={node.sub} size={SUB_SIZE} weight={400} className={`${styles.sub} ${styles[`sub_${tone}`]}`} />}
              </g>
            );
          })}

          {routes
            .filter(({edge}) => edge.label)
            .map(({edge, points}, i) => {
              const {x: lx, y: ly, horizontal} = labelPoint(points);
              const w = textWidth(edge.label!, 12.5) + 14;
              // Horizontal runs carry their label above the line; vertical runs get a chip on the line.
              if (horizontal) {
                return (
                  <text key={`label-${i}`} x={lx} y={ly - 9} textAnchor="middle" className={`${styles.edgeLabel} ${edge.blocked ? styles.edgeLabelBlocked : ''}`}>
                    {edge.label}
                  </text>
                );
              }
              return (
                <g key={`label-${i}`}>
                  <rect x={lx - w / 2} y={ly - 11} width={w} height={22} rx={6} className={styles.edgeLabelBg} />
                  <text x={lx} y={ly + 4.5} textAnchor="middle" className={`${styles.edgeLabel} ${edge.blocked ? styles.edgeLabelBlocked : ''}`}>
                    {edge.label}
                  </text>
                </g>
              );
            })}

          {legendItems.map(({item, x}) => (
            <g key={item.label}>
              <rect x={x} y={legendY - 11} width={22} height={22} rx={6} className={`${styles.node} ${styles[`node_${item.tone}`]}`} />
              <text x={x + 34} y={legendY + 5.5} className={styles.legendLabel}>
                {item.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
