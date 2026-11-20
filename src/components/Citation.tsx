import { useState } from "react"
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

type SidenoteProps = {
  num: number
  label: string
  note: string
  refNum?: number
}

export function Sidenote({ num, label, note, refNum }: SidenoteProps) {
  const [highlighted, setHighlighted] = useState(false)
  const refItem = refNum ? REFERENCES.find((r) => r.num === refNum) : undefined

  return (
    <>
      <span className="citation-inline">
        <Popover>
          <PopoverTrigger
            className="citation-trigger"
            data-highlighted={highlighted ? "true" : "false"}
            aria-label={`Note ${num}: ${label}`}
            onMouseEnter={() => setHighlighted(true)}
            onMouseLeave={() => setHighlighted(false)}
            onFocus={() => setHighlighted(true)}
            onBlur={() => setHighlighted(false)}
          >
            <sup>[{num}]</sup>
          </PopoverTrigger>
          <PopoverContent className="citation-popover">
            <div className="citation-popover-head">
              <PopoverTitle className="citation-popover-title">
                Note [{num}] · {label}
              </PopoverTitle>
              <PopoverClose
                className="citation-popover-close"
                aria-label={`Close note ${num}`}
              >
                <X size={13} aria-hidden="true" />
              </PopoverClose>
            </div>
            <PopoverDescription className="citation-popover-body">
              {note}
            </PopoverDescription>
            {refItem && (
              <a
                href={refItem.url}
                target="_blank"
                rel="noreferrer"
                className="citation-popover-link"
              >
                <span>{refItem.label}</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
          </PopoverContent>
        </Popover>
      </span>
      <span
        className="sidenote"
        role="note"
        aria-label={`Margin note ${num}: ${label}`}
        data-highlighted={highlighted ? "true" : "false"}
        onMouseEnter={() => setHighlighted(true)}
        onMouseLeave={() => setHighlighted(false)}
      >
        <span className="sidenote-head">
          <span className="sidenote-num">[{num}]</span>
          <span className="sidenote-label">{label}</span>
        </span>
        <span className="sidenote-text">{note}</span>
        {refItem && (
          <a
            href={refItem.url}
            target="_blank"
            rel="noreferrer"
            className="sidenote-link"
          >
            <span>{refItem.label}</span>
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
      </span>
    </>
  )
}
