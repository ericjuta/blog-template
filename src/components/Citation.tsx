import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react/popover"
import { ExternalLink, X } from "lucide-react"
import { REFERENCES } from "../data/blog-data"

type CitationProps = {
  num: number
  highlightedNum?: number | null
  onHighlight?: (num: number | null) => void
}

export function Citation({ num, highlightedNum, onHighlight }: CitationProps) {
  const refItem = REFERENCES.find((r) => r.num === num)
  if (!refItem) return null

  const isHighlighted = highlightedNum === num

  return (
    <span className="citation-inline">
      <Popover>
        <PopoverTrigger
          className="citation-trigger"
          data-highlighted={isHighlighted ? "true" : "false"}
          aria-label={`Citation ${num}: ${refItem.label}`}
          onMouseEnter={() => onHighlight?.(num)}
          onMouseLeave={() => onHighlight?.(null)}
          onFocus={() => onHighlight?.(num)}
          onBlur={() => onHighlight?.(null)}
        >
          <sup>[{num}]</sup>
        </PopoverTrigger>
        <PopoverContent className="citation-popover">
          <div className="citation-popover-head">
            <PopoverTitle className="citation-popover-title">
              Reference [{num}]
            </PopoverTitle>
            <PopoverClose
              className="citation-popover-close"
              aria-label={`Close citation ${num}`}
            >
              <X size={13} aria-hidden="true" />
            </PopoverClose>
          </div>
          <PopoverDescription className="citation-popover-body">
            {refItem.cite}
          </PopoverDescription>
          <a
            href={refItem.url}
            target="_blank"
            rel="noreferrer"
            className="citation-popover-link"
          >
            <span>{refItem.label}</span>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </PopoverContent>
      </Popover>
    </span>
  )
}

type SidenotesRailProps = {
  nums: number[]
  highlightedNum: number | null
  onHighlight: (num: number | null) => void
}

export function SidenotesRail({
  nums,
  highlightedNum,
  onHighlight,
}: SidenotesRailProps) {
  const items = nums
    .map((n) => REFERENCES.find((r) => r.num === n))
    .filter((r): r is (typeof REFERENCES)[number] => Boolean(r))

  return (
    <aside className="sidenotes-rail" aria-label="Margin citations">
      <p className="toc-heading">Citations</p>
      <ol className="sidenotes-list">
        {items.map((item) => (
          <li
            key={item.num}
            className="sidenote-item"
            data-highlighted={highlightedNum === item.num ? "true" : "false"}
            onMouseEnter={() => onHighlight(item.num)}
            onMouseLeave={() => onHighlight(null)}
          >
            <span className="sidenote-num">[{item.num}]</span>
            <div className="sidenote-content">
              <p className="sidenote-text">{item.cite}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="sidenote-link"
              >
                {item.label}
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  )
}
